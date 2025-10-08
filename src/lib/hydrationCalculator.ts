import { DiagnosticData } from "@/types/diagnostic";

export interface HydrationResult {
  MB: number;
  DEJ: number;
  pertes_tot: number;
  eau_metabo: number;
  besoin_total_ml: number;
  hydratation_jour_ml: number;
  nb_pastilles: number;
  score: number;
  statut: string;
}

// Convertit la tranche d'âge en nombre médian
const getAgeNumber = (ageRange: string): number => {
  if (ageRange === "3-10 ans") return 6.5;
  if (ageRange === "11-17 ans") return 14;
  if (ageRange === "18-49 ans") return 33;
  if (ageRange === "50-60 ans") return 55;
  if (ageRange === "61-69 ans") return 65;
  if (ageRange === "70+ ans") return 75;
  return 33; // défaut
};

export const calculateHydration = (data: DiagnosticData): HydrationResult => {
  const sexe = data.sexe || "Un homme";
  const poids_kg = parseFloat(data.poids_kg || "70");
  const taille_cm = parseFloat(data.taille_cm || "170");
  const age = getAgeNumber(data.age || "18-49 ans");
  const sport_pratique = data.sport_pratique || "Non";
  const frequence = data.frequence || "Jamais";
  const type_sport = data.type_sport || "";
  const duree_seance = data.duree_seance || "";
  const transpiration = data.transpiration || "Moyenne";
  const temperature_ext = data.temperature_ext || "18-28°C";
  const situation_particuliere = data.situation_particuliere || "Aucune";
  const metier_physique = data.metier_physique || "Non";
  const urine_couleur = parseInt(data.urine_couleur || "4");
  const crampes = data.crampes || "Non";
  const courbatures = data.courbatures || "Non";

  // Métabolisme basal (Harris-Benedict)
  const MB = sexe === "Un homme"
    ? 66.47 + (13.75 * poids_kg) + (5 * taille_cm) - (6.76 * age)
    : 655.1 + (9.56 * poids_kg) + (1.85 * taille_cm) - (4.68 * age);

  // NAP selon activité
  let NAP = 1.2; // sédentaire
  if (sport_pratique === "Oui") {
    if (frequence === "1-2 fois/semaine") NAP = 1.375;
    if (frequence === "3-5 fois/semaine") NAP = 1.55;
    if (frequence === "6+ fois/semaine") NAP = 1.725;
    if (type_sport === "Force/Musculation" && duree_seance === "60-120 min") NAP = 1.9;
  }

  const DEJ = MB * NAP;

  // Pertes hydriques journalières (mL/j)
  const evap = 0.1 * DEJ;
  const resp = 0.015 * DEJ;
  const feca = 100;
  const urine = 1200;
  const sueur = transpiration === "Forte" ? 1500 :
                 transpiration === "Moyenne" ? 1000 : 500;
  const pertes_tot = evap + resp + feca + urine + sueur;

  // Production d'eau métabolique
  const eau_metabo = 0.14 * DEJ;

  // Bilan hydrique théorique
  const besoin_total_ml = pertes_tot - eau_metabo;

  // Ajustements contextuels
  let extra_ml = 0;
  if (temperature_ext === "> 28°C") extra_ml += 300;
  if (temperature_ext === "< 0°C") extra_ml -= 100;
  if (situation_particuliere.startsWith("Enceinte")) extra_ml += 300;
  if (situation_particuliere === "Allaitante") extra_ml += 700;
  if (metier_physique === "Oui") extra_ml += 500;

  // Volume recommandé
  const hydratation_jour_ml = Math.round(besoin_total_ml + extra_ml);

  // Recommandation pastilles Hydratis
  let nb_pastilles = Math.ceil(hydratation_jour_ml / 500 / 2); // 2 pastilles/500 ml
  nb_pastilles = Math.min(nb_pastilles, 5);
  if (age >= 60 && age < 70) nb_pastilles = Math.min(nb_pastilles, 3);
  if (age >= 70) nb_pastilles = Math.min(nb_pastilles, 2);

  // Score d'hydratation
  let score = 100;
  if (urine_couleur >= 6) score -= 20;
  if (crampes === "Oui" || courbatures === "Oui") score -= 10;
  if (transpiration === "Forte") score -= 5;
  if (score < 0) score = 0;

  // Statut
  const statut = score >= 85 ? "Hydratation optimale"
               : score >= 70 ? "Hydratation correcte"
               : score >= 50 ? "Légère déshydratation"
               : "Déshydratation probable";

  // Sortie
  return {
    MB: Math.round(MB),
    DEJ: Math.round(DEJ),
    pertes_tot: Math.round(pertes_tot),
    eau_metabo: Math.round(eau_metabo),
    besoin_total_ml: Math.round(besoin_total_ml),
    hydratation_jour_ml,
    nb_pastilles,
    score,
    statut
  };
};
