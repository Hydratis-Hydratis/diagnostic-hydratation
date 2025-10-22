import { DiagnosticData } from "@/types/diagnostic";

export interface HydrationResult {
  // Besoins basals quotidiens
  besoins_basals_ml: number;
  details_basals: {
    base_age_sexe: number;
    ajust_imc: number;
    ajust_temperature: number;
    ajust_boissons: number;
    ajust_physiologique: number;
    ajust_symptomes: number;
  };
  
  // Besoins pendant l'exercice
  besoins_exercice_ml: number;
  details_exercice: {
    pertes_transpiration: number;
    facteur_sport: number;
    duree_heures: number;
    ajust_temperature: number;
  };
  
  // Totaux et recommandations
  besoin_total_ml: number;
  nb_pastilles_basal: number;
  nb_pastilles_exercice: number;
  score: number;
  statut: string;
  notes: string[];
}

// Convertit la tranche d'âge en valeurs pour le calcul
const getAgeData = (ageRange: string): { median: number; mlPerKg: number; facteurMetabo: number } => {
  const ageMap: Record<string, { median: number; mlPerKg: number; facteurMetabo: number }> = {
    "3-10 ans": { median: 6.5, mlPerKg: 55, facteurMetabo: 1.3 },
    "11-17 ans": { median: 14, mlPerKg: 45, facteurMetabo: 1.1 },
    "18-49 ans": { median: 33, mlPerKg: 32.5, facteurMetabo: 1.0 },
    "50-60 ans": { median: 55, mlPerKg: 30, facteurMetabo: 0.9 },
    "61-69 ans": { median: 65, mlPerKg: 30, facteurMetabo: 0.9 },
    "70+ ans": { median: 75, mlPerKg: 25, facteurMetabo: 0.8 }
  };
  return ageMap[ageRange] || ageMap["18-49 ans"];
};

// Facteur selon le sexe
const getFacteurSexe = (sexe: string, situation: string): { facteur: number; bonus: number } => {
  if (situation === "Allaitante") return { facteur: 0.9, bonus: 700 };
  if (situation?.startsWith("Enceinte")) return { facteur: 0.9, bonus: 300 };
  if (sexe === "Une femme") return { facteur: 0.9, bonus: 0 };
  if (sexe === "Un homme") return { facteur: 1.0, bonus: 0 };
  return { facteur: 0.95, bonus: 0 }; // Autre
};

// Calcul IMC
const calculateIMC = (poids_kg: number, taille_cm: number): number => {
  const taille_m = taille_cm / 100;
  return poids_kg / (taille_m * taille_m);
};

// Calcul de base selon IMC
const calculateBaseHydration = (poids_kg: number, imc: number, mlPerKg: number): number => {
  if (imc >= 30) {
    // Formule spéciale pour IMC ≥ 30
    return (poids_kg - 20) * 15 + 1500;
  }
  return poids_kg * mlPerKg;
};

// Ajustement température pour besoins basals
const getAjustTemperatureBasal = (temperature: string): number => {
  if (temperature === "< 10°C") return 0;
  if (temperature === "10-18°C") return 0;
  if (temperature === "18-28°C") return 200;
  if (temperature === "> 28°C") return 500;
  return 0;
};

// Ajustement température pour exercice (ml/h)
const getAjustTemperatureExercice = (temperature: string): number => {
  if (temperature === "< 10°C") return 0;
  if (temperature === "10-18°C") return 0; // ≤ 20°C
  if (temperature === "18-28°C") return 150; // 21-25°C moyenne
  if (temperature === "> 28°C") return 350; // 30-32°C+ moyenne
  return 0;
};

// Facteur selon type de sport
const getFacteurSport = (typeSport: string): number => {
  const facteurs: Record<string, number> = {
    "Endurance continue": 1.0,
    "Intermittent/collectif/HIIT": 0.9,
    "Musculation/Force": 0.6,
    "Natation": 0.8,
    "Sports collectifs": 0.85,
    "Yoga/Pilates/Stretching": 0.5
  };
  return facteurs[typeSport] || 1.0;
};

// Convertir durée de séance en heures
const getDureeHeures = (dureeSeance: string): number => {
  if (dureeSeance === "15-30 min") return 0.375; // 22.5 min
  if (dureeSeance === "30-60 min") return 0.75; // 45 min
  if (dureeSeance === "60-120 min") return 1.5; // 90 min
  if (dureeSeance === "120+ min") return 2.5; // 150 min
  return 0;
};

