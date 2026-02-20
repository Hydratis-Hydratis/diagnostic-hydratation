import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, X, Send, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function HelpChatWidget() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ email: "", phone: "", name: "", message: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.email.includes("@") || !form.email.includes(".")) {
      setError("Veuillez entrer un email valide");
      return;
    }
    if (!form.phone.trim()) {
      setError("Le téléphone est obligatoire");
      return;
    }
    if (!form.message.trim()) {
      setError("Le message est obligatoire");
      return;
    }

    setSending(true);
    const { error: dbError } = await supabase.from("support_requests").insert({
      email: form.email.trim(),
      phone: form.phone.trim(),
      name: form.name.trim() || null,
      message: form.message.trim(),
    });

    if (dbError) {
      setError("Erreur lors de l'envoi. Réessayez.");
    } else {
      setSent(true);
    }
    setSending(false);
  };

  const handleReset = () => {
    setSent(false);
    setForm({ email: "", phone: "", name: "", message: "" });
    setOpen(false);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300",
          "bg-primary text-primary-foreground hover:scale-110"
        )}
        aria-label="Aide"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[340px] max-w-[calc(100vw-2rem)] bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-primary text-primary-foreground px-4 py-3">
            <h3 className="font-semibold text-sm">Besoin d'aide ?</h3>
            <p className="text-xs opacity-80">Envoyez-nous un message</p>
          </div>

          {sent ? (
            <div className="p-6 text-center space-y-3">
              <CheckCircle className="w-12 h-12 text-primary mx-auto" />
              <p className="font-semibold text-sm">Message envoyé !</p>
              <p className="text-xs text-muted-foreground">Nous vous répondrons rapidement par email ou téléphone.</p>
              <Button size="sm" variant="outline" onClick={handleReset}>Fermer</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <Input
                placeholder="Email *"
                type="email"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
              <Input
                placeholder="Téléphone *"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                required
              />
              <Input
                placeholder="Nom (optionnel)"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              />
              <Textarea
                placeholder="Votre message *"
                value={form.message}
                onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                rows={3}
                required
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={sending}>
                {sending ? "Envoi..." : <><Send className="w-4 h-4 mr-2" />Envoyer</>}
              </Button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
