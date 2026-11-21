<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { useProgress } from '~/composables/useProgress'

const { award, track } = useProgress()

const DURATIONS = [60, 180, 300] // giây
const total = ref(60)
const left = ref(60)
const running = ref(false)
const done = ref(false)
const phase = ref<'Hít vào' | 'Thở ra'>('Hít vào')
let tick: number | null = null
let breath: number | null = null

const mm = computed(() => String(Math.floor(left.value / 60)).padStart(2, '0'))
const ss = computed(() => String(left.value % 60).padStart(2, '0'))

function start() {
  if (running.value) return
  done.value = false
  left.value = total.value
  running.value = true
  phase.value = 'Hít vào'
  breath = window.setInterval(() => {
    phase.value = phase.value === 'Hít vào' ? 'Thở ra' : 'Hít vào'
  }, 4000)
  tick = window.setInterval(() => {
    left.value -= 1
    if (left.value <= 0) finish()
  }, 1000)
}

function finish() {
  stopTimers()
  running.value = false
  done.value = true
  track('meditate')
  award(20, 'ngồi thiền')
}

function stopTimers() {
  if (tick) { clearInterval(tick); tick = null }
  if (breath) { clearInterval(breath); breath = null }
}

function stop() {
  stopTimers()
  running.value = false
  left.value = total.value
}

function pick(d: number) { if (!running.value) { total.value = d; left.value = d } }

onBeforeUnmount(stopTimers)
</script>

<template>
  <div class="card-zen relative overflow-hidden p-6 sm:p-8 text-center">
    <p class="eyebrow">Tĩnh lặng</p>
    <h3 class="mt-1 text-2xl heading-serif">Ngồi Thiền</h3>
    <p class="mt-2 text-sm text-go/70">Theo hơi thở, buông mọi niệm.</p>

    <div class="my-6 grid place-items-center">
      <div class="breath-ring grid h-44 w-44 place-items-center rounded-full"
        :class="{ inhale: running && phase === 'Hít vào', exhale: running && phase === 'Thở ra' }">
        <div class="text-center">
          <div class="font-serif text-4xl text-do">{{ mm }}:{{ ss }}</div>
          <div class="mt-1 text-sm text-dong">{{ running ? phase : (done ? 'An nhiên' : 'Sẵn sàng') }}</div>
        </div>
      </div>
    </div>

    <div v-if="!running && !done" class="mb-4 flex justify-center gap-2">
      <button v-for="d in DURATIONS" :key="d" @click="pick(d)"
        class="h-10 rounded-full border px-4 text-sm transition-all"
        :class="total === d ? 'border-do bg-do text-kem' : 'border-dong/40 text-go hover:bg-dong/10'">
        {{ d / 60 }} phút
      </button>
    </div>

    <p v-if="done" class="mb-4 font-serif text-lg text-do">Tâm an, vạn sự an 🌿</p>

    <button v-if="!running" class="btn-zen" @click="start">
      <span>🧘</span>{{ done ? 'Thiền tiếp' : 'Bắt đầu thiền' }}
    </button>
    <button v-else class="btn-ghost" @click="stop">Dừng</button>
  </div>
</template>

<style scoped>
.breath-ring {
  background: radial-gradient(circle, rgba(201,163,86,.22), rgba(139,46,46,.08));
  border: 2px solid rgba(201,163,86,.5);
  transition: transform 4s ease-in-out, box-shadow 4s ease-in-out;
}
.breath-ring.inhale { transform: scale(1.12); box-shadow: 0 0 50px rgba(201,163,86,.5); }
.breath-ring.exhale { transform: scale(0.9); box-shadow: 0 0 20px rgba(201,163,86,.2); }
</style>
