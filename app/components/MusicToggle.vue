<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useAmbientMusic } from '~/composables/useAmbientMusic'

const { playing, toggle, start, stop } = useAmbientMusic()

const PREF = 'dichua_music'

function onToggle() {
  toggle()
  if (import.meta.client) {
    localStorage.setItem(PREF, playing.value ? 'on' : 'off')
  }
}

// Trình duyệt chặn tự phát nhạc -> khởi động ở lần chạm/bấm đầu tiên khi vào chùa
function primeAutoplay() {
  if (!import.meta.client) return
  const pref = localStorage.getItem(PREF)
  if (pref === 'off') return // người dùng đã chủ động tắt
  const startOnce = () => {
    if (!playing.value) start()
    window.removeEventListener('pointerdown', startOnce)
    window.removeEventListener('keydown', startOnce)
  }
  window.addEventListener('pointerdown', startOnce, { once: true })
  window.addEventListener('keydown', startOnce, { once: true })
}

onMounted(primeAutoplay)
onBeforeUnmount(() => stop())
</script>

<template>
  <button
    @click="onToggle"
    class="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-dong/50
           bg-kem/80 px-4 py-3 text-sm text-go shadow-soft backdrop-blur transition-all duration-500
           hover:bg-dong/10"
    :aria-label="playing ? 'Tắt nhạc thiền' : 'Bật nhạc thiền'"
  >
    <span class="text-lg" :class="playing ? 'animate-breathe' : ''">
      {{ playing ? '🎵' : '🔇' }}
    </span>
    <span class="hidden sm:inline">{{ playing ? 'Nhạc thiền' : 'Bật nhạc' }}</span>
  </button>
</template>
