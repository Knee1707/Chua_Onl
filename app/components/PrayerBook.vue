<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePrayers } from '~/composables/usePrayers'

const { prayers, loading, usingCloud, fetchRecent, addPrayer } = usePrayers()

const name = ref('')
const wish = ref('')
const sending = ref(false)
const justSent = ref(false)
const error = ref('')

onMounted(() => fetchRecent())

function maskName(n: string): string {
  const s = (n || 'Ẩn danh').trim()
  const parts = s.split(/\s+/)
  if (parts.length === 1) {
    return s.length <= 2 ? s : s[0] + '•'.repeat(Math.max(1, s.length - 2)) + s.slice(-1)
  }
  // Giữ họ + tên, ẩn phần đệm
  return parts[0] + ' ' + '•'.repeat(2) + ' ' + parts[parts.length - 1]
}

function timeAgo(iso?: string): string {
  if (!iso) return 'vừa xong'
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'vừa xong'
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
  return `${Math.floor(diff / 86400)} ngày trước`
}

async function submit() {
  error.value = ''
  if (!wish.value.trim()) {
    error.value = 'Xin nhập lời nguyện của bạn.'
    return
  }
  sending.value = true
  try {
    await addPrayer(name.value, wish.value)
    wish.value = ''
    name.value = ''
    justSent.value = true
    window.setTimeout(() => (justSent.value = false), 3500)
  } catch (e: any) {
    error.value = 'Không gửi được lời nguyện, thử lại nhé.'
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="card-zen p-6 sm:p-8">
    <div class="mb-5 text-center">
      <p class="eyebrow">Sổ vàng</p>
      <h3 class="mt-1 text-2xl heading-serif">Cầu An · Ghi Sổ Nguyện</h3>
      <p class="mt-2 text-sm text-go/70">
        Viết lời nguyện lành, gửi vào chốn thiền môn.
        <span v-if="!usingCloud" class="text-dong">(đang lưu tại máy bạn)</span>
      </p>
    </div>

    <div class="grid gap-8 md:grid-cols-2">
      <!-- Form -->
      <form @submit.prevent="submit" class="space-y-4">
        <div>
          <label class="mb-1 block text-sm text-go/80">Danh xưng (có thể để trống)</label>
          <input
            v-model="name"
            type="text"
            maxlength="40"
            placeholder="VD: Nguyễn Văn An"
            class="w-full rounded-xl border border-dong/30 bg-kem/60 px-4 py-3 text-go
                   outline-none transition-all duration-300 focus:border-dong focus:bg-kem"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm text-go/80">Lời nguyện</label>
          <textarea
            v-model="wish"
            rows="4"
            maxlength="240"
            placeholder="Cầu cho gia đạo bình an, sức khỏe dồi dào…"
            class="w-full resize-none rounded-xl border border-dong/30 bg-kem/60 px-4 py-3 text-go
                   outline-none transition-all duration-300 focus:border-dong focus:bg-kem"
          />
          <p class="mt-1 text-right text-xs text-go/50">{{ wish.length }}/240</p>
        </div>

        <p v-if="error" class="text-sm text-do">{{ error }}</p>

        <button type="submit" class="btn-zen w-full" :disabled="sending">
          <span>🪷</span>{{ sending ? 'Đang dâng lời nguyện…' : 'Dâng lời nguyện' }}
        </button>

        <Transition name="soft">
          <p v-if="justSent" class="text-center text-sm text-dong">
            🙏 Lời nguyện đã được ghi vào sổ. Nam Mô A Di Đà Phật.
          </p>
        </Transition>
      </form>

      <!-- Sổ vàng cuộn -->
      <div class="relative">
        <div
          class="prayer-scroll max-h-80 space-y-3 overflow-y-auto rounded-2xl border border-dong/30
                 bg-gradient-to-b from-[#fbf6e9] to-[#f3ead3] p-4 shadow-inner"
        >
          <p v-if="loading" class="py-8 text-center text-sm text-go/50">Đang mở sổ…</p>
          <p v-else-if="!prayers.length" class="py-8 text-center text-sm text-go/50">
            Chưa có lời nguyện nào. Hãy là người đầu tiên 🙏
          </p>
          <TransitionGroup name="soft" tag="div" class="space-y-3">
            <div
              v-for="p in prayers"
              :key="p.id ?? p.created_at"
              class="rounded-xl border border-dong/20 bg-kem/70 px-4 py-3"
            >
              <p class="text-[15px] leading-relaxed text-go">"{{ p.wish }}"</p>
              <div class="mt-2 flex items-center justify-between text-xs text-go/55">
                <span class="font-serif text-do/80">— {{ maskName(p.name) }}</span>
                <span>{{ timeAgo(p.created_at) }}</span>
              </div>
            </div>
          </TransitionGroup>
        </div>
        <div class="pointer-events-none absolute inset-x-0 bottom-0 h-8 rounded-b-2xl bg-gradient-to-t from-[#f3ead3] to-transparent" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.prayer-scroll::-webkit-scrollbar { width: 6px; }
.prayer-scroll::-webkit-scrollbar-thumb { background: rgba(201,163,86,0.5); border-radius: 999px; }
</style>
