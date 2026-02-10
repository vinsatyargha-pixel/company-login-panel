// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lrrghigbwxwxpvicbkos.supabase.co';
const supabaseKey = 'sb_Secret_O8S_GyFTmWB-zrJaRJrbg_q7m9-p3g';

// SIMPLE - NO HEADERS
export const supabase = createClient(supabaseUrl, supabaseKey);