// Ajustement selon couleur urine
const getAjustUrine = (urineCouleur: number): number => {
  if (urineCouleur <= 3) return 0; // Claire à jaune pâle
  if (urineCouleur <= 5) return 300; // Jaune foncé
  return 600; // Ambrée / très foncée
};

// Ajustement boissons déshydratantes
const getAjustBoissons = (boissons: any): { total: number; notes: string[] } => {
  if (!boissons) return { total: 0, notes: [] };
  
  let total = 0;
  const notes: string[] = [];
  
  // Café/thé non sucré
  const cafeThe = boissons.cafe_the || 0;
  if (cafeThe > 3) {
    total += 150;
    notes.push("Plus de 3 cafés/thés par jour : pensez à augmenter votre consommation d'eau.");
  }
  
  // Café/thé sucré
  const cafeSucre = boissons.cafe_sucre || 0;
  if (cafeSucre >= 2) {
    total += 200;
    notes.push("Café/thé sucré : privilégiez l'eau ou le café non sucré pour une meilleure hydratation.");
  }
  
  // Soda/jus sucré
  const sodaJus = (boissons.soda || 0) + (boissons.jus || 0);
  if (sodaJus >= 1) {
    total += 250;
    notes.push("Sodas et jus sucrés : limitez leur consommation et privilégiez l'eau.");
  }
  
  // Soda 0%
  const sodaZero = boissons.soda_zero || 0;
  if (sodaZero >= 1) {
    total += 100;
    notes.push("Sodas 0% : sans sucre mais acidifiants, à consommer avec modération.");
  }
  
  // Boisson énergisante
  const energisante = boissons.boisson_energisante || 0;
  if (energisante >= 1) {
    total += 500;
    notes.push("Boissons énergisantes : très sucrées et caféinées, fortement déshydratantes.");
  }
  
  // Vin
  const vin = boissons.vin || 0;
  if (vin >= 1) {
    total += 500;
    notes.push("L'alcool déshydrate : compensez avec de l'eau. L'abus d'alcool est dangereux pour la santé.");
  }
  
  // Bière
  const biere = boissons.biere || 0;
  if (biere >= 1) {
    total += 300;
    notes.push("La bière est diurétique : pensez à bien vous hydrater.");
  }
  
  return { total, notes };
};

