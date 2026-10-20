import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from '../../utils/supabase/info'

declare global {
  var __conectaSupabaseClient: SupabaseClient | undefined
}

export const supabase = globalThis.__conectaSupabaseClient ?? createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)

globalThis.__conectaSupabaseClient = supabase
