import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CertificateData {
  firstName: string;
  score: number;
  hydraRank: string;
  besoinTotalMl: number;
  hydratationReelleMl: number;
  diagnosticId: string;
  nbPastillesTotal?: number;
  isSensitivePopulation?: boolean;
  besoinsExerciceMl?: number;
  // New fields for enriched certificate
  sportsSelectionnes?: Array<{ name: string; category: string }>;
  frequence?: string;
  dureeMinutes?: string;
  transpiration?: string;
  situationParticuliere?: string;
  age?: number;
  urineCouleur?: string;
  crampes?: string;
  temperatureExt?: string;
  besoinsBasalsBrutMl?: number;
  nbPastillesBasal?: number;
  nbPastillesExercice?: number;
  socialComparison?: number;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getScoreColor(score: number): string {
  if (score >= 90) return "#22c55e";
  if (score >= 70) return "#3b82f6";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

function getBadgeColor(rank: string): string {
  switch (rank) {
    case "Hydra'champion": return "#22c55e";
    case "Hydra'avancé": return "#3b82f6";
    case "Hydra'initié": return "#0ea5e9";
    default: return "#f59e0b";
  }
}

function getHydraEmoji(rank: string): string {
  switch (rank) {
    case "Hydra'champion": return "🏆";
    case "Hydra'avancé": return "⭐";
    case "Hydra'initié": return "💧";
    default: return "🌱";
  }
}

function formatVolume(ml: number): string {
  const liters = ml / 1000;
  return liters >= 1 ? `${liters.toFixed(1)}L` : `${liters.toFixed(2)}L`;
}

function getSportIcon(category: string): string {
  const iconMap: Record<string, string> = {
    "Endurance continue": "🏃",
    "Intermittent/collectif/HIIT": "⚡",
    "Musculation/Force": "💪",
    "Natation": "🏊",
    "Sports collectifs": "⚽",
    "Sports de raquette": "🎾",
    "Sports de combat": "🥊",
    "Sports d'hiver": "⛷️",
    "Danse": "💃",
    "Yoga/Pilates": "🧘",
    "Escalade": "🧗",
    "Gymnastique": "🤸",
  };
  return iconMap[category] || "🏅";
}

function generateSVG(data: CertificateData): string {
  const {
    firstName, score, hydraRank, besoinTotalMl, hydratationReelleMl,
    nbPastillesTotal, isSensitivePopulation, besoinsExerciceMl,
    sportsSelectionnes, frequence, dureeMinutes, transpiration,
    situationParticuliere, age, urineCouleur, crampes, temperatureExt,
    besoinsBasalsBrutMl, nbPastillesBasal, nbPastillesExercice, socialComparison
  } = data;

  const displayName = escapeXml(firstName || "Utilisateur");
  const emoji = getHydraEmoji(hydraRank);
  const scoreColor = getScoreColor(score);
  const badgeColor = getBadgeColor(hydraRank);
  const besoinL = formatVolume(besoinTotalMl);
  const exerciceL = formatVolume(besoinsExerciceMl || 0);
  const hasExercice = (besoinsExerciceMl || 0) > 0;
  const isSensitive = isSensitivePopulation ?? false;
  const nbPastilles = nbPastillesTotal ?? 0;
  const nbBasal = nbPastillesBasal ?? 0;
  const nbExercice = nbPastillesExercice ?? 0;

  const today = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  // Gauge calculations
  const gaugePercent = besoinTotalMl > 0 ? Math.min(Math.round((hydratationReelleMl / besoinTotalMl) * 100), 100) : 0;
  const ecart = Math.max(0, besoinTotalMl - hydratationReelleMl);
  const ecartL = formatVolume(ecart);
  const isExcellent = hydratationReelleMl >= besoinTotalMl;
  const scoreBarWidth = Math.round((score / 100) * 280);
  const gaugeFillWidth = Math.round(gaugePercent * 9); // max 900px

  // Alimentation calculation
  const besoinsBasalsBrut = besoinsBasalsBrutMl || Math.round(besoinTotalMl / 0.8);
  const alimentationMl = besoinsBasalsBrut - besoinTotalMl;

  // Warnings
  const warnings: string[] = [];
  if (situationParticuliere?.includes("Enceinte")) {
    warnings.push("🤰 Les besoins hydriques augmentent pendant la grossesse. Fractionne tes prises d'eau au cours de la journée.");
  }
  if (situationParticuliere === "Allaitante") {
    warnings.push("🤱 La production de lait augmente la perte hydrique. Bois régulièrement tout au long de la journée.");
  }
  if (age && age >= 70) {
    warnings.push("🧓 La sensation de soif diminue avec l'âge. Fractionne tes prises d'eau et surveille les signes de déshydratation.");
  }
  if (age && age > 0 && age < 12) {
    warnings.push("👧 Les enfants ont des besoins hydriques proportionnellement plus élevés. Propose-lui de l'eau régulièrement.");
  }
  if (crampes === "Oui") {
    warnings.push("💡 Les crampes répétées peuvent signaler un déséquilibre en électrolytes. Une hydratation enrichie en minéraux peut aider.");
  }
  if (temperatureExt === "> 28°C") {
    warnings.push("🌡️ Par forte chaleur, n'attends pas d'avoir soif pour boire et fractionne tes apports.");
  }

  // Challenges
  const challenge1Title = score < 70 ? `Atteins ${besoinL}` : "Maintiens ton objectif";
  const challenge1Sub = score < 70 ? "pendant 7 jours consécutifs" : "pendant 30 jours";
  const challenge1Diff = score < 70 ? "Moyen" : "Facile";
  const challenge1DiffColor = score < 70 ? "#ef4444" : "#6b7280";

  let challenge2Title: string, challenge2Sub: string;
  if (isSensitive) {
    challenge2Title = "Fractionne ton hydratation";
    challenge2Sub = "8 petits verres répartis dans la journée pendant 7 jours";
  } else if (nbBasal >= 1) {
    challenge2Title = "1 pastille Hydratis chaque matin";
    challenge2Sub = "pendant 14 jours";
  } else {
    challenge2Title = "Teste Hydratis";
    challenge2Sub = "pendant 1 semaine";
  }

  const urineVal = parseInt(urineCouleur || "4");
  let challenge3Emoji: string, challenge3Title: string, challenge3Sub: string, challenge3Diff: string, challenge3DiffColor: string;
  if (urineVal > 5) {
    challenge3Emoji = "🚻"; challenge3Title = "Urine claire (≤3)"; challenge3Sub = "pendant 5 jours";
    challenge3Diff = "Moyen"; challenge3DiffColor = "#ef4444";
  } else if (crampes === "Oui") {
    challenge3Emoji = "💪"; challenge3Title = "Réduis les crampes"; challenge3Sub = "avec une hydratation optimale";
    challenge3Diff = "Moyen"; challenge3DiffColor = "#ef4444";
  } else {
    challenge3Emoji = "🤝"; challenge3Title = "Partage tes résultats"; challenge3Sub = "avec un ami";
    challenge3Diff = "Facile"; challenge3DiffColor = "#6b7280";
  }

  // Dynamic height calculation
  let currentY = 0;
  const HEADER_H = 120;
  const DASHBOARD_H = 260;
  const GAUGE_H = 220;
  const PLAN_H = 380;
  const WARNING_H = warnings.length > 0 ? 40 + warnings.length * 60 : 0;
  const CHALLENGES_H = 240;
  const FOOTER_H = 140;
  const SPACING = 30;

  const totalHeight = HEADER_H + DASHBOARD_H + GAUGE_H + PLAN_H + WARNING_H + CHALLENGES_H + FOOTER_H + SPACING * 7;

  // Sport details for plan section
  const sportsNames = sportsSelectionnes?.map(s => `${getSportIcon(s.category)} ${escapeXml(s.name)}`).join(", ") || "";

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${totalHeight}" viewBox="0 0 1200 ${totalHeight}">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#e0f2fe"/>
      <stop offset="50%" style="stop-color:#f0f9ff"/>
      <stop offset="100%" style="stop-color:#e0f2fe"/>
    </linearGradient>
    <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#0369a1" flood-opacity="0.1"/>
    </filter>
    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#3b82f6"/>
      <stop offset="50%" style="stop-color:#0ea5e9"/>
      <stop offset="100%" style="stop-color:#06b6d4"/>
    </linearGradient>
    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${scoreColor}"/>
      <stop offset="100%" style="stop-color:${scoreColor}99"/>
    </linearGradient>
  </defs>
  
  <rect width="1200" height="${totalHeight}" fill="url(#bgGradient)"/>
  
  <!-- Decorative water drops -->
  <text x="100" y="80" font-size="40" opacity="0.12">💧</text>
  <text x="1080" y="130" font-size="50" opacity="0.1">💧</text>`;

  // ===== SECTION 1: HEADER =====
  currentY = 55;
  svg += `
  <text x="600" y="${currentY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="bold" fill="#0369a1">
    Ton diagnostic est prêt, ${displayName} ! 💧
  </text>
  <text x="600" y="${currentY + 35}" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#64748b">
    Voici tes résultats personnalisés
  </text>`;
  if (score >= 90) {
    svg += `
  <text x="600" y="${currentY + 65}" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#0369a1">
    🎉 Félicitations ! Tu as une hydratation excellente !
  </text>`;
  }

  // ===== SECTION 2: DASHBOARD (3 cards) =====
  currentY = HEADER_H + SPACING;

  // Dashboard title
  svg += `
  <text x="80" y="${currentY}" font-family="Arial, sans-serif" font-size="22" font-weight="600" fill="#0369a1">
    🏆 Ton tableau de bord
  </text>`;
  currentY += 20;

  // Card 1: Score
  svg += `
  <rect x="50" y="${currentY}" width="350" height="220" rx="16" fill="white" filter="url(#cardShadow)"/>
  <rect x="50" y="${currentY}" width="350" height="6" rx="3" fill="${badgeColor}"/>
  <text x="225" y="${currentY + 35}" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="#64748b">Score d'hydratation</text>
  <rect x="100" y="${currentY + 50}" width="250" height="32" rx="16" fill="${badgeColor}22" stroke="${badgeColor}" stroke-width="1.5"/>
  <text x="225" y="${currentY + 73}" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="600" fill="${badgeColor}">${emoji} ${escapeXml(hydraRank)}</text>
  <text x="170" y="${currentY + 145}" text-anchor="middle" font-family="Arial, sans-serif" font-size="60" font-weight="bold" fill="${scoreColor}">${score}</text>
  <text x="245" y="${currentY + 140}" text-anchor="start" font-family="Arial, sans-serif" font-size="26" fill="#94a3b8">/100</text>
  <rect x="85" y="${currentY + 170}" width="280" height="12" rx="6" fill="#e2e8f0"/>
  <rect x="85" y="${currentY + 170}" width="${scoreBarWidth}" height="12" rx="6" fill="url(#scoreGradient)"/>`;

  // Social comparison
  if (socialComparison !== null && socialComparison !== undefined) {
    svg += `
  <text x="225" y="${currentY + 205}" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#64748b">
    👥 Tu fais mieux que ${socialComparison}% des utilisateurs
  </text>`;
  }

  // Card 2: Water needs
  svg += `
  <rect x="425" y="${currentY}" width="350" height="220" rx="16" fill="white" filter="url(#cardShadow)"/>
  <rect x="425" y="${currentY}" width="350" height="6" rx="3" fill="#0ea5e9"/>
  <text x="600" y="${currentY + 35}" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="#64748b">Quantité d'eau à boire par jour</text>
  <text x="600" y="${currentY + 85}" text-anchor="middle" font-size="36">💧</text>
  <text x="600" y="${currentY + 145}" text-anchor="middle" font-family="Arial, sans-serif" font-size="52" font-weight="bold" fill="#0369a1">${besoinL}</text>
  <text x="600" y="${currentY + 180}" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#64748b">litres à boire${hasExercice ? ` (+ ${exerciceL} les jours de sport)` : ""}</text>`;

  // Card 3: Pastilles
  svg += `
  <rect x="800" y="${currentY}" width="350" height="220" rx="16" fill="white" filter="url(#cardShadow)"/>
  <rect x="800" y="${currentY}" width="350" height="6" rx="3" fill="#8b5cf6"/>
  <text x="975" y="${currentY + 35}" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="#64748b">Pastilles recommandées</text>
  <text x="975" y="${currentY + 85}" text-anchor="middle" font-size="36">💊</text>`;
  if (isSensitive) {
    svg += `
  <text x="975" y="${currentY + 145}" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="bold" fill="#94a3b8">—</text>
  <text x="975" y="${currentY + 180}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#64748b">Consulte un professionnel de santé</text>`;
  } else {
    svg += `
  <text x="975" y="${currentY + 145}" text-anchor="middle" font-family="Arial, sans-serif" font-size="52" font-weight="bold" fill="#8b5cf6">${nbPastilles}</text>
  <text x="975" y="${currentY + 180}" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#64748b">pastilles/jour</text>`;
  }

  // ===== SECTION 3: GAUGE =====
  currentY = HEADER_H + DASHBOARD_H + SPACING * 2;

  svg += `
  <text x="80" y="${currentY}" font-family="Arial, sans-serif" font-size="22" font-weight="600" fill="#0369a1">
    💧 Comparaison
  </text>`;
  currentY += 15;

  svg += `
  <rect x="100" y="${currentY}" width="1000" height="180" rx="16" fill="white" filter="url(#cardShadow)"/>`;

  // Labels above gauge
  const labelXPos = 150 + Math.min(Math.max(gaugeFillWidth, 100), 700);
  svg += `
  <text x="${labelXPos}" y="${currentY + 45}" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#3b82f6">Ton hydratation quotidienne</text>
  <text x="${labelXPos}" y="${currentY + 62}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0891b2">${formatVolume(hydratationReelleMl)}</text>
  <text x="1050" y="${currentY + 45}" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#0369a1">Ton idéal</text>
  <text x="1050" y="${currentY + 62}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0369a1">${besoinL}</text>`;

  // Gauge track
  svg += `
  <rect x="150" y="${currentY + 80}" width="900" height="40" rx="20" fill="#e2e8f0"/>
  <rect x="150" y="${currentY + 80}" width="${gaugeFillWidth}" height="40" rx="20" fill="url(#gaugeGradient)"/>`;

  // Percentage inside gauge
  if (gaugeFillWidth >= 80) {
    svg += `
  <text x="${145 + gaugeFillWidth - 10}" y="${currentY + 108}" text-anchor="end" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white">${gaugePercent}%</text>`;
  }

  // Ideal marker
  svg += `
  <line x1="1050" y1="${currentY + 75}" x2="1050" y2="${currentY + 125}" stroke="#0369a1" stroke-width="3" stroke-dasharray="4,2"/>`;

  // Status message
  if (isExcellent) {
    svg += `
  <rect x="350" y="${currentY + 140}" width="500" height="32" rx="16" fill="#dcfce7"/>
  <text x="600" y="${currentY + 162}" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="600" fill="#16a34a">🎉 Excellent ! Tu as atteint tes besoins de base !</text>`;
  } else {
    svg += `
  <rect x="350" y="${currentY + 140}" width="500" height="32" rx="16" fill="#fef3c7"/>
  <text x="600" y="${currentY + 162}" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="600" fill="#d97706">Encore ${ecartL} à boire pour atteindre ton idéal</text>`;
  }

  // ===== SECTION 4: PLAN D'HYDRATATION =====
  currentY = HEADER_H + DASHBOARD_H + GAUGE_H + SPACING * 3;

  svg += `
  <text x="80" y="${currentY}" font-family="Arial, sans-serif" font-size="22" font-weight="600" fill="#0369a1">
    💧 Ton plan d'hydratation quotidien
  </text>
  <text x="80" y="${currentY + 25}" font-family="Arial, sans-serif" font-size="14" fill="#64748b">
    Voici tes besoins personnalisés pour rester bien hydraté
  </text>`;
  currentY += 45;

  // Left column: Daily needs
  svg += `
  <rect x="50" y="${currentY}" width="540" height="310" rx="16" fill="white" filter="url(#cardShadow)" stroke="#3b82f633" stroke-width="2"/>
  <text x="320" y="${currentY + 35}" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="600" fill="#64748b">💧 Besoin en eau par jour</text>
  <text x="320" y="${currentY + 90}" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#2563eb">${besoinL}</text>
  <text x="320" y="${currentY + 115}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#64748b">à boire</text>`;

  // Pastilles basales
  if (!isSensitive && nbBasal > 0) {
    svg += `
  <rect x="200" y="${currentY + 130}" width="240" height="28" rx="14" fill="#3b82f622" stroke="#3b82f6" stroke-width="1"/>
  <text x="320" y="${currentY + 150}" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="600" fill="#2563eb">${nbBasal} pastille${nbBasal > 1 ? 's' : ''} / jour</text>`;
  }

  // Details
  svg += `
  <line x1="80" y1="${currentY + 175}" x2="560" y2="${currentY + 175}" stroke="#3b82f633" stroke-width="1"/>
  <text x="90" y="${currentY + 200}" font-family="Arial, sans-serif" font-size="13" fill="#64748b">Besoin total</text>
  <text x="550" y="${currentY + 200}" text-anchor="end" font-family="Arial, sans-serif" font-size="13" font-weight="600" fill="#334155">${formatVolume(besoinsBasalsBrut)}</text>
  <text x="90" y="${currentY + 225}" font-family="Arial, sans-serif" font-size="13" fill="#64748b">• Apportée par l'alimentation</text>
  <text x="550" y="${currentY + 225}" text-anchor="end" font-family="Arial, sans-serif" font-size="13" font-weight="600" fill="#334155">~${formatVolume(alimentationMl)}</text>
  <text x="90" y="${currentY + 250}" font-family="Arial, sans-serif" font-size="13" fill="#64748b">• Apportée par la boisson</text>
  <text x="550" y="${currentY + 250}" text-anchor="end" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#2563eb">${besoinL}</text>`;

  // Right column: Sport or encouragement
  svg += `
  <rect x="610" y="${currentY}" width="540" height="310" rx="16" fill="white" filter="url(#cardShadow)" stroke="${hasExercice ? '#f9731633' : '#22c55e33'}" stroke-width="2"/>`;

  if (hasExercice) {
    svg += `
  <text x="640" y="${currentY + 35}" font-family="Arial, sans-serif" font-size="15" font-weight="600" fill="#64748b">💪 Jours d'entraînement</text>
  <text x="640" y="${currentY + 55}" font-family="Arial, sans-serif" font-size="12" fill="#64748b">Besoins additionnels</text>
  <text x="1120" y="${currentY + 50}" text-anchor="end" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#ea580c">${exerciceL}</text>
  <text x="1120" y="${currentY + 70}" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#64748b">en plus</text>`;

    // Sports list
    if (sportsNames) {
      svg += `
  <text x="640" y="${currentY + 105}" font-family="Arial, sans-serif" font-size="13" font-weight="600" fill="#334155">🏅 Ton sport</text>
  <text x="640" y="${currentY + 125}" font-family="Arial, sans-serif" font-size="12" fill="#64748b">${sportsNames}</text>`;
    }

    // Frequency / Duration / Transpiration
    let detailY = currentY + 155;
    if (frequence) {
      svg += `
  <rect x="640" y="${detailY}" width="150" height="50" rx="8" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
  <text x="715" y="${detailY + 18}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#64748b">📅 Fréquence</text>
  <text x="715" y="${detailY + 38}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#334155">${escapeXml(frequence)}</text>`;
    }
    if (dureeMinutes) {
      svg += `
  <rect x="800" y="${detailY}" width="150" height="50" rx="8" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
  <text x="875" y="${detailY + 18}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#64748b">⏱️ Durée</text>
  <text x="875" y="${detailY + 38}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#334155">${escapeXml(dureeMinutes)} min</text>`;
    }
    if (transpiration) {
      svg += `
  <rect x="960" y="${detailY}" width="150" height="50" rx="8" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
  <text x="1035" y="${detailY + 18}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#64748b">💧 Transpiration</text>
  <text x="1035" y="${detailY + 38}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#334155">${escapeXml(transpiration)}/10</text>`;
    }

    // Sport pastilles
    if (!isSensitive && nbExercice > 0) {
      svg += `
  <rect x="700" y="${currentY + 230}" width="260" height="28" rx="14" fill="#f9731622" stroke="#f97316" stroke-width="1"/>
  <text x="830" y="${currentY + 250}" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="600" fill="#ea580c">${nbExercice} pastille${nbExercice > 1 ? 's' : ''} / séance</text>`;
    }
  } else {
    // Non-sport encouragement
    svg += `
  <text x="880" y="${currentY + 60}" text-anchor="middle" font-size="48">🚶‍♂️</text>
  <text x="880" y="${currentY + 110}" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#16a34a">30 minutes qui changent tout</text>
  <text x="880" y="${currentY + 140}" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#64748b">L'ANSES recommande 30 min d'activité</text>
  <text x="880" y="${currentY + 160}" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#64748b">physique modérée par jour</text>
  <rect x="680" y="${currentY + 185}" width="400" height="50" rx="10" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1"/>
  <text x="880" y="${currentY + 216}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#16a34a">💡 Bouger régulièrement aide aussi à maintenir une bonne hydratation !</text>`;
  }

  // + circle between columns
  svg += `
  <circle cx="600" cy="${currentY + 155}" r="20" fill="#fff7ed" stroke="#f9731650" stroke-width="2"/>
  <text x="600" y="${currentY + 163}" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#ea580c">+</text>`;

  // ===== SECTION 5: WARNINGS (conditional) =====
  currentY = HEADER_H + DASHBOARD_H + GAUGE_H + PLAN_H + SPACING * 4;

  if (warnings.length > 0) {
    warnings.forEach((warning, i) => {
      svg += `
  <rect x="100" y="${currentY + i * 60}" width="1000" height="50" rx="12" fill="#fffbeb" stroke="#fbbf2480" stroke-width="2"/>
  <text x="130" y="${currentY + i * 60 + 32}" font-family="Arial, sans-serif" font-size="14" fill="#92400e">${escapeXml(warning)}</text>`;
    });
    currentY += warnings.length * 60 + 20;
  }

  // ===== SECTION 6: CHALLENGES =====
  svg += `
  <text x="80" y="${currentY + 10}" font-family="Arial, sans-serif" font-size="22" font-weight="600" fill="#0369a1">
    🎯 Tes défis hydratation
  </text>
  <text x="80" y="${currentY + 35}" font-family="Arial, sans-serif" font-size="14" fill="#64748b">
    Atteins tes objectifs avec ces défis personnalisés
  </text>`;
  currentY += 55;

  // Challenge 1
  svg += `
  <rect x="50" y="${currentY}" width="350" height="140" rx="14" fill="white" filter="url(#cardShadow)" stroke="#3b82f633" stroke-width="2"/>
  <text x="80" y="${currentY + 30}" font-size="22">💧</text>
  <rect x="110" y="${currentY + 15}" width="60" height="22" rx="11" fill="${challenge1DiffColor}20"/>
  <text x="140" y="${currentY + 31}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="${challenge1DiffColor}">${challenge1Diff}</text>
  <text x="80" y="${currentY + 70}" font-family="Arial, sans-serif" font-size="16" font-weight="600" fill="#1e293b">${escapeXml(challenge1Title)}</text>
  <text x="80" y="${currentY + 95}" font-family="Arial, sans-serif" font-size="13" fill="#64748b">${escapeXml(challenge1Sub)}</text>`;

  // Challenge 2
  svg += `
  <rect x="425" y="${currentY}" width="350" height="140" rx="14" fill="white" filter="url(#cardShadow)" stroke="#8b5cf633" stroke-width="2"/>
  <text x="455" y="${currentY + 30}" font-size="22">${isSensitive ? "🥤" : "💊"}</text>
  <rect x="485" y="${currentY + 15}" width="60" height="22" rx="11" fill="#6b728020"/>
  <text x="515" y="${currentY + 31}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#6b7280">Facile</text>
  <text x="455" y="${currentY + 70}" font-family="Arial, sans-serif" font-size="16" font-weight="600" fill="#1e293b">${escapeXml(challenge2Title)}</text>
  <text x="455" y="${currentY + 95}" font-family="Arial, sans-serif" font-size="13" fill="#64748b">${escapeXml(challenge2Sub)}</text>`;

  // Challenge 3
  svg += `
  <rect x="800" y="${currentY}" width="350" height="140" rx="14" fill="white" filter="url(#cardShadow)" stroke="#22c55e33" stroke-width="2"/>
  <text x="830" y="${currentY + 30}" font-size="22">${challenge3Emoji}</text>
  <rect x="860" y="${currentY + 15}" width="60" height="22" rx="11" fill="${challenge3DiffColor}20"/>
  <text x="890" y="${currentY + 31}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="${challenge3DiffColor}">${challenge3Diff}</text>
  <text x="830" y="${currentY + 70}" font-family="Arial, sans-serif" font-size="16" font-weight="600" fill="#1e293b">${escapeXml(challenge3Title)}</text>
  <text x="830" y="${currentY + 95}" font-family="Arial, sans-serif" font-size="13" fill="#64748b">${escapeXml(challenge3Sub)}</text>`;

  // ===== SECTION 7: FOOTER =====
  currentY += 140 + SPACING;

  svg += `
  <text x="600" y="${currentY + 15}" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#0369a1" letter-spacing="2">HYDRATIS</text>
  <text x="600" y="${currentY + 40}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#64748b">L'hydratation optimisée</text>
  <text x="600" y="${currentY + 70}" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#94a3b8">Diagnostic réalisé le ${today}</text>
  <rect x="300" y="${currentY + 85}" width="600" height="36" rx="18" fill="#0369a1"/>
  <text x="600" y="${currentY + 109}" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="600" fill="white">hydratis.co  |  01 89 71 32 00  |  contact@hydratis.co</text>
</svg>`;

  return svg;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: CertificateData = await req.json();
    console.log("Generating certificate for:", data.firstName, "Score:", data.score, "BesoinTotalMl:", data.besoinTotalMl, "DiagnosticId:", data.diagnosticId);

    const svg = generateSVG(data);

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const fileName = `cert_${data.diagnosticId}.svg`;
    console.log("Uploading certificate to storage:", fileName);

    const svgBuffer = new TextEncoder().encode(svg);
    const { error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(fileName, svgBuffer, {
        contentType: 'image/svg+xml',
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('certificates')
      .getPublicUrl(fileName);

    const certificateUrl = urlData.publicUrl;
    console.log("Certificate uploaded successfully:", certificateUrl);

    const { error: updateError } = await supabase
      .from('diagnostics')
      .update({ certificate_url: certificateUrl })
      .eq('id', data.diagnosticId);

    if (updateError) {
      console.error("Error updating diagnostic with certificate URL:", updateError);
    } else {
      console.log("Diagnostic updated with certificate URL");
    }

    return new Response(
      JSON.stringify({ success: true, certificateUrl, fileName }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error generating certificate:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
