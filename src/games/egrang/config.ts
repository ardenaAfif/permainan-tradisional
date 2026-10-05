/**
 * Angka-angka lomba Egrang. Ubah di sini untuk menyetel rasa permainan;
 * aturan.test.ts memeriksa perilakunya.
 *
 * Miring: −1 (condong kiri) … 0 (tegak) … +1 (condong kanan). |miring| ≥ 1 = jatuh.
 */
import type { Kesulitan } from '../../shared/types'

/** Panjang lintasan (meter). */
export const JARAK_LOMBA = 30
/** Maju per langkah (meter). 30 m = 50 langkah di tanah datar. */
export const LANGKAH = 0.6

/** Irama: jeda antarlangkah di bawah CEPAT = terburu-buru; di atas LAMBAT = terlalu pelan (ms). */
export const CEPAT = 340
export const LAMBAT = 900

/** Badan makin miring dengan sendirinya: miring dikali e^(LABIL·detik) saat tidak ditahan. */
export const LABIL = 0.6
/** Ayunan kecil ke arah kaki yang menumpu (mengangkat egrang kiri = condong ke kanan). */
export const AYUN = 0.07
/** Langkah berirama menegakkan badan: miring dikali angka ini. */
export const REDAM_PAS = 0.5
/** Langkah terlalu pelan hanya sedikit menegakkan badan. */
export const REDAM_PELAN = 0.85
/**
 * Terburu-buru: miring bertambah ke arah badan sudah condong, makin cepat makin
 * besar: sedikit di bawah CEPAT = 40%, BURU_PENUH ms di bawahnya = penuh.
 */
export const TAMBAH_BURU = 0.26
export const BURU_PENUH = 150
/** Mengangkat egrang yang sama dua kali: miring bertambah ke arah kaki itu, tidak maju. */
export const TAMBAH_SAMA = 0.3

/** TAHAN: miring berkurang e^(−TAHAN_REDAM·detik), tidak maju. */
export const TAHAN_REDAM = 3
/** Kendali miring HP: miring berubah KEMUDI per detik saat HP dimiringkan penuh. */
export const KEMUDI = 1.4
/** Sudut miring HP (derajat) untuk kemudi penuh, dan zona mati di tengah. */
export const SUDUT_KEMUDI = 25
export const ZONA_MATI = 3

/** Rintangan: LABIL dikali `labil`; tiap langkah tersentak acak ±(½–1)·`sentak`; maju dikali `laju`. */
export const MEDAN = {
  gelombang: { labil: 1.25, sentak: 0.2, laju: 1 },
  genangan: { labil: 1.3, sentak: 0.16, laju: 0.6 },
} as const

export type JenisRintangan = keyof typeof MEDAN

export interface Rintangan {
  jenis: JenisRintangan
  /** Rentang meter [dari, sampai). */
  dari: number
  sampai: number
}

/** Susunan rintangan (sama untuk semua lintasan supaya adil); satu dipilih acak per lomba. */
export const SUSUNAN_RINTANGAN: Rintangan[][] = [
  [
    { jenis: 'gelombang', dari: 5, sampai: 9 },
    { jenis: 'genangan', dari: 13, sampai: 15.5 },
    { jenis: 'gelombang', dari: 19, sampai: 23 },
    { jenis: 'genangan', dari: 25.5, sampai: 27.5 },
  ],
  [
    { jenis: 'genangan', dari: 4.5, sampai: 6.5 },
    { jenis: 'gelombang', dari: 10, sampai: 14 },
    { jenis: 'genangan', dari: 17.5, sampai: 20 },
    { jenis: 'gelombang', dari: 23, sampai: 27 },
  ],
  [
    { jenis: 'gelombang', dari: 6, sampai: 10 },
    { jenis: 'genangan', dari: 14, sampai: 16 },
    { jenis: 'gelombang', dari: 21, sampai: 24 },
    { jenis: 'genangan', dari: 26, sampai: 28 },
  ],
]

/** Pos (meter) tempat kembali setelah jatuh di tingkat Mudah. Tingkat lain kembali ke start. */
export const POS_MUDAH = [10, 20]

/** Lama animasi jatuh, lalu lama berpindah ke start/pos (ms). */
export const LAMA_JATUH = 1400
export const LAMA_KEMBALI = 700

/** Hitungan 3-2-1-JALAN (ms per angka). */
export const LAMA_HITUNG = 700
/** Setelah pemain pertama finis, lomba berlanjut paling lama sekian ms supaya urutan finis terisi. */
export const BATAS_SUSUL = 8000
/** Papan urutan finis tampil sekian ms sebelum layar hasil. */
export const JEDA_HASIL = 3800

export interface ProfilCpu {
  /** Rata-rata jeda antarlangkah (ms) dan sebaran acaknya (±ms). */
  jeda: number
  acak: number
  /** Peluang salah per langkah (terburu-buru atau kaki sama). */
  salah: number
  /** Komputer menahan badan saat |miring| melewati angka ini. */
  tahan: number
  /** Peluang komputer lengah saat badannya miring: tidak menahan, malah terburu-buru (bisa jatuh). */
  lengah: number
}

export const CPU: Record<Kesulitan, ProfilCpu> = {
  mudah: { jeda: 680, acak: 110, salah: 0.1, tahan: 0.6, lengah: 0.3 },
  sedang: { jeda: 560, acak: 80, salah: 0.08, tahan: 0.55, lengah: 0.3 },
  sulit: { jeda: 450, acak: 55, salah: 0.06, tahan: 0.5, lengah: 0.2 },
}
/** Komputer berhenti menahan saat |miring| di bawah angka ini. */
export const CPU_LEPAS_TAHAN = 0.12
