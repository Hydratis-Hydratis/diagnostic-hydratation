import { supabase } from "@/integrations/supabase/client";

export function trackPageView() {
  // Deduplicate within session
  const key = "pv_tracked";
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, "1");

  const params = new URLSearchParams(window.location.search);

  const row = {
    page_path: window.location.pathname,
    utm_source: params.get("utm_source") || null,
    utm_medium: params.get("utm_medium") || null,
    utm_campaign: params.get("utm_campaign") || null,
    referrer: document.referrer || null,
    user_agent: navigator.userAgent || null,
  };

  // Fire-and-forget insert
  supabase.from("page_views").insert(row).then(({ error }) => {
    if (error) console.warn("trackPageView error:", error.message);
  });
}
