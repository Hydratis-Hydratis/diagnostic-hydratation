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
  hydratation_reelle_ml: number;
  ecart_hydratation_ml: number;
  nb_pastilles_basal: number;
  nb_pastilles_exercice: number;
  nb_pastilles_post_exercice: number;
  score: number;
  statut: string;
  notes: string[];
}

// Convertit l'âge exact en valeurs pour le calcul
const getAgeData = (ageInput: string): { median: number; mlPerKg: number; facteurMetabo: number } => {
  const age = parseInt(ageInput);
  
  // Si l'âge n'est pas valide, utiliser la valeur par défaut adulte
  if (isNaN(age) || age < 1) {
    return { median: 33, mlPerKg: 32.5, facteurMetabo: 1.0 };
  }
  
  // Déterminer la tranche d'âge et retourner les paramètres correspondants
  if (age >= 3 && age <= 10) {
    return { median: age, mlPerKg: 55, facteurMetabo: 1.3 };
  } else if (age >= 11 && age <= 17) {
    return { median: age, mlPerKg: 45, facteurMetabo: 1.1 };
  } else if (age >= 18 && age <= 49) {
    return { median: age, mlPerKg: 32.5, facteurMetabo: 1.0 };
  } else if (age >= 50 && age <= 60) {
    return { median: age, mlPerKg: 30, facteurMetabo: 0.9 };
  } else if (age >= 61 && age <= 69) {
    return { median: age, mlPerKg: 30, facteurMetabo: 0.9 };
  } else if (age >= 70) {
    return { median: age, mlPerKg: 25, facteurMetabo: 0.8 };
  } else {
    // Pour les enfants < 3 ans, utiliser les paramètres des 3-10 ans
    return { median: 3, mlPerKg: 55, facteurMetabo: 1.3 };
  }
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

// Note: La couleur d'urine est utilisée uniquement comme indicateur, pas pour ajuster les besoins

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
    total += 100;
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
    total += 150;
    notes.push("Boissons énergisantes : très sucrées et caféinées, fortement déshydratantes.");
  }
  
  // Vin
  const vin = boissons.vin || 0;
  if (vin >= 1) {
    total += 100;
    notes.push("L'alcool déshydrate : compensez avec de l'eau. L'abus d'alcool est dangereux pour la santé.");
  }
  
  // Bière
  const biere = boissons.biere || 0;
  if (biere >= 1) {
    total += 100;
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
  
  // 6. Ajustement symptômes (métier physique uniquement)
  let ajust_symptomes = 0;
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
  
  let besoin_total_ml = besoins_basals_ml + besoins_exercice_ml;
  const besoin_total_original = besoin_total_ml;
  
  // ========== PLAFOND DE 6000 ML ==========
  const PLAFOND_MAX = 6000;
  let alerte_plafond = "";
  
  if (besoin_total_ml >= 4500 && besoin_total_ml < 5000) {
    alerte_plafond = "💧 Vos besoins hydriques sont élevés. Pensez à vous hydrater régulièrement tout au long de la journée.";
  } else if (besoin_total_ml >= 5000 && besoin_total_ml < PLAFOND_MAX) {
    alerte_plafond = "⚠️ Vos besoins hydriques sont exceptionnellement élevés en raison de la combinaison de plusieurs facteurs (chaleur, activité physique intense, etc.). Fractionnez bien votre hydratation et consultez un professionnel de santé si nécessaire.";
  } else if (besoin_total_ml >= PLAFOND_MAX) {
    alerte_plafond = `⚠️ Vos besoins calculés dépassent ${PLAFOND_MAX / 1000}L (${besoin_total_original} mL), ce qui concerne les athlètes de haut niveau en conditions extrêmes. La valeur a été plafonnée à ${PLAFOND_MAX / 1000}L. Un suivi médical sportif est fortement recommandé pour une hydratation personnalisée.`;
    besoin_total_ml = PLAFOND_MAX;
  }
  
  // Calcul de l'hydratation réelle
  let hydratation_reelle_ml = 0;
  if (boissons) {
    // 1 verre = 250 ml
    const totalVerres = Object.values(boissons).reduce((sum: number, qty: number) => sum + qty, 0);
    hydratation_reelle_ml = totalVerres * 250;
  }
  
  // Écart entre besoins et hydratation réelle
  const ecart_hydratation_ml = besoin_total_ml - hydratation_reelle_ml;
  
  // Pastilles Hydratis
  // Pour les besoins basals : 2 pastilles / 500 ml
  let nb_pastilles_basal = Math.ceil(besoins_basals_ml / 500 / 2);
  if (temperature_ext === "> 28°C") nb_pastilles_basal += 1;
  nb_pastilles_basal = Math.min(nb_pastilles_basal, 5);
  if (ageData.median >= 60 && ageData.median < 70) nb_pastilles_basal = Math.min(nb_pastilles_basal, 3);
  if (ageData.median >= 70) nb_pastilles_basal = Math.min(nb_pastilles_basal, 2);
  
  // Pour l'exercice : 1 pastille / 500 ml
  const nb_pastilles_exercice = besoins_exercice_ml > 0 ? Math.ceil(besoins_exercice_ml / 500) : 0;
  
  // Pour la récupération post-exercice : 1 pastille si besoins exercice > 0
  const nb_pastilles_post_exercice = besoins_exercice_ml > 0 ? 1 : 0;

  // Score d'hydratation : (Hydratation actuelle / Besoin total quotidien) * 100
  const score = Math.round((hydratation_reelle_ml / besoin_total_ml) * 100);

  // Statut
  const statut = score >= 85 ? "Hydratation optimale"
               : score >= 70 ? "Hydratation correcte"
               : score >= 50 ? "Légère déshydratation"
               : "Déshydratation probable";

  // ========== MESSAGES PERSONNALISÉS CONTEXTUELS ==========
  const notes: string[] = [...boissonData.notes];
  
  // Ajouter l'alerte de plafond en premier si elle existe
  if (alerte_plafond) {
    notes.unshift(alerte_plafond);
  }
  
  // 💧 1. Eau consommée
  if (hydratation_reelle_ml > 0) {
    const pourcentage_besoins = Math.round((hydratation_reelle_ml / besoin_total_ml) * 100);
    const manque_ml = Math.max(0, besoin_total_ml - hydratation_reelle_ml);
    
    if (pourcentage_besoins >= 90) {
      notes.push(`💧 Vous êtes sur la bonne voie avec ${hydratation_reelle_ml} mL d'eau par jour, continuez à boire régulièrement tout au long de la journée.`);
    } else if (pourcentage_besoins >= 70) {
      notes.push(`💧 Votre apport en eau représente environ ${pourcentage_besoins}% de vos besoins journaliers. Essayez d'ajouter environ ${manque_ml} mL d'eau pour atteindre votre objectif d'hydratation.`);
    } else {
      notes.push(`💧 Vous avez bu ${hydratation_reelle_ml} mL d'eau pure aujourd'hui. Essayez d'ajouter environ ${manque_ml} mL d'eau pour atteindre votre objectif. L'eau reste votre meilleur allié : c'est la seule boisson 100% hydratante.`);
    }
  }
  
  // 🚻 2. Couleur de l'urine (indicateur uniquement)
  if (urine_couleur <= 3) {
    notes.push("🚻 La couleur claire de vos urines indique une bonne hydratation actuelle.");
  } else if (urine_couleur <= 5) {
    notes.push("🚻 ⚠️ Vos urines sont légèrement foncées : cela indique que vous êtes actuellement en début de déshydratation. Buvez de l'eau dès maintenant pour corriger cet état.");
  } else if (urine_couleur <= 7) {
    notes.push("🚻 ⚠️ La couleur foncée de vos urines indique que vous êtes actuellement déshydraté(e). Augmentez votre consommation d'eau dès maintenant pour retrouver une hydratation optimale.");
  } else {
    notes.push("🚻 ⚠️ Vos urines très foncées signalent une déshydratation importante. Buvez de l'eau immédiatement (500-750 mL dans l'heure). Si cette couleur persiste malgré une bonne hydratation, consultez un professionnel de santé.");
  }
  
  // 💪 3. Crampes et courbatures
  if (crampes === "Non" && courbatures === "Non") {
    notes.push("💪 Aucun signe musculaire notable : vos apports hydriques et électrolytiques sont bien adaptés.");
  } else if (crampes === "Oui" && courbatures === "Non") {
    notes.push("💪 De légères crampes peuvent indiquer un petit déficit en magnésium ou sodium. Buvez 250 mL supplémentaires et veillez à consommer des aliments riches en électrolytes.");
  } else if (crampes === "Non" && courbatures === "Oui") {
    notes.push("💪 Les courbatures peuvent être atténuées par une bonne hydratation qui facilite l'élimination des métabolites. Buvez 250 mL supplémentaires.");
  } else {
    notes.push("💪 Des crampes et courbatures fréquentes signalent souvent un déséquilibre hydro-électrolytique. Buvez 500 mL d'eau en plus et privilégiez une boisson contenant sodium, potassium et magnésium. Si les crampes persistent, un avis médical est recommandé.");
  }
  
  // 🏃 4. Activité physique
  if (sport_pratique === "Oui" && besoins_exercice_ml > 0) {
    notes.push(`🏃 L'effort augmente vos pertes hydriques : prévoyez une hydratation adaptée avant, pendant et après l'exercice. Pour cette séance, vos pertes estimées sont d'environ ${besoins_exercice_ml} mL.`);
    
    if (duree_heures > 0) {
      const ml_par_heure = Math.round(besoins_exercice_ml / duree_heures);
      notes.push(`🏃 En moyenne, cela représente ${ml_par_heure} mL par heure d'effort, à répartir en petites gorgées. Après l'effort, buvez environ 1,5 fois la perte de poids observée pour une récupération optimale.`);
    }
    
    if (transpiration_echelle >= 7) {
      notes.push("🏃 Votre transpiration est importante : pensez à intégrer une boisson contenant sodium et magnésium. Pour un effort de cette intensité, la consommation d'une solution hypotonique comme Hydratis peut aider à mieux retenir l'eau.");
    }
  }
  
  // 🌡️ 5. Température extérieure
  if (temperature_ext === "> 28°C") {
    notes.push(`🌡️ Par temps chaud, ajoutez ${getAjustTemperatureBasal(temperature_ext)} mL d'eau supplémentaires. Au-delà de 30°C, la transpiration augmente fortement : buvez plus souvent, même sans soif. En cas de chaleur ou d'humidité élevée, privilégiez des solutions hydratantes riches en électrolytes.`);
  } else if (temperature_ext === "18-28°C") {
    notes.push("🌡️ La température ambiante influence directement vos besoins hydriques. Gardez le réflexe de boire régulièrement tout au long de la journée.");
  } else if (temperature_ext === "< 10°C" || temperature_ext === "10-18°C") {
    notes.push("🌡️ Sous 20°C, vos besoins restent proches de la moyenne, mais gardez le réflexe de boire régulièrement.");
  }
  
  // 💦 6. Transpiration / sensation d'effort
  if (sport_pratique === "Oui") {
    if (transpiration_echelle >= 7) {
      notes.push("💦 Votre transpiration a été intense : vos besoins dépassent probablement 1 L d'eau pour cette séance. N'oubliez pas d'apporter aussi des électrolytes pour reconstituer les pertes en sodium et potassium. La soif est un signal tardif de déshydratation : buvez avant de la ressentir.");
    } else if (transpiration_echelle >= 4) {
      notes.push(`💦 Votre sensation de transpiration correspond à une perte modérée : pensez à boire environ ${besoins_exercice_ml} mL pendant et après l'effort.`);
    } else {
      notes.push("💦 Même si vous transpirez peu, l'eau reste essentielle pour réguler la température corporelle.");
    }
  }
  
  // Situation particulière
  if (situation_particuliere?.startsWith("Enceinte")) {
    notes.push("🤰 Grossesse : privilégiez une hydratation régulière. Consultez un médecin en cas de malaise.");
  }
  
  if (situation_particuliere === "Allaitante") {
    notes.push("🤱 Allaitement : vos besoins en eau sont augmentés d'environ 700 mL/jour.");
  }
  
  if (metier_physique === "Oui") {
    notes.push("💼 Métier physique : pensez à vous hydrater régulièrement au cours de la journée, même sans sensation de soif.");
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
    hydratation_reelle_ml,
    ecart_hydratation_ml,
    nb_pastilles_basal,
    nb_pastilles_exercice,
    nb_pastilles_post_exercice,
    score,
    statut,
    notes,
  };
};
