import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SUPABASE_URL = 'https://eeuflkxnetkqocxyelkr.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVldWZsa3huZXRrcW9jeHllbGtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNDYzMjIsImV4cCI6MjEwMzkyMjMyMn0.lUOxKE45C8eUXY1SMNstZPxrzZD9uhTY-0TM4hsizdU';

export const isSupabaseConfigured = () => {
  return (
    SUPABASE_URL &&
    !SUPABASE_URL.includes('YOUR_SUPABASE_PROJECT_ID') &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY')
  );
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
