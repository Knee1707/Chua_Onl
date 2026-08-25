<script setup lang="ts">
import { useTempleTheme } from '~/composables/useTempleTheme'
const { current } = useTempleTheme()
</script>

<template>
  <main class="relative min-h-screen pb-24">
    <!-- Thanh trên -->
    <header class="sticky top-0 z-30 border-b border-dong/20 bg-kem/80 backdrop-blur-md">
      <div class="container-zen flex items-center justify-between py-4">
        <NuxtLink to="/" class="flex items-center gap-2 font-serif text-lg text-do">
          <span class="text-2xl glow-icon">☸</span> Đi Chùa Online
        </NuxtLink>
        <span class="hidden text-sm text-go/60 sm:block">
          Đang viếng: <b class="text-do">{{ current.name }}</b>
        </span>
      </div>
    </header>

    <div class="container-zen pt-10">
      <div class="text-center animate-fade-up">
        <p class="eyebrow">Chánh điện trực tuyến</p>
        <h1 class="mt-2 text-4xl text-do sm:text-5xl">Không Gian Tịnh Tâm</h1>
        <p class="mx-auto mt-4 max-w-2xl text-go/70">
          Hãy để lòng lắng lại. Chọn một nghi thức để bắt đầu hành trình an yên của bạn.
        </p>
      </div>

      <LotusDivider class="my-10" />

      <!-- Lịch âm + chọn không gian -->
      <div class="grid gap-6 lg:grid-cols-2">
        <LunarCalendar />
        <TempleThemeSwitcher />
      </div>

      <!-- Thắp nhang + Rung chuông -->
      <div class="mt-6 grid gap-6 lg:grid-cols-2">
        <IncenseBurner />
        <TempleBell />
      </div>

      <!-- Tụng kinh -->
      <div class="mt-6">
        <SutraChanting />
      </div>

      <!-- Xin xăm -->
      <div class="mt-6">
        <FortuneStick />
      </div>

      <!-- Cầu an -->
      <div class="mt-6">
        <PrayerBook />
      </div>

      <LotusDivider class="my-12" />
      <p class="text-center text-sm text-go/50">
        🙏 Nguyện đem công đức này, hướng về khắp tất cả, đệ tử và chúng sinh, đều trọn thành Phật đạo.
      </p>
    </div>
  </main>
</template>
