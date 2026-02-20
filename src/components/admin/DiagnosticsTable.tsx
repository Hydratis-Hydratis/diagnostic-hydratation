import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Diagnostic = {
  id: string;
  created_at: string;
  first_name: string | null;
  email: string | null;
  score: number | null;
  hydra_rank: string | null;
  status: string | null;
  sport: string | null;
  age: number | null;
  sexe: string | null;
  besoin_total_ml: number | null;
  hydratation_reelle_ml: number | null;
  ecart_hydratation_ml: number | null;
  nb_pastilles_total: number | null;
};

export function DiagnosticsTable() {
  const [data, setData] = useState<Diagnostic[]>([]);
  const [filter, setFilter] = useState<"all" | "completed" | "started">("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Diagnostic | null>(null);
  const [exporting, setExporting] = useState(false);
  const perPage = 20;

  useEffect(() => {
    const fetch = async () => {
      let q = supabase
        .from("diagnostics")
        .select("id, created_at, first_name, email, score, hydra_rank, status, sport, age, sexe, besoin_total_ml, hydratation_reelle_ml, ecart_hydratation_ml, nb_pastilles_total")
        .order("created_at", { ascending: false });

      if (filter !== "all") q = q.eq("status", filter);

      const { data: rows } = await q.range(page * perPage, (page + 1) * perPage - 1);
      setData(rows || []);
    };
    fetch();
  }, [filter, page]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: result } = await supabase.functions.invoke("admin-analytics?action=export", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!result?.diagnostics) return;

      const headers = ["Date", "Prénom", "Email", "Âge", "Sexe", "Sport", "Score", "Rang", "Besoin (ml)", "Hydratation (ml)", "Écart (ml)", "Pastilles", "Status"];
      const rows = result.diagnostics.map((d: any) => [
        d.created_at ? format(new Date(d.created_at), "dd/MM/yyyy HH:mm") : "",
        d.first_name || "", d.email || "", d.age ?? "", d.sexe || "", d.sport || "",
        d.score ?? "", d.hydra_rank || "", d.besoin_total_ml ?? "", d.hydratation_reelle_ml ?? "",
        d.ecart_hydratation_ml ?? "", d.nb_pastilles_total ?? "", d.status || "",
      ]);

      const csv = [headers, ...rows].map(r => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `diagnostics_${format(new Date(), "yyyy-MM-dd")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap items-center">
        {(["all", "completed", "started"] as const).map((f) => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => { setFilter(f); setPage(0); }}>
            {f === "all" ? "Tous" : f === "completed" ? "Complétés" : "Démarrés"}
          </Button>
        ))}
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
          <Download className="w-4 h-4 mr-2" />
          {exporting ? "Export..." : "Exporter CSV"}
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Prénom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Rang</TableHead>
              <TableHead>Sport</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="whitespace-nowrap">{format(new Date(d.created_at), "dd/MM/yy HH:mm", { locale: fr })}</TableCell>
                <TableCell>{d.first_name || "—"}</TableCell>
                <TableCell className="max-w-[200px] truncate">{d.email || "—"}</TableCell>
                <TableCell>{d.score ?? "—"}</TableCell>
                <TableCell>{d.hydra_rank || "—"}</TableCell>
                <TableCell>{d.sport || "—"}</TableCell>
                <TableCell>
                  <Badge variant={d.status === "completed" ? "default" : "secondary"}>
                    {d.status === "completed" ? "Complété" : "Démarré"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => setSelected(d)}>Détail</Button>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Aucun diagnostic trouvé</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Précédent</Button>
        <span className="text-sm text-muted-foreground">Page {page + 1}</span>
        <Button variant="outline" size="sm" disabled={data.length < perPage} onClick={() => setPage(p => p + 1)}>Suivant</Button>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Détail du diagnostic</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-2 text-sm">
              {[
                ["Prénom", selected.first_name],
                ["Email", selected.email],
                ["Âge", selected.age],
                ["Sexe", selected.sexe],
                ["Sport", selected.sport],
                ["Score", selected.score != null ? `${selected.score}/100` : null],
                ["Rang", selected.hydra_rank],
                ["Besoin total (ml)", selected.besoin_total_ml],
                ["Hydratation réelle (ml)", selected.hydratation_reelle_ml],
                ["Écart (ml)", selected.ecart_hydratation_ml],
                ["Pastilles totales", selected.nb_pastilles_total],
                ["Status", selected.status],
                ["Date", format(new Date(selected.created_at), "dd MMMM yyyy à HH:mm", { locale: fr })],
              ].map(([label, val]) => (
                <div key={label as string} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{val ?? "—"}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
