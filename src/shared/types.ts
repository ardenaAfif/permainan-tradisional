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
  mode: GameMode[]
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

export interface Player {
  id: string
  nama: string
  isCpu: boolean
  avatar?: AvatarConfig
  /** Untuk game tim dan Duel Satu Layar. */
  sisi?: 'kiri' | 'kanan'
}

export interface GameResult {
  gameId: GameId
  mode: GameMode
  /** id pemain yang menang (bisa lebih dari satu untuk game tim). */
  pemenang: string[]
  /** true jika pemain manusia di perangkat ini ikut menang. */
  pemainMenang: boolean
  skor?: Record<string, number>
}

/** Antarmuka yang diekspor setiap game di src/games/<id>/ (lihat brief). */
export interface GameModule {
  id: GameId
  modes: GameMode[]
  orientation: Orientasi
  mount(el: HTMLElement, opts: { mode: GameMode; players: Player[] }): void
  unmount(): void
  onFinish?: (result: GameResult) => void
}
