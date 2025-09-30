export interface DiagnosticData {
  gender?: string;
  age?: string;
  height?: string;
  weight?: string;
  activity?: string;
  waterIntake?: string;
  alcohol?: string;
  fatigue?: string;
  urineColor?: string;
  firstName?: string;
  email?: string;
}

export interface Question {
  id: keyof DiagnosticData;
  text: string;
  type: "options" | "input";
  inputType?: "text" | "email" | "number";
  options?: string[];
  placeholder?: string;
  multiColumn?: boolean;
}
