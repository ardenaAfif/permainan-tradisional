/**
 * Tata letak panggung 1280x720 Gobak Sodor: lapangan tampak atas di tengah
 * (garis jaga mendatar, garis sodor membujur), panel tim dan kendali di kiri
 * dan kanan. Penyerang masuk dari START (bawah), ke UJUNG (atas), lalu pulang.
 */
import type { Lapangan } from './aturan'
import { JUMLAH_GARIS, PAKAI_SODOR } from './config'

export const LEBAR = 1280
export const TINGGI = 720

/** Tepi kiri/kanan lapangan. */
export const LAP_X0 = 350
export const LAP_X1 = 930
/** Garis jaga paling bawah (garis masuk) dan paling atas (garis belakang). */
const GARIS_BAWAH = 610
const GARIS_ATAS = 160
/** Tepi atas zona UJUNG dan tepi bawah zona START (gambar lapangan). */
export const TEPI_ATAS = 70
export const TEPI_BAWAH = 708

export function buatLapangan(jumlahGaris = JUMLAH_GARIS, sodor = PAKAI_SODOR): Lapangan {
  const n = Math.max(2, jumlahGaris)
  const jarak = (GARIS_BAWAH - GARIS_ATAS) / (n - 1)
  return {
    x0: LAP_X0,
    x1: LAP_X1,
    tengahX: (LAP_X0 + LAP_X1) / 2,
    garisY: Array.from({ length: n }, (_, i) => GARIS_BAWAH - i * jarak),
    atas: TEPI_ATAS + 10,
    bawah: TEPI_BAWAH - 14,
    sodor,
  }
}

/** Tinggi karakter di lapangan (titik kaki = posisi logika). */
export const TINGGI_SOSOK = 88

/** Panel tim (kartu) di kiri dan kanan; di bawahnya zona kendali. */
export const PANEL_LEBAR = 330
export const KARTU_ATAS = 132
export const KARTU_TINGGI = 196
/** Zona kendali (joystick/slider) di bawah kartu. */
export const KENDALI_ATAS = KARTU_ATAS + KARTU_TINGGI + 14

/** x kiri panel sisi 0 (kiri) atau 1 (kanan). */
export const panelX = (sisi: 0 | 1) => (sisi === 0 ? 0 : LEBAR - PANEL_LEBAR)
