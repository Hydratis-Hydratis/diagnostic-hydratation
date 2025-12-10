import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CertificateData {
  firstName: string;
  score: number;
  hydraRank: string;
  besoinTotalMl: number;
  hydratationReelleMl: number;
  diagnosticId: string;
}

function getHydraEmoji(rank: string): string {
  switch (rank) {
    case "Hydra'champion": return "🏆";
    case "Hydra'avancé": return "⭐";
    case "Hydra'initié": return "💧";
    default: return "🌱";
  }
}

function getScoreColor(score: number): string {
  if (score >= 90) return "#22c55e";
  if (score >= 70) return "#3b82f6";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateSVG(data: {
  displayName: string;
  score: number;
  hydraRank: string;
  emoji: string;
  scoreColor: string;
  besoinL: string;
  hydratationL: string;
  today: string;
}): string {
  const { displayName, score, hydraRank, emoji, scoreColor, besoinL, hydratationL, today } = data;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0ea5e9"/>
      <stop offset="50%" style="stop-color:#0284c7"/>
      <stop offset="100%" style="stop-color:#0369a1"/>
    </linearGradient>
    <linearGradient id="topBar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#38bdf8"/>
      <stop offset="50%" style="stop-color:#7dd3fc"/>
      <stop offset="100%" style="stop-color:#38bdf8"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="20" flood-opacity="0.2"/>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGradient)"/>
  
  <!-- Top decoration bar -->
  <rect x="0" y="0" width="1200" height="8" fill="url(#topBar)"/>
  
  <!-- Bottom decoration bar -->
  <rect x="0" y="622" width="1200" height="8" fill="url(#topBar)"/>
  
  <!-- Logo text -->
  <text x="600" y="70" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="white" letter-spacing="4">HYDRATIS</text>
  
  <!-- Title -->
  <text x="600" y="115" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="600" fill="white" opacity="0.9">🏅 CERTIFICAT D'HYDRATATION 🏅</text>
  
  <!-- Congratulations -->
  <text x="600" y="165" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="white" opacity="0.9">Félicitations,</text>
  
  <!-- Name -->
  <text x="600" y="210" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white">${escapeXml(displayName)} !</text>
  
  <!-- Score container -->
  <rect x="400" y="240" width="400" height="120" rx="20" fill="white" filter="url(#shadow)"/>
  <text x="540" y="325" text-anchor="middle" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="${scoreColor}">${score}</text>
  <text x="660" y="315" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="600" fill="#64748b">/100</text>
  
  <!-- Badge -->
  <rect x="400" y="380" width="400" height="50" rx="25" fill="rgba(255,255,255,0.2)"/>
  <text x="600" y="415" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="600" fill="white">${emoji} ${escapeXml(hydraRank)} ${emoji}</text>
  
  <!-- Metrics -->
  <text x="400" y="480" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="white" opacity="0.8">Besoin quotidien</text>
  <text x="400" y="510" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white">${besoinL}L</text>
  
  <rect x="598" y="460" width="4" height="60" fill="rgba(255,255,255,0.3)"/>
  
  <text x="800" y="480" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="white" opacity="0.8">Hydratation actuelle</text>
  <text x="800" y="510" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white">${hydratationL}L</text>
  
  <!-- Date -->
  <text x="600" y="560" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="white" opacity="0.7">Diagnostic du ${today}</text>
  
  <!-- Website -->
  <text x="600" y="595" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="600" fill="white" opacity="0.9">hydratis.fr</text>
</svg>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: CertificateData = await req.json();
    const { firstName, score, hydraRank, besoinTotalMl, hydratationReelleMl, diagnosticId } = data;

    console.log("Generating certificate for:", firstName, "Score:", score, "DiagnosticId:", diagnosticId);

    const today = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const emoji = getHydraEmoji(hydraRank);
    const scoreColor = getScoreColor(score);
    const besoinL = (besoinTotalMl / 1000).toFixed(1);
    const hydratationL = (hydratationReelleMl / 1000).toFixed(1);
    const displayName = firstName || "Utilisateur";

    // Generate SVG
    const svg = generateSVG({
      displayName,
      score,
      hydraRank,
      emoji,
      scoreColor,
      besoinL,
      hydratationL,
      today
    });

    // Convert SVG to base64 for storage
    const svgBase64 = btoa(unescape(encodeURIComponent(svg)));
    const svgDataUrl = `data:image/svg+xml;base64,${svgBase64}`;

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate unique filename (SVG format now)
    const fileName = `cert_${diagnosticId}.svg`;

    console.log("Uploading certificate to storage:", fileName);

    // Upload SVG to Supabase Storage
    const svgBuffer = new TextEncoder().encode(svg);
    const { error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(fileName, svgBuffer, {
        contentType: 'image/svg+xml',
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('certificates')
      .getPublicUrl(fileName);

    const certificateUrl = urlData.publicUrl;
    console.log("Certificate uploaded successfully:", certificateUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        certificateUrl,
        fileName 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error generating certificate:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
