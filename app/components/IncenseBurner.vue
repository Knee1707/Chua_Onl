<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSound } from '~/composables/useSound'

const { playChime } = useSound()

const options = [1, 3, 5]
const count = ref(3)
const lit = ref(false)
const burning = ref(false)

const sticks = computed(() => Array.from({ length: count.value }, (_, i) => i))

function light() {
  if (burning.value) return
  lit.value = true
  burning.value = true
  playChime()
  // Nhang cháy dần trong ~26s rồi tự tắt, có thể thắp lại
  window.setTimeout(() => {
    burning.value = false
    lit.value = false
  }, 26000)
}
</script>

<template>
  <div class="card-zen relative overflow-hidden p-6 sm:p-8">
    <div class="mb-5 text-center">
      <p class="eyebrow">Tịnh tâm</p>
      <h3 class="mt-1 text-2xl heading-serif">Thắp Nén Tâm Hương</h3>
      <p class="mt-2 text-sm text-go/70">Dâng hương lễ Phật, gửi trọn lòng thành.</p>
    </div>

    <!-- Chọn số nén nhang -->
    <div class="mb-6 flex justify-center gap-3">
      <button
        v-for="o in options"
        :key="o"
        @click="count = o"
        :disabled="burning"
        class="h-11 w-11 rounded-full border font-serif text-lg transition-all duration-500
               disabled:opacity-40"
        :class="count === o
          ? 'border-do bg-do text-kem shadow-glow'
          : 'border-dong/40 text-go hover:bg-dong/10'"
      >
        {{ o }}
      </button>
    </div>

    <!-- Lư hương + nhang -->
    <div class="relative mx-auto h-64 w-full max-w-sm">
      <!-- Khói -->
      <div class="absolute inset-x-0 top-0 h-44">
        <IncenseSmoke :active="burning" :intensity="Math.min(count, 5)" />
      </div>

      <!-- Nhang -->
      <div class="absolute inset-x-0 bottom-14 flex items-end justify-center gap-2">
        <div
          v-for="s in sticks"
          :key="s"
          class="relative w-[3px] origin-bottom rounded-full bg-gradient-to-t from-[#7a3b1a] to-[#b5651d]"
          :class="burning ? 'incense-burning' : ''"
          :style="{ height: '120px', transform: `rotate(${(s - (count - 1) / 2) * 4}deg)` }"
        >
          <span
            v-if="lit"
            class="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-orange-500"
            style="box-shadow: 0 0 8px 3px rgba(255,120,0,0.8)"
          />
        </div>
      </div>

      <!-- Bát hương -->
      <svg viewBox="0 0 240 120" class="absolute inset-x-0 bottom-0 mx-auto w-64 glow-icon">
        <defs>
          <linearGradient id="bz" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#e9b96b" />
            <stop offset="0.5" stop-color="#a9721f" />
            <stop offset="1" stop-color="#6d4410" />
          </linearGradient>
        </defs>
        <ellipse cx="120" cy="34" rx="92" ry="16" fill="#3a2a12" />
        <path d="M28 34 C40 104, 200 104, 212 34 Z" fill="url(#bz)" stroke="#5c3d12" stroke-width="2" />
        <ellipse cx="120" cy="34" rx="92" ry="14" fill="#c9a86a" />
        <ellipse cx="120" cy="32" rx="78" ry="9" fill="#6b5a3a" />
      </svg>
    </div>

    <div class="mt-6 text-center">
      <button class="btn-zen" @click="light" :disabled="burning">
        <span>🕯️</span>{{ burning ? 'Nhang đang cháy…' : `Thắp ${count} nén nhang` }}
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Nhang cháy dần: chiều cao giảm chậm rãi, êm dịu */
.incense-burning {
  animation: burn 26s linear forwards;
}
@keyframes burn {
  from { height: 120px; }
  to { height: 26px; }
}
</style>
