export type GameId =
  | 'dam-daman'
  | 'engklek'
  | 'ular-tangga'
  | 'gobak-sodor'
  | 'bola-bekel'
  | 'bakiak'
  | 'egrang'
  | 'kelereng'
  | 'pecah-balon-air'

export type Kategori = 'Adu Strategi' | 'Adu Ketangkasan' | 'Adu Kekompakan'

/** cpu = Lawan Komputer, hotseat = Main Bergantian, split = Duel Satu Layar */
export type GameMode = 'cpu' | 'hotseat' | 'split'

export type Orientasi = 'landscape' | 'any'

export type Benda =
  | 'papan'
  | 'gacuk'
  | 'dadu'
  | 'kapur'
  | 'bekel'
  | 'bakiak'
  | 'egrang'
  | 'kelereng'
  | 'balon'

export type JenisKontrol = 'tap' | 'irama' | 'joystick' | 'swipe-tap' | 'kiri-kanan' | 'tarik-lepas' | 'seret'

/** Satu entri di src/data/games.json. */
export interface GameData {
  id: GameId
  nama: string
  kategori: Kategori
  jumlahPemainAsli: string
  bintang: 1 | 2 | 3
  benda: Benda
  deskripsi: string
  aturanAsli: string[]
  caraMainWeb: string
  kontrol: string
  /** Jenis animasi kontrol di layar Kenalan Dulu. */
  jenisKontrol: JenisKontrol
  mode: GameMode[]
  /** Jumlah pemain untuk mode Main Bergantian [min, maks]. */
  pemainBergantian: [number, number]
  /** Jumlah lawan komputer di mode Lawan Komputer. */
  lawanKomputer: number
  /** Ajakan memainkan versi asli di layar hasil (draf, perlu dicek guru). */
  tantanganLapangan: string
  orientasi: Orientasi
  isBonus: boolean
  asalDaerah: string
  namaLain: string[]
}

export type WarnaKulit = 0 | 1 | 2 | 3 | 4
export type GayaRambut = 'pendek' | 'jabrik' | 'belah' | 'keriting' | 'kuncir'
export type PenutupKepala = 'none' | 'kerudung' | 'peci'

export interface AvatarConfig {
  nama: string
  kulit: WarnaKulit
  rambut: GayaRambut
  penutupKepala: PenutupKepala
}

export type Kesulitan = 'mudah' | 'sedang' | 'sulit'

export interface Player {
  id: string
  nama: string
  /** Avatar pemain manusia, atau 'cpu' untuk lawan komputer. */
  avatar: AvatarConfig | 'cpu'
  /** Warna pion/tim (hex dari WARNA_PEMAIN di app/tokens.ts). */
  warna: string
  /** Tokoh yang memerankan pemain komputer. */
  tokoh?: 'bima' | 'sekar' | 'dimas'
}

export interface GameResult {
  /** Pemenang: satu pemain, satu tim (array), atau null jika seri. */
  pemenang: Player | Player[] | null
  /** Skor akhir per id pemain (opsional, untuk urutan di layar hasil). */
  skor?: Record<string, number>
  durasiDetik: number
}

export interface MountOptions {
  mode: GameMode
  players: Player[]
  difficulty: Kesulitan
  onFinish(result: GameResult): void
}

/**
 * Antarmuka setiap game di src/games/<id>/index.ts (export default).
 * Untuk memperbarui HUD (giliran, skor), game memanggil kirimHud(el, ...)
 * dari src/shared/hud.ts pada elemen yang diterima di mount().
 */
export interface GameModule {
  id: string
  modes: GameMode[]
  orientation: Orientasi
  mount(el: HTMLElement, opts: MountOptions): void
  unmount(): void
  pause(): void
  resume(): void
}
