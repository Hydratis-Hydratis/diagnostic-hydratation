import { useState, useEffect } from "react";
import { Question, DiagnosticData } from "@/types/diagnostic";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { ColorScaleSelector } from "./ColorScaleSelector";
import { BeverageSelector, BeverageQuantities } from "./BeverageSelector";
import { TranspirationScale } from "./TranspirationScale";
import { TemperatureSelector } from "./TemperatureSelector";
import { SportSelector, Sport } from "./SportSelector";
import { User, Baby } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThematicScreenProps {
  questions: Question[];
  stepName: string;
  onSubmit: (answers: Partial<DiagnosticData>) => void;
  previousAnswers: DiagnosticData;
}

export const ThematicScreen = ({ 
  questions, 
  stepName, 
  onSubmit,
  previousAnswers 
}: ThematicScreenProps) => {
  const [answers, setAnswers] = useState<Partial<DiagnosticData>>({});
  const [beverageQuantities, setBeverageQuantities] = useState<BeverageQuantities>({
    eau: 0,
    soda: 0,
    soda_zero: 0,
    jus: 0,
    cafe_sucre: 0,
    cafe_the: 0,
    vin: 0,
    biere: 0,
    boisson_sport: 0,
    boisson_energisante: 0,
  });
  const [selectedSports, setSelectedSports] = useState<Sport[]>([]);

  // Filter questions based on conditionals and previous answers
  const visibleQuestions = questions.filter(q => {
    if (q.conditional) {
      const dependsOnValue = previousAnswers[q.conditional.dependsOn] || answers[q.conditional.dependsOn];
      return dependsOnValue === q.conditional.value;
    }
    if (q.conditionalMultiple) {
      // Cas spécial : la transpiration s'affiche si l'utilisateur a répondu "Oui" 
      // à sport_pratique OU metier_physique (logique OR plutôt que la logique standard)
      if (q.id === "transpiration") {
        const sportValue = previousAnswers["sport_pratique"] || answers["sport_pratique"];
        const metierValue = previousAnswers["metier_physique"] || answers["metier_physique"];
        return sportValue === "Oui" || metierValue === "Oui";
      }
      const dependsOnValue = previousAnswers[q.conditionalMultiple.dependsOn] || answers[q.conditionalMultiple.dependsOn];
      if (typeof dependsOnValue === "string") {
        return q.conditionalMultiple.values.includes(dependsOnValue);
      }
      return false;
    }
    if (q.skipIfNo) {
      const skipValue = previousAnswers[q.skipIfNo] || answers[q.skipIfNo];
      return skipValue !== "Non";
    }
    return true;
  });

  const canSubmit = visibleQuestions.every(q => {
    if (q.type === "beverageSelector") return true;
    if (q.type === "sportSelector") return selectedSports.length > 0;
    const value = answers[q.id];
    if (value === undefined || value === null) return false;
    if (typeof value === "string") return value !== "";
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    
    const submittedAnswers = { ...answers };
    
    // Add beverage quantities if present
    const hasBeverageSelector = questions.some(q => q.type === "beverageSelector");
    if (hasBeverageSelector) {
      submittedAnswers.boissons_journalieres = beverageQuantities;
    }
    
    // Add selected sports if present
    const hasSportSelector = questions.some(q => q.type === "sportSelector");
    if (hasSportSelector && selectedSports.length > 0) {
      submittedAnswers.sports_selectionnes = selectedSports;
      // Calculate average coefficient and set type_sport
      const avgCoefficient = selectedSports.reduce((sum, s) => sum + s.coefficient, 0) / selectedSports.length;
      // Find the category that best matches the average coefficient
      if (avgCoefficient >= 0.95) submittedAnswers.type_sport = "Endurance continue";
      else if (avgCoefficient >= 0.85) submittedAnswers.type_sport = "Intermittent/collectif/HIIT";
      else if (avgCoefficient >= 0.75) submittedAnswers.type_sport = "Natation";
      else if (avgCoefficient >= 0.65) submittedAnswers.type_sport = "Musculation/Force";
      else submittedAnswers.type_sport = "Yoga/Pilates/Stretching";
    }
    
    // Convert duree_minutes to duree_seance for calculator compatibility
    if (submittedAnswers.duree_minutes) {
      const minutes = parseInt(submittedAnswers.duree_minutes);
      if (minutes < 30) submittedAnswers.duree_seance = "15-30 min";
      else if (minutes < 60) submittedAnswers.duree_seance = "30-60 min";
      else if (minutes < 120) submittedAnswers.duree_seance = "60-120 min";
      else submittedAnswers.duree_seance = "120+ min";
    }
    
    onSubmit(submittedAnswers);
  };

  const getOptionIcon = (question: Question, option: string) => {
    if (question.id === "sexe") {
      if (option === "Un homme") return <User className="w-5 h-5" />;
      if (option === "Une femme") return <User className="w-5 h-5" />;
    }
    if (question.id === "situation_particuliere") {
      if (option.includes("Enceinte") || option === "Allaitante") {
        return <Baby className="w-5 h-5" />;
      }
    }
    return null;
  };

  const renderQuestion = (question: Question) => {
    const cleanText = question.text
      .replace(/\*\*.*?\*\*\n\n/g, '') // Remove headers like "👤 **Étape 1 - Profil**\n\n"
      .replace(/^.*?Pour commencer, es-tu\.\.\.$/m, 'Es-tu...'); // Clean first question

    switch (question.type) {
      case "options":
        return (
          <div key={question.id} className="space-y-3">
            <Label className="text-sm font-medium text-foreground">
              {cleanText}
            </Label>
            <RadioGroup
              value={answers[question.id] as string || ""}
              onValueChange={(value) => setAnswers(prev => ({ ...prev, [question.id]: value }))}
              className={cn(
                "gap-2",
                question.multiColumn && "grid grid-cols-2"
              )}
            >
              {question.options?.map((option, idx) => {
                const icon = getOptionIcon(question, option);
                return (
                  <div key={idx} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                    <RadioGroupItem value={option} id={`${question.id}-${idx}`} />
                    <Label 
                      htmlFor={`${question.id}-${idx}`} 
                      className="flex-1 cursor-pointer font-normal flex items-center gap-2"
                    >
                      {icon}
                      {option}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>
        );

      case "input":
        return (
          <div key={question.id} className="space-y-2">
            <Label htmlFor={question.id} className="text-sm font-medium text-foreground">
              {cleanText}
            </Label>
            <Input
              id={question.id}
              type={question.inputType || "text"}
              placeholder={question.placeholder}
              value={answers[question.id] as string || ""}
              onChange={(e) => setAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
              className="w-full"
            />
          </div>
        );

      case "colorScale":
        return (
          <div key={question.id} className="space-y-3">
            <Label className="text-sm font-medium text-foreground">
              {cleanText}
            </Label>
            <ColorScaleSelector 
              onSelect={(value) => setAnswers(prev => ({ ...prev, [question.id]: value }))}
            />
          </div>
        );

      case "transpirationScale":
        return (
          <div key={question.id} className="space-y-3">
            <Label className="text-sm font-medium text-foreground">
              {cleanText}
            </Label>
            <TranspirationScale 
              onSelect={(value) => setAnswers(prev => ({ ...prev, [question.id]: value }))}
            />
          </div>
        );

      case "beverageSelector":
        return (
          <div key={question.id} className="space-y-3">
            <Label className="text-sm font-medium text-foreground">
              {cleanText}
            </Label>
            <BeverageSelector
              quantities={beverageQuantities}
              onChange={setBeverageQuantities}
            />
          </div>
        );

      case "temperatureSelector":
        return (
          <div key={question.id} className="space-y-3">
            <Label className="text-sm font-medium text-foreground">
              {cleanText}
            </Label>
            <TemperatureSelector
              onSelect={(value) => setAnswers(prev => ({ ...prev, [question.id]: value }))}
            />
          </div>
        );

      case "sportSelector":
        return (
          <div key={question.id} className="space-y-3">
            <Label className="text-sm font-medium text-foreground">
              {cleanText}
            </Label>
            <SportSelector
              onSelect={(sports) => setSelectedSports(sports)}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-primary mb-1">{stepName}</h3>
          <p className="text-xs text-muted-foreground">
            Complète tous les champs pour continuer
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {visibleQuestions.map(renderQuestion)}

          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={!canSubmit}
          >
            Continuer
          </Button>
        </form>
      </div>
    </div>
  );
};
