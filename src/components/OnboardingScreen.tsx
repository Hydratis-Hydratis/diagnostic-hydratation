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
      <div className="text-center mb-6">
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
      </div>

      {/* Ce que tu vas obtenir */}
      <div className="p-6 bg-card rounded-2xl border border-border shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
          🎁 Ce que tu vas obtenir
        </h3>

        <ul className="space-y-3">
          {[
            "Ton score d'hydratation /100",
            "Ta quantité d'eau idéale par jour selon ton profil",
            "Des conseils d'hydratation adaptés à ton activité physique",
            "Et d'autres recommandations personnalisées adaptées à tes résultats"
          ].map((item, index) => (
            <li
              key={index}
              className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20"
            >
              <span className="text-primary">✓</span>
              <span className="text-sm sm:text-base text-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Mention RGPD discrète */}
      <p className="text-center text-xs text-muted-foreground mt-6 px-4">
        En continuant, vous acceptez que vos données soient collectées à des fins d'amélioration du service et de communication.
      </p>
    </div>
  );
};
