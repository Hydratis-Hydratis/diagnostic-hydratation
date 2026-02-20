import { supabase } from "@/integrations/supabase/client";
import type { DiagnosticData } from "@/types/diagnostic";
import type { HydrationResult } from "@/lib/hydrationCalculator";

export async function upsertDiagnosticProgress(params: {
  diagnosticId: string;
  diagnosticData: DiagnosticData;
}): Promise<{ success: boolean; error?: string }> {
  const { diagnosticId, diagnosticData } = params;

  const { data, error } = await supabase.functions.invoke('save-diagnostic-progress', {
    body: {
      diagnosticId,
      mode: 'progress',
      data: {
        diagnostic_data: diagnosticData,
        age: diagnosticData.age ? parseInt(diagnosticData.age) : null,
        sexe: diagnosticData.sexe || null,
        email: diagnosticData.email || null,
        first_name: diagnosticData.firstName || null,
      },
    },
  });

  if (error) return { success: false, error: error.message };
  if (data?.error) return { success: false, error: data.error };
  return { success: true };
}

export async function upsertDiagnosticCompletion(params: {
  diagnosticId: string;
  diagnosticData: DiagnosticData;
  results: HydrationResult;
  completedAt: string;
  sportValue: string;
  hydraRank: string;
}): Promise<{ success: boolean; error?: string }> {
  const { diagnosticId, diagnosticData, results, completedAt, sportValue, hydraRank } = params;

  const { data, error } = await supabase.functions.invoke('save-diagnostic-progress', {
    body: {
      diagnosticId,
      mode: 'completion',
      data: {
        email: diagnosticData.email || null,
        first_name: diagnosticData.firstName || null,
        diagnostic_data: diagnosticData,
        results,
        score: results.score,
        hydration_status: results.statut,
        completed_at: completedAt,
        age: diagnosticData.age ? parseInt(diagnosticData.age) : null,
        sexe: diagnosticData.sexe || null,
        sport: sportValue,
        besoin_total_ml: Math.round(results.besoin_total_ml),
        hydratation_reelle_ml: Math.round(results.hydratation_reelle_ml),
        ecart_hydratation_ml: Math.round(results.ecart_hydratation_ml),
        nb_pastilles_basal: results.nb_pastilles_basal,
        nb_pastilles_exercice: results.nb_pastilles_exercice,
        nb_pastilles_total: results.nb_pastilles_basal + results.nb_pastilles_exercice,
        hydra_rank: hydraRank,
      },
    },
  });

  if (error) return { success: false, error: error.message };
  if (data?.error) return { success: false, error: data.error };
  return { success: true };
}
