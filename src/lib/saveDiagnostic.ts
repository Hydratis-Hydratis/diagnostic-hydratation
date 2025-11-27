import { supabase } from "@/integrations/supabase/client";
import { DiagnosticData } from "@/types/diagnostic";
import { HydrationResult } from "./hydrationCalculator";

export async function saveDiagnosticToCloud(
  diagnosticData: DiagnosticData,
  results: HydrationResult
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      email: diagnosticData.email || null,
      first_name: diagnosticData.firstName || null,
      diagnostic_data: diagnosticData as any,
      results: results as any,
      score: results.score,
      hydration_status: results.statut,
      user_agent: navigator.userAgent,
      completed_at: new Date().toISOString()
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
