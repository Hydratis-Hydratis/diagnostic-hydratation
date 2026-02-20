import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CheckCircle, TrendingUp, Calendar } from "lucide-react";

interface Stats {
  total: number;
  completed: number;
  avgScore: number;
  today: number;
  thisWeek: number;
}

export function AdminOverview() {
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, avgScore: 0, today: 0, thisWeek: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase.from("diagnostics").select("status, score, created_at");
      if (error || !data) { setLoading(false); return; }

      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const weekAgo = new Date(now.getTime() - 7 * 86400000);

      const completed = data.filter(d => d.status === "completed");
      const scores = completed.filter(d => d.score != null).map(d => d.score as number);
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const today = data.filter(d => d.created_at?.startsWith(todayStr)).length;
      const week = data.filter(d => new Date(d.created_at) >= weekAgo).length;

      setStats({ total: data.length, completed: completed.length, avgScore: avg, today, thisWeek: week });
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <p className="text-muted-foreground">Chargement...</p>;

  const cards = [
    { title: "Total diagnostics", value: stats.total, icon: Activity, desc: `${stats.completed} complétés` },
    { title: "Taux de complétion", value: stats.total ? `${Math.round((stats.completed / stats.total) * 100)}%` : "0%", icon: CheckCircle, desc: `${stats.total - stats.completed} abandonnés` },
    { title: "Score moyen", value: `${stats.avgScore}/100`, icon: TrendingUp, desc: "sur les diagnostics complétés" },
    { title: "Cette semaine", value: stats.thisWeek, icon: Calendar, desc: `${stats.today} aujourd'hui` },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
            <c.icon className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{c.value}</div>
            <p className="text-xs text-muted-foreground">{c.desc}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
