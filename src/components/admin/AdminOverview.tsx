import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CheckCircle, TrendingUp, Calendar, Mail } from "lucide-react";

interface Stats {
  total: number;
  completed: number;
  avgScore: number;
  today: number;
  thisWeek: number;
  withEmail: number;
}

export function AdminOverview() {
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, avgScore: 0, today: 0, thisWeek: 0, withEmail: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const { data, error } = await supabase.functions.invoke("admin-analytics", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error || !data?.overview) { setLoading(false); return; }
      setStats(data.overview);
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return <p className="text-muted-foreground">Chargement...</p>;

  const cards = [
    { title: "Total diagnostics", value: stats.total, icon: Activity, desc: `${stats.completed} complétés` },
    { title: "Taux de complétion", value: stats.total ? `${Math.round((stats.completed / stats.total) * 100)}%` : "0%", icon: CheckCircle, desc: `${stats.total - stats.completed} abandonnés` },
    { title: "Score moyen", value: `${stats.avgScore}/100`, icon: TrendingUp, desc: "sur les diagnostics complétés" },
    { title: "Cette semaine", value: stats.thisWeek, icon: Calendar, desc: `${stats.today} aujourd'hui` },
    { title: "Avec email", value: stats.withEmail, icon: Mail, desc: `${stats.completed ? Math.round((stats.withEmail / stats.completed) * 100) : 0}% des complétés` },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
