// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lrrghigbwxwxpvicbkos.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxycmdoaWdid3h3eHB2aWNia29zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MTE1NjEsImV4cCI6MjA4NjE4NzU2MX0.6v7pQtcfZsNEPRP622ZzHnKdGjaCX2ibgAIKUbvwC5g';

// SIMPLE - NO HEADERS
export const supabase = createClient(supabaseUrl, supabaseKey);