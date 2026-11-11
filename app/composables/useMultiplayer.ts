import { useSupabase } from './useSupabase'
import { useAuth } from './useAuth'

export interface RemotePlayer {
  id: string
  name: string
  x: number; y: number; z: number; yaw: number; st: number // st: 0 đứng, 1 đi, 2 quỳ
  bare: boolean // đã cởi dép (để dép ngoài)
  // mốc nội suy cho mượt
  tx: number; ty: number; tz: number; tyaw: number
  lastSeen: number
}

export interface LocalState { x: number; y: number; z: number; yaw: number; st: number; bare: boolean }
export interface ChatMsg { id: string; name: string; text: string; ts: number; mine?: boolean }

/**
 * Đồng bộ nhiều người chơi qua Supabase Realtime (broadcast).
 * - Không cần bảng/RLS: broadcast là pub/sub tạm thời.
 * - Mỗi ~90ms gửi vị trí của mình; nhận vị trí người khác vào `players`.
 * - Ai ngừng gửi > 5s coi như rời -> xoá.
 */
export function useMultiplayer() {
  const { client, isConfigured } = useSupabase()
  const { current } = useAuth()

  const players: Record<string, RemotePlayer> = {}
  const messages = reactive<ChatMsg[]>([])
  const myId = Math.random().toString(36).slice(2, 10)
  const online = ref(1)
  const connected = ref(false)

  let channel: any = null
  let bc: BroadcastChannel | null = null
  let timer: any = null
  let getState: (() => LocalState) | null = null

  // nhận 1 gói vị trí (từ Supabase hoặc tab cùng máy)
  function onPos(p: any) {
    if (!p || p.id === myId) return
    const ex = players[p.id]
    if (ex) {
      ex.tx = p.x; ex.ty = p.y; ex.tz = p.z; ex.tyaw = p.yaw
      ex.st = p.st; ex.bare = !!p.bare; ex.name = p.name; ex.lastSeen = Date.now()
    } else {
      players[p.id] = {
        id: p.id, name: p.name, x: p.x, y: p.y, z: p.z, yaw: p.yaw,
        tx: p.x, ty: p.y, tz: p.z, tyaw: p.yaw, st: p.st, bare: !!p.bare, lastSeen: Date.now()
      }
    }
  }
  function onChat(m: any) {
    if (!m || !m.text) return
    messages.push({ id: m.id, name: m.name || 'Khách', text: String(m.text).slice(0, 200), ts: m.ts || Date.now(), mine: m.id === myId })
    if (messages.length > 40) messages.splice(0, messages.length - 40)
  }

  function connect(stateFn: () => LocalState) {
    if (!import.meta.client) return false
    getState = stateFn

    // Kênh phụ: tab cùng trình duyệt (hoạt động cả khi offline) — giúp test & chơi chung 1 máy
    try {
      bc = new BroadcastChannel('chua-online-room')
      bc.onmessage = (e) => { const d = e.data; if (d && d.t === 'chat') onChat(d); else onPos(d) }
    } catch {}

    // Kênh chính: Supabase Realtime (xuyên thiết bị)
    if (isConfigured && client) {
      channel = client.channel('chua-online-room', { config: { broadcast: { self: false } } })
      channel.on('broadcast', { event: 'pos' }, ({ payload }: any) => onPos(payload))
      channel.on('broadcast', { event: 'chat' }, ({ payload }: any) => onChat(payload))
      channel.subscribe((status: string) => { if (status === 'SUBSCRIBED') connected.value = true })
    }

    timer = setInterval(() => {
      if (!getState) return
      const s = getState()
      const payload = { t: 'pos', id: myId, name: current.value?.name || 'Khách', x: s.x, y: s.y, z: s.z, yaw: s.yaw, st: s.st, bare: s.bare }
      try { bc?.postMessage(payload) } catch {}
      try { channel?.send({ type: 'broadcast', event: 'pos', payload }) } catch {}
      const now = Date.now()
      for (const id in players) if (now - players[id].lastSeen > 5000) delete players[id]
      online.value = 1 + Object.keys(players).length
    }, 90)
    return true
  }

  function sendChat(text: string) {
    const t = (text || '').trim()
    if (!t) return
    const m = { t: 'chat', id: myId, name: current.value?.name || 'Khách', text: t.slice(0, 200), ts: Date.now() }
    onChat(m) // hiện ngay tin của mình
    try { bc?.postMessage(m) } catch {}
    try { channel?.send({ type: 'broadcast', event: 'chat', payload: m }) } catch {}
  }

  function disconnect() {
    if (timer) { clearInterval(timer); timer = null }
    if (channel && client) { try { client.removeChannel(channel) } catch {} }
    if (bc) { try { bc.close() } catch {} bc = null }
    channel = null
    connected.value = false
  }

  return { players, messages, myId, online, connected, connect, disconnect, sendChat }
}
