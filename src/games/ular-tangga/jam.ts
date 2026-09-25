/**
 * Jam permainan yang bisa dijeda: tunggu() dan animasi GSAP ikut berhenti saat
 * dijeda, dan tidak pernah selesai setelah dihentikan (game dilepas).
 */
/** Bagian API animasi GSAP (Tween/Timeline) yang dipakai Jam. */
interface Animasi {
  pause(): unknown
  resume(): unknown
  kill(): unknown
  totalProgress(): number
  eventCallback(tipe: 'onComplete', cb: () => void): unknown
}

interface Penunggu {
  sisa: number
  mulai: number
  timer: ReturnType<typeof setTimeout> | undefined
  selesai: () => void
}

export class Jam {
  private jedaAktif = false
  private berhenti = false
  private penunggu = new Set<Penunggu>()
  private animasiAktif = new Set<Animasi>()
  private pendengar = new Set<() => void>()

  get dijeda() {
    return this.jedaAktif
  }

  get dihentikan() {
    return this.berhenti
  }

  /** Tunggu `ms` milidetik waktu main (tidak berjalan saat jeda). */
  tunggu(ms: number): Promise<void> {
    if (this.berhenti) return new Promise(() => {})
    return new Promise((resolve) => {
      const p: Penunggu = {
        sisa: ms,
        mulai: 0,
        timer: undefined,
        selesai: () => {
          this.penunggu.delete(p)
          resolve()
        },
      }
      this.penunggu.add(p)
      if (!this.jedaAktif) this.jalankan(p)
    })
  }

  /** Jalankan animasi GSAP yang ikut dijeda; selesai saat animasi selesai. */
  animasi(a: Animasi): Promise<void> {
    if (this.berhenti) {
      a.kill()
      return new Promise(() => {})
    }
    // Animasi berdurasi 0 bisa sudah selesai saat diterima.
    if (a.totalProgress() === 1) return Promise.resolve()
    this.animasiAktif.add(a)
    if (this.jedaAktif) a.pause()
    return new Promise((resolve) => {
      a.eventCallback('onComplete', () => {
        this.animasiAktif.delete(a)
        resolve()
      })
    })
  }

  jeda() {
    if (this.jedaAktif || this.berhenti) return
    this.jedaAktif = true
    for (const p of this.penunggu) {
      clearTimeout(p.timer)
      p.sisa -= performance.now() - p.mulai
    }
    this.animasiAktif.forEach((a) => a.pause())
    this.beritahu()
  }

  lanjut() {
    if (!this.jedaAktif || this.berhenti) return
    this.jedaAktif = false
    this.penunggu.forEach((p) => this.jalankan(p))
    this.animasiAktif.forEach((a) => a.resume())
    this.beritahu()
  }

  hentikan() {
    this.berhenti = true
    this.penunggu.forEach((p) => clearTimeout(p.timer))
    this.penunggu.clear()
    this.animasiAktif.forEach((a) => a.kill())
    this.animasiAktif.clear()
    this.beritahu()
  }

  /** Untuk useSyncExternalStore. */
  langgan = (cb: () => void) => {
    this.pendengar.add(cb)
    return () => this.pendengar.delete(cb)
  }

  private jalankan(p: Penunggu) {
    p.mulai = performance.now()
    p.timer = setTimeout(p.selesai, Math.max(0, p.sisa))
  }

  private beritahu() {
    this.pendengar.forEach((cb) => cb())
  }
}
