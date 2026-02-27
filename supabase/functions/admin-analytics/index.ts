import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function detectDevice(ua: string | null): string {
  if (!ua) return "Inconnu";
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "Tablette";
  if (/mobile|iphone|ipod|android.*mobile|windows phone/i.test(ua)) return "Mobile";
  return "Desktop";
}

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
    const dateFrom = url.searchParams.get("date_from");
    const dateTo = url.searchParams.get("date_to");

    // Helper: paginated fetch to bypass 1000-row PostgREST limit
    async function fetchAll(selectColumns: string, orderCol = "created_at") {
      const PAGE_SIZE = 1000;
      let allRows: any[] = [];
      let from = 0;
      while (true) {
        let query = supabase
          .from("diagnostics")
          .select(selectColumns)
          .order(orderCol, { ascending: false })
          .range(from, from + PAGE_SIZE - 1);
        if (dateFrom) query = query.gte("created_at", dateFrom);
        if (dateTo) query = query.lte("created_at", dateTo + "T23:59:59.999Z");
        const { data: rows, error } = await query;
        if (error) throw error;
        if (!rows || rows.length === 0) break;
        allRows = allRows.concat(rows);
        if (rows.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }
      return allRows;
    }

    if (action === "export") {
      const allDiags = await fetchAll("created_at, first_name, email, age, sexe, sport, score, hydra_rank, besoin_total_ml, hydratation_reelle_ml, ecart_hydratation_ml, nb_pastilles_total, status");
      return new Response(JSON.stringify({ diagnostics: allDiags }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch ALL diagnostics with pagination
    const data = await fetchAll("score, sexe, age, sport, hydra_rank, created_at, status, diagnostic_data, user_agent, first_name, email, ecart_hydratation_ml, nb_pastilles_total");
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const weekAgo = new Date(now.getTime() - 7 * 86400000);

    const completed = data.filter((d: any) => d.status === "completed");
    const scores = completed.filter((d: any) => d.score != null).map((d: any) => d.score as number);
    const avgScore = scores.length ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
    const today = data.filter((d: any) => d.created_at?.startsWith(todayStr)).length;
    const thisWeek = data.filter((d: any) => new Date(d.created_at) >= weekAgo).length;
    const withEmail = completed.filter((d: any) => d.email || (d.diagnostic_data as any)?.email).length;

    // Score distribution by 10-point buckets
    const scoreDistribution: Record<string, number> = {};
    for (let i = 0; i <= 90; i += 10) {
      scoreDistribution[`${i}-${i + 9}`] = 0;
    }
    scoreDistribution["100"] = 0;
    completed.forEach((d: any) => {
      if (d.score == null) return;
      if (d.score === 100) { scoreDistribution["100"]++; return; }
      const bucket = Math.floor(d.score / 10) * 10;
      const key = `${bucket}-${bucket + 9}`;
      if (scoreDistribution[key] !== undefined) scoreDistribution[key]++;
    });

    // Legacy score buckets (keep for compatibility)
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
    const ageBuckets = [0, 0, 0, 0, 0, 0];
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

    // Beverages
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

    // Pastilles distribution
    const pastillesDistribution: Record<string, number> = {};
    completed.forEach((d: any) => {
      if (d.nb_pastilles_total == null) return;
      const key = String(d.nb_pastilles_total);
      pastillesDistribution[key] = (pastillesDistribution[key] || 0) + 1;
    });

    // Pastilles by rank
    const pastillesByRankAcc: Record<string, { total: number; count: number }> = {};
    completed.forEach((d: any) => {
      if (d.nb_pastilles_total == null || !d.hydra_rank) return;
      if (!pastillesByRankAcc[d.hydra_rank]) pastillesByRankAcc[d.hydra_rank] = { total: 0, count: 0 };
      pastillesByRankAcc[d.hydra_rank].total += d.nb_pastilles_total;
      pastillesByRankAcc[d.hydra_rank].count++;
    });
    const pastillesByRank: Record<string, number> = {};
    for (const [rank, v] of Object.entries(pastillesByRankAcc)) {
      pastillesByRank[rank] = Math.round((v.total / v.count) * 10) / 10;
    }

    // === NEW AGGREGATIONS ===

    // Device map from user_agent
    const deviceMap: Record<string, number> = {};
    data.forEach((d: any) => {
      const dev = detectDevice(d.user_agent);
      deviceMap[dev] = (deviceMap[dev] || 0) + 1;
    });

    // Source map from diagnostic_data.utm_source
    const sourceMap: Record<string, number> = {};
    const mediumMap: Record<string, number> = {};
    const campaignMap: Record<string, number> = {};
    const referrerMap: Record<string, number> = {};
    data.forEach((d: any) => {
      const dd = d.diagnostic_data;
      if (!dd || typeof dd !== "object") return;
      const src = (dd as any).utm_source || "Direct";
      sourceMap[src] = (sourceMap[src] || 0) + 1;
      const med = (dd as any).utm_medium;
      if (med) mediumMap[med] = (mediumMap[med] || 0) + 1;
      const camp = (dd as any).utm_campaign;
      if (camp) campaignMap[camp] = (campaignMap[camp] || 0) + 1;
      const ref = (dd as any).referrer;
      if (ref) {
        try {
          const host = new URL(ref).hostname;
          referrerMap[host] = (referrerMap[host] || 0) + 1;
        } catch {
          referrerMap[ref] = (referrerMap[ref] || 0) + 1;
        }
      }
    });

    // Avg hydration gap & pastilles
    const gaps = completed.filter((d: any) => d.ecart_hydratation_ml != null).map((d: any) => d.ecart_hydratation_ml as number);
    const avgHydrationGap = gaps.length ? Math.round(gaps.reduce((a: number, b: number) => a + b, 0) / gaps.length) : 0;
    const pasts = completed.filter((d: any) => d.nb_pastilles_total != null).map((d: any) => d.nb_pastilles_total as number);
    const avgPastilles = pasts.length ? Math.round((pasts.reduce((a: number, b: number) => a + b, 0) / pasts.length) * 10) / 10 : 0;

    // Recent diagnostics (last 10 completed)
    const recentDiagnostics = completed
      .filter((d: any) => d.score != null)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map((d: any) => ({
        created_at: d.created_at,
        first_name: d.first_name || "—",
        score: d.score,
        hydra_rank: d.hydra_rank || "—",
        sport: d.sport || "—",
        nb_pastilles_total: d.nb_pastilles_total ?? "—",
      }));

    const result = {
      overview: { total: data.length, completed: completed.length, avgScore, today, thisWeek, withEmail, avgHydrationGap, avgPastilles },
      scoreBuckets,
      scoreDistribution,
      genderMap,
      ageBuckets,
      sportMap,
      dailyMap,
      rankMap,
      hourlyMap,
      scoreByAge: scoreByAge.map(s => ({ name: s.name, avg: s.count ? Math.round(s.total / s.count) : 0, count: s.count })),
      beverageMap,
      funnel: { started: data.length, completed: completed.length, withEmail },
      deviceMap,
      sourceMap,
      mediumMap,
      campaignMap,
      referrerMap,
      recentDiagnostics,
      pastillesDistribution,
      pastillesByRank,
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
