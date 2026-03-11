import { Question } from "@/types/diagnostic";

export const questions: Question[] = [
  // ===== ÉTAPE 1 - PROFIL =====
  {
    id: "sexe",
    text: "Pour commencer, es-tu...",
    type: "options",
    options: ["Un homme", "Une femme", "Autre"],
    step: "Profil",
    icon: "user"
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
    },
    icon: "baby"
  },
  {
    id: "age",
    text: "Quel âge as-tu ?",
    type: "input",
    inputType: "number",
    placeholder: "Ex: 25",
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
    text: "En ce moment, quelle est la température extérieure ?\n\n💡 La température influence tes besoins en eau.",
    type: "temperatureSelector",
    step: "Santé & Conditions",
  },
  
  // ===== ÉTAPE 3 - ACTIVITÉ PHYSIQUE =====
  {
    id: "sport_pratique",
    text: "Pratiques-tu une activité sportive ?",
    type: "options",
    options: ["Oui", "Non"],
    step: "Activité physique",
  },
  {
    id: "metier_physique",
    text: "Exerces-tu un métier physique ?",
    type: "options",
    options: ["Oui", "Non"],
    step: "Activité physique",
  },
  {
    id: "sports_selectionnes",
    text: "Quel(s) sport(s) pratiques-tu ? (Tu peux en sélectionner plusieurs)",
    type: "sportSelector",
    step: "Activité physique",
    conditional: {
      dependsOn: "sport_pratique",
      value: "Oui"
    }
  },
  {
    id: "frequence",
    text: "Quelle est la fréquence de ta pratique sportive ?",
    type: "options",
    options: ["1 à 2 fois par semaine", "3 à 5 fois par semaine", "Plus de 6 fois par semaine"],
    multiColumn: false,
    step: "Activité physique",
    conditional: {
      dependsOn: "sport_pratique",
      value: "Oui"
    }
  },
  {
    id: "duree_minutes",
    text: "Quelle est la durée moyenne de tes séances (en minutes) ?",
    type: "input",
    inputType: "number",
    placeholder: "Ex: 45",
    step: "Activité physique",
    conditional: {
      dependsOn: "sport_pratique",
      value: "Oui"
    }
  },
  // Note: Cette question s'affiche si sport_pratique OU metier_physique est "Oui"
  // La logique complète (OR) est implémentée dans ThematicScreen.tsx (cas spécial pour id="transpiration")
  {
    id: "transpiration",
    text: "À quel point transpires-tu pendant ton activité ?",
    type: "transpirationScale",
    step: "Activité physique",
    conditionalMultiple: {
      dependsOn: "sport_pratique",
      values: ["Oui"]
    }
  },
  
  // ===== ÉTAPE 4 - SIGNAUX CLINIQUES =====
  {
    id: "crampes",
    text: "Souffres-tu régulièrement de crampes ?\n\n💡 Les crampes surviennent généralement pendant l'effort.",
    type: "options",
    options: ["Oui", "Non"],
    step: "Santé & Conditions",
  },
  {
    id: "courbatures",
    text: "As-tu souvent des courbatures ?\n\n💡 Les courbatures surviennent généralement après l'effort.",
    type: "options",
    options: ["Oui", "Non"],
    step: "Santé & Conditions",
  },
  {
    id: "urine_couleur",
    text: "Quelle est la couleur habituelle de ton urine ?",
    type: "colorScale",
    step: "Santé & Conditions",
  },
  
  // ===== ÉTAPE 5 - HABITUDES =====
  {
    id: "boissons_journalieres",
    text: "Indique combien de verres/portions de chaque boisson tu consommes en moyenne tous les jours.",
    type: "beverageSelector",
    step: "Habitudes",
  },
  
  // ===== INFOS FINALES (étape séparée pour tracker les abandons) =====
  {
    id: "firstName",
    text: "D'ailleurs, apprenons à faire connaissance !\n\nQuel est ton prénom ?",
    type: "input",
    inputType: "text",
    placeholder: "Ton prénom",
    step: "Coordonnées",
  },
  {
    id: "email",
    text: "Et ton adresse email ? (pour recevoir ton diagnostic)",
    type: "input",
    inputType: "email",
    placeholder: "ton.email@exemple.com",
    step: "Coordonnées",
  },
];
