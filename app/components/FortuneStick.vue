<script setup lang="ts">
import { ref } from 'vue'
import { randomFortune, type Fortune } from '~/data/fortunes'
import { useSound } from '~/composables/useSound'

const { playChime } = useSound()
const shaking = ref(false)
const result = ref<Fortune | null>(null)
const revealed = ref(false)

function drawFortune() {
  if (shaking.value) return
  revealed.value = false
  result.value = null
  shaking.value = true
  playChime()
  window.setTimeout(() => {
    shaking.value = false
    result.value = randomFortune()
    // Chờ khung tiếp theo để hiệu ứng lật thẻ mượt
    window.setTimeout(() => (revealed.value = true), 60)
  }, 1500)
}

function loaiColor(loai: string): string {
  if (loai.includes('Thượng thượng')) return 'text-do'
  if (loai.includes('Thượng')) return 'text-dong'
  if (loai.includes('Trung')) return 'text-go'
  return 'text-go/70'
}
</script>

<template>
  <div class="card-zen p-6 sm:p-8">
    <div class="mb-5 text-center">
      <p class="eyebrow">Tùy duyên</p>
      <h3 class="mt-1 text-2xl heading-serif">Xin Xăm · Gieo Quẻ</h3>
      <p class="mt-2 text-sm text-go/70">Thành tâm khấn nguyện, lắc ống xin một quẻ.</p>
    </div>

    <div class="relative mx-auto flex h-64 max-w-xs items-end justify-center">
      <!-- Ống xăm -->
      <div
        class="relative origin-bottom cursor-pointer"
        :class="shaking ? 'tube-shake' : ''"
        @click="drawFortune"
      >
        <svg viewBox="0 0 120 200" class="h-56 w-32 glow-icon">
          <rect x="34" y="46" width="52" height="150" rx="10" fill="#9c3a2a" stroke="#5a160f" stroke-width="3" />
          <ellipse cx="60" cy="46" rx="26" ry="9" fill="#7a2a1e" />
          <text x="60" y="140" text-anchor="middle" font-size="26" fill="#e7c98a" font-family="serif">籤</text>
          <g :class="shaking ? 'sticks-jitter' : ''">
            <rect x="50" y="12" width="4" height="42" fill="#e7c98a" />
            <rect x="58" y="8" width="4" height="46" fill="#e7c98a" />
            <rect x="66" y="14" width="4" height="40" fill="#e7c98a" />
            <rect x="44" y="16" width="4" height="38" fill="#e7c98a" />
            <rect x="72" y="18" width="4" height="36" fill="#e7c98a" />
          </g>
        </svg>
      </div>
    </div>

    <div class="mt-4 text-center">
      <button class="btn-zen" @click="drawFortune" :disabled="shaking">
        <span>🎋</span>{{ shaking ? 'Đang lắc ống xăm…' : 'Xin một quẻ' }}
      </button>
    </div>

    <!-- Thẻ quẻ -->
    <Transition name="soft">
      <div v-if="result" class="mt-6">
        <LotusDivider />
        <div
          class="fortune-card mx-auto max-w-md rounded-2xl border-2 border-dong/50 bg-gradient-to-b
                 from-[#fbf6e9] to-[#f1e6cd] p-6 text-center shadow-soft"
          :class="revealed ? 'card-in' : 'opacity-0'"
        >
          <div class="text-sm text-go/60">Quẻ số {{ result.so }}</div>
          <div class="mt-1 font-serif text-2xl font-semibold" :class="loaiColor(result.loai)">
            {{ result.loai }}
          </div>
          <div class="my-4 space-y-1.5 font-serif text-lg italic leading-relaxed text-go">
            <p v-for="(line, i) in result.tho" :key="i">{{ line }}</p>
          </div>
          <div class="rounded-xl bg-do/5 px-4 py-3 text-sm leading-relaxed text-go/80">
            <span class="font-semibold text-do">Luận giải: </span>{{ result.giai }}
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.tube-shake { animation: tubeShake 0.16s ease-in-out 9; }
@keyframes tubeShake {
  0%, 100% { transform: rotate(0) translateY(0); }
  25% { transform: rotate(-6deg) translateY(-4px); }
  75% { transform: rotate(6deg) translateY(-4px); }
}
.sticks-jitter { animation: jitter 0.14s linear 10; transform-origin: bottom center; }
@keyframes jitter {
  0%,100% { transform: translateX(0); }
  50% { transform: translateX(2px) rotate(2deg); }
}
.fortune-card { transition: opacity 0.7s ease-in-out, transform 0.7s ease-in-out; }
.card-in { animation: cardIn 0.8s ease-out both; }
@keyframes cardIn {
  from { opacity: 0; transform: translateY(16px) rotateX(8deg); }
  to { opacity: 1; transform: translateY(0) rotateX(0); }
}
</style>
