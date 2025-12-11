import { useState, useEffect, useRef } from "react";
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

const parseQuestionText = (text: string) => {
  const hintMatch = text.match(/\n\n(💡.+)$/s);
  
  if (hintMatch) {
    return {
      mainText: text.replace(/\n\n💡.+$/s, ''),
      hint: hintMatch[1]
    };
  }
  
  return { mainText: text, hint: null };
};

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
  const screenRef = useRef<HTMLDivElement>(null);
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
    hydratis: 0
  });
  const [selectedSports, setSelectedSports] = useState<Sport[]>([]);

  // Pre-fill answers from previousAnswers when questions change
  useEffect(() => {
    const initialAnswers: Partial<DiagnosticData> = {};
    questions.forEach(q => {
      const value = previousAnswers[q.id];
      // Only copy simple values (strings/numbers), not complex objects/arrays
      if (value !== undefined && (typeof value === 'string' || typeof value === 'number')) {
        (initialAnswers as any)[q.id] = value;
      }
    });
    setAnswers(initialAnswers);
    
    // Pre-fill beverages if present
    if (previousAnswers.boissons_journalieres && typeof previousAnswers.boissons_journalieres === 'object') {
      setBeverageQuantities(previousAnswers.boissons_journalieres as BeverageQuantities);
    }
    
    // Pre-fill selected sports if present
    if (previousAnswers.sports_selectionnes && Array.isArray(previousAnswers.sports_selectionnes)) {
      setSelectedSports(previousAnswers.sports_selectionnes as Sport[]);
    }
  }, [questions, previousAnswers]);

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
    const submittedAnswers = {
      ...answers
    };

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
    const cleanText = question.text.replace(/\*\*.*?\*\*\n\n/g, '')
      .replace(/^.*?Pour commencer, es-tu\.\.\.$/m, 'Es-tu...');
    
    const { mainText, hint } = parseQuestionText(cleanText);

    switch (question.type) {
      case "options":
        return (
          <div key={question.id} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-foreground">
                {mainText}
              </Label>
              {hint && (
                <p className="text-xs text-muted-foreground italic">
                  {hint}
                </p>
              )}
            </div>
            <RadioGroup 
              value={answers[question.id] as string || ""} 
              onValueChange={value => setAnswers(prev => ({
                ...prev,
                [question.id]: value
              }))} 
              className={cn("gap-2", question.multiColumn && "grid grid-cols-2")}
            >
              {question.options?.map((option, idx) => {
                const icon = getOptionIcon(question, option);
                return (
                  <label 
                    key={idx} 
                    htmlFor={`${question.id}-${idx}`}
                    className="flex items-center space-x-3 p-3 min-h-[48px] border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer touch-manipulation active:scale-[0.98]"
                  >
                    <RadioGroupItem value={option} id={`${question.id}-${idx}`} />
                    <span className="flex-1 font-normal flex items-center gap-2">
                      {icon}
                      {option}
                    </span>
                  </label>
                );
              })}
            </RadioGroup>
          </div>
        );
      case "input":
        return (
          <div key={question.id} className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor={question.id} className="text-sm font-medium text-foreground">
                {mainText}
              </Label>
              {hint && (
                <p className="text-xs text-muted-foreground italic">
                  {hint}
                </p>
              )}
            </div>
            <Input 
              id={question.id} 
              type={question.inputType || "text"} 
              placeholder={question.placeholder} 
              value={answers[question.id] as string || ""} 
              onChange={e => setAnswers(prev => ({
                ...prev,
                [question.id]: e.target.value
              }))} 
              className="w-full" 
            />
          </div>
        );
      case "colorScale":
        return (
          <div key={question.id} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-foreground">
                {mainText}
              </Label>
              {hint && (
                <p className="text-xs text-muted-foreground italic">
                  {hint}
                </p>
              )}
            </div>
            <ColorScaleSelector 
              value={answers[question.id] as string}
              onSelect={value => setAnswers(prev => ({
                ...prev,
                [question.id]: value
              }))} 
            />
          </div>
        );
      case "transpirationScale":
        return (
          <div key={question.id} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-foreground">
                {mainText}
              </Label>
              {hint && (
                <p className="text-xs text-muted-foreground italic">
                  {hint}
                </p>
              )}
            </div>
            <TranspirationScale 
              value={answers[question.id] as string}
              onSelect={value => setAnswers(prev => ({
                ...prev,
                [question.id]: value
              }))} 
            />
          </div>
        );
      case "beverageSelector":
        return (
          <div key={question.id} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-foreground">
                {mainText}
              </Label>
              {hint && (
                <p className="text-xs text-muted-foreground italic">
                  {hint}
                </p>
              )}
            </div>
            <BeverageSelector quantities={beverageQuantities} onChange={setBeverageQuantities} />
          </div>
        );
      case "temperatureSelector":
        return (
          <div key={question.id} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-foreground">
                {mainText}
              </Label>
              {hint && (
                <p className="text-xs text-muted-foreground italic">
                  {hint}
                </p>
              )}
            </div>
            <TemperatureSelector 
              value={answers[question.id] as string}
              onSelect={value => setAnswers(prev => ({
                ...prev,
                [question.id]: value
              }))} 
            />
          </div>
        );
      case "sportSelector":
        return (
          <div key={question.id} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-foreground">
                {mainText}
              </Label>
              {hint && (
                <p className="text-xs text-muted-foreground italic">
                  {hint}
                </p>
              )}
            </div>
            <SportSelector 
              selectedSports={selectedSports}
              onSelect={sports => setSelectedSports(sports)} 
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div ref={screenRef} className="animate-screen-enter pb-24 sm:pb-6 will-change-transform">
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-primary mb-1">{stepName}</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {visibleQuestions.map(renderQuestion)}

          {/* Marketing consent mention - only show on email step */}
          {visibleQuestions.some(q => q.id === "email") && (
            <p className="text-xs text-muted-foreground italic text-center">
              En continuant, vous acceptez de recevoir des emails marketing de la part d'Hydratis.
            </p>
          )}

          {/* Desktop button - hidden on mobile */}
          <Button 
            type="submit" 
            className="w-full hidden sm:flex touch-target" 
            size="lg" 
            disabled={!canSubmit}
          >
            Continuer
          </Button>
        </form>
      </div>

      {/* Mobile sticky button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-safe bg-background/95 backdrop-blur-sm border-t border-border/50 sm:hidden z-40">
        <Button 
          type="button"
          onClick={handleSubmit}
          className="w-full touch-target touch-active touch-manipulation" 
          size="lg" 
          disabled={!canSubmit}
        >
          Continuer
        </Button>
      </div>
    </div>
  );
};