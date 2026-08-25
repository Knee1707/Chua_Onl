<script setup lang="ts">
import { ref } from 'vue'
import { useSound } from '~/composables/useSound'

const { playBell } = useSound()
const ripples = ref<number[]>([])
const swinging = ref(false)
let id = 0

function ring() {
  playBell()
  swinging.value = true
  const rid = id++
  ripples.value.push(rid)
  window.setTimeout(() => {
    ripples.value = ripples.value.filter((r) => r !== rid)
  }, 2600)
  window.setTimeout(() => (swinging.value = false), 1600)
}
</script>

<template>
  <div class="card-zen relative flex flex-col items-center overflow-hidden p-6 sm:p-8">
    <div class="mb-5 text-center">
      <p class="eyebrow">Tỉnh thức</p>
      <h3 class="mt-1 text-2xl heading-serif">Rung Chuông Chùa</h3>
      <p class="mt-2 text-sm text-go/70">Một tiếng chuông ngân, muộn phiền lắng xuống.</p>
    </div>

    <div class="relative flex h-60 w-full items-center justify-center">
      <!-- Sóng âm lan tỏa -->
      <span
        v-for="r in ripples"
        :key="r"
        class="ripple pointer-events-none absolute rounded-full border border-dong/50"
      />

      <!-- Chuông đồng -->
      <button
        @click="ring"
        class="group relative z-10 outline-none"
        aria-label="Rung chuông"
      >
        <svg
          viewBox="0 0 160 200"
          class="h-52 w-44 origin-top glow-icon transition-transform"
          :class="swinging ? 'bell-swing' : 'group-hover:scale-[1.02]'"
        >
          <defs>
            <linearGradient id="bell" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#e9c97f" />
              <stop offset="0.5" stop-color="#c9a356" />
              <stop offset="1" stop-color="#8a6b2b" />
            </linearGradient>
          </defs>
          <!-- Quai treo -->
          <path d="M80 10 c-14 0-14 20 0 20 c14 0 14-20 0-20Z" fill="none" stroke="#8a6b2b" stroke-width="5" />
          <!-- Thân chuông -->
          <path d="M46 60 C46 40 114 40 114 60 C120 96 128 140 140 168 L20 168 C32 140 40 96 46 60 Z"
                fill="url(#bell)" stroke="#6d4410" stroke-width="2.5" />
          <!-- Vành -->
          <rect x="16" y="166" width="128" height="12" rx="6" fill="#a9721f" stroke="#6d4410" stroke-width="1.5" />
          <!-- Hoa văn -->
          <ellipse cx="80" cy="96" rx="30" ry="16" fill="none" stroke="#6d4410" stroke-width="1.4" opacity="0.6" />
          <circle cx="80" cy="128" r="7" fill="#6d4410" opacity="0.55" />
          <!-- Vệt sáng -->
          <path d="M60 66 C58 100 54 140 46 166" stroke="#fff2cf" stroke-width="3" opacity="0.5" fill="none" />
        </svg>
      </button>
    </div>

    <button class="btn-ghost mt-2" @click="ring">🔔 Thỉnh chuông</button>
  </div>
</template>

<style scoped>
.ripple {
  width: 120px;
  height: 120px;
  animation: ripple 2.6s ease-out forwards;
}
@keyframes ripple {
  0% { transform: scale(0.5); opacity: 0.55; }
  100% { transform: scale(4.2); opacity: 0; }
}
.bell-swing {
  animation: swingBell 1.6s ease-in-out;
}
@keyframes swingBell {
  0% { transform: rotate(0); }
  15% { transform: rotate(7deg); }
  35% { transform: rotate(-5deg); }
  55% { transform: rotate(3deg); }
  75% { transform: rotate(-2deg); }
  100% { transform: rotate(0); }
}
</style>
