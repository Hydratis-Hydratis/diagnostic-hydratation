import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { score } = await req.json()
    
    console.log(`Calculating percentile for score: ${score}`)
    
    if (typeof score !== 'number' || score < 0 || score > 100) {
      console.error('Invalid score received:', score)
      return new Response(
        JSON.stringify({ error: 'Score invalide' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Count total diagnostics with a score
    const { count: totalCount, error: totalError } = await supabase
      .from('diagnostics')
      .select('*', { count: 'exact', head: true })
      .not('score', 'is', null)

    if (totalError) {
      console.error('Error counting total diagnostics:', totalError)
      throw totalError
    }

    // Count diagnostics with lower score
    const { count: lowerCount, error: lowerError } = await supabase
      .from('diagnostics')
      .select('*', { count: 'exact', head: true })
      .not('score', 'is', null)
      .lt('score', score)

    if (lowerError) {
      console.error('Error counting lower scores:', lowerError)
      throw lowerError
    }

    // Calculate percentile
    const percentile = totalCount && totalCount > 0 
      ? Math.round((lowerCount! / totalCount) * 100)
      : 50 // Default if no data

    console.log(`Total users: ${totalCount}, Lower scores: ${lowerCount}, Percentile: ${percentile}%`)

    return new Response(
      JSON.stringify({ percentile, totalUsers: totalCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in get-score-percentile:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
