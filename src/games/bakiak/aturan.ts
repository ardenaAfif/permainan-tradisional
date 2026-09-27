/**
 * Aturan lomba Bakiak tanpa Phaser: tempo aba-aba, penilaian ketukan, meter
 * goyang, jatuh & bangkit, Tim Kompak, dan otak komputer. Semua waktu dalam ms
 * "waktu lagu": ketukan 0 (aba-aba "Kiri!" pertama) = 0, hitungan awal negatif.
 */
import {
  BANGKIT_KETUK,
  BANGKIT_WAKTU,
  BPM_AKHIR,
  BPM_AWAL,
  BPM_NAIK,
  GOYANG,
  GOYANG_MAKS,
  JARAK_LOMBA,
  JEDA_SETELAH_BANGKIT,
  JENDELA_KOMPAK,
  JENDELA_OKE,
  JENDELA_PAS,
  JENDELA_TANGKAP,
  KETUKAN_PER_NAIK,
  LAMA_JATUH,
  LANGKAH_OKE,
  LANGKAH_PAS,
} from './config'

export type Kaki = 'kiri' | 'kanan'
export type Nilai = 'pas' | 'oke' | 'meleset' | 'salah'

/** Aba-aba bergantian: ketukan genap "Kiri!", ganjil "Kanan!". */
export const kakiKetukan = (k: number): Kaki => (((k % 2) + 2) % 2 === 0 ? 'kiri' : 'kanan')

export function bpmKetukan(k: number): number {
  if (k < 0) return BPM_AWAL
  return Math.min(BPM_AKHIR, BPM_AWAL + Math.floor(k / KETUKAN_PER_NAIK) * BPM_NAIK)
}

const waktuCache: number[] = [0]

/** Waktu ketukan ke-k (ms). Tempo ketukan k menentukan jarak ke ketukan k+1. */
export function waktuKetukan(k: number): number {
  if (k < 0) return k * (60000 / BPM_AWAL)
  while (waktuCache.length <= k) {
    const j = waktuCache.length - 1
    waktuCache.push(waktuCache[j]! + 60000 / bpmKetukan(j))
  }
  return waktuCache[k]!
}

/** Ketukan pertama (≥ 0) yang jatuh setelah waktu t. */
export function ketukanSetelah(t: number): number {
  let k = 0
  while (waktuKetukan(k) <= t) k++
  return k
}

/** Tekanan sejauh ini dari ketukan k masih dinilai untuk ketukan itu (tidak tumpang tindih dengan ketukan berikutnya). */
export const jendelaTangkap = (k: number) => Math.min(JENDELA_TANGKAP, 30000 / bpmKetukan(k) - 10)

export function nilaiDariSelisih(ms: number): Exclude<Nilai, 'salah'> {
  const d = Math.abs(ms)
  return d <= JENDELA_PAS ? 'pas' : d <= JENDELA_OKE ? 'oke' : 'meleset'
}

export type Status = 'jalan' | 'jatuh' | 'bangkit' | 'finis'

/** Kaki yang ditekan; 'kompak' = ketiga tombol Tim Kompak serempak; 'tidak-kompak' = tidak serempak. */
export type Masukan = Kaki | 'kompak' | 'tidak-kompak'

export type Peristiwa =
  | { jenis: 'nilai'; nilai: Nilai; ketukan: number; maju: number; alasan?: 'kaki' | 'kompak' }
  | { jenis: 'ekstra' }
  | { jenis: 'jatuh' }
  | { jenis: 'siap-bangkit' }
  | { jenis: 'ketuk-bangkit'; ketuk: number }
  | { jenis: 'bangkit-gagal' }
  | { jenis: 'bangkit' }
  | { jenis: 'finis' }

export interface Statistik {
  pas: number
  oke: number
  meleset: number
  salah: number
  jatuh: number
}

/** Keadaan satu tim di lintasan. */
export class LogikaTim {
  jarak = 0
  goyang = 0
  status: Status = 'jalan'
  /** Ketukan berikutnya yang belum dinilai. */
  ketukan = 0
  ketukBangkit = 0
  private jatuhSejak = 0
  private mulaiBangkit: number | null = null
  readonly statistik: Statistik = { pas: 0, oke: 0, meleset: 0, salah: 0, jatuh: 0 }