export const calculateHydration = (data: DiagnosticData): HydrationResult => {
  const sexe = data.sexe || "Un homme";
  const poids_kg = parseFloat(data.poids_kg || "70");
  const taille_cm = parseFloat(data.taille_cm || "170");
  const ageData = getAgeData(data.age || "18-49 ans");
  const situation_particuliere = data.situation_particuliere || "Aucune";
  const temperature_ext = data.temperature_ext || "18-28°C";
  const sport_pratique = data.sport_pratique || "Non";
  const type_sport = data.type_sport || "";
  const duree_seance = data.duree_seance || "";
  const transpiration_echelle = parseFloat(data.transpiration || "5");
  const urine_couleur = parseInt(data.urine_couleur || "4");
  const crampes = data.crampes || "Non";
  const courbatures = data.courbatures || "Non";
  const metier_physique = data.metier_physique || "Non";
  const boissons = data.boissons_journalieres;

  // ========== CALCUL DES BESOINS BASALS ==========
  
  // 1. Base selon âge et sexe
  const imc = calculateIMC(poids_kg, taille_cm);
  const baseHydration = calculateBaseHydration(poids_kg, imc, ageData.mlPerKg);
  const facteurSexe = getFacteurSexe(sexe, situation_particuliere);
  const base_age_sexe = Math.round(baseHydration * facteurSexe.facteur * ageData.facteurMetabo);
  
  // 2. Ajustement IMC (déjà inclus dans baseHydration)
  const ajust_imc = imc >= 30 ? Math.round((poids_kg - 20) * 15 + 1500 - (poids_kg * ageData.mlPerKg)) : 0;
  
  // 3. Ajustement température
  const ajust_temperature = getAjustTemperatureBasal(temperature_ext);
  
  // 4. Ajustement boissons
  const boissonData = getAjustBoissons(boissons);
  const ajust_boissons = boissonData.total;
  
  // 5. Ajustement physiologique (grossesse/allaitement)
  const ajust_physiologique = facteurSexe.bonus;
  
  // 6. Ajustement symptômes (urine + métier physique)
  let ajust_symptomes = getAjustUrine(urine_couleur);
  if (metier_physique === "Oui") ajust_symptomes += 500;
  
  const besoins_basals_ml = Math.max(
    base_age_sexe + ajust_temperature + ajust_boissons + ajust_physiologique + ajust_symptomes,
    1500 // garde-fou plancher
  );

  // ========== CALCUL DES BESOINS PENDANT L'EXERCICE ==========
  
  let besoins_exercice_ml = 0;
  let pertes_transpiration = 0;
  let facteur_sport = 0;
  let duree_heures = 0;
  let ajust_temperature_exercice = 0;
  
  if (sport_pratique === "Oui" && type_sport && duree_seance) {
    // Calcul pertes par transpiration (ml/kg/h)
    const pertes_ml_kg_h = 5 + (0.6 * transpiration_echelle);
    pertes_transpiration = pertes_ml_kg_h * poids_kg;
    
    // Facteur type de sport
    facteur_sport = getFacteurSport(type_sport);
    
    // Durée en heures
    duree_heures = getDureeHeures(duree_seance);
    
    // Ajustement température pour exercice (ml/h)
    ajust_temperature_exercice = getAjustTemperatureExercice(temperature_ext);
    
    // Total besoins exercice
    besoins_exercice_ml = Math.round(
      (pertes_transpiration * facteur_sport + ajust_temperature_exercice) * duree_heures
    );
  }

  // ========== TOTAUX ET RECOMMANDATIONS ==========
  
  const besoin_total_ml = besoins_basals_ml + besoins_exercice_ml;
  
  // Pastilles Hydratis
  // Pour les besoins basals : 2 pastilles / 500 ml
  let nb_pastilles_basal = Math.ceil(besoins_basals_ml / 500 / 2);
  if (temperature_ext === "> 28°C") nb_pastilles_basal += 1;
  nb_pastilles_basal = Math.min(nb_pastilles_basal, 5);
  if (ageData.median >= 60 && ageData.median < 70) nb_pastilles_basal = Math.min(nb_pastilles_basal, 3);
  if (ageData.median >= 70) nb_pastilles_basal = Math.min(nb_pastilles_basal, 2);
  
  // Pour l'exercice : 1 pastille / 500 ml
  const nb_pastilles_exercice = besoins_exercice_ml > 0 ? Math.ceil(besoins_exercice_ml / 500) : 0;

  // Score d'hydratation
  let score = 100;
  if (urine_couleur >= 6) score -= 20;
  else if (urine_couleur >= 4) score -= 8;
  if (crampes === "Oui") score -= 8;
  if (courbatures === "Oui") score -= 5;
  if (transpiration_echelle >= 7) score -= 5;
  const totalAlcool = (boissons?.vin || 0) + (boissons?.biere || 0);
  if (totalAlcool >= 2) score -= 6;
  score = Math.max(score, 0);

  // Statut
  const statut = score >= 85 ? "Hydratation optimale"
               : score >= 70 ? "Hydratation correcte"
               : score >= 50 ? "Légère déshydratation"
               : "Déshydratation probable";

  // Notes additionnelles
  const notes: string[] = [...boissonData.notes];
  
  if (temperature_ext === "> 28°C") {
    notes.push("Chaleur : fractionnez vos apports hydriques tout au long de la journée.");
  }
  
  if (situation_particuliere?.startsWith("Enceinte")) {
    notes.push("Grossesse : privilégiez une hydratation régulière. Consultez un médecin en cas de malaise.");
  }
  
  if (situation_particuliere === "Allaitante") {
    notes.push("Allaitement : vos besoins en eau sont augmentés d'environ 700 mL/jour.");
  }
  
  if (crampes === "Oui") {
    notes.push("Crampes fréquentes : veillez à votre hydratation et à vos apports en électrolytes (sodium, potassium, magnésium).");
  }
  
  if (courbatures === "Oui") {
    notes.push("Courbatures : une bonne hydratation facilite la récupération musculaire.");
  }
  
  if (transpiration_echelle >= 7 && sport_pratique === "Oui") {
    notes.push("Forte transpiration : pesez-vous avant et après l'effort pour compenser 150% des pertes hydriques.");
  }
  
  if (metier_physique === "Oui") {
    notes.push("Métier physique : pensez à vous hydrater régulièrement au cours de la journée.");
  }

  return {
    besoins_basals_ml,
    details_basals: {
      base_age_sexe,
      ajust_imc,
      ajust_temperature,
      ajust_boissons,
      ajust_physiologique,
      ajust_symptomes,
    },
    besoins_exercice_ml,
    details_exercice: {
      pertes_transpiration: Math.round(pertes_transpiration),
      facteur_sport,
      duree_heures,
      ajust_temperature: ajust_temperature_exercice,
    },
    besoin_total_ml,
    nb_pastilles_basal,
    nb_pastilles_exercice,
    score,
    statut,
    notes,
  };
};
