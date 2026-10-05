/**
 * Angka-angka Pecah Balon Air. Ubah di sini untuk menyetel rasa permainan;
 * aturan.test.ts memeriksa perilakunya. Satuan jarak = px dunia lintasan,
 * kecepatan = px/detik, percepatan = px/detik², waktu = ms, tekanan = 0..1.
 */
import type { Kesulitan } from '../../shared/types'

export type IdCara = 'dua-tangan' | 'atas-kepala' | 'diapit' | 'mundur'

/** Cara membawa balon di satu putaran estafet. */
export interface Cara {
  id: IdCara
  judul: string
  /** Penjelasan singkat di kartu putaran. */
  keterangan: string
  /** Pengali kecepatan maksimum. */
  laju: number
  /** Pengali kenaikan tekanan (makin besar = balon makin gampang pecah). */
  peka: number
  /** Arah kendali dibalik (jalan mundur). */
  terbalik: boolean
  /** Dibawa berdua; teman diapit dikendalikan komputer. */
  berpasangan: boolean
}

/** Urutan cara membawa: putaran 1–4. */
export const URUTAN_CARA: readonly Cara[] = [
  {
    id: 'dua-tangan',
    judul: 'Dua tangan',
    keterangan: 'Peluk balon dengan dua tangan. Jalan dengan halus, jangan mengerem mendadak.',
    laju: 1,
    peka: 1,
    terbalik: false,
    berpasangan: false,
  },
  {
    id: 'atas-kepala',
    judul: 'Di atas kepala',
    keterangan: 'Balon dijunjung di atas kepala. Langkahmu lebih cepat, tapi balon lebih gampang pecah.',
    laju: 1.25,
    peka: 1.7,
    terbalik: false,
    berpasangan: false,
  },
  {
    id: 'diapit',
    judul: 'Diapit berdua',
    keterangan: 'Balon diapit berdua dengan teman setim. Temanmu menyusul sedikit terlambat, jadi jaga jarak tetap pas: jangan kejauhan, jangan kedempetan.',
    laju: 0.9,
    peka: 1,
    terbalik: false,
    berpasangan: true,
  },
  {
    id: 'mundur',
    judul: 'Jalan mundur',
    keterangan:
      'Kamu berjalan mundur, jadi arah kendali terbalik: joystick ke kiri = jalan ke kanan. Kalau menyeret, taruh jari di sebelah kiri pelari untuk mendorongnya ke kanan.',
    laju: 0.85,
    peka: 1,
    terbalik: true,
    berpasangan: false,
  },
]

export const JUMLAH_PUTARAN = URUTAN_CARA.length
/** Anggota per tim = satu pelari per putaran. */
export const ANGGOTA_TIM = 4

// ── Gerak ─────────────────────────────────────────────────

/** Kecepatan maksimum cara "dua tangan". */
export const V_MAKS = 220
/** Kecepatan mendekati arah kendali (per detik); makin besar makin gesit. */
export const RESPON = 5
/** Jari-jari badan untuk tabrakan (di titik kaki). */
export const R_BADAN = 13
/** Sampai di keranjang jika titik kaki sedekat ini dengan pusat keranjang. */
export const R_SAMPAI = 64

/** Genangan: kecepatan dan respons dikali angka ini (lambat dan licin). */
export const GENANGAN_LAJU = 0.5
export const GENANGAN_RESPON = 0.45
/** Papan titian: di atas kecepatan ini papan bergoyang dan tekanan naik. */
export const V_TITIAN = 90

// ── Tekanan balon ─────────────────────────────────────────

/** Percepatan (perubahan kecepatan) di bawah angka ini aman. */
export const A_AMAN = 480
/** Tekanan per (px/detik² di atas A_AMAN) per detik. */
export const K_AKSEL = 0.0024
/** Benturan: tekanan += K_BENTUR × (laju tegak lurus benturan / V_MAKS). */
export const K_BENTUR = 0.5
/** Benturan pelan di bawah laju ini diabaikan (menyusuri tepi). */
export const V_BENTUR_MIN = 35
/** Pagar tepi lintasan lebih empuk dari batu. */
export const PENGALI_TEPI = 0.6
/** Melangkah cepat di genangan: tekanan per detik pada laju V_MAKS (di atas 40 px/detik). */
export const K_GENANGAN = 0.5
/** Terburu-buru di papan titian: tekanan per detik pada selisih laju V_MAKS. */
export const K_TITIAN = 1.2
/** Tekanan turun perlahan saat bergerak halus / diam. */
export const TURUN_JALAN = 0.1
export const TURUN_DIAM = 0.05
/** Bergerak dianggap "jalan" di atas laju ini. */
export const V_JALAN = 30

// ── Diapit berdua ─────────────────────────────────────────

/** Jarak pas antara dua pengapit (titik kaki). */
export const JARAK_APIT = 62
/** Selisih jarak yang masih aman. */
export const TOLERANSI_APIT = 14
/** Tekanan per px kelebihan selisih per detik. */
export const K_APIT = 0.035
/** Kegesitan teman pengapit (pegas teredam kritis, rad/detik). */
export const OMEGA_TEMAN = 7

// ── Waktu ─────────────────────────────────────────────────

/** Setelah balon pecah, pelari kembali ke START dengan balon baru sekian ms kemudian. */
export const JEDA_PECAH = 1100
/** Hitungan 3-2-1 (ms per angka). */
export const LAMA_HITUNG = 700
/** Jeda setelah putaran selesai sebelum kartu putaran berikutnya. */
export const JEDA_PUTARAN = 2200
/** Papan hasil akhir tampil sekian ms sebelum layar hasil. */
export const JEDA_HASIL = 4200
/** Selisih waktu tim di bawah angka ini dihitung seri. */
export const SELISIH_SERI = 50

// ── Tim komputer (bayangan pelari) ────────────────────────

export interface ProfilCpu {
  /** Laju di tanah terbuka, sebagai bagian dari laju maksimum cara. */
  tempo: number
  /** Peluang balon pecah sekali di satu putaran (dikali `peka` cara). */
  pecah: number
}

export const CPU: Record<Kesulitan, ProfilCpu> = {
  mudah: { tempo: 0.64, pecah: 0.45 },
  sedang: { tempo: 0.76, pecah: 0.28 },
  sulit: { tempo: 0.87, pecah: 0.12 },
}
/** Percepatan bayangan pelari (halus, tidak pernah mendadak). */
export const A_CPU = 320
