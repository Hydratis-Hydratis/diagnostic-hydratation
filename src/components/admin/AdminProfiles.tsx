import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#d0ed57"];

interface AdminProfilesProps {
  data: {
    genderMap: Record<string, number>;
    ageBuckets: number[];
    sportMap: Record<string, { count: number; totalScore: number }>;
    beverageMap: Record<string, number>;
    hourlyMap: Record<number, number>;
  };
}

export function AdminProfiles({ data }: AdminProfilesProps) {
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

  const beverageData = Object.entries(data.beverageMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}h`,
    count: data.hourlyMap[i] || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Gender + Age */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Répartition par sexe</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={genderData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {genderData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Répartition par âge</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ageBucketData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Sports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Sports les plus pratiqués</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(220, sportData.length * 28)}>
              <BarChart data={sportData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS[4]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {sportScoreData.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Score moyen par sport (min. 3)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(220, sportScoreData.length * 28)}>
                <BarChart data={sportScoreData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="avg" fill={COLORS[3]} radius={[0, 4, 4, 0]} name="Score moyen" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Beverages + Hourly */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {beverageData.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Boissons les plus consommées</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(220, beverageData.length * 28)}>
                <BarChart data={beverageData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={COLORS[5]} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Activité par heure</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS[2]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