  /** Tombol tim ditekan pada waktu t. */
  tekan(t: number, masukan: Masukan): Peristiwa[] {
    if (this.status === 'bangkit') return this.ketukBangkitan(t)
    if (this.status !== 'jalan') return []
    // Selama hitungan "3, 2, 1" tekanan diabaikan tanpa hukuman.
    if (t < waktuKetukan(0) - jendelaTangkap(0)) return []
    const out = this.lewati(t)
    if (this.status !== 'jalan') return out
    const k = this.ketukan
    const selisih = t - waktuKetukan(k)
    if (Math.abs(selisih) > jendelaTangkap(k)) {
      out.push({ jenis: 'ekstra' })
      return out.concat(this.ubahGoyang(GOYANG.ekstra, t))
    }
    this.ketukan++
    if (masukan === 'tidak-kompak') return out.concat(this.nilai(k, 'salah', t, 'kompak'))
    if (masukan !== 'kompak' && masukan !== kakiKetukan(k)) return out.concat(this.nilai(k, 'salah', t, 'kaki'))
    return out.concat(this.nilai(k, nilaiDariSelisih(selisih), t))
  }

  /**
   * Panggil setiap frame. Ketukan yang lewat tanpa tekanan = Meleset; setelah
   * animasi jatuh, tantangan bangkit dimulai; waktu bangkit habis = ulang hitungan.
   */
  lewati(t: number): Peristiwa[] {
    const out: Peristiwa[] = []
    while (this.status === 'jalan' && t > waktuKetukan(this.ketukan) + jendelaTangkap(this.ketukan)) {
      out.push(...this.nilai(this.ketukan++, 'meleset', t))
    }
    if (this.status === 'jatuh' && t >= this.jatuhSejak + LAMA_JATUH) {
      this.status = 'bangkit'
      this.ketukBangkit = 0
      this.mulaiBangkit = null
      out.push({ jenis: 'siap-bangkit' })
    }
    if (this.status === 'bangkit' && this.mulaiBangkit !== null && t - this.mulaiBangkit > BANGKIT_WAKTU) {
      this.ketukBangkit = 0
      this.mulaiBangkit = null
      out.push({ jenis: 'bangkit-gagal' })
    }
    return out
  }

  /** Sisa waktu tantangan bangkit (ms), atau null jika belum mulai mengetuk. */
  sisaBangkit(t: number): number | null {
    return this.mulaiBangkit === null ? null : Math.max(0, BANGKIT_WAKTU - (t - this.mulaiBangkit))
  }

  private ketukBangkitan(t: number): Peristiwa[] {
    // Waktu 2 detik dihitung dari ketukan pertama, supaya tidak ada hukuman waktu reaksi.
    if (this.mulaiBangkit === null || t - this.mulaiBangkit > BANGKIT_WAKTU) {
      this.mulaiBangkit = t
      this.ketukBangkit = 0
    }
    this.ketukBangkit++
    const out: Peristiwa[] = [{ jenis: 'ketuk-bangkit', ketuk: this.ketukBangkit }]
    if (this.ketukBangkit >= BANGKIT_KETUK) {
      this.status = 'jalan'
      this.goyang = GOYANG.setelahBangkit
      this.mulaiBangkit = null
      this.ketukan = ketukanSetelah(t + JEDA_SETELAH_BANGKIT)
      out.push({ jenis: 'bangkit' })
    }
    return out
  }

  private nilai(k: number, nilai: Nilai, t: number, alasan?: 'kaki' | 'kompak'): Peristiwa[] {
    this.statistik[nilai]++
    const maju = nilai === 'pas' ? LANGKAH_PAS : nilai === 'oke' ? LANGKAH_OKE : 0
    this.jarak = Math.min(JARAK_LOMBA, this.jarak + maju)
    const out: Peristiwa[] = [{ jenis: 'nilai', nilai, ketukan: k, maju, ...(alasan && { alasan }) }]
    if (this.jarak >= JARAK_LOMBA) {
      this.status = 'finis'
      out.push({ jenis: 'finis' })
      return out
    }
    return out.concat(this.ubahGoyang(GOYANG[nilai], t))
  }

  private ubahGoyang(d: number, t: number): Peristiwa[] {
    this.goyang = Math.max(0, Math.min(GOYANG_MAKS, this.goyang + d))
    if (this.goyang < GOYANG_MAKS) return []
    this.status = 'jatuh'
    this.jatuhSejak = t
    this.statistik.jatuh++
    return [{ jenis: 'jatuh' }]
  }
}

/**
 * Tim Kompak: tiga tombol kaki (satu per siswa). Hasilnya 'kompak' jika ketiganya
 * ditekan dalam JENDELA_KOMPAK ms, 'tidak-kompak' jika jendela habis lebih dulu.
 * Waktu hasil = rata-rata waktu tekan (untuk dinilai terhadap ketukan).
 */
