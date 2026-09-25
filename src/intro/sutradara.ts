import gsap from 'gsap'
import { useKotak } from '../app/store'
import { audio } from '../shared/audio/AudioManager'
import { barisAdegan, durasiTeks, type Baris, type DataAdegan } from './naskah'

/** Menjalankan fungsi di dalam gsap.context adegan supaya tween-nya ikut dibersihkan. */
export type Lepas = (fn: () => void) => void

/** Dibuat oleh komponen adegan: menambah animasi ke timeline adegan. */
export type BangunAnimasi = (tl: gsap.core.Timeline, lepas: Lepas) => void

export interface BarisAktif {
  baris: Baris
  /** Terisi jika VO diputar: volume untuk lip-sync. */
  lipSync: (() => number) | null
}

interface Callback {
  onBaris(b: BarisAktif | null): void
  onAdeganSelesai(): void
}

const JEDA_CUE = 0.02
/** VO yang gagal dimuat tetap memberi waktu baca minimal ini. */
const MIN_VO = 1.2

/**
 * Sutradara intro: satu timeline GSAP per adegan (animasi + cue dialog + sfx).
 *
 * - Baris dialog mulai pada detik `mulai`. Jika baris sebelumnya belum selesai
 *   (VO panjang), timeline berhenti di cue itu sampai baris selesai.
 * - Akhir adegan juga menunggu baris terakhir selesai.
 * - lanjut() (tap) menutup baris yang tampil dan melompat ke cue berikutnya.
 */
export class Sutradara {
  private tl: gsap.core.Timeline | null = null
  private ctx: gsap.Context | null = null
  private adegan: DataAdegan | null = null
  private baris: Baris | null = null
  private token = 0
  private timerBaris: gsap.core.Tween | null = null
  private tertunda: (() => void) | null = null
  private melompat = false
  private readonly cb: Callback
  /** true saat transisi berjalan: tap diabaikan. */
  kunci = false

  constructor(cb: Callback) {
    this.cb = cb
  }

  putar(adegan: DataAdegan, bangun: BangunAnimasi | null, scope: Element | null) {
    this.hentikanAdegan()
    this.adegan = adegan
    const ctx = gsap.context(() => {}, scope ?? undefined)
    this.ctx = ctx
    const lepas: Lepas = (fn) => ctx.add(fn)
    let tl!: gsap.core.Timeline
    ctx.add(() => {
      tl = gsap.timeline({ paused: true })
      if (bangun) {
        try {
          bangun(tl, lepas)
        } catch (e) {
          // Animasi gagal tidak boleh menghentikan intro: dialog dan alur tetap jalan.
          console.error('[intro] animasi adegan gagal', adegan.id, e)
        }
      }
    })
    this.tl = tl

    for (const s of adegan.sfx) {
      tl.call(() => {
        if (!this.melompat) audio.sfx(s.nama)
      }, [], s.t)
    }
    for (const b of barisAdegan(adegan.id)) {
      tl.call(() => this.gerbang(() => this.mulaiBaris(b)), [], b.mulai)
    }
    for (const t of adegan.tahan) tl.call(() => this.gerbang(() => {}), [], t)
    tl.call(() => this.gerbang(() => this.cb.onAdeganSelesai()), [], adegan.durasi)
    tl.play(0)
  }

  /** Jalankan `fn` sekarang, atau setelah baris yang sedang tampil selesai. */
  private gerbang(fn: () => void) {
    if (this.baris) {
      this.tl?.pause()
      this.tertunda = fn
      return
    }
    fn()
  }

  private mulaiBaris(b: Baris) {
    const id = ++this.token
    this.baris = b
    const p = useKotak.getState().pengaturan
    const pakaiVO = audio.sudahTerbuka && p.suara && p.vo && audio.adaVO(b.lineId)
    this.cb.onBaris({ baris: b, lipSync: pakaiVO ? audio.levelVO : null })
    if (pakaiVO) {
      const minimal = new Promise<void>((r) => {
        this.timerBaris = gsap.delayedCall(MIN_VO, r)
      })
      void Promise.all([audio.vo(b.lineId), minimal]).then(() => {
        if (id === this.token) this.selesaiBaris()
      })
    } else {
      this.timerBaris = gsap.delayedCall(durasiTeks(b.teks), () => {
        if (id === this.token) this.selesaiBaris()
      })
    }
  }

  /** @returns true jika ada aksi tertunda yang langsung dijalankan. */
  private selesaiBaris(): boolean {
    if (!this.baris) return false
    this.token++
    this.timerBaris?.kill()
    this.timerBaris = null
    this.baris = null
    audio.hentikanVO()
    this.cb.onBaris(null)
    const f = this.tertunda
    this.tertunda = null
    if (!f) return false
    f()
    // Jika f memulai baris baru, timeline boleh jalan lagi sampai cue berikutnya.
    if (this.tl && this.tl.paused() && this.tl.progress() < 1) this.tl.resume()
    return true
  }

  /** Tap / Spasi: percepat ke baris berikutnya. */
  lanjut() {
    if (this.kunci || !this.tl || !this.adegan) return
    if (this.baris) {
      const adaTertunda = this.selesaiBaris()
      if (adaTertunda) return
    }
    this.lompatKeCue()
  }

  private lompatKeCue() {
    const tl = this.tl
    const adegan = this.adegan
    if (!tl || !adegan) return
    const t = tl.time()
    const cue = [...barisAdegan(adegan.id).map((b) => b.mulai), adegan.durasi].filter((c) => c > t + JEDA_CUE).sort((a, b) => a - b)[0]
    if (cue === undefined) return
    this.melompat = true
    try {
      // suppressEvents = false: callback di antaranya (ekspresi, loop) tetap jalan.
      tl.seek(Math.max(t, cue - JEDA_CUE), false)
    } finally {
      this.melompat = false
    }
    if (tl.paused() && !this.baris) tl.resume()
  }

  hentikanAdegan() {
    this.token++
    this.timerBaris?.kill()
    this.timerBaris = null
    this.tertunda = null
    if (this.baris) {
      this.baris = null
      audio.hentikanVO()
      this.cb.onBaris(null)
    }
    this.tl?.kill()
    this.tl = null
    this.ctx?.revert()
    this.ctx = null
    this.adegan = null
  }
}
