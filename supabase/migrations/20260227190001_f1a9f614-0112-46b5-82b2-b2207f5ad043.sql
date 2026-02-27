
-- Create page_views table for tracking all visitors
CREATE TABLE public.page_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  page_path text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referrer text,
  user_agent text
);

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Anonymous users can insert page views
CREATE POLICY "anon_insert_page_views"
ON public.page_views
FOR INSERT
WITH CHECK (true);

-- Only admins can read page views
CREATE POLICY "admin_select_page_views"
ON public.page_views
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- No updates or deletes
CREATE POLICY "deny_update_page_views"
ON public.page_views
FOR UPDATE
USING (false);

CREATE POLICY "deny_delete_page_views"
ON public.page_views
FOR DELETE
USING (false);

-- Index for date-based queries
CREATE INDEX idx_page_views_created_at ON public.page_views (created_at DESC);
