/**
 * Logika aturan Dam-daman (murni TypeScript, tanpa UI). Dipakai oleh tampilan,
 * oleh AI di Web Worker, dan oleh unit test.
 *
 * Papan berupa titik-titik yang dihubungkan garis. Bidak melangkah satu titik
 * ke titik kosong yang terhubung garis, atau menangkap dengan melompati bidak
 * lawan yang bersebelahan ke titik kosong tepat di baliknya pada garis yang
 * sama. Lompatan boleh beruntun dalam satu giliran.
 */

export type Koordinat = readonly [number, number]
export type Pemain = 0 | 1

export interface BentukPapan {
  /** Setiap garis = deretan titik lurus berurutan. Titik papan = gabungan semua titik garis. */
  garis: Koordinat[][]
}

export interface VarianDam {
  nama: string
  bentuk: BentukPapan
  /** Posisi awal bidak [pemain 0 (bawah), pemain 1 (atas)]. */
  posisiAwal: [Koordinat[], Koordinat[]]
}

export interface AturanMain {
  wajibMakan: boolean
  bolehMundur: boolean
  batasSeri: number
}

export interface Lompatan {
  /** Titik bidak lawan yang dilompati. */
  lewat: number
  /** Titik kosong tempat mendarat. */
  ke: number
}

export interface Papan {
  titik: Koordinat[]
  /** Titik yang terhubung langsung oleh garis. */
  tetangga: number[][]
  /** Lompatan yang mungkin dari setiap titik (tiga titik berurutan pada satu garis). */
  lompatan: Lompatan[][]
  /** Garis sebagai indeks titik (untuk menggambar papan). */
  garis: number[][]
}

/** Papan + aturan yang berlaku selama satu permainan. */
export interface Meja {
  papan: Papan
  aturan: AturanMain
  /** Arah maju (tanda dy) tiap pemain, dari posisi awalnya. */
  maju: [number, number]
}

export interface Keadaan {
  /** Pemilik bidak di setiap titik, null jika kosong. */
  isi: (Pemain | null)[]
  giliran: Pemain
  /** Langkah berturut-turut tanpa penangkapan. */
  tanpaMakan: number
}

/** Satu giliran penuh: langkah biasa (jalur 1 titik, tanpa tangkapan) atau rangkaian lompatan. */
export interface Langkah {
  dari: number
  /** Titik pendaratan berurutan. */
  jalur: number[]
  /** Titik bidak lawan yang tertangkap, sejajar dengan jalur. */
  tangkap: number[]
}

export type SebabAkhir = 'habis' | 'buntu' | 'seri'

export interface HasilAkhir {
  /** null jika seri. */
  pemenang: Pemain | null
  sebab: SebabAkhir
}

const kunci = (k: Koordinat) => `${k[0]},${k[1]}`

export const lawanDari = (p: Pemain): Pemain => (p === 0 ? 1 : 0)

export function bangunPapan(bentuk: BentukPapan): Papan {
  const indeks = new Map<string, number>()
  const titik: Koordinat[] = []
  const id = (k: Koordinat) => {
    let i = indeks.get(kunci(k))
    if (i === undefined) {
      i = titik.length
      indeks.set(kunci(k), i)
      titik.push(k)
    }
    return i
  }
  const garis = bentuk.garis.map((g) => g.map(id))
  const tetangga = titik.map(() => new Set<number>())
  const lompatan = titik.map(() => new Map<string, Lompatan>())
  for (const g of garis) {
    for (let i = 0; i + 1 < g.length; i++) {
      const a = g[i]!
      const b = g[i + 1]!
      tetangga[a]!.add(b)
      tetangga[b]!.add(a)
      const c = g[i + 2]
      if (c === undefined) continue
      lompatan[a]!.set(`${b}>${c}`, { lewat: b, ke: c })
      lompatan[c]!.set(`${b}>${a}`, { lewat: b, ke: a })
    }
  }
  return {
    titik,
    tetangga: tetangga.map((s) => [...s].sort((x, y) => x - y)),
    lompatan: lompatan.map((m) => [...m.values()]),
    garis,
  }
}

/** Indeks titik pada koordinat k, atau -1. */
export function cariTitik(papan: Papan, k: Koordinat): number {
  return papan.titik.findIndex((t) => t[0] === k[0] && t[1] === k[1])
}

export function siapkanMeja(varian: VarianDam, aturan: AturanMain): { meja: Meja; awal: Keadaan } {
  const papan = bangunPapan(varian.bentuk)
  const isi: (Pemain | null)[] = papan.titik.map(() => null)
  varian.posisiAwal.forEach((daftar, p) => {
    for (const k of daftar) {
      const i = cariTitik(papan, k)
      if (i < 0) throw new Error(`Posisi awal ${kunci(k)} bukan titik papan`)
      if (isi[i] !== null) throw new Error(`Posisi awal ${kunci(k)} terisi dua kali`)
      isi[i] = p as Pemain
    }
  })
  const rataY = (daftar: Koordinat[]) => daftar.reduce((s, k) => s + k[1], 0) / Math.max(1, daftar.length)
  // Pemain yang mulai di bawah maju ke atas (dy negatif), dan sebaliknya.
  const bawah0 = rataY(varian.posisiAwal[0]) >= rataY(varian.posisiAwal[1])
  return {
    meja: { papan, aturan, maju: bawah0 ? [-1, 1] : [1, -1] },
    awal: { isi, giliran: 0, tanpaMakan: 0 },
  }
}

