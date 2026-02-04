import { supabase } from "@/integrations/supabase/client";
import type { DiagnosticData } from "@/types/diagnostic";
import type { HydrationResult } from "@/lib/hydrationCalculator";

type DiagnosticsRowUpsert = {
  id: string;
  diagnostic_data: any;
  results?: any | null;
  score?: number | null;
  hydration_status?: string | null;
  completed_at?: string | null;
  age?: number | null;
  sexe?: string | null;
  sport?: string | null;
  besoin_total_ml?: number | null;
  hydratation_reelle_ml?: number | null;
  ecart_hydratation_ml?: number | null;
  nb_pastilles_basal?: number | null;
  nb_pastilles_exercice?: number | null;
  nb_pastilles_total?: number | null;
  hydra_rank?: string | null;
  email?: string | null;
  first_name?: string | null;
  status?: string | null;
};

export async function upsertDiagnosticProgress(params: {
  diagnosticId: string;
  diagnosticData: DiagnosticData;
}): Promise<{ success: boolean; error?: string }> {
  const { diagnosticId, diagnosticData } = params;

  const row: DiagnosticsRowUpsert = {
    id: diagnosticId,
    diagnostic_data: diagnosticData as any,
    age: diagnosticData.age ? parseInt(diagnosticData.age) : null,
    sexe: diagnosticData.sexe || null,
    email: diagnosticData.email || null,
    first_name: diagnosticData.firstName || null,
    // IMPORTANT: do NOT set status here to avoid reverting a completed diagnostic.
  };

  const { error } = await supabase
    .from("diagnostics")
    .upsert(row as any, { onConflict: "id" });

  if (error) return { success: false, error: error.message };
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
  const {
    diagnosticId,
    diagnosticData,
    results,
    completedAt,
    sportValue,
    hydraRank,
  } = params;

  const row: DiagnosticsRowUpsert = {
    id: diagnosticId,
    email: diagnosticData.email || null,
    first_name: diagnosticData.firstName || null,
    diagnostic_data: diagnosticData as any,
    results: results as any,
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
    status: "completed",
  };

  const { error } = await supabase
    .from("diagnostics")
    .upsert(row as any, { onConflict: "id" });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
