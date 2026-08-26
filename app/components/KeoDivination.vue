<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSound } from '~/composables/useSound'

const { playWoodenFish, playBell } = useSound()

const name = ref('')
const wish = ref('')
const err = ref('')

// Xóa báo lỗi ngay khi người dùng bắt đầu viết
watch(wish, (v) => { if (v.trim()) err.value = '' })
const phase = ref<'idle' | 'tossing' | 'result'>('idle')
const blocks = ref<[boolean, boolean]>([false, false]) // true = ngửa (dương), false = úp (âm)
const result = ref<{ key: string; title: string; desc: string; cls: string } | null>(null)
const solat = ref(0) // số lần thánh keo liên tiếp

function gieo() {
  if (phase.value === 'tossing') return
  // Bắt buộc phải có lời thỉnh cầu mới cho gieo
  if (!wish.value.trim()) {
    err.value = 'Xin hãy viết lời thỉnh cầu trước khi gieo keo.'
    return
  }
  err.value = ''
  phase.value = 'tossing'
  result.value = null
  playWoodenFish()
  window.setTimeout(() => {
    const b0 = Math.random() < 0.5
    const b1 = Math.random() < 0.5
    blocks.value = [b0, b1]
    const up = (b0 ? 1 : 0) + (b1 ? 1 : 0)
    if (up === 1) {
      result.value = {
        key: 'thanh',
        title: 'Thánh Keo — Ơn trên chấp thuận',
        desc: 'Một mặt ngửa một mặt úp (nhất âm nhất dương). Lời thỉnh cầu được chứng giám và chấp thuận. Nếu gieo được 3 lần Thánh Keo liên tiếp thì càng linh ứng.',
        cls: 'text-do'
      }
      solat.value++
      playBell()
    } else if (up === 2) {
      result.value = {
        key: 'cuoi',
        title: 'Cười Keo — Ý còn chưa rõ',
        desc: 'Cả hai mặt ngửa. Ơn trên đang mỉm cười, lời thỉnh cầu chưa rõ ràng hoặc chưa đến lúc. Hãy tĩnh tâm, khấn lại cho thành kính rồi gieo tiếp.',
        cls: 'text-dong'
      }
      solat.value = 0
    } else {
      result.value = {
        key: 'am',
        title: 'Âm Keo — Chưa được chấp thuận',
        desc: 'Cả hai mặt úp. Lời thỉnh cầu chưa được chấp thuận lúc này. Hãy giữ tâm thành, tích thêm phước lành rồi cầu lại sau.',
        cls: 'text-go'
      }
      solat.value = 0
    }
    playWoodenFish()
    phase.value = 'result'
  }, 1150)
}

function gieoLai() {
  phase.value = 'idle'
  result.value = null
}

function doiThinhCau() {
  phase.value = 'idle'
  result.value = null
  solat.value = 0
}
</script>

