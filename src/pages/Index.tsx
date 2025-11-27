import { DiagnosticChat } from "@/components/DiagnosticChat";
import { ProgressIndicator } from "@/components/ProgressIndicator";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface ProgressState {
  current: number;
  total: number;
  steps: string[];
  isComplete: boolean;
  showOnboarding: boolean;
}

const Index = () => {
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const stepHandlerRef = useRef<((stepIndex: number) => void) | null>(null);
  const restartHandlerRef = useRef<(() => void) | null>(null);

  // Ensure page starts at the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const showProgress = progress && !progress.showOnboarding && !progress.isComplete && progress.current >= 0;
  const canRestart = progress && !progress.showOnboarding && progress.current > 0 && !progress.isComplete;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Sticky */}
      <header className={cn(
        "sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50",
        "transition-all duration-300"
      )}>
        {/* Brand Section */}
        <div className={cn(
          "bg-gradient-to-b from-primary/15 to-transparent text-center transition-all duration-300",
          showProgress ? "py-3 px-4" : "py-8 px-4"
        )}>
          <h1 className={cn(
            "font-bold text-primary transition-all duration-300",
            showProgress ? "text-2xl sm:text-3xl mb-0" : "text-4xl sm:text-5xl mb-1"
          )}>
            Hydratis
          </h1>
          {!showProgress && (
            <>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">
                Diagnostic d'Hydratation
              </h2>
              <p className="text-sm sm:text-base text-foreground/70 max-w-md mx-auto">
                Obtiens une routine personnalisée en répondant à quelques questions 💧
              </p>
            </>
          )}
          {showProgress && (
            <p className="text-xs text-foreground/70">
              Diagnostic d'Hydratation 💧
            </p>
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
                <button
                  onClick={() => restartHandlerRef.current?.()}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-accent ml-2 shrink-0"
                >
                  <span>🔄</span>
                  <span className="hidden sm:inline">Recommencer</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Chat Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto flex flex-col">
        <DiagnosticChat
          onProgressChange={setProgress}
          registerStepHandler={(handler) => { stepHandlerRef.current = handler; }}
          registerRestartHandler={(handler) => { restartHandlerRef.current = handler; }}
        />
      </main>

      {/* Footer */}
      <footer className="py-4 px-4 text-center text-xs text-muted-foreground border-t border-border/50">
        Diagnostic d'hydratation - Prends soin de toi 💙
      </footer>
    </div>
  );
};

export default Index;
