import { reactive, computed } from 'vue'

/**
 * Lớp "game hoá" cho trải nghiệm chùa (tham khảo chuaonline.org):
 * - Công đức = điểm kinh nghiệm, tích luỹ theo hoạt động.
 * - Cấp độ + pháp hiệu tăng dần theo công đức.
 * - Nhiệm vụ hằng ngày: làm hoạt động để hoàn thành, tự nhận thưởng.
 * - Đèn nguyện: đếm số đèn đã thả.
 * Lưu localStorage, dùng được cả khi không có cloud. Singleton toàn app.
 */

const KEY = 'dco.progress.v1'

// Pháp hiệu theo cấp (cấp 1..10+)
const TITLES = [
  'Khởi tâm', 'Kết duyên', 'Tịnh tín', 'Phát nguyện', 'Tinh tấn',
  'An lạc', 'Từ bi', 'Trí tuệ', 'Thiền định', 'Giác ngộ'
]

// Nhiệm vụ hằng ngày
export interface Quest { key: string; label: string; target: number; reward: number; icon: string }
const QUESTS: Quest[] = [
  { key: 'incense', label: 'Thắp nhang lễ Phật', target: 1, reward: 15, icon: '🪔' },
  { key: 'bow', label: 'Lạy Phật 3 lạy', target: 3, reward: 15, icon: '🙇' },
  { key: 'wish', label: 'Thả 1 đèn nguyện', target: 1, reward: 20, icon: '🏮' },
  { key: 'meditate', label: 'Ngồi thiền 1 lần', target: 1, reward: 20, icon: '🧘' },
  { key: 'bell', label: 'Thỉnh chuông an lành', target: 1, reward: 10, icon: '🔔' }
]

const today = () => new Date().toISOString().slice(0, 10)

interface SaveShape {
  cd: number
  lanterns: number
  quests: Record<string, Record<string, number>> // ngày -> {key: progress}
  claimed: Record<string, Record<string, 1>>       // ngày -> {key: 1}
}

function load(): SaveShape {
  const base: SaveShape = { cd: 0, lanterns: 0, quests: {}, claimed: {} }
  if (!import.meta.client) return base
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}')
    return { ...base, ...raw, quests: raw.quests || {}, claimed: raw.claimed || {} }
  } catch { return base }
}

const state = reactive(load())

interface Toast { id: number; text: string; kind: 'cd' | 'level' | 'quest' }
const toasts = reactive<Toast[]>([])
let toastId = 0

function save() {
  if (!import.meta.client) return
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch {}
}

function pushToast(text: string, kind: Toast['kind'] = 'cd') {
  const id = toastId++
  toasts.push({ id, text, kind })
  window.setTimeout(() => {
    const i = toasts.findIndex(t => t.id === id)
    if (i >= 0) toasts.splice(i, 1)
  }, kind === 'level' ? 4200 : 2600)
}

// Ngưỡng công đức cho từng cấp (lũy tiến nhẹ)
function levelFromCd(cd: number) {
  let lvl = 1, base = 0, need = 40
  while (cd >= base + need) { base += need; lvl++; need = Math.round(40 * Math.pow(lvl, 1.35)) }
  return { lvl, inLevel: cd - base, need, base }
}

export function useProgress() {
  const level = computed(() => {
    const { lvl, inLevel, need } = levelFromCd(state.cd)
    return {
      lvl,
      title: TITLES[Math.min(lvl - 1, TITLES.length - 1)],
      inLevel,
      need,
      pct: Math.min(100, Math.round((inLevel / need) * 100))
    }
  })

  function award(amount: number, reason = '') {
    const before = level.value.lvl
    state.cd += amount
    save()
    pushToast(`+${amount} công đức${reason ? ' · ' + reason : ''}`, 'cd')
    const after = level.value.lvl
    if (after > before) {
      pushToast(`🌸 Thăng cấp ${after} — ${TITLES[Math.min(after - 1, TITLES.length - 1)]}`, 'level')
    }
  }

  // Ghi nhận tiến độ nhiệm vụ; tự trao thưởng khi đủ (một lần/ngày)
  function track(key: string, inc = 1) {
    const q = QUESTS.find(x => x.key === key)
    if (!q) return
    const d = today()
    const day = (state.quests[d] = state.quests[d] || {})
    const claimed = (state.claimed[d] = state.claimed[d] || {})
    day[key] = Math.min(q.target, (day[key] || 0) + inc)
    save()
    if (day[key] >= q.target && !claimed[key]) {
      claimed[key] = 1
      state.cd += q.reward
      save()
      pushToast(`${q.icon} Xong nhiệm vụ: ${q.label} (+${q.reward})`, 'quest')
    }
  }

  function addLantern() {
    state.lanterns += 1
    save()
  }

  const quests = computed(() => {
    const d = today()
    const day = state.quests[d] || {}
    const claimed = state.claimed[d] || {}
    return QUESTS.map(q => ({
      ...q,
      progress: Math.min(q.target, day[q.key] || 0),
      done: !!claimed[q.key]
    }))
  })

  const questsDone = computed(() => quests.value.filter(q => q.done).length)

  return {
    state,
    level,
    toasts,
    quests,
    questsDone,
    award,
    track,
    addLantern,
    lanterns: computed(() => state.lanterns)
  }
}
