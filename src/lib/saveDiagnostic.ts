import { supabase } from "@/integrations/supabase/client";
import { DiagnosticData } from "@/types/diagnostic";
import { HydrationResult } from "./hydrationCalculator";

export async function saveDiagnosticToCloud(
  diagnosticData: DiagnosticData,
  results: HydrationResult
): Promise<{ success: boolean; error?: string }> {
  try {
    // Determine sport value
    const sportValue = diagnosticData.sport_pratique === "Oui" 
      ? (diagnosticData.sports_selectionnes?.map(s => s.name).join(", ") || "Sport non spécifié")
      : "Non sportif";

    // Determine hydra_rank based on score
    const getHydraRank = (score: number): string => {
      if (score >= 90) return "Hydra'champion";
      if (score >= 70) return "Hydra'avancé";
      if (score >= 50) return "Hydra'initié";
      return "Hydra'débutant";
    };

    const payload = {
      email: diagnosticData.email || null,
      first_name: diagnosticData.firstName || null,
      diagnostic_data: diagnosticData as any,
      results: results as any,
      score: results.score,
      hydration_status: results.statut,
      user_agent: navigator.userAgent,
      completed_at: new Date().toISOString(),
      // Nouvelles colonnes dénormalisées
      age: diagnosticData.age ? parseInt(diagnosticData.age) : null,
      sexe: diagnosticData.sexe || null,
      sport: sportValue,
      besoin_total_ml: Math.round(results.besoin_total_ml),
      hydratation_reelle_ml: Math.round(results.hydratation_reelle_ml),
      ecart_hydratation_ml: Math.round(results.ecart_hydratation_ml),
      nb_pastilles_basal: results.nb_pastilles_basal,
      nb_pastilles_exercice: results.nb_pastilles_exercice,
      nb_pastilles_total: results.nb_pastilles_basal + results.nb_pastilles_exercice,
      hydra_rank: getHydraRank(results.score)
    };

    const { error } = await supabase
      .from('diagnostics')
      .insert(payload as any);
    
    if (error) {
      console.error('Erreur sauvegarde diagnostic:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Diagnostic sauvegardé avec succès');
    return { success: true };
  } catch (err) {
    console.error('Erreur lors de la sauvegarde:', err);
    return { success: false, error: String(err) };
  }
}
