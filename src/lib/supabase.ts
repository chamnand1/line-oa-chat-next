import { createClient } from '@supabase/supabase-js';
import { config } from './config';

const supabaseUrl = config.supabase.url;
const supabaseKey = config.supabase.secretKey || config.supabase.publishableKey;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase URL or Keys");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
