import data from './script.json'

export type IdAdegan = 'istirahat' | 'guru-datang' | 'kotak-dibuka' | 'kilas-balik' | 'memudar' | 'misi'
export type TokohBicara = 'guru' | 'bima' | 'sekar' | 'dimas'
/** kain = kain tersingkap, gunungan = gunungan berputar, putih = layar PID menyala, potong = tanpa transisi. */
export type JenisTransisi = 'kain' | 'gunungan' | 'putih' | 'potong'

export interface AksiAdegan {
  id: string
  /** Detik sejak awal adegan. */
  t: number
  durasi: number
  tokoh: string
  keterangan: string
}

export interface DataAdegan {
  id: IdAdegan
  judul: string
  durasi: number
  latar: string
  transisiKeluar: JenisTransisi
  sfx: { t: number; nama: string }[]
  /** Titik waktu yang menunggu baris dialog selesai sebelum animasi lanjut. */
  tahan: number[]
  aksi: AksiAdegan[]
}

/** Posisi balon kata di panggung 1280x720 (dari storyboard). */
export interface PosisiBalon {
  x: number
  y: number
  lebar: number
  ekor: 'bawah' | 'kiri' | 'kanan' | 'tanpa'
  /** Posisi ekor dari kiri balon (hanya untuk ekor bawah). */
  ekorX: number
}

export interface Baris {
  lineId: string
  adegan: IdAdegan
  tokoh: TokohBicara
  gaya?: 'narasi'
  /** Detik sejak awal adegan saat baris mulai (bisa mundur bila baris sebelumnya belum selesai). */
  mulai: number
  teks: string
  /** Naskah untuk perekam suara jika berbeda dari subtitle. */
  teksVO?: string
  balon: PosisiBalon
}

interface Naskah {
  adegan: DataAdegan[]
  baris: Baris[]
}

const naskah = data as Naskah

export const ADEGAN = naskah.adegan
export const BARIS = naskah.baris

export const barisAdegan = (id: IdAdegan) => BARIS.filter((b) => b.adegan === id).sort((a, b) => a.mulai - b.mulai)

/**
 * Waktu aksi satu adegan dari script.json: const T = waktuAksi('istirahat'); T('bima-menguap').t
 * Aksi yang tidak tertulis tetap aman (t = 0) supaya intro tidak macet.
 */
export function waktuAksi(id: IdAdegan): (aksi: string) => AksiAdegan {
  const daftar = ADEGAN.find((x) => x.id === id)?.aksi ?? []
  return (aksi) => daftar.find((x) => x.id === aksi) ?? { id: aksi, t: 0, durasi: 0, tokoh: '', keterangan: '' }
}

/** Lama baris tanpa VO: sekitar 14 karakter per detik, minimal 1,8 detik. */
export const durasiTeks = (teks: string) => Math.max(1.8, teks.length / 14)

export const NAMA_TOKOH: Record<TokohBicara, string> = {
  guru: 'Pak Guru',
  bima: 'Bima',
  sekar: 'Sekar',
  dimas: 'Dimas',
}