export class KelompokKompak {
  readonly jumlah: number
  private jendela: number
  private mulai: number | null = null
  private waktu = new Map<number, number>()

  constructor(jumlah = 3, jendela = JENDELA_KOMPAK) {
    this.jumlah = jumlah
    this.jendela = jendela
  }

  /** Siswa yang sudah menekan dalam kelompok yang sedang terbuka. */
  get sudahTekan(): ReadonlySet<number> {
    return new Set(this.waktu.keys())
  }

  tekan(siswa: number, t: number): { hasil: 'kompak' | 'tidak-kompak'; t: number }[] {
    const out: { hasil: 'kompak' | 'tidak-kompak'; t: number }[] = this.periksa(t)
    if (this.mulai === null) this.mulai = t
    if (!this.waktu.has(siswa)) this.waktu.set(siswa, t)
    if (this.waktu.size >= this.jumlah) {
      const rata = [...this.waktu.values()].reduce((a, b) => a + b, 0) / this.waktu.size
      this.kosongkan()
      out.push({ hasil: 'kompak', t: rata })
    }
    return out
  }

  /** Panggil setiap frame: kelompok yang jendelanya habis menjadi 'tidak-kompak'. */
  periksa(t: number): { hasil: 'tidak-kompak'; t: number }[] {
    if (this.mulai === null || t - this.mulai <= this.jendela) return []
    const mulai = this.mulai
    this.kosongkan()
    return [{ hasil: 'tidak-kompak', t: mulai }]
  }

  kosongkan() {
    this.mulai = null
    this.waktu.clear()
  }
}

type Rencana = { t: number; masukan: Masukan | 'bangkit' }

/**
 * Tim komputer: setiap ketukan menekan dengan peluang `akurasi` (lalu Pas
 * dengan peluang yang sama, sisanya Oke). Sisanya meleset atau salah kaki.
 */
export class OtakCpu {
  readonly tim: LogikaTim
  private akurasi: number
  private lamaBangkit: number
  private acak: () => number
  private rencana: Rencana[] = []
  private ketukanDirencana = 0
  private bangkitDirencana = false

  constructor(tim: LogikaTim, akurasi: number, lamaBangkit: number, acak: () => number = Math.random) {
    this.tim = tim
    this.akurasi = akurasi
    this.lamaBangkit = lamaBangkit
    this.acak = acak
  }

  jalan(t: number): Peristiwa[] {
    const tim = this.tim
    if (tim.status === 'jalan') {
      this.bangkitDirencana = false
      this.ketukanDirencana = Math.max(this.ketukanDirencana, tim.ketukan)
      while (waktuKetukan(this.ketukanDirencana) - JENDELA_TANGKAP <= t) this.rencanakan(this.ketukanDirencana++)
    } else if (tim.status === 'bangkit' && !this.bangkitDirencana) {
      this.bangkitDirencana = true
      for (let i = 1; i <= BANGKIT_KETUK; i++) this.rencana.push({ t: t + (i * this.lamaBangkit) / BANGKIT_KETUK, masukan: 'bangkit' })
    }
    this.rencana.sort((a, b) => a.t - b.t)
    const out: Peristiwa[] = []
    while (this.rencana.length && this.rencana[0]!.t <= t) {
      const r = this.rencana.shift()!
      const statusSebelum = tim.status
      if ((r.masukan === 'bangkit') === (statusSebelum === 'bangkit')) {
        out.push(...tim.tekan(r.t, r.masukan === 'bangkit' ? 'kompak' : r.masukan))
      }
      // Jatuh: rencana langkah yang tersisa dibatalkan.
      if (tim.status === 'jatuh') this.rencana = this.rencana.filter((x) => x.masukan === 'bangkit')
    }
    return out.concat(tim.lewati(t))
  }

  private rencanakan(k: number) {
    const w = waktuKetukan(k)
    const kaki = kakiKetukan(k)
    const acak = (a: number, b: number) => a + this.acak() * (b - a)
    const tanda = () => (this.acak() < 0.5 ? -1 : 1)
    if (this.acak() < this.akurasi) {
      const pas = this.acak() < this.akurasi
      const geser = pas ? acak(-JENDELA_PAS * 0.6, JENDELA_PAS * 0.6) : tanda() * acak(JENDELA_PAS + 15, JENDELA_OKE - 10)
      this.rencana.push({ t: w + geser, masukan: kaki })
    } else if (this.acak() < 0.3) {
      // Salah kaki.
      this.rencana.push({ t: w + acak(-40, 40), masukan: kaki === 'kiri' ? 'kanan' : 'kiri' })
    }
    // Selain itu: tidak menekan → Meleset saat ketukan lewat.
  }
}
