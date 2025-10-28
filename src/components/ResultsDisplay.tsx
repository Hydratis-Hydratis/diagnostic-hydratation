import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Droplet, Activity, Pill, AlertCircle, CheckCircle, TrendingUp, Zap, Info, Sparkles } from "lucide-react";
import type { HydrationResult } from "@/lib/hydrationCalculator";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

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

      {/* Section 1 - Besoins quotidiens de base */}
      <Card className="border-blue-500/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Droplet className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-xl">Besoins quotidiens de base</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Hydratation journalière hors activité sportive</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <p className="text-sm text-muted-foreground mb-2">Besoin hydrique total</p>
              <div className="text-3xl font-bold text-foreground">
                {results.besoins_basals_brut_ml}
                <span className="text-lg font-normal text-muted-foreground ml-1">mL</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🍽️</span>
                  <p className="text-xs font-medium text-muted-foreground">Via l'alimentation</p>
                </div>
                <div className="text-xl font-bold text-foreground">
                  {results.apport_alimentation_basal_ml}
                  <span className="text-sm font-normal text-muted-foreground ml-1">mL</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">20%</p>
              </div>
              
              <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">💧</span>
                  <p className="text-xs font-medium text-muted-foreground">À boire</p>
                </div>
                <div className="text-xl font-bold text-foreground">
                  {results.besoins_basals_net_ml}
                  <span className="text-sm font-normal text-muted-foreground ml-1">mL</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">80% • {Math.round(results.besoins_basals_net_ml / 250)} verres</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Pill className="w-4 h-4 text-purple-500" />
              <p className="font-semibold text-sm">Pastilles quotidiennes</p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">À répartir tout au long de la journée</span>
              <Badge className="bg-purple-500 text-white text-base font-bold">
                {results.nb_pastilles_basal} pastille{results.nb_pastilles_basal > 1 ? 's' : ''}
              </Badge>
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="facteurs" className="border-none">
              <AccordionTrigger className="hover:no-underline py-2 text-xs">
                <span className="text-muted-foreground">📊 Voir les facteurs pris en compte</span>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-1 ml-4 text-xs text-muted-foreground">
                  <li>• Âge, sexe et morphologie</li>
                  <li>• Température extérieure ({results.details_basals.ajust_temperature} mL)</li>
                  <li>• Boissons consommées ({results.details_basals.ajust_boissons} mL)</li>
                  {results.details_basals.ajust_physiologique > 0 && (
                    <li>• Situation physiologique (+{results.details_basals.ajust_physiologique} mL)</li>
                  )}
                  {results.details_basals.ajust_symptomes > 0 && (
                    <li>• Symptômes et activité (+{results.details_basals.ajust_symptomes} mL)</li>
                  )}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Section 2 - Besoins liés au sport */}
      {results.besoins_exercice_ml > 0 && (
        <Card className="border-orange-500/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Activity className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <CardTitle className="text-xl">Besoins liés au sport</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Hydratation spécifique pour cette séance</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-orange-500/5 border border-orange-500/20">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Volume pour cette séance</p>
                <div className="text-3xl font-bold text-foreground">
                  {results.besoins_exercice_ml}
                  <span className="text-lg font-normal text-muted-foreground ml-1">mL</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Soit environ {Math.round(results.besoins_exercice_ml / results.details_exercice.duree_heures)} mL/heure d'effort
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-purple-500" />
                  <p className="font-semibold text-sm">Pastilles sport</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pendant l'effort</span>
                    <Badge variant="secondary" className="text-sm font-semibold">
                      {results.nb_pastilles_exercice} pastille{results.nb_pastilles_exercice > 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Récupération post-effort</span>
                    <Badge variant="secondary" className="text-sm font-semibold">
                      {results.nb_pastilles_post_exercice} pastille{results.nb_pastilles_post_exercice > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground space-y-1 pt-2">
              <p className="font-medium">Détails de la séance :</p>
              <ul className="space-y-0.5 ml-4">
                <li>• Pertes par transpiration : {results.details_exercice.pertes_transpiration} mL/kg/h</li>
                <li>• Facteur sport : {results.details_exercice.facteur_sport}</li>
                <li>• Durée : {results.details_exercice.duree_heures}h</li>
                {results.details_exercice.ajust_temperature > 0 && (
                  <li>• Ajustement température : +{results.details_exercice.ajust_temperature} mL/h</li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 3 - Total et bilan */}
      <Card className="border-2 border-primary/40 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Total et bilan</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Vue d'ensemble de vos besoins hydriques</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-primary/10 border-2 border-primary/30">
              <p className="text-sm font-medium text-muted-foreground mb-2">Besoin hydrique total</p>
              <div className="text-3xl font-bold text-primary">
                {results.besoin_total_brut_ml}
                <span className="text-lg font-normal text-muted-foreground ml-1">mL</span>
              </div>
              {results.besoins_exercice_ml > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {results.besoins_basals_brut_ml} mL (quotidien) + {results.besoins_exercice_ml} mL (sport)
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🍽️</span>
                  <p className="text-xs font-medium text-muted-foreground">Via l'alimentation</p>
                </div>
                <div className="text-xl font-bold text-foreground">
                  {results.apport_alimentation_ml}
                  <span className="text-sm font-normal text-muted-foreground ml-1">mL</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">20% du quotidien</p>
              </div>
              
              <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">💧</span>
                  <p className="text-xs font-medium text-muted-foreground">À boire</p>
                </div>
                <div className="text-xl font-bold text-foreground">
                  {results.besoin_hydration_nette_ml}
                  <span className="text-sm font-normal text-muted-foreground ml-1">mL</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">80% + sport</p>
              </div>
            </div>
          </div>

          {/* Comparison with Current Hydration */}
          {results.hydratation_reelle_ml > 0 && (
            <div className="space-y-3 p-4 rounded-lg bg-background border">
              <h4 className="font-semibold text-sm">Ton hydratation actuelle</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Tu bois actuellement</span>
                  <span className="font-semibold">{results.hydratation_reelle_ml} mL/jour</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Objectif recommandé (à boire)</span>
                  <span className="font-semibold">{results.besoin_hydration_nette_ml} mL/jour</span>
                </div>
                {results.ecart_hydratation_ml > 0 ? (
                  <div className="flex justify-between items-center text-sm text-yellow-600 dark:text-yellow-500 pt-2 border-t">
                    <span className="font-medium">À ajouter</span>
                    <span className="font-bold">+{results.ecart_hydratation_ml} mL</span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-sm text-green-600 dark:text-green-500 pt-2 border-t">
                    <span className="font-medium">Objectif atteint !</span>
                    <CheckCircle className="w-5 h-5" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Total Pastilles Summary */}
          <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
            <div className="flex items-center gap-2 mb-3">
              <Pill className="w-5 h-5 text-purple-500" />
              <h4 className="font-semibold">Total pastilles Hydratis recommandées</h4>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pour couvrir tous vos besoins</span>
              <Badge className="bg-purple-500 text-white text-lg font-bold px-4 py-1">
                {totalPastilles} pastille{totalPastilles > 1 ? 's' : ''}/jour
              </Badge>
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
                  <Tooltip 
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
                  Les pastilles Hydratis contiennent un mélange optimal d'électrolytes (sodium, potassium, magnésium) qui accélèrent l'absorption de l'eau par l'organisme jusqu'à 3 fois plus rapidement qu'avec de l'eau seule.
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

    </div>
  );
};
