export interface DiagnosticData {
  // Étape 1 - Profil
  sexe?: string;
  situation_particuliere?: string;
  age?: string;
  taille_cm?: string;
  poids_kg?: string;
  
  // Étape 2 - Environnement
  temperature_ext?: string;
  
  // Étape 3 - Activité physique
  sport_pratique?: string;
  frequence?: string;
  duree_seance?: string;
  type_sport?: string;
  nom_sport?: string;
  transpiration?: string;
  metier_physique?: string;
  
  // Étape 4 - Signaux cliniques
  crampes?: string;
  courbatures?: string;
  urine_couleur?: string;
  
  // Étape 5 - Habitudes
  boissons_journalieres?: {
    eau: number;
    soda: number;
    soda_zero: number;
    jus: number;
    cafe_sucre: number;
    cafe_the: number;
    vin: number;
    biere: number;
    boisson_sport: number;
    boisson_energisante: number;
  };
  
  // Infos finales
  firstName?: string;
  email?: string;
}

export interface Question {
  id: keyof DiagnosticData;
  text: string;
  type: "options" | "input" | "colorScale" | "multiSelect" | "beverageSelector";
  inputType?: "text" | "email" | "number";
  options?: string[];
  placeholder?: string;
  multiColumn?: boolean;
  step?: string;
  conditional?: {
    dependsOn: keyof DiagnosticData;
    value: string;
  };
  skipIfNo?: keyof DiagnosticData;
}
