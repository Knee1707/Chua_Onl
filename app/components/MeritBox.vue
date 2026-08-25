<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMerit } from '~/composables/useMerit'
import { useSound } from '~/composables/useSound'

const { records, total, usingCloud, fetchRecent, addMerit } = useMerit()
const { playChime } = useSound()

const amounts = [10000, 50000, 100000, 200000, 500000]
const chosen = ref(0)
const custom = ref<number | null>(null)
const name = ref('')
const sending = ref(false)
const coins = ref<number[]>([])
const boxShake = ref(false)
const blessed = ref(false)
let coinId = 0

onMounted(() => fetchRecent())

function pick(v: number) {
  chosen.value = v
  custom.value = null
}

function fmt(n: number) {
  return n.toLocaleString('vi-VN')
}

function maskName(n: string) {
  const s = (n || 'Ẩn danh').trim()
  const parts = s.split(/\s+/)
  if (parts.length === 1) return s.length <= 2 ? s : s[0] + '•'.repeat(Math.max(1, s.length - 2)) + s.slice(-1)
  return parts[0] + ' ' + '•'.repeat(2) + ' ' + parts[parts.length - 1]
}

async function donate() {
  const amount = custom.value && custom.value >= 1000 ? Math.floor(custom.value) : chosen.value
  if (!amount || amount < 1000) return
  sending.value = true
  playChime()

  // Đồng xu rơi vào thùng
  const id = coinId++
  coins.value.push(id)
  boxShake.value = true
  window.setTimeout(() => { coins.value = coins.value.filter((c) => c !== id); boxShake.value = false }, 900)

  try {
    await addMerit(name.value, amount)
    blessed.value = true
    window.setTimeout(() => (blessed.value = false), 4000)
    chosen.value = 0
    custom.value = null
    name.value = ''
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="card-zen relative overflow-hidden p-6 sm:p-8">
    <div class="mb-6 text-center">
      <p class="eyebrow">Gieo duyên</p>
      <h3 class="mt-1 text-2xl heading-serif">Thùng Công Đức</h3>
      <p class="mt-2 text-sm text-go/70">
        Tùy tâm cúng dường trước khi vào chùa — của ít lòng nhiều, phước đức vô lượng.
        <span v-if="!usingCloud" class="text-dong">(đang lưu tại máy bạn)</span>
      </p>
    </div>

    <div class="grid items-center gap-8 md:grid-cols-[auto_1fr]">
      <!-- Thùng gỗ -->
      <div class="relative mx-auto h-56 w-52">
        <!-- Đồng xu rơi -->
        <div class="pointer-events-none absolute left-1/2 top-0 h-24 w-24 -translate-x-1/2">
          <span v-for="c in coins" :key="c" class="coin" />
        </div>
        <svg
          viewBox="0 0 200 230"
          class="absolute inset-0 mx-auto h-56 w-52 glow-icon transition-transform"
          :class="boxShake ? 'box-shake' : ''"
        >
          <defs>
            <linearGradient id="woodM" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#8a2b22" />
              <stop offset="1" stop-color="#5a160f" />
            </linearGradient>
          </defs>
          <rect x="20" y="52" width="160" height="164" rx="10" fill="url(#woodM)" stroke="#3d0d08" stroke-width="3" />
          <polygon points="20,52 100,22 180,52 100,80" fill="#6e1c14" stroke="#3d0d08" stroke-width="2" />
          <rect x="78" y="42" width="44" height="9" rx="3" fill="#1c0705" />
          <circle cx="100" cy="140" r="46" fill="#C9A356" opacity="0.14" />
          <text x="100" y="130" text-anchor="middle" font-size="34" fill="#e8c877" font-family="serif">功</text>
          <text x="100" y="172" text-anchor="middle" font-size="34" fill="#e8c877" font-family="serif">德</text>
        </svg>
      </div>

      <!-- Chọn số tiền -->
      <div>
        <div class="mb-3 flex flex-wrap gap-2">
          <button
            v-for="a in amounts"
            :key="a"
            @click="pick(a)"
            class="rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-300"
            :class="chosen === a
              ? 'border-do bg-do text-kem shadow-glow'
              : 'border-dong/40 text-go hover:bg-dong/10'"
          >
            {{ fmt(a) }}đ
          </button>
        </div>

        <div class="mb-3 grid gap-3 sm:grid-cols-2">
          <input
            v-model="name"
            type="text"
            maxlength="40"
            placeholder="Danh xưng (tùy chọn)"
            class="rounded-xl border border-dong/30 bg-kem/60 px-4 py-3 text-go outline-none
                   transition-all duration-300 focus:border-dong focus:bg-kem"
          />
          <input
            v-model.number="custom"
            type="number"
            min="1000"
            step="1000"
            placeholder="Số tiền tùy tâm…"
            class="rounded-xl border border-dong/30 bg-kem/60 px-4 py-3 text-go outline-none
                   transition-all duration-300 focus:border-dong focus:bg-kem"
          />
        </div>

        <button class="btn-zen w-full" @click="donate" :disabled="sending">
          <span>💰</span>{{ sending ? 'Đang cúng dường…' : 'Bỏ vào thùng công đức' }}
        </button>

        <Transition name="soft">
          <p v-if="blessed" class="mt-3 text-center text-sm text-dong">
            🙏 Công đức vô lượng. Nguyện hồi hướng bình an đến quý vị.
          </p>
        </Transition>

        <!-- Tổng công đức -->
        <div class="mt-5 flex items-center justify-between rounded-2xl border border-dong/30 bg-kem/60 px-5 py-3">
          <span class="text-sm text-go/70">Tổng công đức đã gieo</span>
          <span class="font-serif text-2xl text-do">{{ fmt(total) }}đ</span>
        </div>

        <!-- Bảng công đức gần đây -->
        <div v-if="records.length" class="mt-4">
          <p class="mb-2 text-xs uppercase tracking-widest text-dong">Tấm lòng gần đây</p>
          <TransitionGroup name="soft" tag="ul" class="space-y-1.5">
            <li
              v-for="r in records"
              :key="r.id ?? r.created_at"
              class="flex items-center justify-between rounded-lg bg-do/5 px-3 py-2 text-sm"
            >
              <span class="font-serif text-do/80">{{ maskName(r.name) }}</span>
              <span class="text-go/70">{{ fmt(r.amount) }}đ</span>
            </li>
          </TransitionGroup>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.box-shake { animation: boxShake 0.5s ease-in-out; }
@keyframes boxShake {
  0%, 100% { transform: translateY(0); }
  25% { transform: translateY(-6px) rotate(-1deg); }
  60% { transform: translateY(2px) rotate(1deg); }
}
.coin {
  position: absolute;
  left: 50%;
  top: -56px;
  height: 26px;
  width: 26px;
  transform: translateX(-50%);
  border-radius: 9999px;
  background: radial-gradient(circle at 35% 30%, #fff2b0, #e8b23a 60%, #a9781a);
  border: 2px solid #b8860b;
  animation: coinDrop 0.9s cubic-bezier(0.5, 0, 0.9, 0.5) forwards;
}
@keyframes coinDrop {
  0% { top: -56px; opacity: 0; transform: translateX(-50%) scale(1) rotate(0); }
  20% { opacity: 1; }
  100% { top: 70px; opacity: 0; transform: translateX(-50%) scale(0.4) rotate(220deg); }
}
</style>
