/** Bunyi Kelereng (sintesis, lihat shared/audio/synth.ts). */
import { konteks, nada } from '../../shared/audio/synth'

let klikTerakhir = 0

export const bunyi = {
  /** Klik kaca saat dua kelereng bertumbukan; `kuat` 0..1 dari kecepatan tumbukan. */
  klikKaca(kuat: number) {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    // Tumbukan beruntun dalam 30 ms cukup satu bunyi.
    if (t - klikTerakhir < 0.03) return
    klikTerakhir = t
    const v = 0.05 + Math.min(1, kuat) * 0.3
    const f = 3000 + Math.random() * 900
    nada(k, t, f, 0.05, v, 'sine')
    nada(k, t, f * 1.52, 0.035, v * 0.5, 'sine')
  },

  sentil(kuat: number) {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    nada(k, t, 260, 0.05, 0.18 + kuat * 0.12, 'triangle', 140)
    nada(k, t, 2600, 0.03, 0.08, 'sine')
  },

  masukLubang() {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    ;[520, 420, 330].forEach((f, i) => nada(k, t + i * 0.07, f, 0.08, 0.2 - i * 0.04, 'triangle'))
    ;[659, 880].forEach((f, i) => nada(k, t + 0.3 + i * 0.09, f, 0.16, 0.14, 'triangle'))
  },

  poin() {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    ;[659, 880].forEach((f, i) => nada(k, t + i * 0.09, f, 0.16, 0.14, 'triangle'))
  },

  keluar() {
    const k = konteks()
    if (k) nada(k, k.ctx.currentTime, 220, 0.3, 0.15, 'square', 110)
  },

  lubang() {
    const k = konteks()
    if (k) nada(k, k.ctx.currentTime, 180, 0.12, 0.2, 'sine', 90)
  },

  selesai() {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    ;[523, 659, 784, 1047].forEach((f, i) => nada(k, t + i * 0.1, f, 0.22, 0.16, 'triangle'))
  },
}
