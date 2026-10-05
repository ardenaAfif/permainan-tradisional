/** Bunyi Dam-daman (sintesis, lihat shared/audio/synth.ts). */
import { konteks, nada } from '../../shared/audio/synth'

export const bunyi = {
  /** Bidak diangkat/dipilih. */
  pilih() {
    const k = konteks()
    if (k) nada(k, k.ctx.currentTime, 520, 0.07, 0.08, 'triangle', 700)
  },

  /** Bidak kayu diletakkan di papan. */
  letak() {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    nada(k, t, 240, 0.06, 0.26, 'triangle', 150)
    nada(k, t + 0.012, 900, 0.025, 0.05, 'sine')
  },

  /** Bidak lawan tertangkap. */
  tangkap() {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    nada(k, t, 330, 0.1, 0.16, 'square', 660)
    nada(k, t + 0.08, 660, 0.14, 0.12, 'triangle', 990)
  },

  salah() {
    const k = konteks()
    if (k) nada(k, k.ctx.currentTime, 200, 0.18, 0.1, 'square', 130)
  },

  batal() {
    const k = konteks()
    if (k) nada(k, k.ctx.currentTime, 600, 0.16, 0.1, 'sine', 300)
  },
}
