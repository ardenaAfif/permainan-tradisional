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
 * Putar bagian di titik putarnya sendiri (0,0 lokal <g data-part>) lewat atribut transform.
 * Jangan pakai rotation + svgOrigin: svgOrigin GSAP dihitung di koordinat global SVG, sehingga
 * bagian bersarang (lengan, kaki, kepala) ikut bergeser dan terlihat "putus".
 */
const putar = (derajat: number) => ({ attr: { transform: `rotate(${derajat})` } })

/** Rotasi awal bagian dari atributnya ('rotate(-6)' → -6, kosong → 0). null jika ada transform lain. */
function rotasiAtribut(el: Element): number | null {
  const t = (el.getAttribute('transform') ?? '').trim()
  if (!t) return 0
  const m = /^rotate\((-?[\d.]+)\)$/.exec(t)
  return m ? Number(m[1]) : null
}

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

  /** Elemen bagian, mis. part('arm-upper-r'). Putar lewat atribut transform, lihat putar(). */
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

  /** Simpan rotasi awal bagian; false jika bagian tidak ada atau transformnya bukan rotate() biasa. */
  private simpanPutaran(el: Element | null): el is Element {
    if (!el) return false
    if (this.putaranAwal.has(el)) return true
    const r = rotasiAtribut(el)
    if (r === null) return false
    this.putaranAwal.set(el, r)
    return true
  }

  private lambai() {
    const atas = this.part('arm-upper-r')
    const bawah = this.part('arm-lower-r')
    const tl = gsap.timeline()
    if (!this.simpanPutaran(atas) || !this.simpanPutaran(bawah)) return tl
    if (!this.gerak) {
      tl.set(atas, putar(-150)).set(bawah, putar(-10))
      return tl
    }
    tl.fromTo(atas, putar(this.putaranAwal.get(atas) ?? 0), { ...putar(-150), duration: 0.3, ease: 'back.out(1.6)' })
      .fromTo(bawah, putar(this.putaranAwal.get(bawah) ?? 0), { ...putar(-35), duration: 0.25, ease: 'sine.inOut' }, '<')
      .to(bawah, { ...putar(15), duration: 0.28, ease: 'sine.inOut', yoyo: true, repeat: -1 })
    return tl
  }

  private lompat() {
    const root = this.part('root')
    // Kaki berpose khusus (mis. engklek: translate + scale) tidak ikut diputar.
    const kaki = [this.part('leg-l'), this.part('leg-r')].filter((k): k is SVGGElement => this.simpanPutaran(k))
    this.tampilMata('happy')
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.12 })
    if (!root || !this.gerak) return tl
    const awal = (i: number) => this.putaranAwal.get(kaki[i]!) ?? 0
    tl.to(root, { y: -30, duration: 0.28, ease: 'power2.out' })
    kaki.forEach((k, i) => tl.fromTo(k, putar(awal(i)), { ...putar(awal(i) + (k.dataset.part === 'leg-l' ? 9 : -9)), duration: 0.2 }, '<'))
    tl.to(root, { y: 0, duration: 0.26, ease: 'power2.in' })
    kaki.forEach((k, i) => tl.to(k, { ...putar(awal(i)), duration: 0.2 }, i === 0 ? '<0.06' : '<'))
    return tl
  }

  private hentikanAksi() {
    this.aksiTl?.kill()
    this.aksiTl = null
    for (const [el, rot] of this.putaranAwal) gsap.to(el, { ...putar(rot), duration: this.gerak ? 0.2 : 0 })
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
    // Hanya tween milik animator ini (alis, kedip, pengembalian aksi). Jangan killTweensOf semua
    // [data-part]: itu ikut mematikan timeline luar (intro/game) yang menggerakkan lengan/kepala,
    // mis. saat StrictMode menjalankan ulang efek Karakter setelah timeline intro dibangun.
    const milik = [this.part('brows'), this.svg.querySelector('[data-anim="kedip"]'), this.part('root'), ...this.putaranAwal.keys()]
    gsap.killTweensOf(milik.filter((el): el is Element => !!el))
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
