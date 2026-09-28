/** Bunyi Engklek (sintesis, lihat shared/audio/synth.ts). */
import { konteks, nada } from '../../shared/audio/synth'

export const bunyi = {
  lempar() {
    const k = konteks()
    if (k) nada(k, k.ctx.currentTime, 520, 0.22, 0.1, 'triangle', 260)
  },

  /** Gacuk batu jatuh di tanah. */
  gacukJatuh() {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    nada(k, t, 210, 0.07, 0.3, 'triangle', 120)
    nada(k, t + 0.09, 260, 0.05, 0.14, 'triangle', 160)
  },

  lompat() {
    const k = konteks()
    if (k) nada(k, k.ctx.currentTime, 330, 0.12, 0.12, 'sine', 620)
  },

  mendarat(dua: boolean) {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    nada(k, t, 150, 0.08, 0.28, 'sine', 80)
    if (dua) nada(k, t + 0.05, 140, 0.08, 0.22, 'sine', 75)
  },

  pas() {
    const k = konteks()
    if (k) nada(k, k.ctx.currentTime, 660, 0.09, 0.1, 'sine', 990)
  },

  salah() {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    nada(k, t, 220, 0.3, 0.16, 'square', 110)
  },

  /** Jarum keseimbangan berdetak saat melewati tengah. */
  detak() {
    const k = konteks()
    if (k) nada(k, k.ctx.currentTime, 1400, 0.03, 0.06, 'sine')
  },

  ambil() {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    ;[587, 784, 988].forEach((f, i) => nada(k, t + i * 0.07, f, 0.12, 0.14, 'triangle'))
  },

  naikLevel() {
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
