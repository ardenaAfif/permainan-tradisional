/**
 * Bunyi Bakiak (sintesis, lihat shared/audio/synth.ts): ketukan kentongan untuk
 * aba-aba harus dijadwalkan tepat waktu, jadi tidak lewat Howl biasa.
 */
import { konteks, latensi, nada } from '../../shared/audio/synth'

export const bunyi = {
  /**
   * Ketukan kentongan, dijadwalkan `dalamMs` dari sekarang. `tekanan` untuk
   * ketukan hitungan / awal birama.
   */
  ketukan(dalamMs: number, tekanan = false) {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime + Math.max(0, dalamMs / 1000 - latensi(k.ctx))
    nada(k, t, tekanan ? 1180 : 880, 0.09, 0.32, 'triangle', tekanan ? 900 : 700)
    nada(k, t, tekanan ? 2360 : 1760, 0.035, 0.08, 'sine')
  },

  pas() {
    const k = konteks()
    if (k) nada(k, k.ctx.currentTime, 520, 0.08, 0.12, 'sine', 780)
  },

  salah() {
    const k = konteks()
    if (k) nada(k, k.ctx.currentTime, 190, 0.14, 0.14, 'square', 150)
  },

  jatuh() {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    nada(k, t, 440, 0.5, 0.18, 'triangle', 110)
    nada(k, t + 0.42, 90, 0.18, 0.25, 'sine', 60)
  },

  ketukBangkit(ke: number) {
    const k = konteks()
    if (k) nada(k, k.ctx.currentTime, 400 + ke * 70, 0.07, 0.14, 'triangle')
  },

  bangkit() {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    ;[523, 659, 784].forEach((f, i) => nada(k, t + i * 0.07, f, 0.12, 0.14, 'triangle'))
  },

  finis() {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    ;[523, 659, 784, 1047].forEach((f, i) => nada(k, t + i * 0.1, f, 0.22, 0.16, 'triangle'))
  },
}
