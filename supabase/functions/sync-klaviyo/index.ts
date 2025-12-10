import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const KLAVIYO_API_KEY = Deno.env.get('KLAVIYO_API_KEY');
    const KLAVIYO_LIST_ID = Deno.env.get('KLAVIYO_LIST_ID');

    if (!KLAVIYO_API_KEY || !KLAVIYO_LIST_ID) {
      console.error('Missing Klaviyo configuration');
      return new Response(
        JSON.stringify({ error: 'Missing Klaviyo configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: DiagnosticPayload = await req.json();
    console.log('Received diagnostic payload:', JSON.stringify(payload));

    // Skip if no email provided
    if (!payload.email) {
      console.log('No email provided, skipping Klaviyo sync');
      return new Response(
        JSON.stringify({ success: true, message: 'No email provided, skipping sync' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const klaviyoHeaders = {
      'Authorization': `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
      'revision': '2024-02-15',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Step 1: Create or update profile with custom properties
    const profileData = {
      data: {
        type: 'profile',
        attributes: {
          email: payload.email,
          first_name: payload.first_name || undefined,
          properties: {
            hydratis_score: payload.score,
            hydratis_rank: payload.hydra_rank,
            hydratis_age: payload.age,
            hydratis_sexe: payload.sexe,
            hydratis_sport: payload.sport,
            hydratis_besoin_ml: payload.besoin_total_ml,
            hydratis_hydratation_ml: payload.hydratation_reelle_ml,
            hydratis_completed_at: payload.completed_at,
          },
        },
      },
    };

    console.log('Creating/updating Klaviyo profile:', JSON.stringify(profileData));

    const profileResponse = await fetch('https://a.klaviyo.com/api/profiles', {
      method: 'POST',
      headers: klaviyoHeaders,
      body: JSON.stringify(profileData),
    });

    const profileResponseText = await profileResponse.text();
    console.log('Klaviyo profile response status:', profileResponse.status);
    console.log('Klaviyo profile response:', profileResponseText);

    let profileId: string | null = null;

    if (profileResponse.status === 201) {
      // Profile created successfully
      const profileResult = JSON.parse(profileResponseText);
      profileId = profileResult.data?.id;
      console.log('Profile created with ID:', profileId);
    } else if (profileResponse.status === 409) {
      // Profile already exists - extract the profile ID from the error response
      const errorResult = JSON.parse(profileResponseText);
      const existingProfileId = errorResult.errors?.[0]?.meta?.duplicate_profile_id;
      
      if (existingProfileId) {
        profileId = existingProfileId;
        console.log('Profile already exists with ID:', profileId);
        
        // Update the existing profile with new properties
        const updateResponse = await fetch(`https://a.klaviyo.com/api/profiles/${profileId}`, {
          method: 'PATCH',
          headers: klaviyoHeaders,
          body: JSON.stringify({
            data: {
              type: 'profile',
              id: profileId,
              attributes: {
                first_name: payload.first_name || undefined,
                properties: {
                  hydratis_score: payload.score,
                  hydratis_rank: payload.hydra_rank,
                  hydratis_age: payload.age,
                  hydratis_sexe: payload.sexe,
                  hydratis_sport: payload.sport,
                  hydratis_besoin_ml: payload.besoin_total_ml,
                  hydratis_hydratation_ml: payload.hydratation_reelle_ml,
                  hydratis_completed_at: payload.completed_at,
                },
              },
            },
          }),
        });
        
        console.log('Profile update response status:', updateResponse.status);
        const updateResponseText = await updateResponse.text();
        console.log('Profile update response:', updateResponseText);
      }
    } else {
      console.error('Failed to create profile:', profileResponseText);
      return new Response(
        JSON.stringify({ error: 'Failed to create profile', details: profileResponseText }),
        { status: profileResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Add profile to list
    if (profileId) {
      const listResponse = await fetch(`https://a.klaviyo.com/api/lists/${KLAVIYO_LIST_ID}/relationships/profiles`, {
        method: 'POST',
        headers: klaviyoHeaders,
        body: JSON.stringify({
          data: [{ type: 'profile', id: profileId }],
        }),
      });

      console.log('Add to list response status:', listResponse.status);
      const listResponseText = await listResponse.text();
      console.log('Add to list response:', listResponseText);

      if (listResponse.status !== 204 && listResponse.status !== 200) {
        console.warn('Failed to add profile to list:', listResponseText);
        // Don't fail the whole request, profile was still created/updated
      }
    }

    console.log('Klaviyo sync completed successfully');
    return new Response(
      JSON.stringify({ success: true, profileId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in sync-klaviyo function:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
