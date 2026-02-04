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
  besoinTotalMl: number; // besoins_basals_net_ml - ce qu'il faut boire
  hydratationReelleMl: number;
  diagnosticId: string;
  nbPastillesTotal?: number;
  isSensitivePopulation?: boolean;
  besoinsExerciceMl?: number; // besoins supplémentaires pour l'exercice
}

function getHydraEmoji(rank: string): string {
  switch (rank) {
    case "Hydra'champion": return "🏆";
    case "Hydra'avancé": return "⭐";
    case "Hydra'initié": return "💧";
    default: return "🌱";
  }
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

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateSVG(data: {
  displayName: string;
  score: number;
  hydraRank: string;
  emoji: string;
  scoreColor: string;
  badgeColor: string;
  besoinL: string;
  hydratationL: string;
  today: string;
  nbPastilles: number | null;
  isSensitive: boolean;
  ecartL: string;
  gaugePercent: number;
  isExcellent: boolean;
  besoinsExerciceL: string;
}): string {
  const { 
    displayName, score, hydraRank, emoji, scoreColor, badgeColor,
    besoinL, hydratationL, today, nbPastilles, isSensitive,
    ecartL, gaugePercent, isExcellent, besoinsExerciceL
  } = data;
  
  // Calculate score bar width (max 280px)
  const scoreBarWidth = Math.round((score / 100) * 280);
  
  // Calculate gauge fill width (max 900px for the gauge track)
  const gaugeFillWidth = Math.round(Math.min(gaugePercent, 100) * 9);
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <!-- Background gradient - light blue like the app -->
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#e0f2fe"/>
      <stop offset="50%" style="stop-color:#f0f9ff"/>
      <stop offset="100%" style="stop-color:#e0f2fe"/>
    </linearGradient>
    
    <!-- Card shadow -->
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#0369a1" flood-opacity="0.1"/>
    </filter>
    
    <!-- Gauge gradient (water effect) -->
    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#3b82f6"/>
      <stop offset="50%" style="stop-color:#0ea5e9"/>
      <stop offset="100%" style="stop-color:#06b6d4"/>
    </linearGradient>
    
    <!-- Score progress gradient -->
    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${scoreColor}"/>
      <stop offset="100%" style="stop-color:${scoreColor}99"/>
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="800" fill="url(#bgGradient)"/>
  
  <!-- Decorative water drops -->
  <text x="100" y="100" font-size="40" opacity="0.15">💧</text>
  <text x="1080" y="150" font-size="50" opacity="0.12">💧</text>
  <text x="150" y="750" font-size="35" opacity="0.1">💧</text>
  <text x="1050" y="700" font-size="45" opacity="0.1">💧</text>
  
  <!-- Header section -->
  <text x="600" y="60" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#0369a1">
    Ton diagnostic est prêt, ${escapeXml(displayName)} ! 💧
  </text>
  <text x="600" y="95" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#64748b">
    Voici tes résultats personnalisés
  </text>
  
  <!-- ============= 3 CARDS DASHBOARD ============= -->
  
  <!-- Card 1: Score d'hydratation -->
  <rect x="50" y="130" width="350" height="220" rx="16" fill="white" filter="url(#cardShadow)"/>
  <rect x="50" y="130" width="350" height="6" rx="3" fill="${badgeColor}"/>
  
  <text x="225" y="170" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#64748b">Score d'hydratation</text>
  
  <!-- Badge -->
  <rect x="100" y="185" width="250" height="36" rx="18" fill="${badgeColor}22" stroke="${badgeColor}" stroke-width="1.5"/>
  <text x="225" y="210" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="${badgeColor}">${emoji} ${escapeXml(hydraRank)}</text>
  
  <!-- Score display -->
  <text x="170" y="280" text-anchor="middle" font-family="Arial, sans-serif" font-size="64" font-weight="bold" fill="${scoreColor}">${score}</text>
  <text x="250" y="275" text-anchor="start" font-family="Arial, sans-serif" font-size="28" fill="#94a3b8">/100</text>
  
  <!-- Score progress bar -->
  <rect x="85" y="305" width="280" height="12" rx="6" fill="#e2e8f0"/>
  <rect x="85" y="305" width="${scoreBarWidth}" height="12" rx="6" fill="url(#scoreGradient)"/>
  
  <!-- Card 2: Quantité d'eau à boire -->
  <rect x="425" y="130" width="350" height="220" rx="16" fill="white" filter="url(#cardShadow)"/>
  <rect x="425" y="130" width="350" height="6" rx="3" fill="#0ea5e9"/>
  
  <text x="600" y="170" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#64748b">Quantité d'eau à boire par jour</text>
  
  <!-- Water icon -->
  <text x="600" y="220" text-anchor="middle" font-size="36">💧</text>
  
  <!-- Volume display -->
  <text x="600" y="285" text-anchor="middle" font-family="Arial, sans-serif" font-size="56" font-weight="bold" fill="#0369a1">${besoinL}</text>
  <text x="600" y="320" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#64748b">litres à boire${besoinsExerciceL !== "0.0" ? ` (+ ${besoinsExerciceL}L les jours de sport)` : ""}</text>
  
  <!-- Card 3: Pastilles recommandées -->
  <rect x="800" y="130" width="350" height="220" rx="16" fill="white" filter="url(#cardShadow)"/>
  <rect x="800" y="130" width="350" height="6" rx="3" fill="#8b5cf6"/>
  
  <text x="975" y="170" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#64748b">Pastilles recommandées</text>
  
  <!-- Pastille icon -->
  <text x="975" y="220" text-anchor="middle" font-size="36">💊</text>
  
  ${isSensitive ? `
  <!-- Sensitive population message -->
  <text x="975" y="275" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#94a3b8">—</text>
  <text x="975" y="315" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#64748b">Consulte un</text>
  <text x="975" y="335" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#64748b">professionnel de santé</text>
  ` : `
  <!-- Pastilles count -->
  <text x="975" y="285" text-anchor="middle" font-family="Arial, sans-serif" font-size="56" font-weight="bold" fill="#8b5cf6">${nbPastilles}</text>
  <text x="975" y="320" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#64748b">pastilles/jour</text>
  `}
  
  <!-- ============= HYDRATION GAUGE SECTION ============= -->
  
  <!-- Section title -->
  <text x="600" y="400" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="600" fill="#0369a1">
    Ton plan d'hydratation au quotidien
  </text>
  
  <!-- Gauge container card -->
  <rect x="100" y="420" width="1000" height="180" rx="16" fill="white" filter="url(#cardShadow)"/>
  
  <!-- Gauge track (background) -->
  <rect x="150" y="490" width="900" height="40" rx="20" fill="#e2e8f0"/>
  
  <!-- Gauge fill (water level) -->
  <rect x="150" y="490" width="${gaugeFillWidth}" height="40" rx="20" fill="url(#gaugeGradient)"/>
  
  <!-- Current hydration label (above the fill) -->
  <text x="${150 + Math.min(Math.max(gaugeFillWidth, 100), 700)}" y="475" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#3b82f6">
    Ton hydratation
  </text>
  <text x="${150 + Math.min(Math.max(gaugeFillWidth, 100), 700)}" y="458" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#3b82f6">
    quotidienne
  </text>
  
  <!-- Percentage inside gauge -->
  ${gaugeFillWidth >= 80 ? `
  <text x="${145 + gaugeFillWidth - 10}" y="518" text-anchor="end" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" style="text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
    ${Math.round(gaugePercent)}%
  </text>
  ` : ''}
  
  <!-- Ideal marker line -->
  <line x1="1050" y1="485" x2="1050" y2="535" stroke="#0369a1" stroke-width="3" stroke-dasharray="4,2"/>
  
  <!-- Ideal label -->
  <text x="1050" y="475" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#0369a1">Ton idéal</text>
  <text x="1050" y="555" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#0369a1">${besoinL}L</text>
  
  <!-- Status message -->
  ${isExcellent ? `
  <rect x="400" y="555" width="400" height="36" rx="18" fill="#dcfce7"/>
  <text x="600" y="580" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#16a34a">
    🎉 Excellent ! Tu es bien hydraté(e)
  </text>
  ` : `
  <rect x="400" y="555" width="400" height="36" rx="18" fill="#fef3c7"/>
  <text x="600" y="580" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#d97706">
    💡 Encore ${ecartL}L à boire pour atteindre ton idéal
  </text>
  `}
  
  <!-- ============= FOOTER ============= -->
  
  <!-- Hydratis branding -->
  <text x="600" y="660" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#0369a1" letter-spacing="2">
    HYDRATIS
  </text>
  <text x="600" y="685" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#64748b">
    L'hydratation optimisée
  </text>
  
  <!-- Date -->
  <text x="600" y="720" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#94a3b8">
    Diagnostic réalisé le ${today}
  </text>
  
  <!-- Website -->
  <rect x="475" y="740" width="250" height="36" rx="18" fill="#0369a1"/>
  <text x="600" y="765" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="600" fill="white">
    hydratis.fr
  </text>
</svg>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: CertificateData = await req.json();
    const { firstName, score, hydraRank, besoinTotalMl, hydratationReelleMl, diagnosticId, nbPastillesTotal, isSensitivePopulation, besoinsExerciceMl } = data;

    console.log("Generating certificate for:", firstName, "Score:", score, "BesoinTotalMl:", besoinTotalMl, "DiagnosticId:", diagnosticId);

    const today = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const emoji = getHydraEmoji(hydraRank);
    const scoreColor = getScoreColor(score);
    const badgeColor = getBadgeColor(hydraRank);
    const besoinL = (besoinTotalMl / 1000).toFixed(1);
    const hydratationL = (hydratationReelleMl / 1000).toFixed(1);
    const displayName = firstName || "Utilisateur";
    const besoinsExerciceL = ((besoinsExerciceMl || 0) / 1000).toFixed(1);
    
    // Calculate gauge values - comparing real hydration vs daily needs (besoins_basals_net_ml)
    const ecart = Math.max(0, besoinTotalMl - hydratationReelleMl);
    const ecartL = (ecart / 1000).toFixed(1);
    const gaugePercent = besoinTotalMl > 0 ? (hydratationReelleMl / besoinTotalMl) * 100 : 0;
    const isExcellent = hydratationReelleMl >= besoinTotalMl;
    
    // Handle pastilles
    const nbPastilles = nbPastillesTotal ?? null;
    const isSensitive = isSensitivePopulation ?? false;

    // Generate SVG
    const svg = generateSVG({
      displayName,
      score,
      hydraRank,
      emoji,
      scoreColor,
      badgeColor,
      besoinL,
      hydratationL,
      today,
      nbPastilles,
      isSensitive,
      ecartL,
      gaugePercent,
      isExcellent,
      besoinsExerciceL
    });

    // Convert SVG to base64 for storage
    const svgBase64 = btoa(unescape(encodeURIComponent(svg)));
    const svgDataUrl = `data:image/svg+xml;base64,${svgBase64}`;

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate unique filename (SVG format now)
    const fileName = `cert_${diagnosticId}.svg`;

    console.log("Uploading certificate to storage:", fileName);

    // Upload SVG to Supabase Storage
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

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('certificates')
      .getPublicUrl(fileName);

    const certificateUrl = urlData.publicUrl;
    console.log("Certificate uploaded successfully:", certificateUrl);

    // Update the diagnostics table with the certificate URL (using service role to bypass RLS)
    const { error: updateError } = await supabase
      .from('diagnostics')
      .update({ certificate_url: certificateUrl })
      .eq('id', diagnosticId);

    if (updateError) {
      console.error("Error updating diagnostic with certificate URL:", updateError);
    } else {
      console.log("Diagnostic updated with certificate URL");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        certificateUrl,
        fileName 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error generating certificate:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
