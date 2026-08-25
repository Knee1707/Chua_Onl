import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

/**
 * Trả về Supabase client nếu đã cấu hình khóa, ngược lại trả null.
 * Nhờ vậy app vẫn chạy tốt khi chưa có Supabase (fallback lưu local).
 */
export function useSupabase() {
  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl as string
  const key = config.public.supabaseAnonKey as string

  const isConfigured = Boolean(url && key)

  if (isConfigured && !_client && import.meta.client) {
    _client = createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true }
    })
  }

  return { client: _client, isConfigured }
}
