import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Droplet, Activity, Pill, AlertCircle, CheckCircle, TrendingUp, Zap, Info, Sparkles, RefreshCw, Trophy, Target, ArrowUp, Sun, Users } from "lucide-react";
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

// Système de badges
const getBadge = (score: number) => {
  if (score >= 90) return { level: "Or", icon: "🥇", color: "bg-yellow-500", textColor: "text-yellow-900" };
  if (score >= 70) return { level: "Argent", icon: "🥈", color: "bg-gray-400", textColor: "text-gray-900" };
  if (score >= 50) return { level: "Bronze", icon: "🥉", color: "bg-orange-600", textColor: "text-white" };
  return { level: "Débutant", icon: "🌱", color: "bg-green-500", textColor: "text-white" };
};

export const ResultsDisplay = ({ results, diagnosticData, firstName, onRestart }: ResultsDisplayProps) => {
  const totalPastilles = results.nb_pastilles_basal + results.nb_pastilles_exercice + results.nb_pastilles_post_exercice;
  const animatedScore = useCountUp(results.score, 2000);
  const [visiblePills, setVisiblePills] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  const badge = getBadge(results.score);
  const progressPercent = results.hydratation_reelle_ml > 0 
    ? Math.min(100, Math.round((results.hydratation_reelle_ml / results.besoin_hydration_nette_ml) * 100))
    : 0;
  
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

      {/* Dashboard avec 3 métriques clés */}
      <Card className="border-2 border-primary/40 bg-gradient-to-br from-primary/10 to-transparent">
        <CardContent className="p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Ton tableau de bord
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            {/* Métrique 2 : Total à boire avec jauge */}
            <div className="p-4 rounded-lg bg-background border border-blue-500/20">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Total à boire aujourd'hui</h4>
              <div className="text-3xl font-bold text-foreground mb-2">
                {results.besoin_hydration_nette_ml}
                <span className="text-lg font-normal text-muted-foreground ml-1">mL</span>
              </div>
              {results.hydratation_reelle_ml > 0 && (
                <>
                  <Progress value={progressPercent} className="h-2 mb-2" />
                  <p className="text-xs text-muted-foreground">{getProgressMessage(progressPercent)}</p>
                </>
              )}
            </div>

            {/* Métrique 3 : Total pastilles */}
            <div className="p-4 rounded-lg bg-background border border-purple-500/20">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Pastilles recommandées</h4>
              <div className="flex items-center gap-3">
                <Pill className="w-8 h-8 text-purple-500" />
                <div className="text-3xl font-bold text-foreground">
                  {totalPastilles}
                  <span className="text-lg font-normal text-muted-foreground ml-1">/jour</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Pour optimiser ton hydratation</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertes contextuelles */}
      {results.score < 50 && (
        <Card className="border-red-500 bg-gradient-to-br from-red-500/10 to-transparent animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-600 dark:text-red-400 mb-1">
                  ⚠️ Alerte déshydratation
                </h4>
                <p className="text-sm text-muted-foreground">
                  Ton score indique une déshydratation significative. Hydrate-toi immédiatement avec 500 mL d'eau et continue à boire régulièrement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isHeatwave && (
        <Card className="border-orange-500 bg-gradient-to-br from-orange-500/10 to-transparent animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Sun className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-orange-600 dark:text-orange-400 mb-1">
                  🌡️ Alerte canicule
                </h4>
                <p className="text-sm text-muted-foreground">
                  Température élevée détectée. Augmente ta consommation d'eau de 500 mL et évite l'exposition prolongée au soleil. Bois avant d'avoir soif.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Ton plan d'hydratation - Cartes empilées avec barres de progression */}
      <Card className="border-2 border-primary/40 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Droplet className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">Ton plan d'hydratation</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Répartition optimale de tes besoins hydriques</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-4">
          {/* Carte 1: Besoins quotidiens de base */}
          <div className="relative overflow-hidden rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-blue-500/10 p-5 shadow-md">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/20 rounded-lg">
                  <Droplet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">Besoins quotidiens</h3>
                  <p className="text-sm text-muted-foreground">Hors activité physique</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {results.besoins_basals_net_ml}
                  <span className="text-lg text-muted-foreground ml-1">mL</span>
                </div>
                <p className="text-xs text-muted-foreground">à boire</p>
              </div>
            </div>
            
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  Besoin total
                </span>
                <span className="font-semibold text-foreground">{results.besoins_basals_brut_ml} mL</span>
              </div>
              <Progress value={100} className="h-3 bg-blue-500/20" />
              
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-center justify-between text-xs bg-background/50 rounded-lg p-2.5">
                  <span className="text-muted-foreground">💧 À boire</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{results.besoins_basals_net_ml} mL</span>
                </div>
                <div className="flex items-center justify-between text-xs bg-background/50 rounded-lg p-2.5">
                  <span className="text-muted-foreground">🍽️ Alimentation</span>
                  <span className="font-semibold text-foreground">{results.apport_alimentation_basal_ml} mL</span>
                </div>
              </div>
            </div>

            {/* Pastilles quotidiennes */}
            <div className={cn(
              "mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 transition-all duration-500",
              visiblePills >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-semibold text-foreground">Pastilles quotidiennes</span>
                </div>
                <Badge className="bg-purple-500 text-white font-bold">
                  {results.nb_pastilles_basal} pastille{results.nb_pastilles_basal > 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
          </div>

          {/* Carte 2: Besoins sport (si applicable) */}
          {isSportPerson && results.besoins_exercice_ml > 0 && (
            <div className="relative overflow-hidden rounded-xl border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-orange-500/10 p-5 shadow-md">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-orange-500/20 rounded-lg">
                    <Activity className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">Besoins sport</h3>
                    <p className="text-sm text-muted-foreground">Pendant et après l'effort</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    {results.besoins_exercice_ml}
                    <span className="text-lg text-muted-foreground ml-1">mL</span>
                  </div>
                  <p className="text-xs text-muted-foreground">par séance</p>
                </div>
              </div>
              
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                    Volume total
                  </span>
                  <span className="font-semibold text-foreground">{results.besoins_exercice_ml} mL</span>
                </div>
                <Progress value={100} className="h-3 bg-orange-500/20 [&>div]:bg-orange-500" />
                
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center justify-between text-xs bg-background/50 rounded-lg p-2.5">
                    <span className="text-muted-foreground">⏱️ Par heure</span>
                    <span className="font-bold text-orange-600 dark:text-orange-400">
                      {Math.round(results.besoins_exercice_ml / results.details_exercice.duree_heures)} mL/h
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs bg-background/50 rounded-lg p-2.5">
                    <span className="text-muted-foreground">🕐 Durée</span>
                    <span className="font-semibold text-foreground">{results.details_exercice.duree_heures}h</span>
                  </div>
                </div>
              </div>

              {/* Pastilles sport */}
              <div className={cn(
                "mt-4 space-y-2 transition-all duration-500",
                visiblePills >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}>
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-semibold text-foreground">Pendant l'effort</span>
                    </div>
                    <Badge variant="secondary" className="font-semibold">
                      {results.nb_pastilles_exercice} pastille{results.nb_pastilles_exercice > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
                
                {results.nb_pastilles_post_exercice > 0 && (
                  <div className={cn(
                    "p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 transition-all duration-500",
                    visiblePills >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <span className="text-sm font-semibold text-foreground">Après l'effort</span>
                      </div>
                      <Badge variant="secondary" className="font-semibold">
                        {results.nb_pastilles_post_exercice} pastille{results.nb_pastilles_post_exercice > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Carte 3: Comparaison avec consommation actuelle */}
          <div className="relative overflow-hidden rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-5 shadow-md">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/20 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">Comparaison</h3>
                  <p className="text-sm text-muted-foreground">Objectif vs. Consommation actuelle</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Objectif total */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-primary"></span>
                    Objectif total
                  </span>
                  <span className="font-bold text-primary text-lg">{results.besoin_hydration_nette_ml} mL</span>
                </div>
                <Progress value={100} className="h-3 bg-primary/20" />
                <p className="text-xs text-muted-foreground text-right">
                  ≈ {Math.round(results.besoin_hydration_nette_ml / 250)} verres de 250mL
                </p>
              </div>

              {/* Consommation actuelle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-foreground/40"></span>
                    Consommation actuelle
                  </span>
                  <span className="font-semibold text-foreground">{results.hydratation_reelle_ml} mL</span>
                </div>
                <Progress 
                  value={Math.min((results.hydratation_reelle_ml / results.besoin_hydration_nette_ml) * 100, 100)} 
                  className="h-3 bg-muted [&>div]:bg-foreground/40" 
                />
              </div>

              {/* Écart */}
              <div className={`p-3 rounded-lg ${
                results.ecart_hydratation_ml <= 0 
                  ? 'bg-green-500/10 border border-green-500/20' 
                  : 'bg-amber-500/10 border border-amber-500/20'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {results.ecart_hydratation_ml <= 0 ? '✅ Objectif atteint' : '⚠️ À combler'}
                  </span>
                  <span className={`text-lg font-bold ${
                    results.ecart_hydratation_ml <= 0 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    {results.ecart_hydratation_ml <= 0 ? '0' : results.ecart_hydratation_ml} mL
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Sources d'hydratation - Accordion */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="sources" className="border rounded-lg px-4 border-green-500/30 bg-gradient-to-br from-green-500/5 to-transparent">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-green-500" />
              <span className="font-semibold">💡 D'où vient ton hydratation ? (Alimentation vs Boissons)</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-lg bg-background border">
                <p className="text-sm text-muted-foreground mb-3">
                  📚 <strong>Bon à savoir :</strong> L'hydratation provient de deux sources principales
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">💧 80%</span>
                    <span>de l'eau que tu bois (boissons)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">🍽️ 20%</span>
                    <span>de ton alimentation (fruits, légumes, soupes, etc.)</span>
                  </li>
                </ul>
              </div>
              
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'À boire (80%)', value: results.besoins_basals_net_ml },
                      { name: 'Alimentation (20%)', value: results.apport_alimentation_basal_ml }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value} mL`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="hsl(210, 100%, 50%)" />
                    <Cell fill="hsl(120, 60%, 50%)" />
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number) => `${value} mL`}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  ⚡ Les besoins affichés tiennent compte de ces deux apports. L'objectif "à boire" correspond aux 80% que tu dois consommer en boissons.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Explication Hydratis */}
      <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Sparkles className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-xl">Pourquoi les pastilles Hydratis ?</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Une hydratation optimale et efficace</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-background rounded-lg border">
              <div className="p-2 bg-primary/10 rounded-full flex-shrink-0">
                <Droplet className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">Hydratation accélérée</h4>
                <p className="text-xs text-muted-foreground">
                  Les pastilles Hydratis contiennent un mélange optimal d'électrolytes (sodium, potassium, magnésium) qui accélèrent l'absorption de l'eau par l'organisme.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-background rounded-lg border">
              <div className="p-2 bg-primary/10 rounded-full flex-shrink-0">
                <Info className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">Comment utiliser ?</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Dissous une pastille dans 200-250 mL d'eau. Pour le sport, prends une pastille pendant l'effort et une autre après pour optimiser ta récupération.
                </p>
                <div className="text-xs text-primary font-medium">
                  💡 Astuce : Commence ta journée avec une pastille pour bien t'hydrater dès le réveil !
                </div>
              </div>
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="details" className="border-none">
              <AccordionTrigger className="hover:no-underline py-2 text-xs">
                <span className="text-muted-foreground">ℹ️ En savoir plus sur les bénéfices</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3 p-3 bg-background rounded-lg border">
                    <div className="p-2 bg-primary/10 rounded-full flex-shrink-0">
                      <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1">Compensation des pertes</h4>
                      <p className="text-xs text-muted-foreground">
                        Lors d'un effort physique, de la chaleur ou de la déshydratation, tu perds non seulement de l'eau mais aussi des minéraux essentiels. Hydratis compense ces pertes pour maintenir ton équilibre hydrique.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-background rounded-lg border">
                    <div className="p-2 bg-primary/10 rounded-full flex-shrink-0">
                      <Activity className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1">Performance et récupération</h4>
                      <p className="text-xs text-muted-foreground">
                        Une hydratation optimale améliore tes performances sportives, réduit la fatigue et accélère la récupération musculaire après l'effort.
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* CTA Marketing - Découvrez nos produits */}
      <Card className="border-primary/40 bg-gradient-to-br from-primary/10 to-purple-500/5">
        <CardContent className="p-6 text-center space-y-4">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground">
              Nos pastilles d'hydratation s'adaptent à vos besoins et vos préférences gustatives. 🍋
            </h3>
            <p className="text-sm text-muted-foreground">
              Découvrez la solution la plus adaptée à votre profil
            </p>
          </div>
          <Button 
            size="lg" 
            className="w-full sm:w-auto font-semibold text-lg px-8 py-6"
            asChild
          >
            <a 
              href="https://hydratis.co" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Découvrir les produits Hydratis 💧
            </a>
          </Button>
          <p className="text-xs text-muted-foreground">
            Livraison rapide • Satisfait ou remboursé
          </p>
        </CardContent>
      </Card>

      {/* Section éducative - Pourquoi l'hydratation ? */}
      <Card className="border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10">
              <Sparkles className="w-6 h-6 text-indigo-500" />
            </div>
            <CardTitle className="text-xl">💡 Pourquoi l'hydratation est-elle si importante ?</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {/* Article 1 - Bienfaits */}
            <AccordionItem value="bienfaits" className="border-b">
              <AccordionTrigger className="text-left hover:no-underline">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-semibold">Les bienfaits d'une bonne hydratation</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 font-bold">✓</span>
                      <span><strong>Performance physique optimale</strong> : Maintient l'endurance et la force musculaire</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 font-bold">✓</span>
                      <span><strong>Concentration mentale</strong> : Améliore la clarté d'esprit et la prise de décision</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 font-bold">✓</span>
                      <span><strong>Régulation de la température</strong> : Évite les coups de chaleur et l'hyperthermie</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 font-bold">✓</span>
                      <span><strong>Récupération accélérée</strong> : Élimine les toxines et réduit les courbatures</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 font-bold">✓</span>
                      <span><strong>Santé de la peau</strong> : Maintient l'élasticité et l'éclat cutané</span>
                    </li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Article 2 - Risques de déshydratation */}
            <AccordionItem value="risques" className="border-b">
              <AccordionTrigger className="text-left hover:no-underline">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="font-semibold">Les risques de la déshydratation</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <p className="text-sm text-muted-foreground mb-3">
                    Une déshydratation même légère (perte de 2% du poids corporel) peut avoir des conséquences :
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">⚠</span>
                      <span><strong>Baisse de performance</strong> : -20% d'efficacité physique et mentale</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">⚠</span>
                      <span><strong>Crampes et fatigue musculaire</strong> : Déséquilibre électrolytique</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">⚠</span>
                      <span><strong>Maux de tête</strong> : Diminution du volume sanguin</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">⚠</span>
                      <span><strong>Troubles digestifs</strong> : Constipation et ballonnements</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">⚠</span>
                      <span><strong>Risque rénal</strong> : Calculs et infections urinaires</span>
                    </li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Article 3 - Rôle des électrolytes */}
            <AccordionItem value="electrolytes" className="border-b">
              <AccordionTrigger className="text-left hover:no-underline">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span className="font-semibold">Le rôle des électrolytes</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <p className="text-sm text-muted-foreground mb-3">
                    Les électrolytes sont des minéraux essentiels pour le bon fonctionnement de l'organisme :
                  </p>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-background border">
                      <p className="font-semibold text-sm mb-1">💧 Sodium (Na+)</p>
                      <p className="text-xs text-muted-foreground">
                        Régule l'équilibre hydrique et la pression artérielle. Principal électrolyte perdu dans la sueur.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-background border">
                      <p className="font-semibold text-sm mb-1">🔋 Potassium (K+)</p>
                      <p className="text-xs text-muted-foreground">
                        Essentiel pour la contraction musculaire et la fonction cardiaque.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-background border">
                      <p className="font-semibold text-sm mb-1">💪 Magnésium (Mg2+)</p>
                      <p className="text-xs text-muted-foreground">
                        Prévient les crampes, favorise la récupération et réduit la fatigue.
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Article 4 - Articles Hydratis */}
            <AccordionItem value="blog" className="border-none">
              <AccordionTrigger className="text-left hover:no-underline">
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-500" />
                  <span className="font-semibold">En savoir plus sur le blog Hydratis</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <p className="text-sm text-muted-foreground mb-3">
                    Découvrez nos articles scientifiques et conseils pratiques :
                  </p>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <a href="https://hydratis.co/blogs/hydratation" target="_blank" rel="noopener noreferrer">
                        📖 Guide complet de l'hydratation sportive
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <a href="https://hydratis.co/blogs/sante" target="_blank" rel="noopener noreferrer">
                        🩺 Hydratation et santé quotidienne
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <a href="https://hydratis.co/blogs/nutrition" target="_blank" rel="noopener noreferrer">
                        🥗 Alimentation et hydratation
                      </a>
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

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
                      ? `Atteins ${results.besoin_hydration_nette_ml} mL` 
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

      {/* Bouton Refaire le diagnostic */}
      {onRestart && (
        <div className="flex justify-center pt-6 pb-2">
          <Button 
            variant="outline" 
            size="lg"
            onClick={onRestart}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refaire le diagnostic
          </Button>
        </div>
      )}

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
