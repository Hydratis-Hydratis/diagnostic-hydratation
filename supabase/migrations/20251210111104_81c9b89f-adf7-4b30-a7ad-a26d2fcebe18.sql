-- Block all SELECT operations on diagnostics table for anon users
CREATE POLICY "Deny anon select on diagnostics"
ON public.diagnostics
FOR SELECT
TO anon
USING (false);

-- Block all SELECT operations on diagnostics table for authenticated users
CREATE POLICY "Deny authenticated select on diagnostics"
ON public.diagnostics
FOR SELECT
TO authenticated
USING (false);

-- Block all UPDATE operations
CREATE POLICY "Deny all updates on diagnostics"
ON public.diagnostics
FOR UPDATE
USING (false);

-- Block all DELETE operations
CREATE POLICY "Deny all deletes on diagnostics"
ON public.diagnostics
FOR DELETE
USING (false);