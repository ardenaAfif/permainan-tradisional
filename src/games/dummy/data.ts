import type { GameData } from '../../shared/types'

/** Data game dummy (hanya mode development). Hapus bersama folder ini. */
export const DATA_DUMMY = {
  id: 'dummy',
  nama: 'Tekan Sampai 10',
  kategori: 'Adu Ketangkasan',
  jumlahPemainAsli: '1–4 pemain',
  bintang: 1,
  benda: 'kelereng',
  deskripsi: 'Game uji untuk GameShell. Siapa yang paling cepat menekan tombol sampai 10?',
  aturanAsli: ['Tekan tombolmu.', 'Yang pertama mencapai 10 menang.'],
  caraMainWeb: 'Tekan tombol besar (atau Spasi). Duel Satu Layar: tombol kiri (A) dan kanan (L) ditekan bersamaan.',
  kontrol: 'Tap',
  jenisKontrol: 'tap',
  mode: ['cpu', 'hotseat', 'split'],
  pemainBergantian: [2, 4],
  lawanKomputer: 1,
  orientasi: 'any',
  isBonus: false,
  asalDaerah: '',
  namaLain: [],
  tantanganLapangan: 'Ini hanya game uji. Coba ajak teman lomba tepuk tangan sampai 10!',
} as unknown as GameData
