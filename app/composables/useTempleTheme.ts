import { ref, computed } from 'vue'

export interface TempleTheme {
  id: string
  name: string
  region: string
  desc: string
  accent: string // vàng đồng biến thể
  deep: string   // đỏ trầm biến thể
  paper: string  // nền be/kem biến thể
  wood: string
  motif: string  // mô tả họa tiết
}

export const TEMPLE_THEMES: TempleTheme[] = [
  {
    id: 'bac',
    name: 'Chùa Miền Bắc',
    region: 'Bắc Bộ',
    desc: 'Mái ngói rêu phong, sân gạch Bát Tràng, trầm mặc cổ kính.',
    accent: '201 163 86',
    deep: '139 46 46',
    paper: '245 239 224',
    wood: '74 55 40',
    motif: 'Hoa sen & mái đao cong'
  },
  {
    id: 'trung',
    name: 'Chùa Miền Trung',
    region: 'Trung Bộ',
    desc: 'Sắc vàng hoàng cung Huế, thanh thoát và tôn nghiêm.',
    accent: '212 175 96',
    deep: '122 42 30',
    paper: '246 240 226',
    wood: '90 62 40',
    motif: 'Mây cuộn & pháp luân'
  },
  {
    id: 'nam',
    name: 'Chùa Miền Nam',
    region: 'Nam Bộ',
    desc: 'Rực rỡ sắc đỏ - vàng, chan hòa nắng phương Nam.',
    accent: '214 158 74',
    deep: '150 40 40',
    paper: '247 241 227',
    wood: '80 54 36',
    motif: 'Bồ đề & sóng nước'
  }
]

const currentId = ref<string>('bac')

export function useTempleTheme() {
  const current = computed(
    () => TEMPLE_THEMES.find((t) => t.id === currentId.value) || TEMPLE_THEMES[0]
  )

  function applyTheme() {
    if (!import.meta.client) return
    const t = current.value
    const root = document.documentElement.style
    root.setProperty('--accent', t.accent)
    root.setProperty('--deep', t.deep)
    root.setProperty('--paper', t.paper)
    root.setProperty('--wood', t.wood)
  }

  function setTheme(id: string) {
    currentId.value = id
    applyTheme()
    if (import.meta.client) localStorage.setItem('dichua_theme', id)
  }

  function initTheme() {
    if (import.meta.client) {
      const saved = localStorage.getItem('dichua_theme')
      if (saved && TEMPLE_THEMES.some((t) => t.id === saved)) currentId.value = saved
    }
    applyTheme()
  }

  return { current, currentId, themes: TEMPLE_THEMES, setTheme, initTheme }
}
