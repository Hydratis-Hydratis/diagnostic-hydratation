import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import confetti from "canvas-confetti";

interface ProgressIndicatorProps {
  current: number;
  total: number;
  steps?: string[];
  onStepClick?: (stepIndex: number) => void;
}

export const ProgressIndicator = ({ current, total, steps, onStepClick }: ProgressIndicatorProps) => {
  const percentage = ((current + 1) / total) * 100;

  useEffect(() => {
    if (percentage === 100) {
      // Configuration pour des gouttes d'eau
      const defaults = {
        origin: { y: 0 },
        colors: ['#3b82f6', '#0ea5e9', '#06b6d4', '#60a5fa'],
        gravity: 1.2,
        scalar: 1.2,
        drift: 0,
        ticks: 200,
      };

      // Fonction pour créer l'effet de pluie
      function createWaterDrop(angle: number, velocity: number) {
        confetti({
          ...defaults,
          particleCount: 3,
          angle,
          spread: 15,
          startVelocity: velocity,
          shapes: ['circle'],
        });
      }

      // Lancer plusieurs vagues de gouttes
      createWaterDrop(90, 15);
      setTimeout(() => createWaterDrop(80, 18), 100);
      setTimeout(() => createWaterDrop(100, 18), 100);
      setTimeout(() => createWaterDrop(90, 20), 200);
      setTimeout(() => createWaterDrop(85, 16), 300);
      setTimeout(() => createWaterDrop(95, 16), 300);
    }
  }, [percentage]);

  return (
    <div className="px-4 py-4 border-b border-border/50 bg-gradient-to-b from-background to-transparent">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Barre principale */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-muted-foreground">
              Étape {current + 1} sur {total}
            </span>
            <span className="text-xs font-semibold text-primary">
              {Math.round(percentage)}%
            </span>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out rounded-full shadow-sm"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Étapes détaillées */}
        {steps && (
          <div className="flex justify-between gap-1">
            {steps.map((step, index) => (
              <div
                key={index}
                className={cn(
                  "flex flex-col items-center gap-1 flex-1 transition-all duration-300",
                  index === current && "scale-105"
                )}
              >
                <div
                  onClick={() => index < current && onStepClick?.(index)}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold transition-all duration-300",
                    index < current
                      ? "bg-primary border-primary text-primary-foreground shadow-sm cursor-pointer hover:scale-110 hover:shadow-md"
                      : index === current
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-background border-border text-muted-foreground"
                  )}
                >
                  {index < current ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] text-center leading-tight transition-colors duration-300 hidden sm:block",
                    index <= current
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  {step}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
