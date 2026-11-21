<script setup lang="ts">
import { ref } from 'vue'
import { useProgress } from '~/composables/useProgress'
import { useSound } from '~/composables/useSound'

const { award, track } = useProgress()
const { playChime } = useSound()

const bows = ref(0)
const bowing = ref(false)
const done = ref(false)

const PHRASES = [
  'Nam mô A Di Đà Phật',
  'Nam mô Bổn Sư Thích Ca Mâu Ni Phật',
  'Nam mô Đại Từ Đại Bi Quán Thế Âm Bồ Tát'
]

function bow() {
  if (bowing.value || done.value) return
  bowing.value = true
  playChime()
  window.setTimeout(() => {
    bows.value += 1
    bowing.value = false
    if (bows.value >= 3) {
      done.value = true
      track('bow', 3)
      award(15, 'lạy Phật')
    } else {
      track('bow', 1)
    }
  }, 900)
}

function reset() { bows.value = 0; done.value = false }
</script>

<template>
  <div class="card-zen relative overflow-hidden p-6 sm:p-8 text-center">
    <p class="eyebrow">Thành kính</p>
    <h3 class="mt-1 text-2xl heading-serif">Lạy Phật</h3>
    <p class="mt-2 text-sm text-go/70">Nhất tâm đảnh lễ — mỗi lạy một niệm an.</p>

    <!-- người lạy -->
    <div class="relative mx-auto my-6 grid h-52 w-52 place-items-end">
      <div class="absolute inset-x-0 top-2 text-5xl glow-icon">🙏</div>
      <div class="bower text-6xl" :class="{ down: bowing }">🧘</div>
      <div class="absolute inset-x-0 bottom-0 h-2 rounded-full bg-dong/30" />
    </div>

    <p class="mb-4 min-h-[1.5rem] font-serif text-lg text-do">
      {{ done ? 'Xin hồi hướng công đức khắp pháp giới 🙏' : (bows > 0 ? PHRASES[bows - 1] : 'Chắp tay, lạy xuống…') }}
    </p>

    <div class="mb-4 flex justify-center gap-2">
      <span v-for="i in 3" :key="i"
        class="h-3 w-3 rounded-full transition-colors duration-500"
        :class="i <= bows ? 'bg-do' : 'bg-dong/25'" />
    </div>

    <button v-if="!done" class="btn-zen" @click="bow" :disabled="bowing">
      <span>🙇</span>{{ bowing ? 'Đang lạy…' : `Lạy Phật (${bows}/3)` }}
    </button>
    <button v-else class="btn-ghost" @click="reset">Lạy thêm một lần nữa</button>
  </div>
</template>

<style scoped>
.bower { transform-origin: bottom center; transition: transform .9s ease-in-out; }
.bower.down { transform: translateY(14px) scaleY(.78) rotate(0deg); }
</style>
