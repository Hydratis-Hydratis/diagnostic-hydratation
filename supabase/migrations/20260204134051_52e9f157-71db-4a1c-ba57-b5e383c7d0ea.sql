-- Fix RLS: remove any leftover RESTRICTIVE policies and recreate PERMISSIVE ones

-- 1) Drop any variants (some were created with trailing spaces)
DROP POLICY IF EXISTS "Allow anon insert diagnostics" ON public.diagnostics;
DROP POLICY IF EXISTS "Allow anon insert diagnostics " ON public.diagnostics;
DROP POLICY IF EXISTS "Allow anon update diagnostics" ON public.diagnostics;
DROP POLICY IF EXISTS "Allow anon update diagnostics " ON public.diagnostics;

DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.diagnostics;
DROP POLICY IF EXISTS "Allow anonymous updates on diagnostics" ON public.diagnostics;

-- 2) Recreate PERMISSIVE policies for anon
CREATE POLICY "Allow anon insert diagnostics"
  ON public.diagnostics
  AS PERMISSIVE
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update diagnostics"
  ON public.diagnostics
  AS PERMISSIVE
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
