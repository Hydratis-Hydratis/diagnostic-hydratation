import { supabase } from "@/integrations/supabase/client";

// Storage key for diagnostic ID
const DIAGNOSTIC_ID_KEY = "hydratis_diagnostic_id";

let startInFlight: Promise<string> | null = null;

export function getCurrentDiagnosticId(): string | null {
  return localStorage.getItem(DIAGNOSTIC_ID_KEY);
}

export function clearDiagnosticId(): void {
  localStorage.removeItem(DIAGNOSTIC_ID_KEY);
}

/**
 * Ensures a single "started" diagnostic row exists for this session.
 * Dedupe concurrent calls to avoid creating multiple rows.
 */
export async function ensureDiagnosticId(): Promise<string> {
  const existing = getCurrentDiagnosticId();
  if (existing) return existing;

  if (startInFlight) return startInFlight;

  startInFlight = (async () => {
    const diagnosticId = crypto.randomUUID();

    const payload = {
      id: diagnosticId,
      diagnostic_data: {} as any,
      status: "started",
      user_agent: navigator.userAgent,
    };

    const { error } = await supabase.from("diagnostics").insert(payload as any);
    if (error) {
      throw new Error(error.message);
    }

    localStorage.setItem(DIAGNOSTIC_ID_KEY, diagnosticId);
    return diagnosticId;
  })();

  try {
    return await startInFlight;
  } finally {
    startInFlight = null;
  }
}
