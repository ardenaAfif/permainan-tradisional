import gsap from 'gsap'
import type { Mata, Mulut } from './kit'

export type Ekspresi = 'normal' | 'happy' | 'surprised' | 'flat'
export type Aksi = 'wave' | 'jump'

export interface Wajah {
  mata: Mata
  mulut: Mulut
  /** Geser alis (negatif = naik). */
  alis: number
}

/** Ekspresi → wajah. `null` berarti pakai bawaan pose. */
const EKSPRESI: Record<Ekspresi, Partial<Wajah>> = {
  normal: {},
  happy: { mata: 'happy', mulut: 'smile', alis: -3 },
  surprised: { mata: 'surprised', mulut: 'talk-o', alis: -5 },
  flat: { mata: 'open', mulut: 'flat', alis: 0 },
}

const acak = (min: number, maks: number) => min + Math.random() * (maks - min)

/**
 * Menggerakkan satu SVG karakter dari kit.ts dengan GSAP.
 * Semua tween dicatat supaya bisa dihentikan bersih saat komponen dilepas.
 */
export class AnimatorKarakter {
  private readonly svg: SVGSVGElement
  private readonly gerak: boolean
  private readonly bawaan: Wajah
  private wajah: Wajah
  private mulutTampil: Mulut
  private idle: gsap.core.Animation[] = []
  private kedipBerikut: gsap.core.Tween | null = null
  private bicaraBerikut: gsap.core.Tween | null = null
  private lipSync: (() => void) | null = null
  private aksiTl: gsap.core.Timeline | null = null
  private aksiAktif: Aksi | null = null
  private putaranAwal = new Map<Element, number>()

  constructor(svg: SVGSVGElement, opsi: { gerak: boolean; siluet: boolean }) {
    this.svg = svg
    this.gerak = opsi.gerak
    const mata = (svg.querySelector('[data-mata]:not([display])')?.getAttribute('data-mata') ?? 'open') as Mata
    const mulut = (svg.querySelector('[data-mulut]:not([display])')?.getAttribute('data-mulut') ?? 'smile') as Mulut
    this.bawaan = { mata, mulut, alis: 0 }
    this.wajah = { ...this.bawaan }
    this.mulutTampil = mulut
    if (this.gerak) this.mulaiIdle(opsi.siluet)
  }

  /** Elemen bagian, mis. part('arm-upper-r'). Putar dengan svgOrigin '0 0'. */
  part(nama: string): SVGGElement | null {
    return this.svg.querySelector(`[data-part="${nama}"]`)
  }

  // ── Wajah ────────────────────────────────────────────────

  setWajah(ekspresi: Ekspresi, ganti: Partial<Wajah> = {}) {
    this.wajah = { ...this.bawaan, ...EKSPRESI[ekspresi], ...ganti }
    this.tampilMata(this.wajah.mata)
    if (!this.bicaraBerikut && !this.lipSync) this.tampilMulut(this.wajah.mulut)
    const alis = this.part('brows')
    if (alis) {
      if (this.gerak) gsap.to(alis, { y: this.wajah.alis, duration: 0.2, ease: 'power2.out' })
      else gsap.set(alis, { y: this.wajah.alis })
    }
  }

  private tampilMata(m: Mata) {
    for (const g of this.svg.querySelectorAll('[data-mata]')) {
      if (g.getAttribute('data-mata') === m) g.removeAttribute('display')
      else g.setAttribute('display', 'none')
    }
  }

  private tampilMulut(m: Mulut) {
    if (m === this.mulutTampil) return
    this.mulutTampil = m
    for (const g of this.svg.querySelectorAll('[data-mulut]')) {
      if (g.getAttribute('data-mulut') === m) g.removeAttribute('display')
      else g.setAttribute('display', 'none')
    }
  }

  // ── Idle: napas, kedip, goyang siluet ─────────────────────

  private mulaiIdle(siluet: boolean) {
    const upper = this.part('upper')
    if (upper) {
      this.idle.push(gsap.to(upper, { y: 1.8, duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1 }))
    }
    if (siluet) {
      const root = this.part('root')
      if (root) {
        gsap.set(root, { rotation: -1.6, x: -3, svgOrigin: '100 380' })
        this.idle.push(
          gsap.to(root, { rotation: 1.6, x: 3, svgOrigin: '100 380', duration: 1.7, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: acak(0, 1) }),
        )
      }
    }
    this.jadwalKedip(acak(0.5, 3))
  }

  private jadwalKedip(detik = acak(2, 5)) {
    this.kedipBerikut = gsap.delayedCall(detik, () => {
      this.kedip()
      this.jadwalKedip()
    })
  }

  /** Berkedip sekali (hanya jika mata sedang terbuka). */
  kedip() {
    const kelopak = this.svg.querySelector('[data-anim="kedip"]')
    if (!kelopak || (this.wajah.mata !== 'open' && this.wajah.mata !== 'surprised')) return
    gsap
      .timeline()
      .to(kelopak, { scaleY: 0.1, transformOrigin: '50% 50%', duration: 0.07, ease: 'power1.in' })
      .to(kelopak, { scaleY: 1, duration: 0.09, ease: 'power1.out' })
  }

  // ── Bicara ───────────────────────────────────────────────

