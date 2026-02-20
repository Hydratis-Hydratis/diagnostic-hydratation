import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabaseAuth.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userId = claims.claims.sub as string;

    // Check admin role using service_role client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "stats";

    if (action === "export") {
      // Return all diagnostics for CSV export
      const { data: allDiags } = await supabase
        .from("diagnostics")
        .select("created_at, first_name, email, age, sexe, sport, score, hydra_rank, besoin_total_ml, hydratation_reelle_ml, ecart_hydratation_ml, nb_pastilles_total, status")
        .order("created_at", { ascending: false });

      return new Response(JSON.stringify({ diagnostics: allDiags || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch ALL diagnostics for stats
    const { data: allData } = await supabase
      .from("diagnostics")
      .select("score, sexe, age, sport, hydra_rank, created_at, status, diagnostic_data");

    const data = allData || [];
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const weekAgo = new Date(now.getTime() - 7 * 86400000);

    const completed = data.filter((d: any) => d.status === "completed");
    const scores = completed.filter((d: any) => d.score != null).map((d: any) => d.score as number);
    const avgScore = scores.length ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
    const today = data.filter((d: any) => d.created_at?.startsWith(todayStr)).length;
    const thisWeek = data.filter((d: any) => new Date(d.created_at) >= weekAgo).length;
    const withEmail = completed.filter((d: any) => d.email || (d.diagnostic_data as any)?.email).length;

    // Score distribution
    const scoreBuckets = [0, 0, 0, 0];
    completed.forEach((d: any) => {
      if (d.score == null) return;
      if (d.score <= 25) scoreBuckets[0]++;
      else if (d.score <= 50) scoreBuckets[1]++;
      else if (d.score <= 75) scoreBuckets[2]++;
      else scoreBuckets[3]++;
    });

    // Gender
    const genderMap: Record<string, number> = {};
    completed.forEach((d: any) => { const s = d.sexe || "Non renseigné"; genderMap[s] = (genderMap[s] || 0) + 1; });

    // Age buckets
    const ageBuckets = [0, 0, 0, 0, 0, 0]; // <18, 18-25, 26-35, 36-50, 51-65, 65+
    completed.forEach((d: any) => {
      if (d.age == null) return;
      if (d.age < 18) ageBuckets[0]++;
      else if (d.age <= 25) ageBuckets[1]++;
      else if (d.age <= 35) ageBuckets[2]++;
      else if (d.age <= 50) ageBuckets[3]++;
      else if (d.age <= 65) ageBuckets[4]++;
      else ageBuckets[5]++;
    });

    // Sports
    const sportMap: Record<string, { count: number; totalScore: number }> = {};
    completed.forEach((d: any) => {
      if (!d.sport) return;
      if (!sportMap[d.sport]) sportMap[d.sport] = { count: 0, totalScore: 0 };
      sportMap[d.sport].count++;
      if (d.score != null) sportMap[d.sport].totalScore += d.score;
    });

    // Daily evolution
    const dailyMap: Record<string, { total: number; completed: number }> = {};
    data.forEach((d: any) => {
      const day = d.created_at.split("T")[0];
      if (!dailyMap[day]) dailyMap[day] = { total: 0, completed: 0 };
      dailyMap[day].total++;
      if (d.status === "completed") dailyMap[day].completed++;
    });

    // Hydra rank
    const rankMap: Record<string, number> = {};
    completed.forEach((d: any) => { if (d.hydra_rank) rankMap[d.hydra_rank] = (rankMap[d.hydra_rank] || 0) + 1; });

    // Hourly heatmap
    const hourlyMap: Record<number, number> = {};
    data.forEach((d: any) => {
      const h = new Date(d.created_at).getHours();
      hourlyMap[h] = (hourlyMap[h] || 0) + 1;
    });

    // Score by age bucket
    const scoreByAge = [
      { name: "<18", total: 0, count: 0 },
      { name: "18-25", total: 0, count: 0 },
      { name: "26-35", total: 0, count: 0 },
      { name: "36-50", total: 0, count: 0 },
      { name: "51-65", total: 0, count: 0 },
      { name: "65+", total: 0, count: 0 },
    ];
    completed.forEach((d: any) => {
      if (d.age == null || d.score == null) return;
      let idx = 5;
      if (d.age < 18) idx = 0;
      else if (d.age <= 25) idx = 1;
      else if (d.age <= 35) idx = 2;
      else if (d.age <= 50) idx = 3;
      else if (d.age <= 65) idx = 4;
      scoreByAge[idx].total += d.score;
      scoreByAge[idx].count++;
    });

    // Beverages from diagnostic_data
    const beverageMap: Record<string, number> = {};
    data.forEach((d: any) => {
      const dd = d.diagnostic_data;
      if (!dd || typeof dd !== "object") return;
      const beverages = (dd as any).boissons_consommees || (dd as any).beverages || [];
      if (Array.isArray(beverages)) {
        beverages.forEach((b: any) => {
          const name = typeof b === "string" ? b : b?.name || b?.id;
          if (name) beverageMap[name] = (beverageMap[name] || 0) + 1;
        });
      }
    });

    const result = {
      overview: { total: data.length, completed: completed.length, avgScore, today, thisWeek, withEmail },
      scoreBuckets,
      genderMap,
      ageBuckets,
      sportMap,
      dailyMap,
      rankMap,
      hourlyMap,
      scoreByAge: scoreByAge.map(s => ({ name: s.name, avg: s.count ? Math.round(s.total / s.count) : 0, count: s.count })),
      beverageMap,
      funnel: { started: data.length, completed: completed.length, withEmail },
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
