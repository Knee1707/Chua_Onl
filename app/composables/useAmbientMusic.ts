import { ref } from 'vue'

/**
 * Nhạc nền "chill" không lời — tổng hợp bằng Web Audio API (không cần file).
 * Gồm: một lớp pad trầm ấm ngân nhẹ + vài nốt ngũ cung buông lơi (twinkle)
 * vang thưa, âm lượng rất khẽ để thư giãn, không chói tai.
 */
const playing = ref(false)

let ctx: AudioContext | null = null
let master: GainNode | null = null
let filter: BiquadFilterNode | null = null
const padOscs: OscillatorNode[] = []
let filterLfo: OscillatorNode | null = null
let twinkleTimer: number | null = null

// Hợp âm nền ấm (A minor: A2, E3, A3) — trầm, dịu
const PAD = [110.0, 164.81, 220.0]
// Nốt ngũ cung A thứ (A C D E G) rải nhiều quãng — nghe thư thái
const PENTA = [220.0, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25]

function twinkle() {
  if (!ctx || !master) return
  const now = ctx.currentTime
  const freq = PENTA[Math.floor(Math.random() * PENTA.length)]
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = 'sine'
  o.frequency.value = freq
  // Vào nhanh, tắt chậm (như tiếng đàn/music box), rất khẽ
  g.gain.setValueAtTime(0.0001, now)
  g.gain.exponentialRampToValueAtTime(0.06, now + 0.05)
  g.gain.exponentialRampToValueAtTime(0.0001, now + 2.6)
  o.connect(g)
  g.connect(master)
  o.start(now)
  o.stop(now + 2.8)

  // Hẹn nốt kế tiếp cách nhau 2.4–4.8s (buông lơi, không dồn dập)
  const next = 2400 + Math.random() * 2400
  twinkleTimer = window.setTimeout(twinkle, next)
}

export function useAmbientMusic() {
  function start() {
    if (playing.value || !import.meta.client) return
    const AC = window.AudioContext || (window as any).webkitAudioContext
    if (!AC) return
    if (!ctx) ctx = new AC()
    if (ctx.state === 'suspended') ctx.resume()

    const now = ctx.currentTime
    master = ctx.createGain()
    master.gain.setValueAtTime(0.0001, now)
    master.gain.exponentialRampToValueAtTime(0.11, now + 4) // vào thật êm

    // Bộ lọc dịu + quét chậm cho có chiều sâu
    filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 720
    filter.Q.value = 0.4
    master.connect(filter)
    filter.connect(ctx.destination)

    // Pad trầm ấm
    PAD.forEach((freq, i) => {
      const o = ctx!.createOscillator()
      const g = ctx!.createGain()
      o.type = 'sine'
      o.frequency.value = freq
      o.detune.value = (i - 1) * 4
      g.gain.value = 0.09 / (i * 0.4 + 1)
      o.connect(g)
      g.connect(master!)
      o.start(now)
      padOscs.push(o)
    })

    // LFO quét nhẹ tần số cắt của bộ lọc -> âm "thở" chậm
    filterLfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    filterLfo.frequency.value = 0.05
    lfoGain.gain.value = 220
    filterLfo.connect(lfoGain)
    lfoGain.connect(filter.frequency)
    filterLfo.start(now)

    // Bắt đầu rải nốt ngũ cung sau vài giây
    twinkleTimer = window.setTimeout(twinkle, 2600)

    playing.value = true
  }

  function stop() {
    if (!ctx || !master) { playing.value = false; return }
    const now = ctx.currentTime
    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(master.gain.value, now)
    master.gain.exponentialRampToValueAtTime(0.0001, now + 1.5)
    if (twinkleTimer) { clearTimeout(twinkleTimer); twinkleTimer = null }
    const toStop = [...padOscs]
    const lfoRef = filterLfo
    window.setTimeout(() => {
      toStop.forEach((o) => { try { o.stop() } catch {} })
      try { lfoRef?.stop() } catch {}
    }, 1700)
    padOscs.length = 0
    filterLfo = null
    playing.value = false
  }

  function toggle() {
    playing.value ? stop() : start()
  }

  return { playing, start, stop, toggle }
}