  /** Mulut bergantian talk-a / talk-o / smile. */
  setBicara(aktif: boolean) {
    this.bicaraBerikut?.kill()
    this.bicaraBerikut = null
    if (!aktif) {
      if (!this.lipSync) this.tampilMulut(this.wajah.mulut)
      return
    }
    if (!this.gerak) {
      this.tampilMulut('talk-a')
      return
    }
    const langkah = () => {
      const pilihan = (['talk-a', 'talk-o', 'smile'] as Mulut[]).filter((m) => m !== this.mulutTampil)
      this.tampilMulut(pilihan[Math.floor(Math.random() * pilihan.length)]!)
      this.bicaraBerikut = gsap.delayedCall(acak(0.09, 0.17), langkah)
    }
    langkah()
  }

  /**
   * Lip-sync: `level()` mengembalikan volume 0..1 (mis. dari AnalyserNode),
   * dibaca setiap frame. Kirim `null` untuk berhenti.
   */
  setLipSync(level: (() => number) | null) {
    if (this.lipSync) gsap.ticker.remove(this.lipSync)
    this.lipSync = null
    if (!level) {
      if (!this.bicaraBerikut) this.tampilMulut(this.wajah.mulut)
      return
    }
    let halus = 0
    this.lipSync = () => {
      halus = halus * 0.5 + level() * 0.5
      this.tampilMulut(halus > 0.16 ? 'talk-a' : halus > 0.05 ? 'talk-o' : this.wajah.mulut === 'flat' ? 'flat' : 'smile')
    }
    gsap.ticker.add(this.lipSync)
  }

  // ── Aksi ─────────────────────────────────────────────────

  setAksi(aksi: Aksi | null) {
    if (aksi === this.aksiAktif) return
    this.hentikanAksi()
    this.aksiAktif = aksi
    if (aksi === 'wave') this.aksiTl = this.lambai()
    if (aksi === 'jump') this.aksiTl = this.lompat()
  }

  private simpanPutaran(el: Element | null) {
    if (el && !this.putaranAwal.has(el)) this.putaranAwal.set(el, Number(gsap.getProperty(el, 'rotation')) || 0)
  }

  private lambai() {
    const atas = this.part('arm-upper-r')
    const bawah = this.part('arm-lower-r')
    this.simpanPutaran(atas)
    this.simpanPutaran(bawah)
    const tl = gsap.timeline()
    if (!atas || !bawah) return tl
    if (!this.gerak) {
      tl.set(atas, { rotation: -150, svgOrigin: '0 0' }).set(bawah, { rotation: -10, svgOrigin: '0 0' })
      return tl
    }
    tl.to(atas, { rotation: -150, svgOrigin: '0 0', duration: 0.3, ease: 'back.out(1.6)' })
      .to(bawah, { rotation: -35, svgOrigin: '0 0', duration: 0.25, ease: 'sine.inOut' }, '<')
      .to(bawah, { rotation: 15, svgOrigin: '0 0', duration: 0.28, ease: 'sine.inOut', yoyo: true, repeat: -1 })
    return tl
  }

  private lompat() {
    const root = this.part('root')
    const kakiL = this.part('leg-l')
    const kakiR = this.part('leg-r')
    ;[kakiL, kakiR].forEach((k) => this.simpanPutaran(k))
    this.tampilMata('happy')
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.12 })
    if (!root || !this.gerak) return tl
    tl.to(root, { y: -30, duration: 0.28, ease: 'power2.out' })
      .to([kakiL, kakiR], { rotation: (i: number) => (i ? -9 : 9), svgOrigin: '0 0', duration: 0.2 }, '<')
      .to(root, { y: 0, duration: 0.26, ease: 'power2.in' })
      .to([kakiL, kakiR], { rotation: 0, svgOrigin: '0 0', duration: 0.2 }, '<0.06')
    return tl
  }

  private hentikanAksi() {
    this.aksiTl?.kill()
    this.aksiTl = null
    for (const [el, rot] of this.putaranAwal) gsap.to(el, { rotation: rot, svgOrigin: '0 0', duration: this.gerak ? 0.2 : 0 })
    const root = this.part('root')
    if (root && this.aksiAktif === 'jump') gsap.to(root, { y: 0, duration: this.gerak ? 0.15 : 0 })
    if (this.aksiAktif === 'jump') this.tampilMata(this.wajah.mata)
    this.aksiAktif = null
  }

  /** Hentikan semua animasi (dipanggil saat komponen dilepas). */
  hancurkan() {
    this.idle.forEach((a) => a.kill())
    this.kedipBerikut?.kill()
    this.bicaraBerikut?.kill()
    this.aksiTl?.kill()
    if (this.lipSync) gsap.ticker.remove(this.lipSync)
    gsap.killTweensOf(this.svg.querySelectorAll('[data-part], [data-anim]'))
  }
}

/** Ubah AnalyserNode menjadi fungsi volume 0..1 untuk lip-sync. */
export function levelDariAnalyser(analyser: AnalyserNode): () => number {
  const data = new Uint8Array(analyser.fftSize)
  return () => {
    analyser.getByteTimeDomainData(data)
    let jumlah = 0
    for (const v of data) {
      const s = (v - 128) / 128
      jumlah += s * s
    }
    return Math.min(1, Math.sqrt(jumlah / data.length) * 3)
  }
}
