/**
 * Logika lomba Egrang tanpa Phaser (diuji di aturan.test.ts). Waktu dalam ms
 * dari jam lomba; adegan memanggil lanjut(t) setiap frame dan langkah()/
 * setTahan() saat tombol ditekan.
 */
import {
  AYUN,
  BURU_PENUH,
  CEPAT,
  CPU_LEPAS_TAHAN,
  JARAK_LOMBA,
  KEMUDI,
  LABIL,
  LAMA_JATUH,
  LAMA_KEMBALI,
  LAMBAT,
  LANGKAH,
  MEDAN,
  REDAM_PAS,
  REDAM_PELAN,
  TAHAN_REDAM,
  TAMBAH_BURU,
  TAMBAH_SAMA,
  type JenisRintangan,
  type ProfilCpu,
  type Rintangan,
} from './config'

export type Kaki = 'kiri' | 'kanan'
export type Medan = 'datar' | JenisRintangan
/** pas = berirama, pelan = terlalu lama, buru = terlalu cepat, sama = egrang yang sama dua kali. */
export type NilaiLangkah = 'pas' | 'pelan' | 'buru' | 'sama'
export type Status = 'jalan' | 'jatuh' | 'kembali' | 'finis'

export type Peristiwa =
  | { jenis: 'langkah'; kaki: Kaki; nilai: NilaiLangkah; maju: number; medan: Medan }
  | { jenis: 'jatuh'; arah: -1 | 1 }
  | { jenis: 'kembali'; ke: number }
  | { jenis: 'siap' }
  | { jenis: 'finis'; waktu: number }

export interface OpsiPelari {
  rintangan: readonly Rintangan[]
  /** Pos tempat kembali setelah jatuh (meter, naik); kosong = selalu ke start. */
  pos: readonly number[]
  /** Angka acak [0, 1). */
  acak: () => number
}

/** Mengangkat egrang kiri berarti bertumpu di kanan: badan berayun ke kanan (+). */
export const arahKaki = (k: Kaki) => (k === 'kiri' ? 1 : -1)

export function medanDi(rintangan: readonly Rintangan[], m: number): Medan {
  return rintangan.find((r) => m >= r.dari && m < r.sampai)?.jenis ?? 'datar'
}

/** Pos terakhir yang sudah dilewati (atau start). */
export function posKembali(pos: readonly number[], jarak: number) {
  return pos.reduce((ke, p) => (p <= jarak ? Math.max(ke, p) : ke), 0)
}

/** Tambahan miring langkah terburu-buru: makin cepat makin besar. */
export function tambahBuru(jeda: number) {
  return TAMBAH_BURU * (0.4 + 0.6 * Math.min(1, Math.max(0, (CEPAT - jeda) / BURU_PENUH)))
}

/** Langkah integrasi terpanjang (ms) supaya pertumbuhan miring tetap halus walau frame tersendat. */
const SUB = 50

export class LogikaPelari {
  jarak = 0
  miring = 0
  status: Status = 'jalan'
  /** Kendali miring HP, −1…1 (+ = mendorong badan ke kanan). */
  kemudi = 0
  waktuFinis: number | null = null
  readonly statistik = { langkah: 0, pas: 0, jatuh: 0 }
  private o: OpsiPelari
  private t = 0
  private sejak = 0
  private menahan = false
  private kakiLalu: Kaki | null = null
  private tLangkahLalu: number | null = null

  constructor(o: OpsiPelari) {
    this.o = o
  }

  get medan(): Medan {
    return medanDi(this.o.rintangan, this.jarak)
  }

  get ditahan() {
    return this.menahan && this.status === 'jalan'
  }

  /** Waktu langkah terakhir (untuk penunjuk irama); null setelah mulai/bangkit. */
  get langkahTerakhir() {
    return this.tLangkahLalu
  }

  /** Majukan simulasi sampai waktu t. */
  lanjut(t: number): Peristiwa[] {
    const ev: Peristiwa[] = []
    while (this.t < t) {
      const dt = Math.min(SUB, t - this.t)
      this.t += dt
      if (this.status === 'jalan') {
        const d = dt / 1000
        if (this.menahan) this.miring *= Math.exp(-TAHAN_REDAM * d)
        else this.miring *= Math.exp(LABIL * this.faktor('labil') * d)
        this.miring += this.kemudi * KEMUDI * d
        if (Math.abs(this.miring) >= 1) ev.push(this.jatuh())
      } else if (this.status === 'jatuh' && this.t - this.sejak >= LAMA_JATUH) {
        this.status = 'kembali'
        this.sejak = this.t
        this.jarak = posKembali(this.o.pos, this.jarak)
        ev.push({ jenis: 'kembali', ke: this.jarak })
      } else if (this.status === 'kembali' && this.t - this.sejak >= LAMA_KEMBALI) {
        this.status = 'jalan'
        this.miring = 0
        this.kakiLalu = null
        this.tLangkahLalu = null
        ev.push({ jenis: 'siap' })
      }
    }
    return ev
  }

