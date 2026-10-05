/** Bunyi Gobak Sodor (sintesis, lihat shared/audio/synth.ts). */
import { konteks, nada, type KonteksSynth } from '../../shared/audio/synth'

/** Peluit kacang: nada tinggi yang bergetar cepat. */
function peluit(k: KonteksSynth, mulai: number, lama: number, vol: number) {
  const { ctx, keluar } = k
  const osc = ctx.createOscillator()
  const getar = ctx.createOscillator()
  const dalam = ctx.createGain()
  const g = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(2750, mulai)
  getar.frequency.setValueAtTime(32, mulai)
  dalam.gain.setValueAtTime(140, mulai)
  getar.connect(dalam).connect(osc.frequency)
  g.gain.setValueAtTime(0.0001, mulai)
  g.gain.exponentialRampToValueAtTime(vol, mulai + 0.02)
  g.gain.setValueAtTime(vol, mulai + lama - 0.05)
  g.gain.exponentialRampToValueAtTime(0.0001, mulai + lama)
  osc.connect(g).connect(keluar)
  osc.start(mulai)
  getar.start(mulai)
  osc.stop(mulai + lama + 0.02)
  getar.stop(mulai + lama + 0.02)
}

export const bunyi = {
  hitung() {
    const k = konteks()
    if (k) nada(k, k.ctx.currentTime, 880, 0.1, 0.22, 'triangle', 700)
  },

  /** Peluit mulai ronde: "priiit!". */
  mulai() {
    const k = konteks()
    if (k) peluit(k, k.ctx.currentTime, 0.55, 0.12)
  },

  /** Peluit akhir ronde: tiga tiupan pendek-panjang. */
  akhir() {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    peluit(k, t, 0.18, 0.11)
    peluit(k, t + 0.26, 0.18, 0.11)
    peluit(k, t + 0.52, 0.6, 0.11)
  },

  /** Penyerang menyeberangi garis: ketukan kecil. */
  lewat() {
    const k = konteks()
    if (k) nada(k, k.ctx.currentTime, 660, 0.07, 0.08, 'triangle', 760)
  },

  ujung() {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    ;[659, 880].forEach((f, i) => nada(k, t + i * 0.08, f, 0.14, 0.12, 'triangle'))
  },

  poin() {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    ;[523, 659, 784, 1047].forEach((f, i) => nada(k, t + i * 0.09, f, 0.2, 0.14, 'triangle'))
  },

  /** Tersentuh penjaga: tepukan lalu peluit pendek. */
  kena() {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    nada(k, t, 200, 0.12, 0.3, 'square', 90)
    peluit(k, t + 0.12, 0.3, 0.1)
  },

  /** Ganti penjaga yang dikendalikan. */
  pilih() {
    const k = konteks()
    if (k) nada(k, k.ctx.currentTime, 520, 0.08, 0.1, 'triangle', 640)
  },
}
