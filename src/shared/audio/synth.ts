/**
 * Bunyi sintesis Web Audio untuk game (tanpa file), mis. ketukan yang harus
 * dijadwalkan tepat waktu atau efek kecil yang sering berbunyi. Tersambung ke
 * Howler.masterGain sehingga tombol mute tetap berlaku, dan hanya berbunyi
 * setelah audio dibuka oleh tap pertama.
 */
import { Howler } from 'howler'
import { useKotak } from '../../app/store'
import { audio } from './AudioManager'

export interface KonteksSynth {
  ctx: AudioContext
  keluar: AudioNode
}

/** null jika audio belum dibuka, dimute, atau Web Audio tidak tersedia. */
export function konteks(): KonteksSynth | null {
  if (!audio.sudahTerbuka || !useKotak.getState().pengaturan.suara) return null
  const ctx = Howler.ctx
  const keluar = Howler.masterGain
  if (!ctx || !keluar || ctx.state === 'closed') return null
  return { ctx, keluar }
}

/** Latensi keluaran audio (detik), untuk menjadwalkan bunyi supaya terdengar tepat waktu. */
export function latensi(ctx: AudioContext) {
  const l = (ctx as AudioContext & { outputLatency?: number }).outputLatency || ctx.baseLatency || 0
  return Math.min(0.25, Math.max(0, l))
}

/** Satu nada pendek dengan serangan cepat dan peluruhan eksponensial. */
export function nada(
  k: KonteksSynth,
  mulai: number,
  frek: number,
  lama: number,
  vol: number,
  tipe: OscillatorType = 'sine',
  frekAkhir?: number,
) {
  const { ctx, keluar } = k
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = tipe
  osc.frequency.setValueAtTime(frek, mulai)
  if (frekAkhir) osc.frequency.exponentialRampToValueAtTime(frekAkhir, mulai + lama)
  g.gain.setValueAtTime(0.0001, mulai)
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), mulai + 0.006)
  g.gain.exponentialRampToValueAtTime(0.0001, mulai + lama)
  osc.connect(g).connect(keluar)
  osc.start(mulai)
  osc.stop(mulai + lama + 0.02)
}
