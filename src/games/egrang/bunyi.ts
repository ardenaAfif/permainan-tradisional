/** Bunyi Egrang (sintesis, lihat shared/audio/synth.ts). */
import { konteks, nada } from '../../shared/audio/synth'

export const bunyi = {
  /** Bambu menapak tanah: "tok". */
  langkah(kaki: 'kiri' | 'kanan') {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    const f = kaki === 'kiri' ? 620 : 560
    nada(k, t, f, 0.06, 0.22, 'triangle', f * 0.7)
    nada(k, t, f * 2.4, 0.025, 0.05, 'sine')
  },

  ciprat() {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    ;[1500, 1900, 1300].forEach((f, i) => nada(k, t + i * 0.025, f, 0.06, 0.05, 'sine', f * 0.6))
  },

  /** Terburu-buru / egrang yang sama: badan oleng. */
  oleng() {
    const k = konteks()
    if (k) nada(k, k.ctx.currentTime, 240, 0.16, 0.12, 'square', 180)
  },

  /** Jatuh lucu: siulan turun lalu "gedebuk". */
  jatuh(keras: boolean) {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    const v = keras ? 1 : 0.45
    nada(k, t, 900, 0.5, 0.14 * v, 'sine', 180)
    nada(k, t + 0.48, 110, 0.2, 0.3 * v, 'triangle', 60)
    nada(k, t + 0.56, 160, 0.12, 0.12 * v, 'triangle', 90)
  },

  bangkit() {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    ;[392, 523].forEach((f, i) => nada(k, t + i * 0.08, f, 0.12, 0.12, 'triangle'))
  },

  hitung(jalan: boolean) {
    const k = konteks()
    if (k) nada(k, k.ctx.currentTime, jalan ? 1180 : 880, jalan ? 0.22 : 0.1, 0.25, 'triangle', jalan ? 900 : 700)
  },

  finis(pertama: boolean) {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    const urut = pertama ? [523, 659, 784, 1047] : [523, 784]
    urut.forEach((f, i) => nada(k, t + i * 0.1, f, 0.22, 0.15, 'triangle'))
  },
}
