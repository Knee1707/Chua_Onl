<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { solarToLunar, canChiYear, daysUntilLunar, type LunarDate } from '~/composables/useLunar'

const lunar = ref<LunarDate | null>(null)
const canChi = ref('')
const toMung1 = ref(0)
const toRam = ref(0)
const solarStr = ref('')

// Tính toàn bộ ở client để tránh lệch múi giờ giữa server/client (hydration)
onMounted(() => {
  const today = new Date()
  solarStr.value = today.toLocaleDateString('vi-VN', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
  })
  const l = solarToLunar(today.getDate(), today.getMonth() + 1, today.getFullYear())
  lunar.value = l
  canChi.value = canChiYear(l.year)
  toMung1.value = daysUntilLunar(1)
  toRam.value = daysUntilLunar(15)
})

function label(n: number) {
  if (n === 0) return 'Hôm nay'
  return `Còn ${n} ngày`
}
</script>

<template>
  <div class="card-zen p-6 sm:p-8">
    <div class="mb-5 text-center">
      <p class="eyebrow">Thời khắc</p>
      <h3 class="mt-1 text-2xl heading-serif">Lịch Âm & Nhắc Lễ</h3>
    </div>

    <div class="mx-auto max-w-md text-center">
      <!-- Ngày âm lớn -->
      <div class="relative mx-auto flex h-40 w-40 items-center justify-center">
        <div class="absolute inset-0 rounded-full bg-do/5 animate-breathe" />
        <div class="absolute inset-2 rounded-full border border-dong/40" />
        <div class="relative">
          <div class="font-serif text-6xl font-semibold text-do leading-none">
            {{ lunar ? lunar.day : '–' }}
          </div>
          <div class="mt-1 text-sm text-go/70">
            tháng {{ lunar ? lunar.month : '–' }}{{ lunar?.leap ? ' (nhuận)' : '' }} ÂL
          </div>
        </div>
      </div>

      <p class="mt-4 font-serif text-lg text-go">Năm {{ canChi }}</p>
      <p class="mt-1 text-sm capitalize text-go/60">{{ solarStr }}</p>

      <!-- Đếm ngược -->
      <div class="mt-6 grid grid-cols-2 gap-3">
        <div class="rounded-2xl border border-dong/30 bg-kem/60 p-4">
          <div class="text-xs uppercase tracking-widest text-dong">Mùng 1</div>
          <div class="mt-1 font-serif text-xl text-do">{{ label(toMung1) }}</div>
        </div>
        <div class="rounded-2xl border border-dong/30 bg-kem/60 p-4">
          <div class="text-xs uppercase tracking-widest text-dong">Ngày Rằm</div>
          <div class="mt-1 font-serif text-xl text-do">{{ label(toRam) }}</div>
        </div>
      </div>
      <p class="mt-4 text-xs text-go/50">Ngày Rằm và Mùng 1 là dịp lễ Phật, cầu an theo truyền thống.</p>
    </div>
  </div>
</template>
