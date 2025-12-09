import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiagnosticPayload {
  email: string | null;
  first_name: string | null;
  score: number;
  hydra_rank: string;
  age: number | null;
  sexe: string | null;
  sport: string;
  besoin_total_ml: number;
  hydratation_reelle_ml: number;
  completed_at: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookUrl = Deno.env.get('N8N_WEBHOOK_URL');
    
    if (!webhookUrl) {
      console.error('N8N_WEBHOOK_URL not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook URL not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: DiagnosticPayload = await req.json();
    
    console.log('Sending diagnostic to n8n:', {
      email: payload.email,
      first_name: payload.first_name,
      score: payload.score,
      hydra_rank: payload.hydra_rank
    });

    // Forward to n8n webhook
    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: payload.email,
        first_name: payload.first_name,
        score: payload.score,
        hydra_rank: payload.hydra_rank,
        age: payload.age,
        sexe: payload.sexe,
        sport: payload.sport,
        besoin_total_ml: payload.besoin_total_ml,
        hydratation_reelle_ml: payload.hydratation_reelle_ml,
        completed_at: payload.completed_at,
        source: 'hydratis-diagnostic'
      }),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error('n8n webhook error:', n8nResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to notify n8n', details: errorText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully notified n8n');
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in notify-n8n function:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
