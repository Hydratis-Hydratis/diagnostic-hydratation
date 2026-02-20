import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";

const COLORS = [
  "hsl(244, 93%, 32%)", "hsl(30, 80%, 55%)", "hsl(197, 37%, 24%)",
  "hsl(43, 74%, 66%)", "hsl(27, 87%, 67%)", "hsl(160, 50%, 40%)",
];

interface AnalyticsData {
  scoreBuckets: number[];
  genderMap: Record<string, number>;
  ageBuckets: number[];
  sportMap: Record<string, { count: number; totalScore: number }>;
  dailyMap: Record<string, { total: number; completed: number }>;
  rankMap: Record<string, number>;
  hourlyMap: Record<number, number>;
  scoreByAge: { name: string; avg: number; count: number }[];
  beverageMap: Record<string, number>;
  funnel: { started: number; completed: number; withEmail: number };
}

export function AnalyticsCharts() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: result } = await supabase.functions.invoke("admin-analytics", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (result && !result.error) setData(result);
    };
    fetch();
  }, []);

  if (!data) return <p className="text-muted-foreground">Chargement des analyses...</p>;

  const scoreBucketData = [
    { name: "0-25", count: data.scoreBuckets[0] },
    { name: "26-50", count: data.scoreBuckets[1] },
    { name: "51-75", count: data.scoreBuckets[2] },
    { name: "76-100", count: data.scoreBuckets[3] },
  ];

  const genderData = Object.entries(data.genderMap).map(([name, value]) => ({ name, value }));

  const ageBucketData = [
    { name: "<18", count: data.ageBuckets[0] },
    { name: "18-25", count: data.ageBuckets[1] },
    { name: "26-35", count: data.ageBuckets[2] },
    { name: "36-50", count: data.ageBuckets[3] },
    { name: "51-65", count: data.ageBuckets[4] },
    { name: "65+", count: data.ageBuckets[5] },
  ];

  const sportData = Object.entries(data.sportMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([name, v]) => ({ name, count: v.count }));

  const sportScoreData = Object.entries(data.sportMap)
    .filter(([, v]) => v.count >= 3)
    .map(([name, v]) => ({ name, avg: Math.round(v.totalScore / v.count) }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 10);

  const dailyData = Object.entries(data.dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date: date.slice(5),
      total: v.total,
      completed: v.completed,
      rate: v.total ? Math.round((v.completed / v.total) * 100) : 0,
    }));

  const rankData = Object.entries(data.rankMap).map(([name, value]) => ({ name, value }));

  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}h`,
    count: data.hourlyMap[i] || 0,
  }));

  const funnelData = [
    { name: "Démarrés", value: data.funnel.started },
    { name: "Complétés", value: data.funnel.completed },
    { name: "Avec email", value: data.funnel.withEmail },
  ];

  const beverageData = Object.entries(data.beverageMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Funnel */}
      <Card>
        <CardHeader><CardTitle className="text-base">Entonnoir de conversion</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip />
              <Bar dataKey="value" fill={COLORS[0]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Score distribution */}
      <Card>
        <CardHeader><CardTitle className="text-base">Répartition des scores</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scoreBucketData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Daily evolution with completion rate */}
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle className="text-base">Évolution quotidienne & taux de complétion</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} unit="%" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="total" stroke={COLORS[0]} strokeWidth={2} dot={false} name="Total" />
              <Line yAxisId="left" type="monotone" dataKey="completed" stroke={COLORS[5]} strokeWidth={2} dot={false} name="Complétés" />
              <Line yAxisId="right" type="monotone" dataKey="rate" stroke={COLORS[1]} strokeWidth={2} dot={false} name="Taux %" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Hourly heatmap */}
      <Card>
        <CardHeader><CardTitle className="text-base">Activité par heure</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill={COLORS[2]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gender */}
      <Card>
        <CardHeader><CardTitle className="text-base">Répartition par sexe</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {genderData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Age */}
      <Card>
        <CardHeader><CardTitle className="text-base">Répartition par âge</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ageBucketData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Score by age */}
      <Card>
        <CardHeader><CardTitle className="text-base">Score moyen par tranche d'âge</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.scoreByAge}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="avg" fill={COLORS[3]} radius={[4, 4, 0, 0]} name="Score moyen" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sports */}
      <Card>
        <CardHeader><CardTitle className="text-base">Sports les plus pratiqués</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sportData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip />
              <Bar dataKey="count" fill={COLORS[2]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Score by sport */}
      {sportScoreData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Score moyen par sport (min. 3)</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sportScoreData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip />
                <Bar dataKey="avg" fill={COLORS[4]} radius={[0, 4, 4, 0]} name="Score moyen" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Hydra rank */}
      <Card>
        <CardHeader><CardTitle className="text-base">Répartition Hydra Rank</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={rankData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {rankData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Beverages */}
      {beverageData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Boissons les plus consommées</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={beverageData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={120} />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS[5]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
