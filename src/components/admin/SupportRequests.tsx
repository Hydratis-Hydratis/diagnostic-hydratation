import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Request = {
  id: string;
  email: string;
  phone: string | null;
  name: string | null;
  message: string;
  admin_reply: string | null;
  status: string;
  created_at: string;
  replied_at: string | null;
};

export function SupportRequests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [selected, setSelected] = useState<Request | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("support_requests")
      .select("*")
      .order("created_at", { ascending: false });
    setRequests((data as Request[]) || []);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleReply = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    const { error } = await supabase
      .from("support_requests")
      .update({ admin_reply: reply, status: "replied", replied_at: new Date().toISOString() })
      .eq("id", selected.id);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Réponse envoyée" });
      setSelected(null);
      setReply("");
      fetchRequests();
    }
    setSending(false);
  };

  const statusBadge = (s: string) => {
    if (s === "replied") return <Badge>Répondu</Badge>;
    if (s === "closed") return <Badge variant="secondary">Fermé</Badge>;
    return <Badge variant="destructive">En attente</Badge>;
  };

  return (
    <div className="space-y-4">
      {requests.length === 0 && <p className="text-muted-foreground text-center py-8">Aucune demande d'aide</p>}
      {requests.map((r) => (
        <Card key={r.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelected(r); setReply(r.admin_reply || ""); }}>
          <CardHeader className="pb-2 flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-sm">{r.name || r.email}</CardTitle>
              <p className="text-xs text-muted-foreground">{r.email} · {r.phone || "—"}</p>
            </div>
            <div className="flex items-center gap-2">
              {statusBadge(r.status)}
              <span className="text-xs text-muted-foreground">{format(new Date(r.created_at), "dd/MM/yy HH:mm", { locale: fr })}</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm line-clamp-2">{r.message}</p>
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Demande de {selected?.name || selected?.email}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Email :</span> {selected.email}</p>
                <p><span className="text-muted-foreground">Téléphone :</span> {selected.phone || "—"}</p>
                <p><span className="text-muted-foreground">Date :</span> {format(new Date(selected.created_at), "dd MMMM yyyy à HH:mm", { locale: fr })}</p>
              </div>
              <div className="bg-muted p-3 rounded-lg text-sm">{selected.message}</div>
              <Textarea
                placeholder="Votre réponse..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={4}
              />
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleReply} disabled={sending || !reply.trim()}>
              {sending ? "Envoi..." : "Répondre"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
