import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Will be null if env vars aren't set — stores fall back to localStorage in that case
export const supabase =
  supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-project.supabase.co'
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

export const isSupabaseConfigured = supabase !== null
