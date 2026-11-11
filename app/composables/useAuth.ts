import { useSupabase } from './useSupabase'

export interface Pilgrim {
  id: string
  name: string
  email?: string
  guest: boolean
}

const current = ref<Pilgrim | null>(null)
const ready = ref(false)

const LS_KEY = 'dco.pilgrim'

/**
 * Tài khoản khách hành hương: mọi người "tự cấp tài khoản".
 * - Có Supabase -> đăng ký/đăng nhập email thật (lưu cloud).
 * - Chưa cấu hình Supabase -> tài khoản khách lưu ở trình duyệt (vẫn đi chùa được).
 */
export function useAuth() {
  const { client, isConfigured } = useSupabase()

  async function init() {
    if (ready.value) return
    // Nhanh: khách đã lưu ở trình duyệt -> vào ngay, không chờ mạng
    if (import.meta.client) {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) {
        try { current.value = JSON.parse(raw) } catch {}
      }
    }
    // Cloud: chỉ gọi khi chưa có phiên local và đã cấu hình Supabase
    if (!current.value && isConfigured && client) {
      try {
        const { data } = await client.auth.getUser()
        if (data.user) {
          current.value = {
            id: data.user.id,
            name: (data.user.user_metadata?.name as string) || data.user.email || 'Thiện nam/Tín nữ',
            email: data.user.email || undefined,
            guest: false
          }
        }
      } catch {}
    }
    ready.value = true
  }

  function persistGuest(p: Pilgrim) {
    current.value = p
    if (import.meta.client) localStorage.setItem(LS_KEY, JSON.stringify(p))
  }

  /** Vào chùa ngay với tên tự đặt (không cần email). */
  function enterAsGuest(name: string) {
    persistGuest({
      id: 'guest-' + Math.random().toString(36).slice(2, 9),
      name: name.trim() || 'Khách thập phương',
      guest: true
    })
  }

  async function signUp(name: string, email: string, password: string) {
    if (!(isConfigured && client)) {
      enterAsGuest(name)
      return { ok: true, cloud: false }
    }
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { name } }
    })
    if (error) return { ok: false, error: error.message }
    if (data.user) {
      current.value = { id: data.user.id, name, email, guest: false }
    }
    return { ok: true, cloud: true }
  }

  async function signIn(email: string, password: string) {
    if (!(isConfigured && client)) return { ok: false, error: 'Chưa bật đăng nhập cloud.' }
    const { data, error } = await client.auth.signInWithPassword({ email, password })
    if (error) return { ok: false, error: error.message }
    current.value = {
      id: data.user.id,
      name: (data.user.user_metadata?.name as string) || email,
      email,
      guest: false
    }
    return { ok: true }
  }

  async function signOut() {
    if (isConfigured && client) await client.auth.signOut()
    current.value = null
    if (import.meta.client) localStorage.removeItem(LS_KEY)
  }

  return { current, ready, cloudEnabled: isConfigured, init, enterAsGuest, signUp, signIn, signOut }
}
