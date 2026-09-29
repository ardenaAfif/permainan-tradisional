/** Bunyi Bola Bekel (sintesis, lihat shared/audio/synth.ts). */
import { konteks, nada } from '../../shared/audio/synth'

export const bunyi = {
  /** Biji disebar ke tikar: gemerincing logam kecil. */
  sebar() {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    for (let i = 0; i < 6; i++) nada(k, t + i * 0.035 + Math.random() * 0.02, 2400 + Math.random() * 900, 0.05, 0.06, 'sine')
  },

  lempar() {
    const k = konteks()
    if (k) nada(k, k.ctx.currentTime, 300, 0.2, 0.12, 'sine', 700)
  },

  ambil() {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    nada(k, t, 2900, 0.06, 0.12, 'sine')
    nada(k, t + 0.03, 3600, 0.05, 0.07, 'sine')
  },

  balik() {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    nada(k, t, 1800, 0.04, 0.12, 'triangle')
    nada(k, t + 0.05, 2500, 0.05, 0.1, 'sine')
  },

  /** Bola masuk cincin tangkap: detak pelan sebagai aba-aba. */
  cincin() {
    const k = konteks()
    if (k) nada(k, k.ctx.currentTime, 1200, 0.04, 0.07, 'sine')
  },

  tangkap() {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    nada(k, t, 180, 0.09, 0.3, 'sine', 90)
    nada(k, t + 0.02, 660, 0.08, 0.08, 'triangle')
  },

  /** Bola karet memantul di lantai; `kuat` 0..1. */
  pantul(kuat = 1) {
    const k = konteks()
    if (k) nada(k, k.ctx.currentTime, 240, 0.12, 0.08 + 0.2 * kuat, 'sine', 120)
  },

  salah() {
    const k = konteks()
    if (k) nada(k, k.ctx.currentTime, 220, 0.3, 0.16, 'square', 110)
  },

  naikTahap() {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    ;[523, 659, 784].forEach((f, i) => nada(k, t + i * 0.09, f, 0.18, 0.15, 'triangle'))
  },

  selesai() {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    ;[523, 659, 784, 1047].forEach((f, i) => nada(k, t + i * 0.1, f, 0.22, 0.16, 'triangle'))
  },
}
