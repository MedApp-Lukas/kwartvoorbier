import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wssgiviravcwxwxbwuex.supabase.co';
const supabaseAnonKey = 'sb_publishable_zfl-KkA8CeCB-w5ysK3faA_Yqkrkcqv';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL en Anon Key zijn vereist.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
