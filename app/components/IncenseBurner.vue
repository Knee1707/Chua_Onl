<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useSound } from '~/composables/useSound'

const { playChime } = useSound()

const options = [1, 3, 5]
const count = ref(3)
const lit = ref(false)
const burning = ref(false)

// Tàn nhang rơi khi đốt
interface Spark { id: number; left: number; dur: number; drift: number }
const sparks = ref<Spark[]>([])
let sparkId = 0
let sparkTimer: number | null = null

function spawnSpark() {
  const id = sparkId++
  const left = 50 + (Math.random() * 34 - 17) // quanh đầu nhang (giữa)
  const dur = 2.2 + Math.random() * 1.4
  const drift = Math.random() * 24 - 12
  sparks.value.push({ id, left, dur, drift })
  window.setTimeout(() => {
    sparks.value = sparks.value.filter((s) => s.id !== id)
  }, dur * 1000)
}

watch(burning, (b) => {
  if (b) {
    sparkTimer = window.setInterval(spawnSpark, 520)
  } else if (sparkTimer) {
    clearInterval(sparkTimer)
    sparkTimer = null
  }
})

onBeforeUnmount(() => {
  if (sparkTimer) clearInterval(sparkTimer)
})

const sticks = computed(() => Array.from({ length: count.value }, (_, i) => i))

// Vị trí & độ nghiêng của nén nhang mới (đối xứng quanh tâm x=130)
function stickX(i: number) { return 130 + (i - (count.value - 1) / 2) * 16 }
function stickTilt(i: number) { return (i - (count.value - 1) / 2) * 5 }

// Chân nhang đã cắm sẵn (tàn nhang cũ) — luôn hiển thị, cắm trong tro
const chanNhang = [
  { x: 90, top: 78, t: -7 },
  { x: 106, top: 71, t: -2 },
  { x: 122, top: 82, t: 3 },
  { x: 140, top: 73, t: -3 },
  { x: 156, top: 80, t: 5 },
  { x: 172, top: 85, t: 9 },
  { x: 80, top: 86, t: -10 }
]

// Than hồng lập lòe trong tro (hiệu ứng nhang tàn)
const ashEmbers = [
  { x: 104, y: 96, d: '0s' },
  { x: 132, y: 99, d: '0.7s' },
  { x: 150, y: 95, d: '1.3s' },
  { x: 118, y: 101, d: '0.4s' },
  { x: 162, y: 98, d: '1.0s' }
]

