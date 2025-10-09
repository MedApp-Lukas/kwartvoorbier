// In: supabase/functions/delete-user/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verwacht nu een array: { userIds: ['id1', 'id2', ...] }
    const { userIds } = await req.json()
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new Error("Een array 'userIds' is verplicht in de request body.")
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    )

    // Maak een lijst van 'delete promises'
    const deletePromises = userIds.map(id => 
      supabaseAdmin.auth.admin.deleteUser(id)
    );

    // Voer alle delete-acties parallel uit
    const results = await Promise.allSettled(deletePromises);

    // Controleer of er fouten zijn opgetreden
    const errors = results
      .filter(result => result.status === 'rejected')
      .map((result: any) => result.reason?.message || 'Onbekende fout');

    if (errors.length > 0) {
      throw new Error(`Kon niet alle gebruikers verwijderen. Fouten: ${errors.join(', ')}`);
    }

    return new Response(JSON.stringify({ message: `${userIds.length} gebruiker(s) succesvol verwijderd.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Fout opgetreden in delete-user function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})