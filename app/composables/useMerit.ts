import { ref } from 'vue'

export interface MeritRecord {
  id?: string | number
  name: string
  amount: number
  created_at?: string
}

const LOCAL_KEY = 'dichua_merits'

/**
 * Sổ công đức. Dùng Supabase nếu có cấu hình, ngược lại lưu localStorage.
 * Tên người cúng dường được ẩn danh hóa khi hiển thị.
 */
export function useMerit() {
  const { client, isConfigured } = useSupabase()
  const records = ref<MeritRecord[]>([])
  const total = ref(0)
  const loading = ref(false)
  const usingCloud = isConfigured

  function readLocal(): MeritRecord[] {
    if (!import.meta.client) return []
    try {
      return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]')
    } catch {
      return []
    }
  }
  function writeLocal(list: MeritRecord[]) {
    if (import.meta.client) localStorage.setItem(LOCAL_KEY, JSON.stringify(list))
  }
  function recomputeLocal() {
    total.value = readLocal().reduce((s, r) => s + (r.amount || 0), 0)
  }

  async function fetchRecent(limit = 8) {
    loading.value = true
    try {
      if (client) {
        const { data, error } = await client
          .from('merits')
          .select('id, name, amount, created_at')
          .order('created_at', { ascending: false })
          .limit(limit)
        if (error) throw error
        records.value = data || []
        // Tổng cộng dồn từ cloud (tính riêng để không giới hạn theo limit)
        const { data: sumData } = await client.from('merits').select('amount')
        total.value = (sumData || []).reduce((s: number, r: any) => s + (r.amount || 0), 0)
        return
      }
      throw new Error('local')
    } catch {
      records.value = readLocal().slice(0, limit)
      const all = readLocal()
      total.value = all.reduce((s, r) => s + (r.amount || 0), 0)
    } finally {
      loading.value = false
    }
  }

  async function addMerit(name: string, amount: number) {
    const entry: MeritRecord = {
      name: (name || '').trim() || 'Ẩn danh',
      amount,
      created_at: new Date().toISOString()
    }
    if (client) {
      const { data, error } = await client
        .from('merits')
        .insert({ name: entry.name, amount: entry.amount })
        .select()
        .single()
      if (error) throw error
      records.value = [data as MeritRecord, ...records.value].slice(0, 8)
      total.value += amount
    } else {
      entry.id = Date.now()
      const list = [entry, ...readLocal()].slice(0, 500)
      writeLocal(list)
      records.value = list.slice(0, 8)
      recomputeLocal()
    }
  }

  return { records, total, loading, usingCloud, fetchRecent, addMerit }
}
