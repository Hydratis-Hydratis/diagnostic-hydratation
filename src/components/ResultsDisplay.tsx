import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Droplet, Droplets, Activity, Disc, AlertCircle, CheckCircle, TrendingUp, Zap, Info, Sparkles, RefreshCw, Trophy, Target, ArrowUp, Sun, Users, Calendar, Clock, Thermometer, Heart, Beaker, Shield, BookOpen, AlertTriangle, ShoppingCart, RotateCcw } from "lucide-react";
import type { HydrationResult } from "@/lib/hydrationCalculator";
import type { DiagnosticData } from "@/types/diagnostic";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from "recharts";
import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
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
  if (score >= 90) return {
    level: "Hydra'champion",
    icon: "🏆"
  };
  if (score >= 70) return {
    level: "Hydra'avancé",
    icon: "⭐"
  };
  if (score >= 50) return {
    level: "Hydra'initié",
    icon: "💧"
  };
  return {
    level: "Hydra'débutant",
    icon: "🌱"
  };
};
export const ResultsDisplay = ({
  results,
  diagnosticData,
  firstName,
  onRestart
}: ResultsDisplayProps) => {
  // Détection des populations sensibles (pas de recommandation de pastilles)
  const isSensitivePopulation = (() => {
    const age = parseInt(diagnosticData?.age || "0");
    const isPregnant = diagnosticData?.situation_particuliere?.includes("Enceinte");
    const isBreastfeeding = diagnosticData?.situation_particuliere === "Allaitante";
    const isElderly = age >= 70;
    return isPregnant || isBreastfeeding || isElderly;
  })();

  // Helper pour générer le message de disclaimer personnalisé
  const getPersonalizedDisclaimerMessage = () => {
    if (diagnosticData?.situation_particuliere?.includes('Enceinte')) {
      return "En raison de ta grossesse, nous te recommandons de consulter un médecin ou un pharmacien avant de prendre des pastilles Hydratis.";
    }
    if (diagnosticData?.situation_particuliere === 'Allaitante') {
      return "En raison de ton allaitement, nous te recommandons de consulter un médecin ou un pharmacien avant de prendre des pastilles Hydratis.";
    }
    const age = parseInt(diagnosticData?.age || '0');
    if (age >= 70) {
      return "En raison de ton âge, nous te recommandons de consulter un médecin ou un pharmacien avant de prendre des pastilles Hydratis.";
    }
    return "";
  };

  const totalPastilles = results.nb_pastilles_basal + results.nb_pastilles_exercice;
  const animatedScore = useCountUp(results.score, 2000);
  const [visiblePills, setVisiblePills] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [socialComparison, setSocialComparison] = useState<number | null>(null);
  const badge = getBadge(results.score);
  const progressPercent = results.hydratation_reelle_ml > 0 ? Math.min(100, Math.round(results.hydratation_reelle_ml / results.besoins_basals_net_ml * 100)) : 0;

  // Fetch real percentile from database
  useEffect(() => {
    const fetchPercentile = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-score-percentile', {
          body: { score: results.score }
        });
        
        if (!error && data && typeof data.percentile === 'number') {
          setSocialComparison(data.percentile);
        }
      } catch (err) {
        console.error('Erreur récupération percentile:', err);
      }
    };
    
    fetchPercentile();
  }, [results.score]);

  useEffect(() => {
    const timers = [setTimeout(() => setVisiblePills(1), 300), setTimeout(() => setVisiblePills(2), 600), setTimeout(() => setVisiblePills(3), 900)];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Animation confetti pour score élevé
  useEffect(() => {
    if (results.score >= 90) {
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: {
            y: 0.6
          }
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

  // Messages de progression - Affiche les besoins supplémentaires pour l'entraînement
  const getProgressMessage = () => {
    if (results.besoins_exercice_ml > 0) {
      const litersExercice = formatVolume(results.besoins_exercice_ml);
      return `Ajouter ${litersExercice} d'eau les jours d'entraînement`;
    }
    return "";
  };

  // Détection de symptômes
  const hasSymptoms = diagnosticData && (diagnosticData.urine_couleur && parseInt(diagnosticData.urine_couleur) > 5 || diagnosticData.crampes === "Oui" || diagnosticData.courbatures === "Oui");

  // Détection sport
  const isSportPerson = diagnosticData && diagnosticData.sport_pratique === "Oui" && results.besoins_exercice_ml > 0;

  // Détection canicule
  const isHeatwave = diagnosticData && diagnosticData.temperature_ext === "> 28°C";
  return <div className="space-y-4 animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          <span className="block">{firstName},</span>
          <span className="block">Ton diagnostic est prêt !</span>
        </h2>
        <p className="text-muted-foreground">Voici tes résultats personnalisés</p>
        {results.score >= 90 && <p className="text-lg font-semibold text-primary mt-2 animate-scale-in">
            🎉 Félicitations ! Tu as une hydratation excellente !
          </p>}
      </div>

      {/* Dashboard avec 3 métriques clés */}
      <Card className="border-2 border-primary/40 bg-gradient-to-br from-primary/10 to-transparent">
        <CardContent className="p-6">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Ton tableau de bord
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Métrique 1 : Score avec badge */}
            <div className="p-4 rounded-lg bg-background border border-primary/20">
              <div className="mb-2">
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Score d'hydratation</h4>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="animate-scale-in border-primary/30 text-xs">
                    {badge.icon} {badge.level}
                  </Badge>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="inline-flex items-center justify-center">
                        <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3" align="start">
                      <div className="space-y-1 text-xs">
                        <p className="font-semibold mb-2">Niveaux d'hydratation :</p>
                        <p>🏆 Hydra'champion : 90-100</p>
                        <p>⭐ Hydra'avancé : 70-89</p>
                        <p>💧 Hydra'initié : 50-69</p>
                        <p>🌱 Hydra'débutant : 0-49</p>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="text-3xl font-bold text-primary mb-2">{animatedScore}/100</div>
              <Progress value={results.score} className="h-2 mb-2" />
              {socialComparison !== null && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  <span>Tu fais mieux que <strong className="text-foreground">{socialComparison}%</strong> des utilisateurs</span>
                </div>
              )}
            </div>

            {/* Métrique 2 : Total à boire avec jauge */}
            <div className="p-4 rounded-lg bg-background border border-blue-500/20">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Quantité d'eau à boire par jour</h4>
              <div className="text-3xl font-bold text-foreground mb-2">
                {formatVolume(results.besoins_basals_net_ml)}
              </div>
              {results.hydratation_reelle_ml > 0 && <>
                  <Progress value={progressPercent} className="h-2 mb-2" />
                </>}
              {getProgressMessage() && <p className="text-xs text-muted-foreground">{getProgressMessage()}</p>}
            </div>

            {/* Métrique 3 : Total pastilles */}
            <div className="p-4 rounded-lg bg-background border border-purple-500/20">
              <div className="flex items-center gap-1.5 mb-2">
                <h4 className="text-sm font-medium text-muted-foreground">Pastilles Hydratis recommandées</h4>
                {!isSensitivePopulation && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="text-muted-foreground hover:text-purple-500 transition-colors p-0.5">
                        <Info className="w-4 h-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent side="top" className="w-[280px] text-sm">
                      {totalPastilles === 0 ? (
                        <>
                          <p className="font-semibold mb-1">💡 Ton hydratation est optimale !</p>
                          <p className="text-muted-foreground text-xs">Pas besoin de pastilles supplémentaires, continue comme ça ! 💪</p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold mb-2">💡 Comment sont calculées tes pastilles ?</p>
                          <div className="space-y-2">
                            <div>
                              <p className="font-medium">🏠 Hydratation quotidienne : {results.nb_pastilles_basal} pastille{results.nb_pastilles_basal > 1 ? 's' : ''}</p>
                              <p className="text-xs text-muted-foreground">→ Basé sur ton score d'hydratation et ton profil</p>
                            </div>
                            {results.nb_pastilles_exercice > 0 && (
                              <div>
                                <p className="font-medium">🏃 Jours de sport : +{results.nb_pastilles_exercice} pastille{results.nb_pastilles_exercice > 1 ? 's' : ''}</p>
                                <p className="text-xs text-muted-foreground">→ Basé sur ta durée d'entraînement hebdomadaire et ton niveau de transpiration</p>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Disc className="w-8 h-8 text-purple-500" />
                <div className="text-3xl font-bold text-foreground">
                  {isSensitivePopulation ? "—" : totalPastilles}
                  {!isSensitivePopulation && <span className="text-lg font-normal text-muted-foreground ml-1">/jour</span>}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {isSensitivePopulation ? "Consulte un professionnel de santé" : (totalPastilles === 0 ? "" : "Pour optimiser ton hydratation")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jauge d'hydratation - Comparaison */}
      {(() => {
        const gaugeTarget = results.besoins_basals_net_ml;
        const gaugeCurrent = Math.max(0, results.hydratation_reelle_ml ?? 0);
        const gaugePercent = gaugeTarget > 0 ? Math.round(gaugeCurrent / gaugeTarget * 100) : 0;
        const animatedGaugePercent = useCountUp(gaugePercent, 2000);
        return <Card className="border-4 border-blue-500/50 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-blue-600/15 overflow-hidden shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Droplets className="w-5 h-5 text-blue-500 animate-pulse-soft" />
                <h3 className="font-bold text-base text-foreground">Comparaison    </h3>
              </div>

              <div className="relative w-full">
                {/* Labels positionnés au-dessus de la jauge - positionnement absolu */}
                <div className="relative mb-3 h-14 sm:h-16">
                  {animatedGaugePercent > 100 ? (
                    <>
                      {/* Quand > 100%: Idéal à gauche (position ~65%), Consommation à droite */}
                      <div 
                        className="absolute flex flex-col items-center transition-all duration-1000 ease-out"
                        style={{ left: '65%', transform: 'translateX(-50%)' }}
                      >
                        <span className="text-[11px] sm:text-sm md:text-base font-medium text-muted-foreground text-center leading-tight mb-1">
                          Ton idéal
                        </span>
                        <span className="text-sm sm:text-base md:text-lg font-bold text-blue-600 dark:text-blue-400">
                          {formatVolume(gaugeTarget)}
                        </span>
                      </div>
                      
                      {/* Consommation - alignée à droite */}
                      <div className="absolute right-0 flex flex-col items-end">
                        <span className="text-[11px] sm:text-sm md:text-base font-medium text-foreground mb-1">
                          Ta consommation
                        </span>
                        <span className="text-sm sm:text-base md:text-lg font-bold text-cyan-600 dark:text-cyan-400">
                          {formatVolume(gaugeCurrent)}
                          <span className="ml-1 text-[10px]">({animatedGaugePercent}%)</span>
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Quand <= 100%: Hydratation suit le %, Idéal à droite */}
                      <div 
                        className="absolute flex flex-col items-center transition-all duration-1000 ease-out"
                        style={{ left: `${Math.min(Math.max(animatedGaugePercent, 15), 65)}%`, transform: 'translateX(-50%)' }}
                      >
                        <span className="text-[11px] sm:text-sm md:text-base font-medium text-foreground text-center leading-tight mb-1">
                          Ton hydratation<br className="sm:hidden" /><span className="hidden sm:inline"> </span>quotidienne
                        </span>
                        <span className="text-sm sm:text-base md:text-lg font-bold text-cyan-600 dark:text-cyan-400">
                          {formatVolume(gaugeCurrent)}
                        </span>
                      </div>
                      
                      {/* Idéal - aligné à droite */}
                      <div className="absolute right-0 flex flex-col items-end">
                        <span className="text-[11px] sm:text-sm md:text-base font-medium text-muted-foreground mb-1">
                          Ton idéal
                        </span>
                        <span className="text-sm sm:text-base md:text-lg font-bold text-blue-600 dark:text-blue-400">
                          {formatVolume(gaugeTarget)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Jauge avec effet liquide - barre horizontale */}
                <div className="relative h-8 w-full overflow-hidden rounded-2xl border-2 border-blue-500/30 bg-gradient-to-b from-blue-50/50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/50 shadow-inner">
                  {/* Fond animé avec vagues */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 via-cyan-100/20 to-blue-100/20 dark:from-blue-900/20 dark:via-cyan-900/20 dark:to-blue-900/20" />
                  
                  {/* Eau avec gradient - remplissage horizontal de gauche à droite (max 100%) */}
                  <div className="absolute top-0 bottom-0 left-0 h-full transition-all duration-1000 ease-out" style={{
                  width: `${Math.min(animatedGaugePercent, 100)}%`
                }}>
                    <div className="relative w-full h-full bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400 dark:from-blue-600 dark:via-blue-500 dark:to-cyan-500">
                      {/* Pourcentage à l'intérieur de la barre */}
                      {animatedGaugePercent >= 15 && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs sm:text-sm font-bold text-white drop-shadow-md">
                          {animatedGaugePercent}%
                        </span>
                      )}
                      {/* Effet de brillance */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse-soft" />
                      
                      {/* Vague animée sur le bord droit */}
                      <div className="absolute top-0 bottom-0 -right-1 w-3 overflow-hidden">
                        <div className="absolute inset-0 animate-pulse-soft">
                          <svg className="w-full h-full" viewBox="0 0 40 1200" preserveAspectRatio="none">
                            <path d="M20,0 Q0,150 20,300 T20,600 T20,900 T20,1200 L40,1200 L40,0 Z" fill="currentColor" className="text-cyan-300/50 dark:text-cyan-400/30">
                              <animate attributeName="d" dur="3s" repeatCount="indefinite" values="
                                  M20,0 Q0,150 20,300 T20,600 T20,900 T20,1200 L40,1200 L40,0 Z;
                                  M20,0 Q30,150 20,300 T20,600 T20,900 T20,1200 L40,1200 L40,0 Z;
                                  M20,0 Q0,150 20,300 T20,600 T20,900 T20,1200 L40,1200 L40,0 Z
                                " />
                            </path>
                          </svg>
                        </div>
                      </div>
                      
                      {/* Gouttelettes flottantes */}
                      {animatedGaugePercent > 10 && <>
                          <Droplet className="absolute top-1/4 left-[15%] h-4 w-4 text-white/60 animate-bounce" style={{
                        animationDelay: '0s',
                        animationDuration: '2s'
                      }} />
                          <Droplet className="absolute top-1/2 left-[40%] h-3 w-3 text-white/40 animate-bounce" style={{
                        animationDelay: '0.5s',
                        animationDuration: '2.5s'
                      }} />
                          <Droplet className="absolute top-2/3 left-[65%] h-4 w-4 text-white/50 animate-bounce" style={{
                        animationDelay: '1s',
                        animationDuration: '2.2s'
                      }} />
                          <Droplet className="absolute top-1/3 left-[80%] h-3 w-3 text-white/45 animate-bounce" style={{
                        animationDelay: '1.5s',
                        animationDuration: '2.8s'
                      }} />
                        </>}
                    </div>
                  </div>

                  {/* Marques de niveau horizontales */}
                  <div className="absolute inset-x-0 top-0 bottom-0 flex flex-row justify-between px-2 pointer-events-none">
                    {[25, 50, 75].map(mark => <div key={mark} className="flex flex-col items-center justify-center h-full">
                        <div className={cn("w-px h-full", animatedGaugePercent >= mark ? "bg-white/20" : "bg-blue-500/20")} />
                      </div>)}
                  </div>

                </div>
              </div>

              {/* Message de progression */}
              <div className="mt-4 text-center">
                <p className={cn("text-sm sm:text-base md:text-lg font-medium", animatedGaugePercent >= 100 ? "text-green-600 dark:text-green-400" : "text-muted-foreground")}>
                  {animatedGaugePercent >= 100 ? "🎉 Excellent ! Tu as atteint tes besoins basaux !" : <>
                        Encore <span className="font-bold text-base sm:text-lg md:text-xl text-primary">{formatVolume(gaugeTarget - gaugeCurrent)}</span> à boire
                      </>}
                </p>
              </div>
            </CardContent>
          </Card>;
      })()}

      {/* Disclaimer global personnalisé pour populations sensibles */}
      {isSensitivePopulation && (
        <div className="p-4 rounded-lg border-2 border-amber-400/50 bg-amber-50 dark:bg-amber-950/30">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚕️</span>
            <div>
              <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-200 mb-2">
                Avis professionnel recommandé
              </h4>
              <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                {getPersonalizedDisclaimerMessage()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Découvrir Hydratis CTA */}
      <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-bold text-foreground mb-2 flex items-center justify-center md:justify-start gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Découvrir Hydratis
              </h3>
              <p className="text-sm text-muted-foreground">
                Explore notre gamme complète de pastilles d'hydratation pour optimiser tes performances et ton bien-être au quotidien
              </p>
            </div>
            <Button 
              size="lg" 
              className="gap-2 whitespace-nowrap"
              onClick={() => window.open('https://www.hydratis.co', '_blank')}
            >
              Visiter le site
              <ShoppingCart className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Carte supplémentaire : Besoins sport (si entraînement aujourd'hui) */}
      {isSportPerson && results.besoins_exercice_ml > 0}

      {/* Carte unifiée : Plan d'hydratation quotidien */}
      <Card className="overflow-hidden border-2">
        <CardHeader className="bg-gradient-to-r from-blue-500/10 to-orange-500/10">
          <h3 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-500" />
            Ton plan d'hydratation quotidien
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Voici tes besoins personnalisés pour rester bien hydraté
          </p>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6 relative">
            
            {/* COLONNE 1 : Besoins quotidiens */}
            <div className="relative p-5 rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
              {/* Layout vertical centré */}
              <div className="flex flex-col items-center text-center mb-4 space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  💧 Besoin en eau par jour
                </h3>
                
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2">
                    <div className="text-5xl font-bold text-blue-600 dark:text-blue-400">
                      {formatVolume(results.besoins_basals_net_ml)}
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="text-muted-foreground hover:text-blue-500 transition-colors p-1 self-start mt-1">
                          <Info className="w-4 h-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent side="left" className="w-[240px] text-sm">
                        <p className="font-semibold mb-1">💡 Le savais-tu ?</p>
                        <p>En moyenne, les femmes ont besoin d'environ <strong>1,6 L/jour</strong> et les hommes <strong>2 L/jour</strong>.</p>
                        <p className="mt-1 text-muted-foreground text-xs">Ces valeurs varient selon ton âge, ton poids et ton activité !</p>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">à boire</p>
                </div>
              </div>

              {/* Pastilles basales - masquées pour populations sensibles */}
              {!isSensitivePopulation && (
                <>
                  {results.nb_pastilles_basal > 0 && <div className="mb-4">
                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30">
                        {results.nb_pastilles_basal} pastille{results.nb_pastilles_basal > 1 ? 's' : ''} / jour
                      </Badge>
                    </div>}

                  {/* Comment prendre */}
                  {results.nb_pastilles_basal > 0 && (
                    <div className="space-y-2 mt-4">
                      <div className="flex items-center gap-2 text-xs p-2 bg-background/50 rounded">
                        <span className="text-muted-foreground">💧 Comment ?</span>
                      </div>
                      <div className="text-xs ml-2 p-2 bg-blue-500/5 rounded">
                        <span>1 pastille dans 1 verre d'eau {results.nb_pastilles_basal}x par jour</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Détails */}
              <div className="border-t border-blue-500/20 mt-4 pt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Besoin total</span>
                  <span className="font-semibold">{formatVolume(results.besoins_basals_brut_ml)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">• Apportée par l'alimentation</span>
                  <span className="font-semibold">~{formatVolume(results.besoins_basals_brut_ml - results.besoins_basals_net_ml)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">• Apportée par la boisson</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{formatVolume(results.besoins_basals_net_ml)}</span>
                </div>
              </div>
            </div>

            {/* Cercle "+" pour MOBILE - visible uniquement sur mobile */}
            <div className="flex md:hidden justify-center -my-3">
              <div className="w-10 h-10 rounded-full bg-orange-50 border-2 border-orange-500/30 shadow-sm flex items-center justify-center">
                <span className="text-xl font-bold text-orange-600">+</span>
              </div>
            </div>

            {/* Cercle "+" pour DESKTOP - positionné au centre en absolu */}
            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="w-10 h-10 rounded-full bg-orange-50 border-2 border-orange-500/30 shadow-sm flex items-center justify-center">
                <span className="text-xl font-bold text-orange-600">+</span>
              </div>
            </div>

            {/* COLONNE 2 : Besoins sport OU Message d'encouragement */}
            {(() => {
              // Messages d'encouragement adaptés par âge (basés sur recommandations ANSES)
              const getEncouragementMessages = (age: string) => {
                const ageNum = parseInt(age || "30");
                
                if (ageNum < 18) {
                  // Messages pour jeunes (< 18 ans) : Focus croissance et développement
                  return [
                    {
                      emoji: "🏃‍♀️",
                      title: "Bouge pour grandir !",
                      text: "L'ANSES recommande 60 minutes d'activité physique par jour pour les jeunes. C'est essentiel pour développer tes os et tes muscles, et te sentir mieux dans ta peau ! 💪"
                    },
                    {
                      emoji: "⚽",
                      title: "Ton corps a besoin de bouger",
                      text: "1 heure d'activité par jour renforce ton cœur, améliore ta concentration en classe et booste ton moral. Course, vélo, danse... à toi de choisir ! 🎯"
                    },
                    {
                      emoji: "🎮",
                      title: "Pause écrans, action !",
                      text: "60 minutes d'activité quotidienne selon l'ANSES : marche rapide, sport, jeux actifs... Ton corps se développe mieux et tu te sens plus énergique ! ✨"
                    }
                  ];
                } else if (ageNum >= 65) {
                  // Messages pour seniors (65+ ans) : Focus autonomie et prévention chutes
                  return [
                    {
                      emoji: "🚶‍♀️",
                      title: "Reste autonome plus longtemps",
                      text: "L'ANSES recommande 30 minutes d'activité adaptée par jour. Marche, gymnastique douce, tai-chi... Tu préserves ton équilibre, ta mobilité et préviens les chutes. 🌳"
                    },
                    {
                      emoji: "🧘‍♂️",
                      title: "Bouge pour ton équilibre",
                      text: "30 minutes quotidiennes d'activité douce renforcent tes muscles, maintiennent ta souplesse et réduisent drastiquement les risques de chute. C'est la clé de ton autonomie ! 💪"
                    },
                    {
                      emoji: "👥",
                      title: "Activité physique = Bien vieillir",
                      text: "Selon l'ANSES, 30 min/jour d'activité adaptée : marche avec des amis, aquagym, jardinage... Tu gardes ton indépendance, ton moral et tu crées du lien social. 🌺"
                    },
                    {
                      emoji: "🌸",
                      title: "Protège ta mobilité",
                      text: "L'activité physique régulière (30 min/jour) préserve ta masse musculaire, maintient tes articulations souples et améliore ta coordination. Essentiel pour rester actif ! ✨"
                    }
                  ];
                } else {
                  // Messages pour adultes (18-64 ans) : Focus santé cardio et prévention
                  return [
                    {
                      emoji: "🚶‍♂️",
                      title: "30 minutes qui changent tout",
                      text: "L'ANSES recommande 30 minutes d'activité physique modérée par jour. Marche rapide, vélo, jardinage... Ton cœur se renforce et tu réduis les risques de maladies cardiovasculaires. 💚"
                    },
                    {
                      emoji: "💪",
                      title: "Prévenir plutôt que guérir",
                      text: "Bouger 30 minutes quotidiennement diminue les risques de diabète, d'hypertension et de certains cancers. C'est aussi un excellent anti-stress naturel ! 🧘‍♀️"
                    },
                    {
                      emoji: "🏃‍♀️",
                      title: "Investis dans ta santé",
                      text: "30 minutes par jour selon l'ANSES : renforce tes muscles, protège tes os, améliore ton sommeil et ton moral. Un geste simple pour une vie plus longue et plus saine ! ✨"
                    },
                    {
                      emoji: "🚴‍♂️",
                      title: "Bouge, ton corps te remerciera",
                      text: "L'activité physique régulière (30 min/jour) est le meilleur médicament : elle réduit l'anxiété, améliore la qualité du sommeil et booste ton système immunitaire. 🌟"
                    }
                  ];
                }
              };

              const ageMessages = getEncouragementMessages(diagnosticData?.age || "30");
              const randomMessage = ageMessages[Math.floor(Math.random() * ageMessages.length)];

              return isSportPerson && results.besoins_exercice_ml > 0 ? (
                // Bloc orange pour les sportifs
                <div className="relative p-5 rounded-xl border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-orange-500/10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">
                      💪 Jours d'entraînement
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Besoins additionnels
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                      {formatVolume(results.besoins_exercice_ml)}
                    </div>
                    <p className="text-xs text-muted-foreground">en plus</p>
                  </div>
                </div>

                {/* Sports pratiqués avec icônes */}
                {diagnosticData?.sports_selectionnes && diagnosticData.sports_selectionnes.length > 0 && <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="w-3.5 h-3.5 text-orange-500" />
                      <span className="text-xs font-semibold">Ton sport</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {diagnosticData.sports_selectionnes.map((sport, idx) => <Badge key={idx} variant="outline" className="bg-orange-500/10 border-orange-500/30 text-xs">
                          {getSportIcon(sport.category)} {sport.name}
                        </Badge>)}
                    </div>
                    
                    {/* Détails de pratique */}
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {diagnosticData.frequence && <div className="flex flex-col items-center p-2 bg-background rounded">
                          <Calendar className="w-3 h-3 text-muted-foreground mb-1" />
                          <span className="text-[10px] text-muted-foreground text-center leading-tight">
                            {diagnosticData.frequence}
                          </span>
                        </div>}
                      {diagnosticData.duree_minutes && <div className="flex flex-col items-center p-2 bg-background rounded">
                          <Clock className="w-3 h-3 text-muted-foreground mb-1" />
                          <span className="text-[10px] text-muted-foreground text-center leading-tight">
                            {diagnosticData.duree_minutes} min
                          </span>
                        </div>}
                      {diagnosticData.transpiration && <div className="flex flex-col items-center p-2 bg-background rounded">
                          <Droplets className="w-3 h-3 text-muted-foreground mb-1" />
                          <span className="text-[10px] text-muted-foreground text-center leading-tight">
                            {diagnosticData.transpiration}/10
                          </span>
                        </div>}
                    </div>
                  </div>}

                {/* Pastilles sport - masquées pour populations sensibles */}
                {!isSensitivePopulation && (
                  <>
                    {results.nb_pastilles_exercice > 0 && <div className="mb-4">
                        <Badge variant="secondary" className="bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30">
                          {results.nb_pastilles_exercice} pastille{results.nb_pastilles_exercice > 1 ? 's' : ''} / séance
                        </Badge>
                      </div>}

                    {/* Comment prendre - affiché seulement si pastilles > 0 */}
                    {results.nb_pastilles_exercice > 0 && (
                      <div className="space-y-2 mt-4">
                        <div className="flex items-center gap-2 text-xs p-2 bg-background/50 rounded">
                          <span className="text-muted-foreground">💧 Comment ?</span>
                        </div>
                        <div className="text-xs ml-2 p-2 bg-orange-500/5 rounded">
                          <span>
                            {results.nb_pastilles_exercice === 1 
                              ? "1 pastille dans 1 verre d'eau pendant/après l'effort"
                              : "2 pastilles dans une gourde ou une flasque pendant/après l'effort"}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Détails */}
                
                </div>
              ) : (
                // Bloc vert pour les non-sportifs
                <div className="relative p-5 rounded-xl border-2 border-green-500/30 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{randomMessage.emoji}</div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">
                        {randomMessage.title}
                      </h3>
                      <p className="text-sm text-green-600 dark:text-green-300 leading-relaxed mb-4">
                        {randomMessage.text}
                      </p>
                      <div className="p-3 bg-white/50 dark:bg-black/20 rounded-lg border border-green-200/50 dark:border-green-800/50">
                        <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                          💡 Bouger régulièrement aide aussi à maintenir une bonne hydratation !
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

        </CardContent>
      </Card>

      {/* Messages d'avertissement contextuels */}
      {(() => {
        const warnings: string[] = [];
        
        // Grossesse
        if (diagnosticData?.situation_particuliere?.includes("Enceinte")) {
          warnings.push("🤰 Les besoins hydriques augmentent pendant la grossesse. Évite la déshydratation et fractionne tes prises d'eau au cours de la journée.");
        }
        
        // Allaitement
        if (diagnosticData?.situation_particuliere === "Allaitante") {
          warnings.push("🤱 La production de lait augmente la perte hydrique quotidienne. Une hydratation optimale est essentielle pour maintenir la lactation. Bois régulièrement tout au long de la journée.");
        }
        
        // Personnes âgées
        const age = parseInt(diagnosticData?.age || "0");
        if (age >= 70) {
          warnings.push("🧓 La sensation de soif diminue avec l'âge. Fractionne tes prises d'eau, évite les longues périodes sans boire, et surveille les signes de déshydratation comme la fatigue, la bouche sèche ou la confusion.");
        }
        
        // Enfants
        if (age > 0 && age < 12) {
          warnings.push("👧 Les enfants ont des besoins hydriques proportionnellement plus élevés que les adultes. Propose-lui de l'eau régulièrement, surtout pendant les activités physiques et par temps chaud.");
        }
        
        // Crampes
        if (diagnosticData?.crampes === "Oui") {
          warnings.push("💡 Les crampes répétées peuvent signaler un déséquilibre en électrolytes. Une hydratation enrichie en minéraux peut aider à les prévenir.");
        }
        
        // Chaleur extrême
        if (diagnosticData?.temperature_ext === "> 28°C") {
          warnings.push("🌡️ Par forte chaleur, tes pertes hydriques sont considérablement augmentées. N'attends pas d'avoir soif pour boire et fractionne tes apports tout au long de la journée.");
        }
        
        return warnings.length > 0 ? (
          <div className="mt-6 space-y-3">
            {warnings.map((warning, index) => (
              <div 
                key={index}
                className="p-4 rounded-lg border-2 border-amber-400/50 bg-amber-50 dark:bg-amber-950/30"
              >
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  {warning}
                </p>
              </div>
            ))}
          </div>
        ) : null;
      })()}

      {/* BLOC 3 : Pour en savoir plus */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">
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
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="font-semibold mb-1">Électrolytes</div>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Sodium</li>
                        <li>• Potassium</li>
                        <li>• Magnésium</li>
                        <li>• Chlorure</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="font-semibold mb-1">Oligo-éléments</div>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Zinc</li>
                        <li>• Manganèse</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="font-semibold mb-1">Sucre</div>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Présent</li>
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
                      <span>Absorption plus rapide et plus efficace grâce aux électrolytes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Meilleure rétention de l'eau dans l'organisme</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Activity className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span>Performance sportive optimisée</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Heart className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>Récupération accélérée après l'effort</span>
                    </li>
                  </ul>
                </div>

                {/* Comment utiliser */}
                <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border">
                  <h4 className="font-semibold text-sm mb-2">💡 Mode d'emploi</h4>
                  <p className="text-xs text-muted-foreground">
                    Dissous une pastille dans 0,25L d'eau (environ 1 verre). Pour le sport, tu peux dissoudre 2 pastilles dans une gourde de 0,5L.
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
                      <div className="text-xs mt-1">Eau, infusions...</div>
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
                  <p className="text-xs text-muted-foreground mb-2">
                    * Les pourcentages représentent la perte en eau en pourcentage de poids corporel
                  </p>
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
                {diagnosticData && <div className="p-4 bg-gradient-to-br from-blue-500/5 to-blue-500/10 rounded-lg border">
                    <h4 className="font-semibold text-sm mb-2">🎯 Conseils pour toi</h4>
                    <ul className="space-y-1.5 text-xs">
                      {diagnosticData.age && Number(diagnosticData.age) > 60 && <li>• Bois régulièrement même sans soif (sensation diminue avec l'âge)</li>}
                      {isSportPerson && <li>• Commence à t'hydrater 2h avant l'effort</li>}
                      {diagnosticData.temperature_ext && diagnosticData.temperature_ext.includes(">") && <li>• Augmente ta consommation par temps chaud</li>}
                      {diagnosticData.urine_couleur && parseInt(diagnosticData.urine_couleur) > 5 && <li>• Surveille la couleur de tes urines (jaune pâle = bien hydraté)</li>}
                      <li>• Garde toujours une bouteille d'eau à portée de main</li>
                      <li>• Bois par petites gorgées régulières plutôt qu'en grande quantité</li>
                    </ul>
                  </div>}
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
                  <h4 className="font-semibold text-base mb-1">
                    {results.score < 70 ? `Atteins ${formatVolume(results.besoins_basals_net_ml)}` : "Maintiens ton objectif"}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {results.score < 70 ? "pendant 7 jours consécutifs" : "pendant 30 jours"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Défi 2 - Fractionner l'hydratation (sensibles) ou Pastilles Hydratis */}
            <Card className="border-purple-500/30">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{isSensitivePopulation ? "🥤" : "💊"}</span>
                    <Badge variant="secondary" className="text-xs">Facile</Badge>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-base mb-1">
                    {isSensitivePopulation 
                      ? "Fractionne ton hydratation" 
                      : results.nb_pastilles_basal >= 1 
                        ? "1 pastille Hydratis chaque matin" 
                        : "Teste Hydratis"}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {isSensitivePopulation 
                      ? "Boire 8 petits verres répartis dans la journée pendant 7 jours" 
                      : results.nb_pastilles_basal >= 1 
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
                      {diagnosticData?.urine_couleur && parseInt(diagnosticData.urine_couleur) > 5 ? "🚻" : diagnosticData?.crampes === "Oui" ? "💪" : "🤝"}
                    </span>
                    <Badge variant={diagnosticData?.urine_couleur && parseInt(diagnosticData.urine_couleur) > 5 || diagnosticData?.crampes === "Oui" ? "destructive" : "secondary"} className="text-xs">
                      {diagnosticData?.urine_couleur && parseInt(diagnosticData.urine_couleur) > 5 || diagnosticData?.crampes === "Oui" ? "Moyen" : "Facile"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-base mb-1">
                    {diagnosticData?.urine_couleur && parseInt(diagnosticData.urine_couleur) > 5 ? "Urine claire (≤3)" : diagnosticData?.crampes === "Oui" ? "Réduis les crampes" : "Partage tes résultats"}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {diagnosticData?.urine_couleur && parseInt(diagnosticData.urine_couleur) > 5 ? "pendant 5 jours" : diagnosticData?.crampes === "Oui" ? "avec une hydratation optimale" : "avec un ami"}
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
            
            {isSensitivePopulation && (
              <div className="mb-4 p-3 rounded-lg border-2 border-amber-500/50 bg-amber-50 dark:bg-amber-950/30 text-left">
                <div className="flex items-start gap-2">
                  <span className="text-lg">⚕️</span>
                  <div>
                    <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1">
                      Important
                    </p>
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      {getPersonalizedDisclaimerMessage()}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <a href="https://www.hydratis.co/collections/tous-nos-produits" target="_blank" rel="noopener noreferrer">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Découvrir nos produits
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Bouton recommencer */}
        {onRestart && <Button onClick={onRestart} variant="outline" size="lg" className="w-full gap-2">
            <RotateCcw className="w-4 h-4" />
            Recommencer le diagnostic
          </Button>}
      </div>

      {/* Bouton Back to Top */}
      {showBackToTop && <Button onClick={() => window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })} className="fixed bottom-4 right-4 z-50 animate-fade-in rounded-full p-3 shadow-lg" size="icon">
          <ArrowUp className="w-5 h-5" />
        </Button>}

    </div>;
};