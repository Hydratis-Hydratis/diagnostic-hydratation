import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { diagnosticId, mode, data } = await req.json();

    if (!diagnosticId || !UUID_RE.test(diagnosticId)) {
      return new Response(JSON.stringify({ error: "Invalid diagnosticId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!mode || !["progress", "completion"].includes(mode)) {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let updateData: Record<string, unknown>;

    if (mode === "progress") {
      updateData = {
        diagnostic_data: data.diagnostic_data,
        age: data.age ?? null,
        sexe: data.sexe ?? null,
        email: data.email ?? null,
        first_name: data.first_name ?? null,
      };
    } else {
      // completion
      updateData = {
        diagnostic_data: data.diagnostic_data,
        results: data.results,
        score: data.score,
        hydration_status: data.hydration_status,
        completed_at: data.completed_at,
        age: data.age ?? null,
        sexe: data.sexe ?? null,
        sport: data.sport ?? null,
        email: data.email ?? null,
        first_name: data.first_name ?? null,
        besoin_total_ml: data.besoin_total_ml,
        hydratation_reelle_ml: data.hydratation_reelle_ml,
        ecart_hydratation_ml: data.ecart_hydratation_ml,
        nb_pastilles_basal: data.nb_pastilles_basal,
        nb_pastilles_exercice: data.nb_pastilles_exercice,
        nb_pastilles_total: data.nb_pastilles_total,
        hydra_rank: data.hydra_rank,
        status: "completed",
      };
    }

    const { error } = await supabase
      .from("diagnostics")
      .update(updateData)
      .eq("id", diagnosticId);

    if (error) {
      console.error("Update error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
