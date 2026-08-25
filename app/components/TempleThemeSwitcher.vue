<script setup lang="ts">
import { useTempleTheme } from '~/composables/useTempleTheme'

const { current, themes, setTheme } = useTempleTheme()
</script>

<template>
  <div class="card-zen p-6 sm:p-8">
    <div class="mb-5 text-center">
      <p class="eyebrow">Không gian</p>
      <h3 class="mt-1 text-2xl heading-serif">Chọn Cảnh Chùa</h3>
      <p class="mt-2 text-sm text-go/70">Mỗi miền một sắc thái kiến trúc, chọn nơi bạn muốn viếng.</p>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <button
        v-for="t in themes"
        :key="t.id"
        @click="setTheme(t.id)"
        class="group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-500 ease-in-out"
        :class="current.id === t.id
          ? 'border-do shadow-glow'
          : 'border-dong/30 hover:border-dong hover:-translate-y-0.5'"
        :style="{ background: `linear-gradient(160deg, rgba(${t.paper},0.9), rgba(${t.accent},0.16))` }"
      >
        <!-- Motif -->
        <div
          class="mb-3 flex h-12 w-12 items-center justify-center rounded-full text-xl glow-icon"
          :style="{ background: `rgba(${t.deep},0.12)`, color: `rgb(${t.deep})` }"
        >
          <span v-if="t.id === 'bac'">🏯</span>
          <span v-else-if="t.id === 'trung'">🛕</span>
          <span v-else>🪷</span>
        </div>
        <div class="font-serif text-lg font-semibold" :style="{ color: `rgb(${t.deep})` }">
          {{ t.name }}
        </div>
        <div class="mt-1 text-xs uppercase tracking-wider" :style="{ color: `rgb(${t.accent})` }">
          {{ t.region }} · {{ t.motif }}
        </div>
        <p class="mt-2 text-sm leading-relaxed text-go/75">{{ t.desc }}</p>

        <span
          v-if="current.id === t.id"
          class="absolute right-3 top-3 rounded-full bg-do px-2 py-0.5 text-[10px] text-kem"
        >đang viếng</span>
      </button>
    </div>
  </div>
</template>
