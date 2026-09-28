/**
 * Tekstur siswa Bakiak (lihat shared/phaser/karakter.ts): raut per anggota tim.
 */
import type { Mata, Mulut, Pose, Tokoh } from '../../characters/kit'
import { gambarKarakter } from '../../shared/phaser/karakter'
import type { AvatarConfig, Player } from '../../shared/types'

/** Satu siswa di atas bakiak. */
export interface Anggota {
  who: Tokoh
  avatar?: Omit<AvatarConfig, 'nama'>
}

export type Raut = 'jalan' | 'kaget' | 'senang' | 'kepala'

const RAUT: Record<Raut, { pose: Pose; eyes?: Mata; mouth?: Mulut; crop?: 'head' }> = {
  jalan: { pose: 'idle', mouth: 'flat' },
  kaget: { pose: 'idle', eyes: 'surprised', mouth: 'talk-o' },
  senang: { pose: 'happy' },
  kepala: { pose: 'idle', crop: 'head' },
}

/** viewBox karakter penuh: '0 -30 200 412'; telapak sepatu di y≈372. */
export const RASIO_KARAKTER = 200 / 412
export const ALAS_KARAKTER = (372 + 30) / 412

/** Teman satu tim (kit "avatar" dengan variasi dari design/, tanpa nama). */
const TEMAN: Omit<AvatarConfig, 'nama'>[] = [
  { kulit: 4, rambut: 'keriting', penutupKepala: 'none' },
  { kulit: 2, rambut: 'kuncir', penutupKepala: 'none' },
  { kulit: 1, rambut: 'pendek', penutupKepala: 'kerudung' },
]

const anggotaDari = (p: Player): Anggota =>
  p.avatar === 'cpu' ? { who: p.tokoh ?? 'bima' } : { who: 'avatar', avatar: p.avatar }

/**
 * Susunan tim dari depan ke belakang; pemain (atau tokoh komputer) paling depan.
 * Tim pemain utama bersama Sekar & Dimas. Tim lawan: Bima (sebagai komputer, atau
 * teman pemain kedua), dilengkapi teman dari kit avatar.
 */
export function susunTim(pemimpin: Player): Anggota[] {
  if (pemimpin.id === 'p1') return [anggotaDari(pemimpin), { who: 'sekar' }, { who: 'dimas' }]
  const teman: Anggota[] = pemimpin.avatar === 'cpu' ? [] : [{ who: 'bima' }]
  for (let i = 0; teman.length < 2; i++) teman.push({ who: 'avatar', avatar: TEMAN[i]! })
  return [anggotaDari(pemimpin), ...teman]
}

/**
 * Gambar satu anggota dengan raut tertentu. `tinggi` = tinggi tekstur (px);
 * lebar mengikuti viewBox (kepala: persegi hampir, 108x122).
 */
export async function gambarAnggota(a: Anggota, raut: Raut, tinggi: number): Promise<HTMLCanvasElement> {
  const r = RAUT[raut]
  return gambarKarakter(
    {
      who: a.who,
      pose: r.pose,
      eyes: r.eyes,
      mouth: r.mouth,
      crop: r.crop,
      skin: a.avatar?.kulit,
      hair: a.avatar?.rambut,
      headwear: a.avatar?.penutupKepala,
    },
    tinggi,
  )
}