<template>
  <div class="card-zen p-6 sm:p-8">
    <div class="mb-5 text-center">
      <p class="eyebrow">Thỉnh nguyện</p>
      <h3 class="mt-1 text-2xl heading-serif">Xin Keo · Gieo Âm Dương</h3>
      <p class="mt-2 text-sm text-go/70">Viết lời thỉnh cầu, thành tâm khấn nguyện rồi gieo keo xin ý.</p>
    </div>

    <!-- BƯỚC 1: Viết lời thỉnh cầu -->
    <div v-if="phase === 'idle'" class="mx-auto max-w-xl space-y-4">
      <div>
        <label class="mb-1 block text-sm text-go/80">Danh xưng (có thể để trống)</label>
        <input
          v-model="name"
          type="text"
          maxlength="40"
          placeholder="VD: Nguyễn Văn An"
          class="w-full rounded-xl border border-dong/30 bg-kem/60 px-4 py-3 text-go outline-none
                 transition-all duration-300 focus:border-dong focus:bg-kem"
        />
      </div>
      <div>
        <label class="mb-1 block text-sm text-go/80">Lời thỉnh cầu <span class="text-do">*</span></label>
        <textarea
          v-model="wish"
          rows="4"
          maxlength="240"
          placeholder="Con tên là… nay thành tâm kính xin… (cầu công danh, sức khỏe, bình an, chuyện tình duyên…)"
          class="w-full resize-none rounded-xl border border-dong/30 bg-kem/60 px-4 py-3 text-go outline-none
                 transition-all duration-300 focus:border-dong focus:bg-kem"
        />
        <p class="mt-1 text-right text-xs text-go/50">{{ wish.length }}/240</p>
      </div>
      <button class="btn-zen w-full" @click="gieo">
        <span>🥠</span> Thành tâm gieo keo
      </button>
      <Transition name="soft">
        <p v-if="err" class="text-center text-sm text-do">{{ err }}</p>
      </Transition>
    </div>

    <!-- BƯỚC 2: Gieo keo (đang tung) & Kết quả -->
    <div v-else class="text-center">
      <!-- Nhắc lại lời thỉnh cầu -->
      <div class="mx-auto mb-6 max-w-xl rounded-xl bg-do/5 px-4 py-3 text-sm italic text-go/80">
        <span v-if="name" class="font-serif text-do/80">{{ name }} khấn: </span>"{{ wish }}"
      </div>

      <!-- Hai đồng keo -->
      <div class="mb-6 flex items-end justify-center gap-8">
        <div
          v-for="(b, i) in blocks"
          :key="i"
          class="keo"
          :class="[phase === 'tossing' ? 'tossing' : (b ? 'ngua' : 'up'), i === 1 ? 'delay' : '']"
        >
          <svg viewBox="0 0 80 60" class="h-20 w-24 glow-icon">
            <!-- Mặt úp (âm): vòm tối -->
            <template v-if="phase !== 'tossing' && !b">
              <path d="M8 46 Q40 6 72 46 Z" fill="#7a1f16" stroke="#3d0d08" stroke-width="2" />
              <path d="M22 40 Q40 20 58 40" fill="none" stroke="#c9a356" stroke-width="2" opacity="0.5" />
            </template>
            <!-- Mặt ngửa (dương): mặt phẳng sáng -->
            <template v-else-if="phase !== 'tossing' && b">
              <path d="M8 40 Q40 52 72 40 L72 46 Q40 58 8 46 Z" fill="#9c3a2a" stroke="#3d0d08" stroke-width="1.5" />
              <ellipse cx="40" cy="40" rx="32" ry="9" fill="#e7c98a" stroke="#8a6b2b" stroke-width="1.5" />
              <circle cx="40" cy="40" r="4" fill="#8B2E2E" />
            </template>
            <!-- Đang tung: hình vòm chung -->
            <template v-else>
              <path d="M8 46 Q40 6 72 46 Z" fill="#8B2E2E" stroke="#3d0d08" stroke-width="2" />
            </template>
          </svg>
          <p v-if="phase === 'result'" class="mt-1 text-xs text-go/60">{{ b ? 'Ngửa (dương)' : 'Úp (âm)' }}</p>
        </div>
      </div>

      <p v-if="phase === 'tossing'" class="text-sm italic text-go/60">Đang gieo keo…</p>

      <!-- Kết quả -->
      <Transition name="soft">
        <div v-if="phase === 'result' && result" class="mx-auto max-w-xl">
          <div class="rounded-2xl border-2 border-dong/50 bg-gradient-to-b from-[#fbf6e9] to-[#f1e6cd] p-6 shadow-soft">
            <h4 class="font-serif text-xl font-semibold" :class="result.cls">{{ result.title }}</h4>
            <p class="mt-3 text-sm leading-relaxed text-go/80">{{ result.desc }}</p>
            <p v-if="result.key === 'thanh' && solat > 1" class="mt-3 text-sm font-semibold text-do">
              🙏 Đã {{ solat }} lần Thánh Keo liên tiếp — thật linh ứng!
            </p>
          </div>
          <div class="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <button class="btn-zen" @click="gieo"><span>🥠</span> Gieo lại quẻ này</button>
            <button class="btn-ghost" @click="doiThinhCau">Viết lời thỉnh cầu khác</button>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.keo { display: flex; flex-direction: column; align-items: center; }
.keo.tossing { animation: toss 0.55s ease-in-out infinite; }
.keo.tossing.delay { animation-delay: 0.12s; }
@keyframes toss {
  0%, 100% { transform: translateY(0) rotate(0); }
  50% { transform: translateY(-38px) rotate(180deg); }
}
.keo.up svg, .keo.ngua svg { animation: settle 0.5s ease-out; }
@keyframes settle {
  0% { transform: translateY(-24px) scale(0.9); opacity: 0.4; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}
</style>
