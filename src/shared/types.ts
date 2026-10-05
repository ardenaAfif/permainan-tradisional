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

/**
 * Pengaturan tambahan khusus satu game, dipilih di Kenalan Dulu (mis. jumlah
 * giliran). Nilai dibawa ke game lewat MountOptions.opsi[id] sebagai string.
 */
export interface PilihanGame {
  id: string
  label: string
  opsi: { nilai: string; label: string }[]
  bawaan: string
}

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
  /** Aturan tambahan khusus versi web (ditampilkan di Kenalan Dulu). */
  catatanWeb?: string[]
  kontrol: string
  /** Jenis animasi kontrol di layar Kenalan Dulu. */
  jenisKontrol: JenisKontrol
  mode: GameMode[]
  /** Jumlah pemain manusia untuk mode Main Bergantian / Duel Satu Layar [min, maks]. */
  pemainBergantian: [number, number]
  /**
   * Duel Satu Layar: jumlah peserta lomba. Jika pemain manusia lebih sedikit,
   * sisanya diisi lawan komputer (mis. egrang selalu 4 lintasan).
   */
  pesertaSplit?: number
  /** false jika tingkat kesulitan komputer tidak berpengaruh (mis. murni dadu). Bawaan: true. */
  pakaiKesulitan?: boolean
  /** Jumlah lawan komputer di mode Lawan Komputer [min, maks]. */
  lawanKomputer: [number, number]
  /** Pengaturan tambahan di Kenalan Dulu (berlaku untuk semua mode). */
  pilihan?: PilihanGame[]
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
  /** Teks skor per id pemain untuk layar hasil, mis. "Kotak 87" (pengganti "x poin"). */
  keteranganSkor?: Record<string, string>
  durasiDetik: number
}

export interface MountOptions {
  mode: GameMode
  players: Player[]
  difficulty: Kesulitan
  /** Nilai pilihan game dari Kenalan Dulu (lihat GameData.pilihan), per id. */
  opsi: Readonly<Record<string, string>>
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
  /**
   * 'lengkap' (bawaan): HUD GameShell menampilkan nama game dan chip pemain.
   * 'tombol': hanya tombol jeda & suara di pojok — untuk game yang sudah
   * menampilkan pemain/giliran sendiri di panggung.
   */
  hud?: 'lengkap' | 'tombol'
  mount(el: HTMLElement, opts: MountOptions): void
  unmount(): void
  pause(): void
  resume(): void
}
