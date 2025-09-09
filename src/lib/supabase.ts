import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL en Anon Key zijn vereist. Zorg ervoor dat je .env bestand VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY bevat.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
