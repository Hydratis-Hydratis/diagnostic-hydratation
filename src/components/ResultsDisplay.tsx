import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Droplet, Activity, Pill, AlertCircle, CheckCircle, TrendingUp } from "lucide-react";
import type { HydrationResult } from "@/lib/hydrationCalculator";

interface ResultsDisplayProps {
  results: HydrationResult;
  firstName?: string;
}

export const ResultsDisplay = ({ results, firstName }: ResultsDisplayProps) => {
  const totalPastilles = results.nb_pastilles_basal + results.nb_pastilles_exercice + results.nb_pastilles_post_exercice;
  
  const getStatusColor = (statut: string) => {
    if (statut.includes("Excellente") || statut.includes("Bonne")) return "bg-green-500";
    if (statut.includes("Modérée") || statut.includes("Attention")) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  const getStatusIcon = (statut: string) => {
    if (statut.includes("Excellente") || statut.includes("Bonne")) return <CheckCircle className="w-5 h-5" />;
    return <AlertCircle className="w-5 h-5" />;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Ton diagnostic est prêt, {firstName} ! 💧
        </h2>
        <p className="text-muted-foreground">Voici tes résultats personnalisés</p>
      </div>

      {/* Score Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getStatusIcon(results.statut)}
              <div>
                <h3 className="font-semibold text-lg">Score d'hydratation</h3>
                <Badge className={`${getStatusColor(results.statut)} text-white mt-1`}>
                  {results.statut}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{results.score}</div>
              <div className="text-sm text-muted-foreground">/100</div>
            </div>
          </div>
          <Progress value={results.score} className="h-3" />
        </CardContent>
      </Card>

      {/* Hydration Needs Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Daily Needs */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Droplet className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="font-semibold">Besoins quotidiens</h3>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">
              {results.besoins_basals_ml}
              <span className="text-lg font-normal text-muted-foreground ml-1">mL</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Environ {Math.round(results.besoins_basals_ml / 250)} verres d'eau par jour
            </p>
          </CardContent>
        </Card>

        {/* Exercise Needs */}
        {results.besoins_exercice_ml > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Activity className="w-5 h-5 text-orange-500" />
                </div>
                <h3 className="font-semibold">Pendant l'exercice</h3>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">
                {results.besoins_exercice_ml}
                <span className="text-lg font-normal text-muted-foreground ml-1">mL</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Par séance de {results.details_exercice.duree_heures}h
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Total Needs */}
      <Card className="border-2 border-primary/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Besoin total quotidien</h3>
                <p className="text-sm text-muted-foreground">Hydratation recommandée</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">
                {results.besoin_total_ml}
                <span className="text-lg font-normal text-muted-foreground ml-1">mL</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison with Current Hydration */}
      {results.hydratation_reelle_ml > 0 && (
        <Card className={results.ecart_hydratation_ml > 0 ? "border-yellow-500/50" : "border-green-500/50"}>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Ton hydratation actuelle</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tu bois actuellement</span>
                <span className="font-semibold">{results.hydratation_reelle_ml} mL/jour</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Objectif recommandé</span>
                <span className="font-semibold">{results.besoin_total_ml} mL/jour</span>
              </div>
              {results.ecart_hydratation_ml > 0 ? (
                <div className="flex justify-between items-center text-yellow-600 dark:text-yellow-500">
                  <span className="font-medium">À ajouter</span>
                  <span className="font-bold">+{results.ecart_hydratation_ml} mL</span>
                </div>
              ) : (
                <div className="flex justify-between items-center text-green-600 dark:text-green-500">
                  <span className="font-medium">Objectif atteint !</span>
                  <CheckCircle className="w-5 h-5" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pastilles Recommendations */}
      <Card className="bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Pill className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="font-semibold">Recommandations Hydratis</h3>
          </div>
          <div className="grid gap-3">
            <div className="flex justify-between items-center p-3 rounded-lg bg-background/50">
              <span className="text-sm">Usage quotidien</span>
              <Badge variant="secondary" className="text-base font-semibold">
                {results.nb_pastilles_basal} pastille{results.nb_pastilles_basal > 1 ? 's' : ''}
              </Badge>
            </div>
            {results.nb_pastilles_exercice > 0 && (
              <>
                <div className="flex justify-between items-center p-3 rounded-lg bg-background/50">
                  <span className="text-sm">Pendant l'effort</span>
                  <Badge variant="secondary" className="text-base font-semibold">
                    {results.nb_pastilles_exercice} pastille{results.nb_pastilles_exercice > 1 ? 's' : ''}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-background/50">
                  <span className="text-sm">Récupération</span>
                  <Badge variant="secondary" className="text-base font-semibold">
                    {results.nb_pastilles_post_exercice} pastille{results.nb_pastilles_post_exercice > 1 ? 's' : ''}
                  </Badge>
                </div>
              </>
            )}
            <div className="flex justify-between items-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 mt-2">
              <span className="font-semibold">Total recommandé</span>
              <Badge className="bg-purple-500 text-white text-base font-bold">
                {totalPastilles} pastille{totalPastilles > 1 ? 's' : ''}/jour
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Notes - Accordion */}
      {results.notes.length > 0 && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="notes" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-primary" />
                <span className="font-semibold">Conseils personnalisés ({results.notes.length})</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                {results.notes.map((note, index) => (
                  <div key={index} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Details - Accordion */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="details" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-semibold text-sm">Voir les détails du calcul</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2 text-sm">
              <div>
                <p className="font-medium mb-2">Besoins quotidiens :</p>
                <ul className="space-y-1 text-muted-foreground ml-4">
                  <li>• Base (âge/sexe) : {results.details_basals.base_age_sexe} mL</li>
                  <li>• Ajustement température : +{results.details_basals.ajust_temperature} mL</li>
                  <li>• Ajustement boissons : +{results.details_basals.ajust_boissons} mL</li>
                  <li>• Ajustement physiologique : +{results.details_basals.ajust_physiologique} mL</li>
                  <li>• Ajustement symptômes : +{results.details_basals.ajust_symptomes} mL</li>
                </ul>
              </div>
              {results.besoins_exercice_ml > 0 && (
                <div>
                  <p className="font-medium mb-2">Besoins exercice :</p>
                  <ul className="space-y-1 text-muted-foreground ml-4">
                    <li>• Pertes transpiration : {results.details_exercice.pertes_transpiration} mL/kg/h</li>
                    <li>• Facteur sport : {results.details_exercice.facteur_sport}</li>
                    <li>• Durée : {results.details_exercice.duree_heures}h</li>
                    <li>• Ajustement température : +{results.details_exercice.ajust_temperature} mL/h</li>
                  </ul>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
