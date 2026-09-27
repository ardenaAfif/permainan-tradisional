/**
 * Angka-angka Kelereng (panggung 1280x720, kecepatan dalam px per langkah
 * fisika 1/60 detik). Ubah di sini untuk menyetel rasa permainan;
 * aturan.test.ts memeriksa perilakunya.
 */
import type { Kesulitan } from '../../shared/types'

/** Garis batas area bermain. */
export const BATAS = { kiri: 40, atas: 84, kanan: 1240, bawah: 704 } as const
export const SUDUT_BATAS = 36
/** Garis sentil (x) dan titik awal gacoan. */
export const GARIS_X = 170
export const GARIS_Y_MIN = BATAS.atas + 50
export const GARIS_Y_MAKS = BATAS.bawah - 50
export const AWAL_Y = (BATAS.atas + BATAS.bawah) / 2
/** Tap sejauh ini dari garis sentil memindahkan gacoan di sepanjang garis. */
export const LEBAR_ZONA_GARIS = 90

export const R_GACOAN = 17
export const R_TARUHAN = 13
export const R_LUBANG = 24

/** Mode Tembak: lingkaran di tengah dan jumlah kelereng taruhan. */
export const PUSAT_LINGKARAN = { x: 780, y: AWAL_Y } as const
export const R_LINGKARAN = 140
export const JUMLAH_TARUHAN = 9

/** Mode Lubang: lubang minimal sejauh ini dari garis sentil, batas, dan lubang lain. */
export const LUBANG_DARI_GARIS = 170
export const LUBANG_DARI_BATAS = 60
export const LUBANG_ANTAR = 150
/** Masuk lubang jika pusat kelereng sedekat ini dan cukup pelan (px/langkah). */
export const LUBANG_TANGKAP = R_LUBANG * 0.8
export const V_MASUK = 5.5
/** Bibir lubang memperlambat kelereng yang lewat terlalu cepat (per langkah). */
export const REDAM_BIBIR = 0.9

/** Kelentingan tumbukan kaca ke kaca (1 = pantul sempurna). */
export const RESTITUSI = 0.92

/** Gesekan tanah: v' = v·(1 − REDAM) − GESEK; di bawah BERHENTI dianggap diam. */
export const REDAM = 0.012
export const GESEK = 0.05
export const BERHENTI = 0.04
export const V_MAKS = 24
export const LANGKAH_MS = 1000 / 60

/** Tarik sejauh ini (px panggung) = kekuatan penuh. Di bawah minimum = batal. */
export const TARIK_MAKS = 200
export const KEKUATAN_MIN = 0.06

/** Komputer: galat sudut bidikan (± derajat) dan galat kekuatan (± bagian). */
export const GALAT_CPU: Record<Kesulitan, number> = { mudah: 12, sedang: 6, sulit: 2 }
export const GALAT_KEKUATAN_CPU = 0.05
/** Mode Tembak: komputer menyentil lebih jauh dari target supaya target terdorong keluar. */
export const LEBIH_TEMBAK = 220
export const JEDA_CPU = 900
export const LAMA_BIDIK_CPU = 700

/** Giliran dianggap selesai paling lama setelah ini (ms), walau ada kelereng bergerak. */
export const BATAS_WAKTU_LUNCUR = 12000
export const JEDA_ANTARGILIRAN = 700
export const JEDA_HASIL = 2400
