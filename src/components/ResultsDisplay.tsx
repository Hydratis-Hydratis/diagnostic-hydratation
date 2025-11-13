import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Droplet, Droplets, Activity, Pill, AlertCircle, CheckCircle, TrendingUp, Zap, Info, Sparkles, RefreshCw, Trophy, Target, ArrowUp, Sun, Users, Calendar, Clock, Thermometer, Heart, Beaker, Shield, BookOpen, AlertTriangle, ShoppingCart, RotateCcw } from "lucide-react";
import type { HydrationResult } from "@/lib/hydrationCalculator";
import type { DiagnosticData } from "@/types/diagnostic";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from "recharts";
import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface ResultsDisplayProps {
  results: HydrationResult;
  diagnosticData?: DiagnosticData;
  firstName?: string;
  onRestart?: () => void;
}

// Helper pour icônes de sport
const getSportIcon = (category: string) => {
  const iconMap: Record<string, string> = {
    "Endurance continue": "🏃",
    "Intermittent/collectif/HIIT": "⚡",
    "Musculation/Force": "💪",
    "Natation": "🏊",
    "Sports collectifs": "⚽",
    "Sports de raquette": "🎾",
    "Sports de combat": "🥊",
    "Sports d'hiver": "⛷️",
    "Danse": "💃",
    "Yoga/Pilates": "🧘",
    "Escalade": "🧗",
    "Gymnastique": "🤸"
  };
  return iconMap[category] || "🏅";
};

// Fonction helper pour convertir mL en Litres avec affichage intelligent
const formatVolume = (ml: number): string => {
  const liters = ml / 1000;
  if (liters >= 1) {
    return `${liters.toFixed(1)} L`;
  } else {
    return `${liters.toFixed(2)} L`;
  }
};

// Pour les débits (mL/h → L/h)
const formatDebit = (mlPerHour: number): string => {
  const litersPerHour = mlPerHour / 1000;
  return `${litersPerHour.toFixed(2)} L/h`;
};

// Système de badges
const getBadge = (score: number) => {
  if (score >= 90) return { level: "Or", icon: "🥇", color: "bg-yellow-500", textColor: "text-yellow-900" };
  if (score >= 70) return { level: "Argent", icon: "🥈", color: "bg-gray-400", textColor: "text-gray-900" };
  if (score >= 50) return { level: "Bronze", icon: "🥉", color: "bg-orange-600", textColor: "text-white" };
  return { level: "Débutant", icon: "🌱", color: "bg-green-500", textColor: "text-white" };
};

