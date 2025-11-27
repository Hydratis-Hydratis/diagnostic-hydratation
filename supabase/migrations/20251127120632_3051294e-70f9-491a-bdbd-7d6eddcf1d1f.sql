-- Table pour stocker les diagnostics (analytics + marketing/CRM)
CREATE TABLE public.diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Données de contact (Marketing/CRM)
  email TEXT,
  first_name TEXT,
  
  -- Données du diagnostic (Analytics)
  diagnostic_data JSONB NOT NULL,
  results JSONB,
  
  -- Métadonnées pour analytics
  score INTEGER,
  hydration_status TEXT,
  
  -- Tracking
  user_agent TEXT,
  completed_at TIMESTAMPTZ
);

-- Index pour améliorer les performances des requêtes analytics
CREATE INDEX idx_diagnostics_created_at ON public.diagnostics(created_at);
CREATE INDEX idx_diagnostics_hydration_status ON public.diagnostics(hydration_status);
CREATE INDEX idx_diagnostics_email ON public.diagnostics(email) WHERE email IS NOT NULL;

-- Activer RLS
ALTER TABLE public.diagnostics ENABLE ROW LEVEL SECURITY;

-- Politique : Autoriser les insertions anonymes uniquement
CREATE POLICY "Allow anonymous inserts"
ON public.diagnostics
FOR INSERT
TO anon
WITH CHECK (true);

-- Pas de lecture depuis le frontend (accès via dashboard Lovable Cloud uniquement)