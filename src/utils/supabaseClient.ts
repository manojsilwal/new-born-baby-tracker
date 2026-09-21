// src/utils/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://bvhdrwyxzjcoyqzmtean.supabase.co';

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2aGRyd3l4empjb3lxem10ZWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjU0MDQsImV4cCI6MjA4OTMwMTQwNH0.PKwoLB5u_WeM6pmFH06sJbRk0DeWY4B3k6Ox-yspaL8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
