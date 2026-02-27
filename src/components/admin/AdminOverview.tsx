import { useEffect, useState, useCallback } from "react";
import { format, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Activity, CheckCircle, TrendingUp, Calendar as CalendarLucide, Mail, Droplets, Pill, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#d0ed57"];

type Preset = "7d" | "30d" | "90d" | "all" | "custom";

interface AnalyticsData {
  overview: { total: number; completed: number; avgScore: number; today: number; thisWeek: number; withEmail: number; avgHydrationGap: number; avgPastilles: number };
  dailyMap: Record<string, { total: number; completed: number }>;
  funnel: { started: number; completed: number; withEmail: number };
  scoreDistribution: Record<string, number>;
  rankMap: Record<string, number>;
  genderMap: Record<string, number>;
  sourceMap: Record<string, number>;
  deviceMap: Record<string, number>;
  pastillesDistribution: Record<string, number>;
  pastillesByRank: Record<string, number>;
  recentDiagnostics: { created_at: string; first_name: string; score: number; hydra_rank: string; sport: string; nb_pastilles_total: number | string }[];
  pageViews?: { totalViews: number; viewsByDay: Record<string, number>; viewSourceMap: Record<string, number>; viewDeviceMap: Record<string, number>; conversionRate: number };
}

export function AdminOverview() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<Preset>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const fetchStats = useCallback(async (from?: string, to?: string) => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    const params: Record<string, string> = {};
    if (from) params.date_from = from;
    if (to) params.date_to = to;

    const queryString = new URLSearchParams(params).toString();
    const { data: result, error } = await supabase.functions.invoke(
      `admin-analytics${queryString ? `?${queryString}` : ""}`,
      { headers: { Authorization: `Bearer ${session.access_token}` } }
    );

    if (error || !result?.overview) { setLoading(false); return; }
    setData(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const applyPreset = (p: Preset) => {
    setPreset(p);
    if (p === "all") {
      setDateFrom(undefined);
      setDateTo(undefined);
      fetchStats();
    } else if (p === "7d") {
      const from = subDays(new Date(), 7);
      setDateFrom(from);
      setDateTo(new Date());
      fetchStats(format(from, "yyyy-MM-dd"), format(new Date(), "yyyy-MM-dd"));
    } else if (p === "30d") {
      const from = subDays(new Date(), 30);
      setDateFrom(from);
      setDateTo(new Date());
      fetchStats(format(from, "yyyy-MM-dd"), format(new Date(), "yyyy-MM-dd"));
    } else if (p === "90d") {
      const from = subDays(new Date(), 90);
      setDateFrom(from);
      setDateTo(new Date());
      fetchStats(format(from, "yyyy-MM-dd"), format(new Date(), "yyyy-MM-dd"));
    }
  };

  const applyCustomDate = (from?: Date, to?: Date) => {
    setPreset("custom");
    setDateFrom(from);
    setDateTo(to);
    fetchStats(
      from ? format(from, "yyyy-MM-dd") : undefined,
      to ? format(to, "yyyy-MM-dd") : undefined
    );
  };

  if (loading) return <p className="text-muted-foreground">Chargement...</p>;
  if (!data) return <p className="text-muted-foreground">Erreur de chargement.</p>;

  const { overview: stats } = data;

  // Prepare daily chart data (last 30 days)
  const dailyChartData = (() => {
    const days: { date: string; total: number; completed: number; taux: number; vues: number }[] = [];
    const now = new Date();
    const numDays = preset === "7d" ? 7 : preset === "90d" ? 90 : 30;
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = d.toISOString().split("T")[0];
      const entry = data.dailyMap[key] || { total: 0, completed: 0 };
      const vues = data.pageViews?.viewsByDay?.[key] || 0;
      days.push({ date: key.slice(5), total: entry.total, completed: entry.completed, taux: entry.total ? Math.round((entry.completed / entry.total) * 100) : 0, vues });
    }
    return days;
  })();

  const funnelData = [
    { name: "Démarrés", value: data.funnel.started },
    { name: "Complétés", value: data.funnel.completed },
    { name: "Avec email", value: data.funnel.withEmail },
  ];

  const scoreDistData = Object.entries(data.scoreDistribution)
    .map(([name, value]) => ({ name, value }))
    .filter(d => d.value > 0 || ["0-9", "10-19", "20-29", "30-39", "40-49", "50-59", "60-69", "70-79", "80-89", "90-99", "100"].includes(d.name));

  const rankData = Object.entries(data.rankMap).map(([name, value]) => ({ name, value }));
  const genderData = Object.entries(data.genderMap).map(([name, value]) => ({ name, value }));
  const sourceData = Object.entries(data.sourceMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  const deviceData = Object.entries(data.deviceMap).map(([name, value]) => ({ name, value }));
  const viewSourceData = data.pageViews ? Object.entries(data.pageViews.viewSourceMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10) : [];
  const pastillesDistData = Object.entries(data.pastillesDistribution).map(([name, value]) => ({ name: `${name} pastilles`, value, raw: Number(name) })).sort((a, b) => a.raw - b.raw);
  const pastillesByRankData = Object.entries(data.pastillesByRank).map(([name, value]) => ({ name: name.replace("Hydra'", ""), value }));

  const pv = data.pageViews;
  const kpiCards = [
    { title: "Vues totales", value: pv?.totalViews ?? "—", icon: Eye, desc: `Taux conv. ${pv?.conversionRate ?? 0}%` },
    { title: "Total diagnostics", value: stats.total, icon: Activity, desc: `${stats.completed} complétés` },
    { title: "Taux de complétion", value: stats.total ? `${Math.round((stats.completed / stats.total) * 100)}%` : "0%", icon: CheckCircle, desc: `${stats.total - stats.completed} abandonnés` },
    { title: "Score moyen", value: `${stats.avgScore}/100`, icon: TrendingUp, desc: `Écart moy. ${stats.avgHydrationGap} ml` },
    { title: "Cette semaine", value: stats.thisWeek, icon: CalendarLucide, desc: `${stats.today} aujourd'hui` },
    { title: "Avec email", value: stats.withEmail, icon: Mail, desc: `${stats.completed ? Math.round((stats.withEmail / stats.completed) * 100) : 0}% des complétés` },
    { title: "Écart hydratation", value: `${stats.avgHydrationGap} ml`, icon: Droplets, desc: "écart moyen besoin vs réel" },
    { title: "Pastilles moy.", value: stats.avgPastilles, icon: Pill, desc: "pastilles recommandées" },
  ];

  const presets: { label: string; value: Preset }[] = [
    { label: "7 jours", value: "7d" },
    { label: "30 jours", value: "30d" },
    { label: "90 jours", value: "90d" },
    { label: "Tout", value: "all" },
  ];

  return (
    <div className="space-y-6">
      {/* Date Filters */}
      <Card>
        <CardContent className="p-3 flex flex-wrap items-center gap-2">
          {presets.map((p) => (
            <Button
              key={p.value}
              variant={preset === p.value ? "default" : "outline"}
              size="sm"
              onClick={() => applyPreset(p.value)}
            >
              {p.label}
            </Button>
          ))}

          <div className="h-6 w-px bg-border mx-1" />

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("text-xs", preset === "custom" && dateFrom && "border-primary")}>
                <CalendarIcon className="w-3.5 h-3.5 mr-1" />
                {dateFrom ? format(dateFrom, "dd/MM/yy") : "Début"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={(d) => applyCustomDate(d, dateTo)}
                locale={fr}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <span className="text-xs text-muted-foreground">→</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("text-xs", preset === "custom" && dateTo && "border-primary")}>
                <CalendarIcon className="w-3.5 h-3.5 mr-1" />
                {dateTo ? format(dateTo, "dd/MM/yy") : "Fin"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={(d) => applyCustomDate(dateFrom, d)}
                locale={fr}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {kpiCards.map((c) => (
          <Card key={c.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-1 p-3">
              <CardTitle className="text-xs font-medium text-muted-foreground">{c.title}</CardTitle>
              <c.icon className="w-3.5 h-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-bold">{c.value}</div>
              <p className="text-[10px] text-muted-foreground">{c.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 2: Daily evolution + Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Évolution quotidienne</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line yAxisId="left" type="monotone" dataKey="vues" stroke="#FF8042" name="Vues" strokeWidth={2} dot={false} />
                <Line yAxisId="left" type="monotone" dataKey="total" stroke="#8884d8" name="Diagnostics" strokeWidth={2} dot={false} />
                <Line yAxisId="left" type="monotone" dataKey="completed" stroke="#82ca9d" name="Complétés" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="taux" stroke="#ffc658" name="Taux %" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Entonnoir de conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8">
                  {funnelData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Score distribution + Hydra Rank + Gender */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Répartition des scores</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={scoreDistData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" name="Diagnostics" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Hydra Rank</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={rankData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {rankData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

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
      </div>

      {/* Row 4: Pastilles analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Répartition des pastilles recommandées</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pastillesDistData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" name="Utilisateurs" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Pastilles moyennes par Hydra Rank</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pastillesByRankData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#00C49F" name="Moy. pastilles" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 5: Page View Sources + Diagnostic Sources + Devices */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {viewSourceData.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Sources de trafic (toutes vues)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={viewSourceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#FF8042" name="Vues" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Sources (diagnostics)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sourceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="value" fill="#00C49F" name="Diagnostics" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Répartition par device</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={deviceData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {deviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 6: Recent diagnostics */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Derniers diagnostics complétés</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Prénom</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Rang</TableHead>
                <TableHead>Sport</TableHead>
                <TableHead>Pastilles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentDiagnostics.map((d, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs">{new Date(d.created_at).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell>{d.first_name}</TableCell>
                  <TableCell className="font-semibold">{d.score}/100</TableCell>
                  <TableCell>{d.hydra_rank}</TableCell>
                  <TableCell>{d.sport}</TableCell>
                  <TableCell>{d.nb_pastilles_total}</TableCell>
                </TableRow>
              ))}
              {data.recentDiagnostics.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Aucun diagnostic complété</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
