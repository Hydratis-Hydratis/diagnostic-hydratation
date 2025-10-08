import { Question } from "@/types/diagnostic";

export const questions: Question[] = [
  // ===== ÉTAPE 1 - PROFIL =====
  {
    id: "sexe",
    text: "Bonjour ! Je suis ravie de t'aider avec ton diagnostic d'hydratation.\n\n👤 **Étape 1 - Profil**\n\nPour commencer, es-tu...",
    type: "options",
    options: ["Un homme", "Une femme", "Autre"],
    step: "Profil",
  },
  {
    id: "situation_particuliere",
    text: "Es-tu dans une situation particulière ?",
    type: "options",
    options: [
      "Aucune",
      "Enceinte (1er trimestre)",
      "Enceinte (2e trimestre)",
      "Enceinte (3e trimestre)",
      "Allaitante"
    ],
    step: "Profil",
    conditional: {
      dependsOn: "sexe",
      value: "Une femme"
    }
  },
  {
    id: "age",
    text: "Quelle est ta tranche d'âge ?",
    type: "options",
    options: ["3-10 ans", "11-17 ans", "18-49 ans", "50-60 ans", "61-69 ans", "70+ ans"],
    multiColumn: true,
    step: "Profil",
  },
  {
    id: "taille_cm",
    text: "Quelle est ta taille (en cm) ?",
    type: "input",
    inputType: "number",
    placeholder: "Ex: 170",
    step: "Profil",
  },
  {
    id: "poids_kg",
    text: "Quel est ton poids (en kg) ?",
    type: "input",
    inputType: "number",
    placeholder: "Ex: 70",
    step: "Profil",
  },
  
  // ===== ÉTAPE 2 - ENVIRONNEMENT =====
  {
    id: "temperature_ext",
    text: "🌡️ **Étape 2 - Environnement**\n\nQuelle est la température extérieure habituelle ?",
    type: "options",
    options: ["< 0°C", "0-10°C", "10-18°C", "18-28°C", "> 28°C"],
    multiColumn: true,
    step: "Environnement",
  },
  
  // ===== ÉTAPE 3 - ACTIVITÉ PHYSIQUE =====
  {
    id: "sport_pratique",
    text: "🏃 **Étape 3 - Activité physique**\n\nPratiques-tu une activité sportive ?",
    type: "options",
    options: ["Oui", "Non"],
    step: "Activité physique",
  },
  {
    id: "frequence",
    text: "Quelle est la fréquence de ta pratique sportive ?",
    type: "options",
    options: ["Jamais", "1-2 fois/semaine", "3-5 fois/semaine", "6+ fois/semaine"],
    multiColumn: true,
    step: "Activité physique",
    skipIfNo: "sport_pratique",
  },
  {
    id: "duree_seance",
    text: "Quelle est la durée moyenne de tes séances ?",
    type: "options",
    options: ["15-30 min", "30-60 min", "60-120 min", "120+ min"],
    multiColumn: true,
    step: "Activité physique",
    skipIfNo: "sport_pratique",
  },
  {
    id: "type_sport",
    text: "Quel type d'activité sportive pratiques-tu principalement ?",
    type: "options",
    options: ["Endurance", "Sport collectif", "Force/Musculation", "Autre"],
    multiColumn: true,
    step: "Activité physique",
    skipIfNo: "sport_pratique",
  },
  {
    id: "nom_sport",
    text: "Quel est le nom de ton sport principal ?",
    type: "options",
    options: [
      "Course à pied",
      "Cyclisme",
      "Natation",
      "Football",
      "Basketball",
      "Tennis",
      "Musculation",
      "Yoga",
      "CrossFit",
      "Randonnée",
      "Danse",
      "Autre"
    ],
    multiColumn: true,
    step: "Activité physique",
    skipIfNo: "sport_pratique",
  },
  {
    id: "transpiration",
    text: "Comment évalues-tu ta transpiration pendant l'effort ?",
    type: "options",
    options: ["Faible", "Moyenne", "Forte"],
    step: "Activité physique",
    skipIfNo: "sport_pratique",
  },
  {
    id: "metier_physique",
    text: "Exerces-tu un métier physique ?",
    type: "options",
    options: ["Oui", "Non"],
    step: "Activité physique",
  },
  
  // ===== ÉTAPE 4 - SIGNAUX CLINIQUES =====
  {
    id: "crampes",
    text: "🩺 **Étape 4 - Signaux cliniques**\n\nSouffres-tu régulièrement de crampes ?",
    type: "options",
    options: ["Oui", "Non"],
    step: "Signaux cliniques",
  },
  {
    id: "courbatures",
    text: "As-tu souvent des courbatures ?",
    type: "options",
    options: ["Oui", "Non"],
    step: "Signaux cliniques",
  },
  {
    id: "urine_couleur",
    text: "Quelle est la couleur habituelle de ton urine ?",
    type: "colorScale",
    step: "Signaux cliniques",
  },
  
  // ===== ÉTAPE 5 - HABITUDES =====
  {
    id: "consommation_boissons",
    text: "☕ **Étape 5 - Habitudes de consommation**\n\nQuelles boissons consommes-tu régulièrement ?\n\n_(Tu peux en sélectionner plusieurs)_",
    type: "multiSelect",
    options: [
      "Eau",
      "Café",
      "Thé",
      "Sodas",
      "Boissons énergisantes",
      "Alcool"
    ],
    step: "Habitudes",
  },
  
  // ===== INFOS FINALES =====
  {
    id: "firstName",
    text: "Super ! On arrive bientôt au bout.\n\nQuel est ton prénom ?",
    type: "input",
    inputType: "text",
    placeholder: "Ton prénom",
  },
  {
    id: "email",
    text: "Merci d'avoir répondu à ce questionnaire !\n\nPour recevoir ton diagnostic personnalisé, quelle est ton adresse e-mail ?",
    type: "input",
    inputType: "email",
    placeholder: "ton.email@exemple.com",
  },
];
