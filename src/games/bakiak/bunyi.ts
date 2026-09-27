/**
 * Bunyi Bakiak disintesis dengan Web Audio (tanpa file): ketukan kentongan untuk
 * aba-aba harus dijadwalkan tepat waktu, jadi tidak lewat Howl biasa.
 * Tersambung ke Howler.masterGain sehingga tombol mute tetap berlaku, dan hanya
 * berbunyi setelah audio dibuka oleh tap pertama.
 */
import { Howler } from 'howler'
import { audio } from '../../shared/audio/AudioManager'
import { useKotak } from '../../app/store'

function konteks(): { ctx: AudioContext; keluar: AudioNode } | null {
  if (!audio.sudahTerbuka || !useKotak.getState().pengaturan.suara) return null
  const ctx = Howler.ctx
  const keluar = Howler.masterGain
  if (!ctx || !keluar || ctx.state === 'closed') return null
  return { ctx, keluar }
}

/** Latensi keluaran audio (detik), supaya bunyi ketukan terdengar tepat pada ketukannya. */
function latensi(ctx: AudioContext) {
  const l = (ctx as AudioContext & { outputLatency?: number }).outputLatency || ctx.baseLatency || 0
  return Math.min(0.25, Math.max(0, l))
}

function nada(ctx: AudioContext, keluar: AudioNode, mulai: number, frek: number, lama: number, vol: number, tipe: OscillatorType = 'sine', frekAkhir?: number) {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = tipe
  osc.frequency.setValueAtTime(frek, mulai)
  if (frekAkhir) osc.frequency.exponentialRampToValueAtTime(frekAkhir, mulai + lama)
  g.gain.setValueAtTime(0.0001, mulai)
  g.gain.exponentialRampToValueAtTime(vol, mulai + 0.006)
  g.gain.exponentialRampToValueAtTime(0.0001, mulai + lama)
  osc.connect(g).connect(keluar)
  osc.start(mulai)
  osc.stop(mulai + lama + 0.02)
}

export const bunyi = {
  /**
   * Ketukan kentongan, dijadwalkan `dalamMs` dari sekarang. `tekanan` untuk
   * ketukan hitungan / awal birama.
   */
  ketukan(dalamMs: number, tekanan = false) {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime + Math.max(0, dalamMs / 1000 - latensi(k.ctx))
    nada(k.ctx, k.keluar, t, tekanan ? 1180 : 880, 0.09, 0.32, 'triangle', tekanan ? 900 : 700)
    nada(k.ctx, k.keluar, t, tekanan ? 2360 : 1760, 0.035, 0.08, 'sine')
  },

  pas() {
    const k = konteks()
    if (k) nada(k.ctx, k.keluar, k.ctx.currentTime, 520, 0.08, 0.12, 'sine', 780)
  },

  salah() {
    const k = konteks()
    if (k) nada(k.ctx, k.keluar, k.ctx.currentTime, 190, 0.14, 0.14, 'square', 150)
  },

  jatuh() {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    nada(k.ctx, k.keluar, t, 440, 0.5, 0.18, 'triangle', 110)
    nada(k.ctx, k.keluar, t + 0.42, 90, 0.18, 0.25, 'sine', 60)
  },

  ketukBangkit(ke: number) {
    const k = konteks()
    if (k) nada(k.ctx, k.keluar, k.ctx.currentTime, 400 + ke * 70, 0.07, 0.14, 'triangle')
  },

  bangkit() {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    ;[523, 659, 784].forEach((f, i) => nada(k.ctx, k.keluar, t + i * 0.07, f, 0.12, 0.14, 'triangle'))
  },

  finis() {
    const k = konteks()
    if (!k) return
    const t = k.ctx.currentTime
    ;[523, 659, 784, 1047].forEach((f, i) => nada(k.ctx, k.keluar, t + i * 0.1, f, 0.22, 0.16, 'triangle'))
  },
}
