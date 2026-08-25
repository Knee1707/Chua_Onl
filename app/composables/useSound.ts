/**
 * Âm thanh tổng hợp bằng Web Audio API — không cần file nhạc, chạy offline.
 * - playBell(): tiếng chuông đồng ngân vang, tắt dần.
 * - playChime(): tiếng nhẹ khi thắp nhang / tương tác.
 */
let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (!import.meta.client) return null
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

export function useSound() {
  function playBell() {
    const ac = getCtx()
    if (!ac) return
    const now = ac.currentTime
    const master = ac.createGain()
    master.gain.setValueAtTime(0.0001, now)
    master.gain.exponentialRampToValueAtTime(0.5, now + 0.02)
    master.gain.exponentialRampToValueAtTime(0.0001, now + 4.5)
    master.connect(ac.destination)

    // Tổ hợp bội âm kim loại (partials) cho tiếng chuông đồng
    const partials = [
      { f: 220, g: 1.0 },
      { f: 520, g: 0.5 },
      { f: 880, g: 0.28 },
      { f: 1200, g: 0.16 },
      { f: 1660, g: 0.1 }
    ]
    partials.forEach((p, i) => {
      const osc = ac.createOscillator()
      const g = ac.createGain()
      osc.type = 'sine'
      osc.frequency.value = p.f
      g.gain.setValueAtTime(p.g, now)
      g.gain.exponentialRampToValueAtTime(0.0001, now + 4.5 - i * 0.4)
      osc.connect(g)
      g.connect(master)
      osc.start(now)
      osc.stop(now + 4.6)
    })
  }

  function playChime() {
    const ac = getCtx()
    if (!ac) return
    const now = ac.currentTime
    const osc = ac.createOscillator()
    const g = ac.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(880, now)
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12)
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(0.18, now + 0.03)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.9)
    osc.connect(g)
    g.connect(ac.destination)
    osc.start(now)
    osc.stop(now + 1)
  }

  function playWoodenFish() {
    // Tiếng mõ "cốc" — knock trầm, tắt rất nhanh, có tiếng gõ đầu.
    const ac = getCtx()
    if (!ac) return
    const now = ac.currentTime

    // Thân tiếng (cộng hưởng gỗ)
    const osc = ac.createOscillator()
    const g = ac.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(320, now)
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.09)
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(0.45, now + 0.005)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16)
    osc.connect(g)
    g.connect(ac.destination)
    osc.start(now)
    osc.stop(now + 0.18)

    // Tiếng gõ đầu (click gỗ) bằng noise ngắn
    const dur = 0.03
    const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
    }
    const noise = ac.createBufferSource()
    noise.buffer = buffer
    const ng = ac.createGain()
    ng.gain.setValueAtTime(0.25, now)
    ng.gain.exponentialRampToValueAtTime(0.0001, now + dur)
    const bp = ac.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 1400
    noise.connect(bp)
    bp.connect(ng)
    ng.connect(ac.destination)
    noise.start(now)
    noise.stop(now + dur)
  }

  return { playBell, playChime, playWoodenFish }
}
