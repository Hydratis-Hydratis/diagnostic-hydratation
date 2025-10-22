import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  current: number;
  total: number;
  steps?: string[];
}

export const ProgressIndicator = ({ current, total, steps }: ProgressIndicatorProps) => {
  const percentage = ((current + 1) / total) * 100;

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
                  className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold transition-all duration-300",
                    index < current
                      ? "bg-primary border-primary text-primary-foreground shadow-sm"
                      : index === current
                      ? "bg-primary/10 border-primary text-primary animate-pulse"
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