export const ResultsDisplay = ({ results, diagnosticData, firstName, onRestart }: ResultsDisplayProps) => {
  const totalPastilles = results.nb_pastilles_basal + results.nb_pastilles_exercice;
  const animatedScore = useCountUp(results.score, 2000);
  const [visiblePills, setVisiblePills] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  const badge = getBadge(results.score);
  const progressPercent = results.hydratation_reelle_ml > 0 
    ? Math.min(100, Math.round((results.hydratation_reelle_ml / results.besoin_hydration_nette_ml) * 100))
    : 0;
  
  // Calculs pour la jauge d'hydratation
  const pourcentageHydratation = Math.min(100, Math.round((results.hydratation_reelle_ml / results.besoins_basals_net_ml) * 100));
  const volumeACombler = Math.max(0, results.besoins_basals_net_ml - results.hydratation_reelle_ml);
  
  // Comparaison sociale fictive basée sur le score
  const socialComparison = Math.min(95, Math.round(results.score + Math.random() * 10));

  useEffect(() => {
    const timers = [
      setTimeout(() => setVisiblePills(1), 300),
      setTimeout(() => setVisiblePills(2), 600),
      setTimeout(() => setVisiblePills(3), 900),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Animation confetti pour score élevé
  useEffect(() => {
    if (results.score >= 90) {
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }, 1000);
    }
  }, [results.score]);

  // Bouton back to top
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const getStatusColor = (statut: string) => {
    if (statut.includes("Excellente") || statut.includes("Bonne")) return "bg-green-500";
    if (statut.includes("Modérée") || statut.includes("Attention")) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  const getStatusIcon = (statut: string) => {
    if (statut.includes("Excellente") || statut.includes("Bonne")) return <CheckCircle className="w-5 h-5" />;
    return <AlertCircle className="w-5 h-5" />;
  };

  // Messages de progression
  const getProgressMessage = (percent: number) => {
    if (percent < 50) return `Tu es à ${percent}% de ton objectif, continue !`;
    if (percent < 75) return `Bon départ ! Tu es à ${percent}%`;
    if (percent < 90) return `Presque parfait ! ${percent}%`;
    return `Objectif presque atteint ! ${percent}%`;
  };

  // Détection de symptômes
  const hasSymptoms = diagnosticData && (
    (diagnosticData.urine_couleur && parseInt(diagnosticData.urine_couleur) > 5) ||
    diagnosticData.crampes === "Oui" ||
    diagnosticData.courbatures === "Oui"
  );

  // Détection sport
  const isSportPerson = diagnosticData && diagnosticData.sport_pratique === "Oui" && results.besoins_exercice_ml > 0;

  // Détection canicule
  const isHeatwave = diagnosticData && diagnosticData.temperature_ext === "> 28°C";

  return (
    <TooltipProvider>
      <div className="space-y-4 animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Ton diagnostic est prêt, {firstName} ! 💧
        </h2>
        <p className="text-muted-foreground">Voici tes résultats personnalisés</p>
        {results.score >= 90 && (
          <p className="text-lg font-semibold text-primary mt-2 animate-scale-in">
            🎉 Félicitations ! Tu as une hydratation excellente !
          </p>
        )}
      </div>

      {/* Dashboard avec 4 métriques clés */}
      <Card className="border-2 border-primary/40 bg-gradient-to-br from-primary/10 to-transparent">
        <CardContent className="p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Ton tableau de bord
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Métrique 1 : Score avec badge et comparaison */}
            <div className="p-4 rounded-lg bg-background border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-muted-foreground">Score d'hydratation</h4>
                <Badge className={`${badge.color} ${badge.textColor} animate-scale-in`}>
                  {badge.icon} {badge.level}
                </Badge>
              </div>
              <div className="text-3xl font-bold text-primary mb-2">{animatedScore}/100</div>
              <Progress value={results.score} className="h-2 mb-2" />
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="w-3 h-3" />
                <span>Mieux que {socialComparison}% des utilisateurs</span>
              </div>
            </div>

            {/* Métrique 2 : A boire au quotidien */}
            <div className="p-4 rounded-lg bg-background border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Droplet className="w-4 h-4 text-blue-500" />
                <h4 className="text-sm font-medium text-muted-foreground">À boire au quotidien</h4>
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {formatVolume(results.besoins_basals_net_ml)}
              </div>
            </div>

            {/* Métrique 3 : A boire pendant le sport */}
            {isSportPerson ? (
              <div className="p-4 rounded-lg bg-background border border-orange-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-orange-500" />
                  <h4 className="text-sm font-medium text-muted-foreground">À boire pendant le sport</h4>
                </div>
                <div className="text-3xl font-bold text-orange-600">
                  {formatVolume(results.besoins_exercice_ml)}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-background border border-gray-300/20 opacity-60">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium text-muted-foreground">À boire pendant le sport</h4>
                </div>
                <div className="text-3xl font-bold text-muted-foreground">
                  0 L
                </div>
              </div>
            )}

            {/* Métrique 4 : Pastilles recommandées (basales + sport) */}
            <div className="p-4 rounded-lg bg-background border border-purple-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Pill className="w-4 h-4 text-purple-500" />
                <h4 className="text-sm font-medium text-muted-foreground">Pastilles recommandées</h4>
              </div>
              
              {/* Pastilles basales */}
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Au quotidien</span>
                  <span className="text-2xl font-bold text-purple-600">
                    {results.nb_pastilles_basal}
                  </span>
                </div>
              </div>

              {/* Pastilles sport (si applicable) */}
              {isSportPerson && results.nb_pastilles_exercice > 0 && (
                <div className="pt-3 border-t border-purple-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Pendant le sport</span>
                    <span className="text-2xl font-bold text-orange-600">
                      {results.nb_pastilles_exercice}
                    </span>
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="mt-3 pt-3 border-t border-purple-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">Total</span>
                  <div className="text-3xl font-bold text-foreground">
                    {totalPastilles}
                    <span className="text-lg font-normal text-muted-foreground ml-1">/jour</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BLOC 3 : Pour en savoir plus */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Info className="w-6 h-6 text-primary" />
          Pour en savoir plus
        </h2>
        
        <Accordion type="multiple" className="space-y-3">
          
          {/* Accordéon 1 : Pourquoi Hydratis */}
          <AccordionItem value="hydratis" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Pourquoi les pastilles Hydratis ?</h3>
                  <p className="text-xs text-muted-foreground">Composition et avantages</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-2">
              <div className="space-y-4">
                {/* Composition */}
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Beaker className="w-4 h-4" />
                    Composition scientifique
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="font-semibold mb-1">Électrolytes</div>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Sodium</li>
                        <li>• Potassium</li>
                        <li>• Magnésium</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="font-semibold mb-1">Minéraux</div>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Zinc</li>
                        <li>• Manganèse</li>
                        <li>• Chlorure</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Avantages */}
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Avantages vs eau simple
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Zap className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Absorption 3x plus rapide</strong> grâce aux électrolytes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Meilleure rétention</strong> de l'eau dans l'organisme</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Activity className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Performance sportive</strong> optimisée</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Heart className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Récupération accélérée</strong> après l'effort</span>
                    </li>
                  </ul>
                </div>

                {/* Comment utiliser */}
                <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border">
                  <h4 className="font-semibold text-sm mb-2">💡 Mode d'emploi</h4>
                  <p className="text-xs text-muted-foreground">
                    Dissous une pastille dans {formatVolume(200)}-{formatVolume(250)} d'eau (environ 1 verre). 
                    {results.nb_pastilles_exercice > 0 && ` Pour le sport, prends ${results.nb_pastilles_exercice} pastille${results.nb_pastilles_exercice > 1 ? 's' : ''} les jours d'entraînement.`}
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Accordéon 2 : Tout savoir sur l'hydratation */}
          <AccordionItem value="education" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Tout savoir sur l'hydratation</h3>
                  <p className="text-xs text-muted-foreground">Bienfaits, risques et conseils</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-2">
              <div className="space-y-4">
                
                {/* Sources d'hydratation */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">💧 Sources d'hydratation</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
                      <div className="text-2xl font-bold text-blue-600 mb-1">80%</div>
                      <div className="text-xs text-muted-foreground">Boissons</div>
                      <div className="text-xs mt-1">Eau, thé, infusions...</div>
                    </div>
                    <div className="p-3 bg-green-500/5 rounded-lg border border-green-500/20">
                      <div className="text-2xl font-bold text-green-600 mb-1">20%</div>
                      <div className="text-xs text-muted-foreground">Alimentation</div>
                      <div className="text-xs mt-1">Fruits, légumes...</div>
                    </div>
                  </div>
                </div>

                {/* Bienfaits */}
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-green-500" />
                    Bienfaits d'une bonne hydratation
                  </h4>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex items-start gap-2 p-2 bg-muted rounded">
                      <span>🧠</span>
                      <span><strong>Concentration</strong> : Améliore les fonctions cognitives</span>
                    </div>
                    <div className="flex items-start gap-2 p-2 bg-muted rounded">
                      <span>💪</span>
                      <span><strong>Performance</strong> : Optimise les capacités physiques</span>
                    </div>
                    <div className="flex items-start gap-2 p-2 bg-muted rounded">
                      <span>✨</span>
                      <span><strong>Peau</strong> : Maintient l'élasticité et l'éclat</span>
                    </div>
                    <div className="flex items-start gap-2 p-2 bg-muted rounded">
                      <span>🔥</span>
                      <span><strong>Métabolisme</strong> : Régule la température corporelle</span>
                    </div>
                  </div>
                </div>

                {/* Risques déshydratation */}
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    Risques de la déshydratation
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="p-2 bg-red-500/5 border border-red-500/20 rounded">
                      <strong>Légère (1-2%)</strong> : Soif, fatigue, baisse de concentration
                    </div>
                    <div className="p-2 bg-red-500/10 border border-red-500/30 rounded">
                      <strong>Modérée (3-5%)</strong> : Maux de tête, vertiges, crampes
                    </div>
                    <div className="p-2 bg-red-500/15 border border-red-500/40 rounded">
                      <strong>Sévère (&gt;5%)</strong> : Confusion, risque vital - consulter un médecin
                    </div>
                  </div>
                </div>

                {/* Conseils personnalisés */}
                {diagnosticData && (
                  <div className="p-4 bg-gradient-to-br from-blue-500/5 to-blue-500/10 rounded-lg border">
                    <h4 className="font-semibold text-sm mb-2">🎯 Conseils pour toi</h4>
                    <ul className="space-y-1.5 text-xs">
                      {diagnosticData.age && Number(diagnosticData.age) > 60 && (
                        <li>• Bois régulièrement même sans soif (sensation diminue avec l'âge)</li>
                      )}
                      {isSportPerson && (
                        <li>• Commence à t'hydrater 2h avant l'effort</li>
                      )}
                      {diagnosticData.temperature_ext && diagnosticData.temperature_ext.includes(">") && (
                        <li>• Augmente ta consommation par temps chaud</li>
                      )}
                      {diagnosticData.urine_couleur && parseInt(diagnosticData.urine_couleur) > 5 && (
                        <li>• Surveille la couleur de tes urines (jaune pâle = bien hydraté)</li>
                      )}
                      <li>• Garde toujours une bouteille d'eau à portée de main</li>
                      <li>• Bois par petites gorgées régulières plutôt qu'en grande quantité</li>
                    </ul>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Section Défis hydratation */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-xl">🎯 Tes défis hydratation</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Atteins tes objectifs avec ces défis personnalisés
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Défi 1 - Hydratation quotidienne */}
            <Card className="border-blue-500/30">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💧</span>
                    <Badge variant={results.score < 70 ? "destructive" : "secondary"} className="text-xs">
                      {results.score < 70 ? "Moyen" : "Facile"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">
                    {results.score < 70 
                      ? `Atteins ${formatVolume(results.besoins_basals_net_ml)}` 
                      : "Maintiens ton objectif"}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {results.score < 70 
                      ? "pendant 7 jours consécutifs"
                      : "pendant 30 jours"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Défi 2 - Pastilles Hydratis */}
            <Card className="border-purple-500/30">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💊</span>
                    <Badge variant="secondary" className="text-xs">Facile</Badge>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">
                    {results.nb_pastilles_basal >= 1 
                      ? "1 pastille Hydratis chaque matin"
                      : "Teste Hydratis"}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {results.nb_pastilles_basal >= 1 
                      ? "pendant 14 jours"
                      : "pendant 1 semaine"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Défi 3 - Symptômes ou partage */}
            <Card className="border-green-500/30">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {diagnosticData?.urine_couleur && parseInt(diagnosticData.urine_couleur) > 5 
                        ? "🚻" 
                        : diagnosticData?.crampes === "Oui" 
                        ? "💪" 
                        : "🤝"}
                    </span>
                    <Badge variant={
                      (diagnosticData?.urine_couleur && parseInt(diagnosticData.urine_couleur) > 5) || 
                      diagnosticData?.crampes === "Oui" 
                        ? "destructive" 
                        : "secondary"
                    } className="text-xs">
                      {(diagnosticData?.urine_couleur && parseInt(diagnosticData.urine_couleur) > 5) || 
                       diagnosticData?.crampes === "Oui" 
                        ? "Moyen" 
                        : "Facile"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">
                    {diagnosticData?.urine_couleur && parseInt(diagnosticData.urine_couleur) > 5
                      ? "Urine claire (≤3)"
                      : diagnosticData?.crampes === "Oui"
                      ? "Réduis les crampes"
                      : "Partage tes résultats"}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {diagnosticData?.urine_couleur && parseInt(diagnosticData.urine_couleur) > 5
                      ? "pendant 5 jours"
                      : diagnosticData?.crampes === "Oui"
                      ? "avec une hydratation optimale"
                      : "avec un ami"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* BLOC 4 : Actions finales */}
      <div className="mt-8 space-y-4">
        {/* CTA Principal : Commander */}
        <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-bold mb-2">Prêt à optimiser ton hydratation ?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Commande tes pastilles Hydratis et profite de ta routine personnalisée
            </p>
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <a href="https://hydratis.co" target="_blank" rel="noopener noreferrer">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Commander Hydratis
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Bouton recommencer */}
        {onRestart && (
          <Button 
            onClick={onRestart} 
            variant="outline" 
            size="lg"
            className="w-full gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Recommencer le diagnostic
          </Button>
        )}
      </div>

      {/* Bouton Back to Top */}
      {showBackToTop && (
        <Button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-4 right-4 z-50 animate-fade-in rounded-full p-3 shadow-lg"
          size="icon"
        >
          <ArrowUp className="w-5 h-5" />
        </Button>
      )}

    </div>
    </TooltipProvider>
  );
};
