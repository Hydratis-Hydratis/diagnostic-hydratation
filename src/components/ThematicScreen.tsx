import { useState, useEffect } from "react";
import { Question, DiagnosticData } from "@/types/diagnostic";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { ColorScaleSelector } from "./ColorScaleSelector";
import { BeverageSelector, BeverageQuantities } from "./BeverageSelector";
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

  // Filter questions based on conditionals and previous answers
  const visibleQuestions = questions.filter(q => {
    if (q.conditional) {
      const dependsOnValue = previousAnswers[q.conditional.dependsOn] || answers[q.conditional.dependsOn];
      return dependsOnValue === q.conditional.value;
    }
    if (q.skipIfNo) {
      const skipValue = previousAnswers[q.skipIfNo] || answers[q.skipIfNo];
      return skipValue !== "Non";
    }
    return true;
  });

  const canSubmit = visibleQuestions.every(q => {
    if (q.type === "beverageSelector") return true;
    return answers[q.id] !== undefined && answers[q.id] !== "";
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submittedAnswers = { ...answers };
    
    // Add beverage quantities if present
    const hasBeverageSelector = questions.some(q => q.type === "beverageSelector");
    if (hasBeverageSelector) {
      submittedAnswers.boissons_journalieres = beverageQuantities;
    }
    
    onSubmit(submittedAnswers);
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
              {question.options?.map((option, idx) => (
                <div key={idx} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value={option} id={`${question.id}-${idx}`} />
                  <Label 
                    htmlFor={`${question.id}-${idx}`} 
                    className="flex-1 cursor-pointer font-normal"
                  >
                    {option}
                  </Label>
                </div>
              ))}
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
