import { supabase } from "@/integrations/supabase/client";
import { DiagnosticData } from "@/types/diagnostic";
import { HydrationResult } from "./hydrationCalculator";
import { clearDiagnosticId, ensureDiagnosticId, getCurrentDiagnosticId } from "./diagnosticSession";
import { upsertDiagnosticCompletion, upsertDiagnosticProgress } from "./diagnosticsRepo";

// Backward-compatible re-exports
export { clearDiagnosticId, getCurrentDiagnosticId };

// Determine hydra_rank based on score
const getHydraRank = (score: number): string => {
  if (score >= 90) return "Hydra'champion";
  if (score >= 70) return "Hydra'avancé";
  if (score >= 50) return "Hydra'initié";
  return "Hydra'débutant";
};

// Generate certificate image and upload to storage
async function generateCertificate(payload: {
  firstName: string | null;
  score: number;
  hydraRank: string;
  besoinTotalMl: number; // besoins_basals_net_ml - ce qu'il faut boire quotidiennement
  hydratationReelleMl: number;
  diagnosticId: string;
  nbPastillesTotal: number;
  isSensitivePopulation: boolean;
  besoinsExerciceMl: number; // besoins supplémentaires pour l'exercice
}): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-certificate', {
      body: payload
    });
    
    if (error) {
      console.error('Erreur génération certificat:', error);
      return null;
    }
    
    if (data?.success && data?.certificateUrl) {
      console.log('Certificat généré:', data.certificateUrl);
      return data.certificateUrl;
    }
    
    return null;
  } catch (err) {
    console.error('Erreur appel generate-certificate:', err);
    return null;
  }
}

// Sync diagnostic data to Klaviyo
async function syncToKlaviyo(payload: {
  email: string | null;
  first_name: string | null;
  score: number;
  hydra_rank: string;
  age: number | null;
  sexe: string | null;
  sport: string;
  besoin_total_ml: number;
  hydratation_reelle_ml: number;
  ecart_hydratation_ml: number;
  nb_pastilles_basal: number;
  nb_pastilles_exercice: number;
  nb_pastilles_total: number;
  completed_at: string;
  certificate_url: string | null;
  status: string;
}): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('sync-klaviyo', {
      body: payload
    });
    
    if (error) {
      console.error('Erreur synchronisation Klaviyo:', error);
    } else {
      console.log('Profil synchronisé avec Klaviyo');
    }
  } catch (err) {
    // Ne pas bloquer le flux principal si la sync échoue
    console.error('Erreur appel sync Klaviyo:', err);
  }
}

// Start a new diagnostic (status: started)
export async function startDiagnostic(): Promise<{ success: boolean; diagnosticId?: string; error?: string }> {
  try {
    const diagnosticId = await ensureDiagnosticId();
    console.log("Diagnostic démarré avec ID:", diagnosticId);
    return { success: true, diagnosticId };
  } catch (err) {
    console.error('Erreur lors du démarrage:', err);
    return { success: false, error: String(err) };
  }
}

// Update diagnostic with partial answers at each step
export async function updateDiagnosticProgress(
  diagnosticData: DiagnosticData
): Promise<{ success: boolean; error?: string }> {
  try {
    const diagnosticId = await ensureDiagnosticId();
    const res = await upsertDiagnosticProgress({ diagnosticId, diagnosticData });
    if (!res.success) {
      console.error('Erreur mise à jour diagnostic:', res.error);
    }
    return res;
  } catch (err) {
    console.error('Erreur lors de la mise à jour:', err);
    return { success: false, error: String(err) };
  }
}

export async function saveDiagnosticToCloud(
  diagnosticData: DiagnosticData,
  results: HydrationResult
): Promise<{ success: boolean; error?: string }> {
  try {
    // Determine sport value
    const sportValue = diagnosticData.sport_pratique === "Oui" 
      ? (diagnosticData.sports_selectionnes?.map(s => s.name).join(", ") || "Sport non spécifié")
      : "Non sportif";

    const hydraRank = getHydraRank(results.score);
    const completedAt = new Date().toISOString();
    
    // Ensure we have an existing diagnostic ID (progressive save)
    let diagnosticId = getCurrentDiagnosticId();

    if (!diagnosticId) {
      diagnosticId = await ensureDiagnosticId();
    }

    if (diagnosticId) {
      const res = await upsertDiagnosticCompletion({
        diagnosticId,
        diagnosticData,
        results,
        completedAt,
        sportValue,
        hydraRank,
      });

      if (!res.success) {
        console.error('Erreur mise à jour finale diagnostic:', res.error);
        return { success: false, error: res.error };
      }

      console.log('Diagnostic complété avec succès (upsert)');
    }

    // Déterminer si population sensible (enceinte, allaitante, 70+)
    const age = diagnosticData.age ? parseInt(diagnosticData.age) : null;
    const situation = diagnosticData.situation_particuliere;
    const isSensitivePopulation = 
      situation === "Enceinte" || 
      situation === "Allaitante" || 
      (age !== null && age >= 70);

    // Générer le certificat en arrière-plan - l'Edge Function se charge de sauvegarder l'URL
    // On utilise besoins_basals_net_ml (ce qu'il faut boire) pour correspondre à ResultsDisplay
    generateCertificate({
      firstName: diagnosticData.firstName || null,
      score: results.score,
      hydraRank: hydraRank,
      besoinTotalMl: Math.round(results.besoins_basals_net_ml), // Quantité à boire quotidiennement
      hydratationReelleMl: Math.round(results.hydratation_reelle_ml),
      diagnosticId: diagnosticId,
      nbPastillesTotal: results.nb_pastilles_basal + results.nb_pastilles_exercice,
      isSensitivePopulation: isSensitivePopulation,
      besoinsExerciceMl: Math.round(results.besoins_exercice_ml) // Besoins supplémentaires pour le sport
    }).then((certificateUrl) => {
      console.log('Certificat généré et sauvegardé par Edge Function:', certificateUrl);
      
      // Synchroniser avec Klaviyo
      syncToKlaviyo({
        email: diagnosticData.email || null,
        first_name: diagnosticData.firstName || null,
        score: results.score,
        hydra_rank: hydraRank,
        age: diagnosticData.age ? parseInt(diagnosticData.age) : null,
        sexe: diagnosticData.sexe || null,
        sport: sportValue,
        besoin_total_ml: Math.round(results.besoin_total_ml),
        hydratation_reelle_ml: Math.round(results.hydratation_reelle_ml),
        ecart_hydratation_ml: Math.round(results.ecart_hydratation_ml),
        nb_pastilles_basal: results.nb_pastilles_basal,
        nb_pastilles_exercice: results.nb_pastilles_exercice,
        nb_pastilles_total: results.nb_pastilles_basal + results.nb_pastilles_exercice,
        completed_at: completedAt,
        certificate_url: certificateUrl,
        status: 'completed'
      });
    });

    // Clear the diagnostic ID from localStorage after completion
    clearDiagnosticId();

    return { success: true };
  } catch (err) {
    console.error('Erreur lors de la sauvegarde:', err);
    return { success: false, error: String(err) };
  }
}
