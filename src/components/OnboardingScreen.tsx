import { Button } from "./ui/button";

interface OnboardingScreenProps {
  onStart: () => void;
}

export const OnboardingScreen = ({
  onStart
}: OnboardingScreenProps) => {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 pb-safe animate-fade-in">
      {/* Header principal avec CTA */}
      <div className="text-center mb-6 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
          <span className="text-lg">⏱️</span>
          <span className="font-medium text-foreground">~3 minutes</span>
        </div>

        {/* CTA Button - Visible immédiatement */}
        <div>
          <Button
            onClick={onStart}
            size="lg"
            className="w-full sm:w-auto px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all touch-target touch-active touch-manipulation"
          >
            🚀 Commencer mon diagnostic
          </Button>
        </div>

        {/* Séparateur */}
        <p className="text-sm text-muted-foreground">
          ou découvre ce que tu vas obtenir ↓
        </p>
      </div>

      {/* Les 5 étapes */}
      <div className="mb-6 p-6 bg-card rounded-2xl border border-border shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
          📋 Les 5 étapes du diagnostic
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { icon: "👤", label: "Profil" },
            { icon: "🏃", label: "Sport" },
            { icon: "🩺", label: "Santé" },
            { icon: "☕", label: "Habitudes" },
            { icon: "🎯", label: "Résultats" }
          ].map((step, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10 hover-scale touch-active transition-all"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <span className="text-2xl sm:text-3xl">{step.icon}</span>
              <span className="text-[10px] sm:text-xs font-medium text-foreground/80 text-center">
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Ce que tu vas obtenir */}
      <div className="p-6 bg-card rounded-2xl border border-border shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
          🎁 Ce que tu vas obtenir
        </h3>

        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              icon: "💧",
              title: "Besoins en eau calculés",
              description: "Basés sur ton profil et tes activités"
            },
            {
              icon: "📊",
              title: "Plan quotidien personnalisé",
              description: "Répartition optimale de ton hydratation"
            },
            {
              icon: "🏋️",
              title: "Conseils sportifs sur-mesure",
              description: "Hydratation adaptée à tes efforts"
            },
            {
              icon: "💡",
              title: "Conseils personnalisés",
              description: "Recommandations adaptées à ta situation"
            }
          ].map((benefit, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 hover-scale touch-active transition-all"
              style={{ animationDelay: `${(index + 5) * 100}ms` }}
            >
              <span className="text-xl sm:text-2xl shrink-0">{benefit.icon}</span>
              <div>
                <h4 className="font-semibold text-foreground text-sm sm:text-base mb-0.5 sm:mb-1">
                  {benefit.title}
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Button en bas pour les utilisateurs qui scrollent */}
      <div className="text-center mt-6 mb-safe">
        <Button
          onClick={onStart}
          size="lg"
          className="w-full sm:w-auto px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all touch-target touch-active touch-manipulation"
        >
          🚀 Commencer mon diagnostic
        </Button>
      </div>
    </div>
  );
};
