import { DiagnosticChat } from "@/components/DiagnosticChat";
import { ProgressIndicator } from "@/components/ProgressIndicator";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { RotateCcw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import logoHydratis from "@/assets/logo-hydratis.png";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProgressState {
  current: number;
  total: number;
  steps: string[];
  isComplete: boolean;
  showOnboarding: boolean;
}

const Index = () => {
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const stepHandlerRef = useRef<((stepIndex: number) => void) | null>(null);
  const restartHandlerRef = useRef<(() => void) | null>(null);

  // Ensure page starts at the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const showProgress = progress && !progress.showOnboarding && !progress.isComplete && progress.current >= 0;
  const showResults = progress?.isComplete;
  const canRestart = progress && !progress.showOnboarding && progress.current > 0 && !progress.isComplete;

  const handleRestartClick = () => {
    setShowRestartDialog(true);
  };

  const handleConfirmRestart = () => {
    setShowRestartDialog(false);
    restartHandlerRef.current?.();
  };

  return (
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      {/* Header Sticky */}
      <header className={cn(
        "sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50",
        "transition-all duration-300"
      )}>
        {/* Brand Section - Ultra compact on mobile when showing progress, text-based on results */}
        <div className={cn(
          "bg-gradient-to-b from-primary/15 to-transparent text-center transition-all duration-300",
          (showResults || showProgress) ? "py-2 sm:py-3 px-4" : "py-6 sm:py-8 px-4"
        )}>
          {showResults ? (
            <>
              <h1 className="text-lg sm:text-xl font-bold text-primary">Hydratis</h1>
              <p className="text-[10px] sm:text-xs text-foreground/70">
                Diagnostic d'Hydratation 💧
              </p>
            </>
          ) : (
            <>
              <img 
                src={logoHydratis} 
                alt="Hydratis - Optimise l'hydratation" 
                className={cn(
                  "mx-auto transition-all duration-300",
                  showProgress ? "h-8 sm:h-10" : "h-16 sm:h-20 md:h-24"
                )}
              />
              {!showProgress && (
                <>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-2 sm:mb-3">
                    Diagnostic d'Hydratation
                  </h2>
                  <p className="text-xs sm:text-sm md:text-base text-foreground/70 max-w-md mx-auto">
                    Obtiens ton résultat d'hydratation et des conseils personnalisés en répondant à quelques questions en 3 minutes top chrono !
                  </p>
                </>
              )}
              {showProgress && (
                <p className="text-[10px] sm:text-xs text-foreground/70 hidden sm:block">
                  Diagnostic d'Hydratation 💧
                </p>
              )}
            </>
          )}
        </div>

        {/* Progress Indicator in Header */}
        {showProgress && (
          <div className="border-t border-border/30">
            <div className="flex items-center justify-between px-4 py-1 max-w-2xl mx-auto">
              <div className="flex-1">
                <ProgressIndicator
                  current={progress.current}
                  total={progress.total}
                  steps={progress.steps}
                  onStepClick={(index) => stepHandlerRef.current?.(index)}
                  compact
                />
              </div>
              {canRestart && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleRestartClick}
                      className="p-1.5 text-muted-foreground hover:text-primary hover:bg-accent rounded-full transition-colors ml-2"
                      aria-label="Recommencer le diagnostic"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Recommencer</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Chat Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto flex flex-col min-h-0">
        <DiagnosticChat
          onProgressChange={setProgress}
          registerStepHandler={(handler) => { stepHandlerRef.current = handler; }}
          registerRestartHandler={(handler) => { restartHandlerRef.current = handler; }}
        />
      </main>

      {/* Footer */}
      <footer className="py-4 px-4 pb-safe text-center text-xs text-muted-foreground border-t border-border/50">
        Diagnostic d'hydratation - Prends soin de toi 💙
      </footer>

      {/* Dialog de confirmation pour recommencer */}
      <AlertDialog open={showRestartDialog} onOpenChange={setShowRestartDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recommencer le diagnostic ?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta progression sera perdue. Es-tu sûr de vouloir recommencer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Non</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRestart}>Oui</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
