<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { SUTRAS } from '~/data/sutras'
import { useSound } from '~/composables/useSound'

const { playWoodenFish, playBell } = useSound()

const current = ref(SUTRAS[0])
const idx = ref(0)
const playing = ref(false)
const bien = ref(0) // số biến (lần tụng trọn bài) trong phiên
const tap = ref(false)

let timer: number | null = null
const lineRefs = ref<HTMLElement[]>([])

const lines = computed(() => current.value.cau)

function setLineRef(el: any, i: number) {
  if (el) lineRefs.value[i] = el as HTMLElement
}

function beat() {
  playWoodenFish()
  tap.value = true
  window.setTimeout(() => (tap.value = false), 140)
}

function scrollActive() {
  nextTick(() => {
    const el = lineRefs.value[idx.value]
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  })
}

function tick() {
  idx.value++
  if (idx.value >= lines.value.length) {
    idx.value = 0
    bien.value++
    playBell() // hết một biến: ngân một tiếng chuông
  }
  beat()
  scrollActive()
}

function start() {
  if (playing.value) return
  playing.value = true
  beat()
  scrollActive()
  timer = window.setInterval(tick, current.value.nhip)
}

function stop() {
  playing.value = false
  if (timer) { clearInterval(timer); timer = null }
}

function toggle() {
  playing.value ? stop() : start()
}

function selectSutra(s: typeof SUTRAS[number]) {
  stop()
  current.value = s
  idx.value = 0
  scrollActive()
}

// Tạm dừng khi rời tab để giữ nhịp đúng
function onVisibility() {
  if (document.hidden && playing.value) stop()
}

watch(current, () => { lineRefs.value = [] })

onMounted(() => document.addEventListener('visibilitychange', onVisibility))
onBeforeUnmount(() => {
  stop()
  document.removeEventListener('visibilitychange', onVisibility)
})
</script>

<template>
  <div class="card-zen p-6 sm:p-8">
    <div class="mb-5 text-center">
      <p class="eyebrow">Nhiếp tâm</p>
      <h3 class="mt-1 text-2xl heading-serif">Tụng Kinh · Niệm Phật</h3>
      <p class="mt-2 text-sm text-go/70">Theo nhịp mõ, an trú từng câu, nhiếp tâm về một mối.</p>
    </div>

    <!-- Chọn bài kinh -->
    <div class="mb-6 flex flex-wrap justify-center gap-2">
      <button
        v-for="s in SUTRAS"
        :key="s.id"
        @click="selectSutra(s)"
        class="rounded-full border px-4 py-2 text-sm transition-all duration-500"
        :class="current.id === s.id
          ? 'border-do bg-do text-kem shadow-glow'
          : 'border-dong/40 text-go hover:bg-dong/10'"
      >
        {{ s.ten }}
      </button>
    </div>

    <p class="mb-4 text-center text-sm italic text-go/60">{{ current.mota }}</p>

    <div class="grid items-center gap-6 md:grid-cols-[1fr_auto]">
      <!-- Bảng kinh chạy chữ -->
      <div
        class="chant-scroll relative h-60 overflow-y-auto rounded-2xl border border-dong/30
               bg-gradient-to-b from-[#fbf6e9] to-[#f2e8d1] px-6 py-16 text-center"
      >
        <p
          v-for="(line, i) in lines"
          :key="i"
          :ref="(el) => setLineRef(el, i)"
          class="font-serif leading-relaxed transition-all duration-700 ease-in-out"
          :class="i === idx
            ? 'my-2 text-2xl font-semibold text-do scale-105'
            : i < idx
              ? 'my-1 text-lg text-go/35'
              : 'my-1 text-lg text-go/55'"
        >
          {{ line }}
        </p>
        <!-- Che mờ trên/dưới -->
        <div class="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-[#fbf6e9] to-transparent" />
        <div class="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#f2e8d1] to-transparent" />
      </div>

      <!-- Mõ + điều khiển -->
      <div class="flex flex-col items-center gap-4">
        <!-- Mõ (wooden fish) -->
        <svg
          viewBox="0 0 120 100"
          class="h-24 w-28 glow-icon origin-bottom transition-transform duration-100"
          :class="tap ? 'scale-95' : 'scale-100'"
          @click="beat"
          role="button"
          aria-label="Gõ mõ"
        >
          <defs>
            <radialGradient id="mocG" cx="0.4" cy="0.35" r="0.8">
              <stop offset="0" stop-color="#b5651d" />
              <stop offset="1" stop-color="#6d4410" />
            </radialGradient>
          </defs>
          <!-- Thân mõ -->
          <ellipse cx="60" cy="60" rx="48" ry="34" fill="url(#mocG)" stroke="#4A3728" stroke-width="2.5" />
          <!-- Khe mõ -->
          <path d="M30 58 Q60 74 90 58" fill="none" stroke="#3a2a12" stroke-width="4" stroke-linecap="round" />
          <!-- Xoáy chạm khắc -->
          <path d="M44 46 q8 -10 20 -4" fill="none" stroke="#e7c98a" stroke-width="2" stroke-linecap="round" opacity="0.7" />
          <circle cx="42" cy="52" r="3" fill="#e7c98a" opacity="0.7" />
          <!-- Dùi gõ -->
          <g :class="tap ? 'mallet-hit' : ''" style="transform-origin: 88px 20px">
            <line x1="88" y1="20" x2="66" y2="44" stroke="#8a6b2b" stroke-width="4" stroke-linecap="round" />
            <circle cx="64" cy="46" r="7" fill="#c9a356" stroke="#6d4410" stroke-width="1.5" />
          </g>
        </svg>

        <button class="btn-zen w-44" @click="toggle">
          <span>{{ playing ? '⏸' : '▶' }}</span>{{ playing ? 'Tạm dừng' : 'Bắt đầu tụng' }}
        </button>

        <div class="rounded-2xl border border-dong/30 bg-kem/60 px-5 py-3 text-center">
          <div class="text-xs uppercase tracking-widest text-dong">Số biến</div>
          <div class="font-serif text-3xl text-do">{{ bien }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chant-scroll::-webkit-scrollbar { width: 6px; }
.chant-scroll::-webkit-scrollbar-thumb { background: rgba(201,163,86,0.5); border-radius: 999px; }
.mallet-hit { animation: hit 0.14s ease-in-out; }
@keyframes hit {
  0% { transform: rotate(0); }
  50% { transform: rotate(-16deg); }
  100% { transform: rotate(0); }
}
</style>
