import { DiagnosticChat } from "@/components/DiagnosticChat";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-b from-primary/15 to-transparent py-8 px-4 text-center border-b border-border/50">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-2">
          Diagnostic d'Hydratation
        </h1>
        <p className="text-sm sm:text-base text-foreground/70 max-w-md mx-auto">
          Obtiens une routine personnalisée en répondant à quelques questions 💧
        </p>
      </header>

      {/* Chat Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto flex flex-col">
        <DiagnosticChat />
      </main>

      {/* Footer */}
      <footer className="py-4 px-4 text-center text-xs text-muted-foreground border-t border-border/50">
        Diagnostic d'hydratation - Prends soin de toi 💙
      </footer>
    </div>
  );
};

export default Index;
