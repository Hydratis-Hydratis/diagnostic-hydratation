
-- Fix diagnostics: drop restrictive admin SELECT and deny authenticated, recreate as permissive
DROP POLICY IF EXISTS "admin_select_diagnostics" ON public.diagnostics;
DROP POLICY IF EXISTS "Deny authenticated select on diagnostics" ON public.diagnostics;

CREATE POLICY "admin_select_diagnostics"
  ON public.diagnostics
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix support_requests: drop restrictive admin SELECT, recreate as permissive
DROP POLICY IF EXISTS "admin_select_support" ON public.support_requests;

CREATE POLICY "admin_select_support"
  ON public.support_requests
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix user_roles: drop restrictive admin SELECT, recreate as permissive
DROP POLICY IF EXISTS "Admins can read user_roles" ON public.user_roles;

CREATE POLICY "Admins can read user_roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
