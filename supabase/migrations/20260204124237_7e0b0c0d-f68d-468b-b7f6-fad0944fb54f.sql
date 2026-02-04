-- Drop the restrictive update policy
DROP POLICY IF EXISTS "Deny all updates on diagnostics" ON public.diagnostics;

-- Create a new policy allowing anonymous updates (for completing diagnostics)
CREATE POLICY "Allow anonymous updates on diagnostics"
ON public.diagnostics
FOR UPDATE
USING (true)
WITH CHECK (true);