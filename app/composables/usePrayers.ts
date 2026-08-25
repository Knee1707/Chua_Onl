import { ref } from 'vue'

export interface Prayer {
  id?: string | number
  name: string
  wish: string
  created_at?: string
}

const LOCAL_KEY = 'dichua_prayers'

/**
 * Sổ cầu an. Dùng Supabase nếu có cấu hình, ngược lại lưu localStorage.
 * Danh sách hiển thị luôn ẩn danh hóa tên (che bớt) khi render.
 */
export function usePrayers() {
  const { client, isConfigured } = useSupabase()
  const prayers = ref<Prayer[]>([])
  const loading = ref(false)
  const usingCloud = isConfigured

  function readLocal(): Prayer[] {
    if (!import.meta.client) return []
    try {
      return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]')
    } catch {
      return []
    }
  }
  function writeLocal(list: Prayer[]) {
    if (import.meta.client) localStorage.setItem(LOCAL_KEY, JSON.stringify(list))
  }

  async function fetchRecent(limit = 12) {
    loading.value = true
    try {
      if (client) {
        const { data, error } = await client
          .from('prayers')
          .select('id, name, wish, created_at')
          .order('created_at', { ascending: false })
          .limit(limit)
        if (error) throw error
        prayers.value = data || []
      } else {
        prayers.value = readLocal().slice(0, limit)
      }
    } catch (e) {
      // Có lỗi mạng/bảng -> vẫn hiển thị dữ liệu local để không gãy trải nghiệm
      prayers.value = readLocal().slice(0, limit)
    } finally {
      loading.value = false
    }
  }

  async function addPrayer(name: string, wish: string) {
    const entry: Prayer = {
      name: name.trim() || 'Ẩn danh',
      wish: wish.trim(),
      created_at: new Date().toISOString()
    }
    if (client) {
      const { data, error } = await client
        .from('prayers')
        .insert({ name: entry.name, wish: entry.wish })
        .select()
        .single()
      if (error) throw error
      prayers.value = [data as Prayer, ...prayers.value].slice(0, 12)
    } else {
      entry.id = Date.now()
      const list = [entry, ...readLocal()].slice(0, 200)
      writeLocal(list)
      prayers.value = list.slice(0, 12)
    }
  }

  return { prayers, loading, usingCloud, fetchRecent, addPrayer }
}
