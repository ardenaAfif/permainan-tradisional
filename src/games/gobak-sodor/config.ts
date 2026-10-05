/**
 * Angka-angka Gobak Sodor. Ubah di sini untuk menyetel rasa permainan;
 * aturan.test.ts memeriksa perilakunya. Satuan jarak = px panggung 1280x720,
 * kecepatan = px/detik, waktu = ms.
 */
import type { Kesulitan } from '../../shared/types'

/** Garis jaga mendatar (masing-masing dijaga satu penjaga). */
export const JUMLAH_GARIS = 4
/** Garis tengah membujur yang dijaga penjaga "sodor". */
export const PAKAI_SODOR = true
/** Anggota per tim. Penjaga = JUMLAH_GARIS (+1 sodor); sisanya cadangan. */
export const ANGGOTA_TIM = 5

/** Lama satu ronde. */
export const LAMA_RONDE = 90_000
/** Setiap tim menyerang sekian ronde (bergantian dengan menjaga). */
export const RONDE_PER_TIM = 2

/** Penjaga menyentuh penyerang jika jarak titik kaki keduanya di bawah angka ini. */
export const R_SENTUH = 44
/** Penyerang dianggap sudah melewati garis jika sekian px di seberangnya (untuk "sampai ujung" dan "pulang"). */
export const LEWAT = 24

/** Kecepatan penyerang yang dikendalikan pemain. */
export const V_PENYERANG = 240
/** Kecepatan penjaga yang dikendalikan pemain (joystick, tombol, atau slider sodor). */
export const V_JAGA_MANUSIA = 205

/** Setelah penyerang gugur / dapat poin, penyerang berikutnya masuk sekian ms kemudian. */
export const JEDA_GUGUR = 1300
export const JEDA_POIN = 900

/** Hitungan 3-2-1 (ms per angka). */
export const LAMA_HITUNG = 700
/** Papan hasil akhir tampil sekian ms sebelum layar hasil. */
export const JEDA_HASIL = 3800

export interface ProfilJaga {
  kecepatan: number
  /** Penjaga bereaksi pada posisi penyerang sekian ms yang lalu. */
  reaksi: number
  /** Menebak arah lari: tujuan = posisi + kecepatan penyerang × detik ini. */
  antisipasi: number
}

/** Penjaga komputer di tim lawan, menurut tingkat kesulitan. */
export const JAGA_CPU: Record<Kesulitan, ProfilJaga> = {
  mudah: { kecepatan: 155, reaksi: 420, antisipasi: 0 },
  sedang: { kecepatan: 175, reaksi: 300, antisipasi: 0.05 },
  sulit: { kecepatan: 185, reaksi: 260, antisipasi: 0.1 },
}
/**
 * Penjaga komputer yang satu tim dengan pemain (ronde menjaga). Kebalikan dari
 * lawan: makin sulit, makin kurang sigap teman penjaganya.
 */
export const JAGA_TEMAN: Record<Kesulitan, ProfilJaga> = {
  mudah: JAGA_CPU.sulit,
  sedang: JAGA_CPU.sedang,
  sulit: JAGA_CPU.mudah,
}
export const JAGA_MANUSIA: ProfilJaga = { kecepatan: V_JAGA_MANUSIA, reaksi: 0, antisipasi: 0 }

export interface ProfilSerang {
  kecepatan: number
  /** Jeda antarkeputusan (ms). */
  reaksi: number
  /** Jarak cadangan (px) dari jangkauan penjaga yang diminta sebelum berani menyeberang. */
  cermat: number
  /** Tebakan waktu reaksi penjaga (detik) saat menilai celah; terlalu besar = terlalu berani. */
  tebakReaksi: number
  /** Berkurangnya `cermat` per detik menunggu di garis yang sama (makin lama makin nekat). */
  nekat: number
  /** Peluang memancing (berbalik arah tiba-tiba) per keputusan. */
  pancing: number
  /** Membatalkan lari jika celah tertutup sebelum sampai garis. */
  batal: boolean
}

export const SERANG_CPU: Record<Kesulitan, ProfilSerang> = {
  mudah: { kecepatan: 215, reaksi: 320, cermat: 6, tebakReaksi: 0.4, nekat: 8, pancing: 0.12, batal: false },
  sedang: { kecepatan: 228, reaksi: 200, cermat: 16, tebakReaksi: 0.25, nekat: 6, pancing: 0.22, batal: false },
  sulit: { kecepatan: 240, reaksi: 120, cermat: 24, tebakReaksi: 0.15, nekat: 4, pancing: 0.3, batal: true },
}
