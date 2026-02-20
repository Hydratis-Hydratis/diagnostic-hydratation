
-- Supprimer les politiques restrictives actuelles
DROP POLICY IF EXISTS "Allow anon insert diagnostics" ON public.diagnostics;
DROP POLICY IF EXISTS "Allow anon update diagnostics" ON public.diagnostics;
DROP POLICY IF EXISTS "Allow anon insert diagnostics " ON public.diagnostics;
DROP POLICY IF EXISTS "Allow anon update diagnostics " ON public.diagnostics;

-- Recreer en mode PERMISSIVE (defaut)
CREATE POLICY "anon_insert_diagnostics"
  ON public.diagnostics
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon_update_diagnostics"
  ON public.diagnostics
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
