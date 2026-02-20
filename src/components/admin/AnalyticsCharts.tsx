import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";

const COLORS = [
  "hsl(244, 93%, 32%)",
  "hsl(30, 80%, 55%)",
  "hsl(197, 37%, 24%)",
  "hsl(43, 74%, 66%)",
  "hsl(27, 87%, 67%)",
  "hsl(160, 50%, 40%)",
];

type D = {
  score: number | null;
  sexe: string | null;
  age: number | null;
  sport: string | null;
  hydra_rank: string | null;
  created_at: string;
  status: string | null;
};

export function AnalyticsCharts() {
  const [data, setData] = useState<D[]>([]);

  useEffect(() => {
    supabase
      .from("diagnostics")
      .select("score, sexe, age, sport, hydra_rank, created_at, status")
      .then(({ data: rows }) => setData(rows || []));
  }, []);

  const completed = data.filter(d => d.status === "completed");

  // Score distribution
  const scoreBuckets = [
    { name: "0-25", count: 0 }, { name: "26-50", count: 0 },
    { name: "51-75", count: 0 }, { name: "76-100", count: 0 },
  ];
  completed.forEach(d => {
    if (d.score == null) return;
    if (d.score <= 25) scoreBuckets[0].count++;
    else if (d.score <= 50) scoreBuckets[1].count++;
    else if (d.score <= 75) scoreBuckets[2].count++;
    else scoreBuckets[3].count++;
  });

  // Gender
  const genderMap: Record<string, number> = {};
  completed.forEach(d => { const s = d.sexe || "Non renseigné"; genderMap[s] = (genderMap[s] || 0) + 1; });
  const genderData = Object.entries(genderMap).map(([name, value]) => ({ name, value }));

  // Age
  const ageBuckets = [
    { name: "<18", count: 0 }, { name: "18-25", count: 0 }, { name: "26-35", count: 0 },
    { name: "36-50", count: 0 }, { name: "51-65", count: 0 }, { name: "65+", count: 0 },
  ];
  completed.forEach(d => {
    if (d.age == null) return;
    if (d.age < 18) ageBuckets[0].count++;
    else if (d.age <= 25) ageBuckets[1].count++;
    else if (d.age <= 35) ageBuckets[2].count++;
    else if (d.age <= 50) ageBuckets[3].count++;
    else if (d.age <= 65) ageBuckets[4].count++;
    else ageBuckets[5].count++;
  });

  // Sports
  const sportMap: Record<string, number> = {};
  completed.forEach(d => { if (d.sport) sportMap[d.sport] = (sportMap[d.sport] || 0) + 1; });
  const sportData = Object.entries(sportMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  // Daily evolution
  const dailyMap: Record<string, number> = {};
  data.forEach(d => { const day = d.created_at.split("T")[0]; dailyMap[day] = (dailyMap[day] || 0) + 1; });
  const dailyData = Object.entries(dailyMap).sort().map(([date, count]) => ({ date, count }));

  // Hydra rank
  const rankMap: Record<string, number> = {};
  completed.forEach(d => { if (d.hydra_rank) rankMap[d.hydra_rank] = (rankMap[d.hydra_rank] || 0) + 1; });
  const rankData = Object.entries(rankMap).map(([name, value]) => ({ name, value }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Répartition des scores</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scoreBuckets}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

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

      <Card>
        <CardHeader><CardTitle className="text-base">Répartition par âge</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ageBuckets}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

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

      <Card>
        <CardHeader><CardTitle className="text-base">Évolution quotidienne</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke={COLORS[0]} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

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
    </div>
  );
}
