import type { Kategori } from '../shared/types'
import s from './kategori.module.css'

const KELAS: Record<Kategori, string> = {
  'Adu Strategi': s.strategi!,
  'Adu Ketangkasan': s.ketangkasan!,
  'Adu Kekompakan': s.kekompakan!,
}

/** Kelas warna per kategori (set --warna-kategori & --warna-kategori-gelap). */
export const kelasKategori = (k: Kategori) => KELAS[k]
