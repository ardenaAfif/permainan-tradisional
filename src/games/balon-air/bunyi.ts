/** Bunyi Pecah Balon Air (sintesis, lihat shared/audio/synth.ts). */
import { konteks, nada, type KonteksSynth } from '../../shared/audio/synth'

let derauCache: { ctx: AudioContext; buf: AudioBuffer } | null = null

/** Derau putih 1 detik (dibuat sekali per AudioContext). */
function derau(ctx: AudioContext) {
  if (derauCache?.ctx !== ctx) {
    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    derauCache = { ctx, buf }
  }
  return derauCache.buf
}

/** Semburan derau tersaring: ciprat air, letupan karet. */
function semprot(k: KonteksSynth, mulai: number, lama: number, vol: number, frek: number, frekAkhir: number, q = 0.8) {
  const { ctx, keluar } = k
  const src = ctx.createBufferSource()
  src.buffer = derau(ctx)
  const f = ctx.createBiquadFilter()
  f.type = 'bandpass'
  f.Q.value = q
  f.frequency.setValueAtTime(frek, mulai)
  f.frequency.exponentialRampToValueAtTime(frekAkhir, mulai + lama)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, mulai)
  g.gain.exponentialRampToValueAtTime(vol, mulai + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, mulai + lama)
  src.connect(f).connect(g).connect(keluar)
  src.start(mulai)
  src.stop(mulai + lama + 0.02)
}

export const bunyi = {
  hitung() {
    const k = konteks()
    if (k) nada(k, k.ctx.currentTime, 880, 0.1, 0.22, 'triangle', 700)
  },

  /** Aba-aba mulai: dua nada naik. */
  mulai() {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    nada(k, t, 784, 0.12, 0.2, 'triangle')
    nada(k, t + 0.1, 1175, 0.3, 0.22, 'triangle')
  },

  /** Balon pecah: "dor!" karet lalu air tumpah. */
  pecah() {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    semprot(k, t, 0.09, 0.9, 2600, 900, 0.6)
    nada(k, t, 180, 0.08, 0.35, 'square', 70)
    semprot(k, t + 0.04, 0.55, 0.45, 1400, 300, 0.7)
    semprot(k, t + 0.12, 0.4, 0.25, 3000, 1200, 1.2)
  },

  /** Menabrak batu/parit: "duk" teredam, balon bergoyang. */
  bentur(kuat: number) {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    const v = Math.min(1, 0.4 + kuat)
    nada(k, t, 140, 0.12, 0.3 * v, 'triangle', 80)
    nada(k, t + 0.02, 420, 0.18, 0.06 * v, 'sine', 260)
  },

  /** Masuk genangan: "cebur" kecil. */
  ciprat() {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    semprot(k, t, 0.25, 0.25, 2000, 500, 1)
  },

  /** Balon baru di START. */
  baru() {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    nada(k, t, 523, 0.1, 0.12, 'triangle')
    nada(k, t + 0.08, 659, 0.12, 0.12, 'triangle')
  },

  /** Tekanan hampir penuh: ketukan peringatan. */
  bahaya() {
    const k = konteks()
    if (k) nada(k, k.ctx.currentTime, 1320, 0.06, 0.07, 'square', 1100)
  },

  /** Balon masuk keranjang. */
  sampai() {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    ;[523, 659, 784, 1047].forEach((f, i) => nada(k, t + i * 0.09, f, 0.2, 0.14, 'triangle'))
  },
}
