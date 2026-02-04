-- The existing INSERT and UPDATE policies are RESTRICTIVE (Permissive: No)
-- Supabase's upsert requires both an INSERT and UPDATE permission via PERMISSIVE policies
-- Drop the existing restrictive policies and replace with permissive ones

-- First drop the existing restrictive policies
DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.diagnostics;
DROP POLICY IF EXISTS "Allow anonymous updates on diagnostics" ON public.diagnostics;

-- Create permissive INSERT policy for anonymous users
CREATE POLICY "Allow anon insert diagnostics"
  ON public.diagnostics
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create permissive UPDATE policy for anonymous users  
CREATE POLICY "Allow anon update diagnostics"
  ON public.diagnostics
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);