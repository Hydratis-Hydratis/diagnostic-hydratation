ALTER TABLE public.diagnostics
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS sexe text,
ADD COLUMN IF NOT EXISTS sport text,
ADD COLUMN IF NOT EXISTS besoin_total_ml integer,
ADD COLUMN IF NOT EXISTS hydratation_reelle_ml integer,
ADD COLUMN IF NOT EXISTS ecart_hydratation_ml integer,
ADD COLUMN IF NOT EXISTS nb_pastilles_basal integer,
ADD COLUMN IF NOT EXISTS nb_pastilles_exercice integer,
ADD COLUMN IF NOT EXISTS nb_pastilles_total integer;