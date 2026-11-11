<script setup lang="ts">
// Trang chủ: Hero với chùa mờ ảo + khói nhang bay
</script>

<template>
  <main class="relative min-h-screen overflow-hidden">
    <!-- Nền chùa mờ ảo -->
    <div class="pointer-events-none absolute inset-0 -z-10">
      <div class="absolute inset-0 bg-gradient-to-b from-kem via-kem to-[#efe6d0]" />
      <!-- Bóng núi & chùa xa (SVG mờ) -->
      <svg viewBox="0 0 1200 600" preserveAspectRatio="xMidYMax slice" class="absolute inset-x-0 bottom-0 h-[75vh] w-full opacity-[0.5]">
        <defs>
          <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#C9A356" stop-opacity="0.0" />
            <stop offset="1" stop-color="#8B2E2E" stop-opacity="0.18" />
          </linearGradient>
        </defs>
        <path d="M0 460 Q300 380 600 440 T1200 430 V600 H0 Z" fill="url(#mist)" />
        <!-- Mái chùa cách điệu -->
        <g fill="#4A3728" opacity="0.35" transform="translate(500 300)">
          <path d="M100 60 L20 120 H180 Z" />
          <rect x="55" y="120" width="90" height="90" />
          <path d="M100 20 L60 60 H140 Z" />
          <rect x="90" y="205" width="20" height="60" />
        </g>
        <g fill="#4A3728" opacity="0.2">
          <path d="M180 340 L120 390 H240 Z" /><rect x="150" y="390" width="60" height="70" />
          <path d="M980 350 L920 400 H1040 Z" /><rect x="950" y="400" width="60" height="70" />
        </g>
      </svg>
      <!-- Khói nhang toàn cảnh -->
      <div class="absolute inset-x-0 bottom-0 h-[70vh]">
        <IncenseSmoke :active="true" :intensity="4" :max-particles="40" />
      </div>
      <!-- Vầng sáng ấm -->
      <div class="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-dong/20 blur-3xl animate-breathe" />
    </div>

    <!-- Thùng công đức nơi cổng chùa (đưa lên trên cùng) -->
    <section id="cong-duc" class="container-zen pb-8 pt-16">
      <p class="mx-auto mb-10 max-w-2xl text-center text-lg leading-relaxed text-go/75 animate-fade-up">
        Một chốn thiền tịnh giữa đời sống hối hả — thắp nén tâm hương,
        thỉnh một tiếng chuông, gửi lời cầu an và xin một quẻ đầu năm.
      </p>
      <div class="mx-auto max-w-4xl">
        <MeritBox />
        <div class="mt-8 text-center">
          <NuxtLink to="/hanh-huong" class="btn-zen text-base">
            <span>🏔️</span> Hành hương 3D — leo núi vào chùa
          </NuxtLink>
          <NuxtLink to="/chua" class="btn-zen text-base ml-2 opacity-80">
            <span>🪷</span> Vào chùa (bản cũ)
          </NuxtLink>
          <p class="mt-3 text-xs text-go/50">Cúng dường tùy tâm, không bắt buộc — bạn có thể vào chùa bất cứ lúc nào.</p>
        </div>
      </div>
    </section>

    <LotusDivider class="container-zen my-6" />

    <!-- Giới thiệu ngắn -->
    <section id="gioi-thieu" class="container-zen pb-28 pt-8">
      <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <div
          v-for="f in [
            { i: '🕯️', t: 'Thắp nhang', d: 'Dâng 1, 3 hoặc 5 nén hương, khói tỏa an nhiên.' },
            { i: '🔔', t: 'Rung chuông', d: 'Tiếng chuông ngân, lắng lòng buông muộn phiền.' },
            { i: '📿', t: 'Tụng kinh', d: 'Tụng kinh niệm Phật theo nhịp mõ, nhiếp tâm an trú.' },
            { i: '🪷', t: 'Cầu an', d: 'Ghi lời nguyện lành vào sổ vàng thiền môn.' },
            { i: '🎋', t: 'Xin xăm', d: 'Gieo một quẻ, tùy duyên nghe lời chỉ dẫn.' }
          ]"
          :key="f.t"
          class="card-zen p-6 text-center transition-transform duration-500 hover:-translate-y-1"
        >
          <div class="mx-auto mb-3 text-3xl glow-icon">{{ f.i }}</div>
          <h3 class="font-serif text-xl text-do">{{ f.t }}</h3>
          <p class="mt-2 text-sm leading-relaxed text-go/70">{{ f.d }}</p>
        </div>
      </div>
    </section>
  </main>
</template>