  langkah(kaki: Kaki, t: number): Peristiwa[] {
    const ev = this.lanjut(t)
    if (this.status !== 'jalan' || this.menahan) return ev
    const s = arahKaki(kaki)
    const jeda = this.tLangkahLalu === null ? null : t - this.tLangkahLalu
    let nilai: NilaiLangkah
    if (kaki === this.kakiLalu) nilai = 'sama'
    else if (jeda === null || (jeda >= CEPAT && jeda <= LAMBAT)) nilai = 'pas'
    else nilai = jeda < CEPAT ? 'buru' : 'pelan'
    this.tLangkahLalu = t

    const medan = this.medan
    let maju = 0
    if (nilai === 'sama') {
      this.miring += s * TAMBAH_SAMA
    } else {
      if (nilai === 'pas') this.miring = this.miring * REDAM_PAS + s * AYUN
      else if (nilai === 'pelan') this.miring = this.miring * REDAM_PELAN + s * AYUN
      else this.miring += (Math.sign(this.miring) || s) * tambahBuru(jeda ?? 0) + s * AYUN
      if (medan !== 'datar') {
        const kuat = MEDAN[medan].sentak * (0.5 + 0.5 * this.o.acak())
        this.miring += this.o.acak() < 0.5 ? -kuat : kuat
      }
      maju = LANGKAH * this.faktor('laju')
      this.jarak = Math.min(JARAK_LOMBA, this.jarak + maju)
      this.kakiLalu = kaki
      this.statistik.langkah++
      if (nilai === 'pas') this.statistik.pas++
    }
    ev.push({ jenis: 'langkah', kaki, nilai, maju, medan })

    // Langkah yang melewati garis finis tetap dihitung walau badan oleng.
    if (this.jarak >= JARAK_LOMBA) {
      this.status = 'finis'
      this.waktuFinis = t
      this.menahan = false
      ev.push({ jenis: 'finis', waktu: t })
    } else if (Math.abs(this.miring) >= 1) {
      ev.push(this.jatuh())
    }
    return ev
  }

  /** TAHAN: menegakkan badan tanpa maju selama ditekan. */
  setTahan(v: boolean, t: number): Peristiwa[] {
    const ev = this.lanjut(t)
    this.menahan = v
    // Setelah menahan, langkah berikutnya dinilai dari awal irama lagi.
    if (!v) this.tLangkahLalu = null
    return ev
  }

  private jatuh(): Peristiwa {
    const arah = this.miring >= 0 ? 1 : -1
    this.status = 'jatuh'
    this.sejak = this.t
    this.miring = arah
    this.menahan = false
    this.statistik.jatuh++
    return { jenis: 'jatuh', arah }
  }

  private faktor(k: 'labil' | 'laju') {
    const m = this.medan
    return m === 'datar' ? 1 : MEDAN[m][k]
  }
}

/**
 * Pemain komputer: melangkah dengan jeda acak di sekitar profilnya, kadang
 * salah (terburu-buru / kaki sama), dan menahan badan saat terlalu miring.
 * Kadang ia lengah: bukannya menahan, malah panik terburu-buru (lalu bisa jatuh).
 */
export class OtakCpu {
  private l: LogikaPelari
  private p: ProfilCpu
  private acak: () => number
  private tBerikut: number | null = null
  private kaki: Kaki
  private menahan = false
  /** null = belum melewati batas miring; true = sedang panik (lengah). */
  private panik: boolean | null = null

  constructor(logika: LogikaPelari, profil: ProfilCpu, acak: () => number) {
    this.l = logika
    this.p = profil
    this.acak = acak
    this.kaki = acak() < 0.5 ? 'kiri' : 'kanan'
  }

  jalan(t: number): Peristiwa[] {
    const l = this.l
    const ev = l.lanjut(t)
    if (l.status !== 'jalan') {
      this.tBerikut = null
      this.menahan = false
      this.panik = null
      return ev
    }
    // Baru mulai / baru bangkit: waktu reaksi sebelum langkah pertama.
    this.tBerikut ??= t + 200 + this.acak() * 300

    const miring = Math.abs(l.miring)
    if (this.panik === null && miring >= this.p.tahan) this.panik = this.acak() < this.p.lengah
    else if (this.panik && miring < this.p.tahan * 0.6) this.panik = null
    if (!this.menahan && this.panik === false) {
      this.menahan = true
      ev.push(...l.setTahan(true, t))
    } else if (this.menahan && miring < CPU_LEPAS_TAHAN) {
      this.menahan = false
      this.panik = null
      ev.push(...l.setTahan(false, t))
      this.tBerikut = t + 120 + this.acak() * 120
    }
    if (this.menahan || t < this.tBerikut) return ev

    ev.push(...l.langkah(this.kaki, t))
    let jeda = Math.max(CEPAT + 15, this.p.jeda + (this.acak() * 2 - 1) * this.p.acak)
    let ganti = true
    if (this.panik) jeda = 180 + this.acak() * 140
    else if (this.acak() < this.p.salah) {
      if (this.acak() < 0.5) jeda = 160 + this.acak() * 160
      else ganti = false
    }
    if (ganti) this.kaki = this.kaki === 'kiri' ? 'kanan' : 'kiri'
    this.tBerikut = t + jeda
    return ev
  }
}

/** Acak berbenih (LCG) untuk uji dan susunan yang bisa diulang. */
export function acakBerbenih(benih: number) {
  let s = benih >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}

export interface DataUrutan {
  id: string
  jarak: number
  waktuFinis: number | null
}

/** Urutan akhir: yang finis menurut waktu, lalu yang belum finis menurut jarak. */
export function urutkan<T extends DataUrutan>(pelari: readonly T[]): T[] {
  return [...pelari].sort((a, b) => {
    if (a.waktuFinis !== null && b.waktuFinis !== null) return a.waktuFinis - b.waktuFinis
    if (a.waktuFinis !== null) return -1
    if (b.waktuFinis !== null) return 1
    return b.jarak - a.jarak
  })
}