export function hitungBidak(k: Keadaan, p: Pemain): number {
  let n = 0
  for (const v of k.isi) if (v === p) n++
  return n
}

/** Langkah biasa dari titik `dari` (tanpa memeriksa wajib makan). */
function langkahBiasa(meja: Meja, isi: Keadaan['isi'], dari: number, p: Pemain, out: Langkah[]) {
  const { papan, aturan, maju } = meja
  const y0 = papan.titik[dari]![1]
  for (const ke of papan.tetangga[dari]!) {
    if (isi[ke] !== null) continue
    if (!aturan.bolehMundur && Math.sign(papan.titik[ke]![1] - y0) === -maju[p]) continue
    out.push({ dari, jalur: [ke], tangkap: [] })
  }
}

/**
 * Rangkaian lompatan dari `dari`. Bidak yang tertangkap langsung diangkat,
 * jadi tidak bisa dilompati dua kali. Tanpa wajib makan, setiap awalan
 * rangkaian juga sah (pemain boleh berhenti kapan saja); dengan wajib makan
 * lompatan harus diteruskan selama masih bisa.
 */
function rantaiLompatan(meja: Meja, isi: Keadaan['isi'], dari: number, p: Pemain, out: Langkah[]) {
  const lawan = lawanDari(p)
  const wajib = meja.aturan.wajibMakan
  const jalur: number[] = []
  const tangkap: number[] = []
  const papanKerja = isi.slice()
  papanKerja[dari] = null
  const telusuri = (pos: number) => {
    let lanjut = false
    for (const { lewat, ke } of meja.papan.lompatan[pos]!) {
      if (papanKerja[lewat] !== lawan || papanKerja[ke] !== null) continue
      lanjut = true
      papanKerja[lewat] = null
      jalur.push(ke)
      tangkap.push(lewat)
      if (!wajib) out.push({ dari, jalur: jalur.slice(), tangkap: tangkap.slice() })
      telusuri(ke)
      jalur.pop()
      tangkap.pop()
      papanKerja[lewat] = lawan
    }
    if (wajib && !lanjut && jalur.length > 0) out.push({ dari, jalur: jalur.slice(), tangkap: tangkap.slice() })
  }
  telusuri(dari)
}

/** Semua giliran sah untuk pemain `p` (bawaan: pemain yang sedang giliran). */
export function langkahSah(meja: Meja, k: Keadaan, p: Pemain = k.giliran): Langkah[] {
  const makan: Langkah[] = []
  const biasa: Langkah[] = []
  k.isi.forEach((v, i) => {
    if (v !== p) return
    rantaiLompatan(meja, k.isi, i, p, makan)
    langkahBiasa(meja, k.isi, i, p, biasa)
  })
  if (meja.aturan.wajibMakan && makan.length > 0) return makan
  return [...makan, ...biasa]
}

/** Papan setelah bidak di `dari` menempuh `jalur` dan bidak di `tangkap` diangkat. */
export function pindahkan(isi: Keadaan['isi'], langkah: Pick<Langkah, 'dari' | 'jalur' | 'tangkap'>): Keadaan['isi'] {
  const baru = isi.slice()
  const p = baru[langkah.dari] ?? null
  baru[langkah.dari] = null
  for (const t of langkah.tangkap) baru[t] = null
  const akhir = langkah.jalur[langkah.jalur.length - 1]
  if (akhir !== undefined) baru[akhir] = p
  return baru
}

/** Keadaan setelah satu giliran penuh; giliran berpindah ke lawan. */
export function terapkan(k: Keadaan, langkah: Langkah): Keadaan {
  return {
    isi: pindahkan(k.isi, langkah),
    giliran: lawanDari(k.giliran),
    tanpaMakan: langkah.tangkap.length > 0 ? 0 : k.tanpaMakan + 1,
  }
}

/**
 * Periksa akhir permainan untuk pemain yang akan melangkah: kalah jika bidaknya
 * habis atau tidak punya langkah sah; seri jika batas langkah tanpa makan tercapai.
 */
export function hasilAkhir(meja: Meja, k: Keadaan): HasilAkhir | null {
  const p = k.giliran
  const menang = lawanDari(p)
  if (hitungBidak(k, p) === 0) return { pemenang: menang, sebab: 'habis' }
  if (langkahSah(meja, k).length === 0) return { pemenang: menang, sebab: 'buntu' }
  if (k.tanpaMakan >= meja.aturan.batasSeri) return { pemenang: null, sebab: 'seri' }
  return null
}

/** Apakah `awal` adalah awalan jalur langkah `l` dari titik yang sama. */
export function cocokAwalan(l: Langkah, dari: number, awal: readonly number[]): boolean {
  if (l.dari !== dari || l.jalur.length < awal.length) return false
  return awal.every((t, i) => l.jalur[i] === t)
}