function light() {
  if (burning.value) return
  lit.value = true
  burning.value = true
  playChime()
  // Nhang cháy tàn dần trong ~26s rồi tắt, có thể thắp lại
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
    <div class="mb-4 flex justify-center gap-3">
      <button
        v-for="o in options"
        :key="o"
        @click="count = o"
        :disabled="burning"
        class="h-11 w-11 rounded-full border font-serif text-lg transition-all duration-500 disabled:opacity-40"
        :class="count === o ? 'border-do bg-do text-kem shadow-glow' : 'border-dong/40 text-go hover:bg-dong/10'"
      >
        {{ o }}
      </button>
    </div>

    <!-- Lư hương -->
    <div class="relative mx-auto h-72 w-full max-w-sm">
      <!-- Khói -->
      <div class="absolute inset-x-0 top-0 h-52">
        <IncenseSmoke :active="burning" :intensity="Math.min(count, 5)" />
      </div>

      <!-- Tàn nhang rơi -->
      <div class="pointer-events-none absolute inset-x-0 top-10 z-10 h-40">
        <span
          v-for="s in sparks"
          :key="s.id"
          class="ash-spark"
          :style="{ left: s.left + '%', '--dur': s.dur + 's', '--drift': s.drift + 'px' }"
        />
      </div>

      <svg viewBox="0 0 260 210" class="absolute inset-x-0 bottom-0 mx-auto w-full" style="filter: drop-shadow(0 14px 20px rgba(0,0,0,.35))">
        <defs>
          <linearGradient id="bronzeBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#e9c07a" />
            <stop offset="0.45" stop-color="#b6842f" />
            <stop offset="1" stop-color="#6d4410" />
          </linearGradient>
          <linearGradient id="rimG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#f4d999" />
            <stop offset="1" stop-color="#a9781f" />
          </linearGradient>
          <radialGradient id="ashG" cx="0.5" cy="0.35" r="0.7">
            <stop offset="0" stop-color="#d8cdb4" />
            <stop offset="0.7" stop-color="#a99a78" />
            <stop offset="1" stop-color="#6f6144" />
          </radialGradient>
          <linearGradient id="stickG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#b5651d" />
            <stop offset="1" stop-color="#7a3b1a" />
          </linearGradient>
        </defs>

        <!-- Tai cầm hai bên -->
        <path d="M40 104 q-22 4 -20 30 q2 16 16 16" fill="none" stroke="#a9781f" stroke-width="9" stroke-linecap="round" />
        <path d="M220 104 q22 4 20 30 q-2 16 -16 16" fill="none" stroke="#a9781f" stroke-width="9" stroke-linecap="round" />

        <!-- Thân lư -->
        <path d="M40 92 C 46 158, 94 182, 130 182 C 166 182, 214 158, 220 92 Z" fill="url(#bronzeBody)" stroke="#5c3d12" stroke-width="2" />
        <!-- Hoa văn hồi văn quanh thân -->
        <path d="M52 128 H208" stroke="#3d2a0e" stroke-width="10" opacity="0.35" />
        <g fill="#f0d79a" opacity="0.55">
          <rect v-for="n in 13" :key="n" :x="54 + (n - 1) * 12" y="123" width="6" height="10" rx="1" />
        </g>

        <!-- Đế lư -->
        <path d="M104 182 L100 200 H160 L156 182 Z" fill="#8a6b2b" stroke="#5c3d12" stroke-width="2" />
        <ellipse cx="130" cy="201" rx="42" ry="7" fill="#6d4410" />

        <!-- Vành miệng lư -->
        <ellipse cx="130" cy="92" rx="88" ry="21" fill="url(#rimG)" stroke="#5c3d12" stroke-width="2" />
        <!-- Lòng lư (bóng tối tạo chiều sâu) -->
        <ellipse cx="130" cy="95" rx="78" ry="15" fill="#4a3a22" />

        <!-- Chân nhang đã cắm (tàn cũ) -->
        <g v-for="(c, i) in chanNhang" :key="'c' + i" :transform="`rotate(${c.t} ${c.x} 112)`">
          <rect :x="c.x - 1.3" :y="c.top" width="2.6" :height="112 - c.top" rx="1.3" fill="#7a2a1e" />
          <circle :cx="c.x" :cy="c.top" r="1.8" fill="#4a4a4a" />
        </g>

        <!-- Nén nhang mới -->
        <g v-for="i in sticks" :key="'s' + i" :transform="`rotate(${stickTilt(i)} ${stickX(i)} 112)`">
          <g class="lit-stick" :class="{ burning }">
            <rect :x="stickX(i) - 1.4" y="22" width="2.8" :height="90" rx="1.4" fill="url(#stickG)" />
            <circle v-if="lit" :cx="stickX(i)" cy="22" r="3.2" class="ember" />
          </g>
        </g>

        <!-- Tro (vẽ đè lên gốc nhang -> nhang như cắm trong tro) -->
        <ellipse cx="130" cy="98" rx="74" ry="13" fill="url(#ashG)" />
        <ellipse cx="130" cy="97" rx="60" ry="8" fill="#c7b89a" opacity="0.5" />
        <!-- Than hồng lập lòe trong tro -->
        <circle v-for="(e, i) in ashEmbers" :key="'e' + i" :cx="e.x" :cy="e.y" r="1.5" class="ash-ember" :style="{ animationDelay: e.d }" />

        <!-- Viền sáng vành trước -->
        <path d="M46 96 Q130 118 214 96" fill="none" stroke="#f7e6b8" stroke-width="2.5" opacity="0.6" />
      </svg>
    </div>

    <div class="mt-4 text-center">
      <button class="btn-zen" @click="light" :disabled="burning">
        <span>🕯️</span>{{ burning ? 'Nhang đang cháy…' : `Thắp ${count} nén nhang` }}
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Nén nhang cháy tàn dần: co ngắn từ trên xuống, đốm than hạ dần */
.lit-stick {
  transform-box: fill-box;
  transform-origin: bottom;
}
.lit-stick.burning {
  animation: burnDown 26s linear forwards;
}
@keyframes burnDown {
  from { transform: scaleY(1); }
  to { transform: scaleY(0.22); }
}
/* Đốm than đầu nhang */
.ember {
  fill: #ff6a00;
  filter: drop-shadow(0 0 3px rgba(255, 120, 0, 0.95));
  animation: emberPulse 1.4s ease-in-out infinite;
}
@keyframes emberPulse {
  0%, 100% { opacity: 0.75; }
  50% { opacity: 1; }
}
/* Tàn nhang rơi khi đốt */
.ash-spark {
  position: absolute;
  top: 0;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: radial-gradient(circle, #ffcf8a, #e0631a 70%);
  box-shadow: 0 0 4px rgba(255, 120, 0, 0.85);
  animation: ashFall var(--dur, 3s) linear forwards;
}
@keyframes ashFall {
  0% { transform: translate(0, 0) scale(1); opacity: 0; }
  12% { opacity: 1; }
  85% { opacity: 0.8; }
  100% { transform: translate(var(--drift, 0), 150px) scale(0.35); opacity: 0; }
}
/* Than hồng trong tro (nhang tàn) */
.ash-ember {
  fill: #ff7a1a;
  filter: drop-shadow(0 0 2px rgba(255, 110, 0, 0.9));
  animation: ashGlow 2.4s ease-in-out infinite;
}
@keyframes ashGlow {
  0%, 100% { opacity: 0.15; }
  50% { opacity: 0.85; }
}
</style>
