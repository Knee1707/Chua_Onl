<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePrayers } from '~/composables/usePrayers'
import { useProgress } from '~/composables/useProgress'
import { useAuth } from '~/composables/useAuth'

const { prayers, fetchRecent, addPrayer } = usePrayers()
const { award, track, addLantern, lanterns } = useProgress()
const { current } = useAuth()

const wish = ref('')
const releasing = ref(false)
const flying = ref(false)
const busy = ref(false)

onMounted(() => { fetchRecent(8) })

// ẩn danh hoá tên
function veil(name: string) {
  const n = (name || 'Ẩn danh').trim()
  if (n.length <= 2) return n[0] + '•'
  return n[0] + '•'.repeat(Math.min(3, n.length - 2)) + n[n.length - 1]
}

const recent = computed(() => prayers.value.slice(0, 8))

async function release() {
  const text = wish.value.trim()
  if (!text || busy.value) return
  busy.value = true
  releasing.value = true
  // bay lên
  flying.value = true
  try {
    await addPrayer(current.value?.name || 'Khách', text)
    addLantern()
    track('wish')
    award(20, 'thả đèn nguyện')
  } finally {
    window.setTimeout(() => {
      flying.value = false
      releasing.value = false
      busy.value = false
      wish.value = ''
      fetchRecent(8)
    }, 2600)
  }
}
</script>

<template>
  <div class="card-zen relative overflow-hidden p-6 sm:p-8">
    <div class="mb-4 text-center">
      <p class="eyebrow">Gửi ước nguyện</p>
      <h3 class="mt-1 text-2xl heading-serif">Thả Đèn Hoa Đăng</h3>
      <p class="mt-2 text-sm text-go/70">Viết điều ước, thả đèn trôi về phía Phật.
        <span class="font-medium text-do">{{ lanterns }}</span> ngọn đèn của bạn đang sáng.</p>
    </div>

    <!-- Bầu trời thả đèn -->
    <div class="relative mx-auto mb-5 h-56 w-full max-w-sm overflow-hidden rounded-2xl"
      style="background: linear-gradient(180deg,#2a1b3d 0%,#3d2b2b 55%,#5a3a24 100%)">
      <!-- sao -->
      <span v-for="n in 26" :key="'st'+n" class="twinkle"
        :style="{ left: (n*37%100)+'%', top: (n*23%70)+'%', animationDelay: (n%7*0.4)+'s' }" />
      <!-- mặt nước phản chiếu -->
      <div class="absolute inset-x-0 bottom-0 h-16"
        style="background: linear-gradient(180deg,transparent,rgba(201,163,86,.18))" />

      <!-- đèn đang bay -->
      <transition name="lift">
        <div v-if="flying" class="lantern fly">🏮</div>
      </transition>
      <!-- đèn chờ thả -->
      <div v-if="!flying" class="lantern idle">🏮</div>
    </div>

    <textarea
      v-model="wish"
      :disabled="busy"
      maxlength="140"
      rows="2"
      placeholder="Con xin nguyện cầu…"
      class="w-full resize-none rounded-xl border border-dong/40 bg-kem/60 px-4 py-3 text-sm text-go outline-none focus:border-dong"
    />
    <div class="mt-1 text-right text-xs text-go/50">{{ wish.length }}/140</div>

    <div class="mt-3 text-center">
      <button class="btn-zen" @click="release" :disabled="busy || !wish.trim()">
        <span>🏮</span>{{ busy ? 'Đèn đang bay lên…' : 'Thả đèn nguyện' }}
      </button>
    </div>

    <!-- Đèn của cộng đồng -->
    <div v-if="recent.length" class="mt-6">
      <p class="eyebrow mb-2 text-center">Ước nguyện gần đây</p>
      <ul class="space-y-1.5">
        <li v-for="(p, i) in recent" :key="i"
          class="flex items-start gap-2 rounded-lg bg-kem/50 px-3 py-2 text-sm">
          <span>🏮</span>
          <span class="flex-1 text-go/85">{{ p.wish }}</span>
          <span class="shrink-0 text-xs text-dong">{{ veil(p.name) }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.twinkle {
  position: absolute; width: 2px; height: 2px; border-radius: 50%;
  background: #fff6d8; box-shadow: 0 0 4px #ffe9a8;
  animation: tw 2.6s ease-in-out infinite;
}
@keyframes tw { 0%,100% { opacity: .25 } 50% { opacity: 1 } }

.lantern {
  position: absolute; left: 50%; bottom: 14px; transform: translateX(-50%);
  font-size: 2.6rem; filter: drop-shadow(0 0 16px rgba(255,170,70,.75));
}
.lantern.idle { animation: bob 3.4s ease-in-out infinite; }
@keyframes bob {
  0%,100% { transform: translateX(-50%) translateY(0) }
  50% { transform: translateX(-50%) translateY(-7px) }
}
.lantern.fly { animation: flyUp 2.6s ease-in forwards; }
@keyframes flyUp {
  0% { bottom: 14px; opacity: 1; transform: translateX(-50%) scale(1) }
  70% { opacity: 1 }
  100% { bottom: 230px; opacity: 0; transform: translateX(-30%) scale(.5) }
}
</style>
