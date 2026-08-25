<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

/**
 * Khói nhang bằng Canvas 2D — tối ưu hiệu năng:
 *  - Giới hạn số particle tối đa (maxParticles).
 *  - Chỉ một vòng requestAnimationFrame, tự dừng khi tab ẩn.
 *  - Emitter phát theo nhịp, không tạo tràn lan.
 */
const props = withDefaults(
  defineProps<{
    active?: boolean
    intensity?: number // 1..5 -> số nguồn khói
    maxParticles?: number
  }>(),
  { active: true, intensity: 3, maxParticles: 46 }
)

const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let raf = 0
let running = false
let W = 0
let H = 0
let dpr = 1
let lastEmit = 0

interface P { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number; sway: number }
const particles: P[] = []

function resize() {
  const c = canvas.value
  if (!c) return
  const parent = c.parentElement
  if (!parent) return
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  W = parent.clientWidth
  H = parent.clientHeight
  c.width = W * dpr
  c.height = H * dpr
  c.style.width = W + 'px'
  c.style.height = H + 'px'
  ctx = c.getContext('2d')
  if (ctx) ctx.scale(dpr, dpr)
}

function spawn() {
  if (particles.length >= props.maxParticles) return
  const sources = Math.max(1, Math.min(5, props.intensity))
  const spread = 46
  for (let i = 0; i < sources; i++) {
    if (particles.length >= props.maxParticles) break
    const baseX = W / 2 + (i - (sources - 1) / 2) * spread + (Math.random() * 12 - 6)
    particles.push({
      x: baseX,
      y: H - 8,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -(0.5 + Math.random() * 0.55),
      life: 0,
      max: 150 + Math.random() * 90,
      r: 6 + Math.random() * 6,
      sway: Math.random() * Math.PI * 2
    })
  }
}

function step(t: number) {
  if (!ctx) return
  ctx.clearRect(0, 0, W, H)
  ctx.globalCompositeOperation = 'lighter'

  if (props.active && t - lastEmit > 260) {
    spawn()
    lastEmit = t
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.life++
    p.sway += 0.02
    p.x += p.vx + Math.sin(p.sway) * 0.35
    p.y += p.vy
    p.vy *= 0.997
    const k = p.life / p.max
    if (k >= 1) { particles.splice(i, 1); continue }
    const alpha = Math.sin(k * Math.PI) * 0.22 // mờ dần vào/ra
    const radius = p.r * (1 + k * 2.6)
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius)
    g.addColorStop(0, `rgba(230,225,210,${alpha})`)
    g.addColorStop(1, 'rgba(230,225,210,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalCompositeOperation = 'source-over'
  raf = requestAnimationFrame(step)
}

function start() {
  if (running) return
  running = true
  raf = requestAnimationFrame(step)
}
function stop() {
  running = false
  cancelAnimationFrame(raf)
}

function onVisibility() {
  if (document.hidden) stop()
  else start()
}

onMounted(() => {
  resize()
  window.addEventListener('resize', resize)
  document.addEventListener('visibilitychange', onVisibility)
  start()
})
onBeforeUnmount(() => {
  stop()
  window.removeEventListener('resize', resize)
  document.removeEventListener('visibilitychange', onVisibility)
})

watch(() => props.active, (a) => { if (a) start() })
</script>

<template>
  <canvas ref="canvas" class="pointer-events-none absolute inset-0 h-full w-full" />
</template>
