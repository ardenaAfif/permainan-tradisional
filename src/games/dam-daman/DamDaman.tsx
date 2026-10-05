import gsap from 'gsap'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { GELAP_PEMAIN, WARNA_PEMAIN } from '../../app/tokens'
import { AvatarKarakter, Karakter } from '../../characters/Karakter'
import { kirimHud } from '../../shared/hud'
import { Jam } from '../../shared/jam'
import type { MountOptions, Player } from '../../shared/types'
import { useReducedMotion } from '../../shared/useReducedMotion'
import {
  cocokAwalan,
  hasilAkhir,
  hitungBidak,
  langkahSah,
  lawanDari,
  siapkanMeja,
  terapkan,
  type HasilAkhir,
  type Keadaan,
  type Langkah,
  type Pemain,
} from './aturan'
import { bunyi } from './bunyi'
import { ATURAN, JEDA_KOMPUTER, JEDA_SELESAI, LAMA_ANGKAT, LAMA_GESER, VARIAN_AKTIF } from './config'
import { OtakKomputer } from './otak'
import { Papan } from './Papan'
import { buatTata, titikKeArah, titikTerdekat, type Kotak, type Tata } from './tata'
import s from './DamDaman.module.css'

/** Penghubung ke GameModule: jam permainan aktif untuk jeda/lanjut. */
export interface Kontrol {
  pasang(jam: Jam): void
  lepas(jam: Jam): void
}

type Fase = 'pilih' | 'gerak' | 'komputer' | 'selesai'

interface Tampil {
  keadaan: Keadaan
  pilih: number | null
  /** Ujung lompatan beruntun yang sedang berlangsung. */
  ujung: number | null
  sasaran: { titik: number; makan: boolean }[]
  /** Bidak yang bisa digerakkan (petunjuk saat belum memilih). */
  bisaGerak: { titik: number; makan: boolean }[]
  fase: Fase
  kabar: string
  pesan: string
  bisaCukup: boolean
  bisaBatal: boolean
  akhir: HasilAkhir | null
  nomorGiliran: number
}

/** Posisi bidak di layar: titik papan, atau slot di baki tangkapan pemain lawan. */
interface PetaBidak {
  di: Map<number, string>
  /** Urutan bidak yang ditangkap, per pemain penangkap. */
  baki: [string[], string[]]
}

const NAMA_WARNA: Record<string, string> = {
  [WARNA_PEMAIN[0]]: 'kuning',
  [WARNA_PEMAIN[1]]: 'merah',
  [WARNA_PEMAIN[2]]: 'biru',
  [WARNA_PEMAIN[3]]: 'hijau',
}

const gelap = (warna: string) => `var(--${GELAP_PEMAIN[warna] ?? 'kayu-gelap'})`

function KepalaPemain({ p }: { p: Player }) {
  return p.avatar === 'cpu' ? (
    <Karakter who={p.tokoh ?? 'bima'} crop="head" hidup={false} />
  ) : (
    <AvatarKarakter avatar={p.avatar} crop="head" hidup={false} />
  )
}

/** Letak slot ke-i di baki tangkapan kartu (px panggung) dan skala bidak mini. */
function slotBaki(tata: Tata, kartu: Kotak, i: number, total: number) {
  const kolom = Math.ceil(total / 2)
  const lebarBaki = tata.tegak ? Math.min(kartu.w * 0.46, 320) : kartu.w - 28
  const slot = Math.min(36, lebarBaki / kolom)
  const x0 = tata.tegak ? kartu.x + kartu.w - 16 - kolom * slot : kartu.x + 14
  const y0 = tata.tegak ? kartu.y + kartu.h / 2 - slot : kartu.y + kartu.h - 16 - 2 * slot
  return {
    x: x0 + (i % kolom) * slot + slot / 2,
    y: y0 + Math.floor(i / kolom) * slot + slot / 2,
    skala: (slot * 0.86) / (2 * jariBidak(tata)),
  }
}

const jariBidak = (tata: Tata) => tata.satuan * 0.34

export function DamDaman({ opsi, host, kontrol }: { opsi: MountOptions; host: HTMLElement; kontrol: Kontrol }) {
  const { players, mode } = opsi
  const gerak = !useReducedMotion()
  const gerakRef = useRef(gerak)
  useEffect(() => {
    gerakRef.current = gerak
  }, [gerak])

  // Meja (papan + aturan) tetap selama satu pemasangan.
  const { meja, awal } = useMemo(() => siapkanMeja(VARIAN_AKTIF, ATURAN), [])
  const jumlahAwal = useMemo(() => [hitungBidak(awal, 0), hitungBidak(awal, 1)] as const, [awal])
  const daftarBidak = useMemo(
    () =>
      awal.isi.flatMap((p, i) => (p === null ? [] : [{ id: `${p}-${i}`, p, titik: i }])),
    [awal],
  )

  // Panggung tegak (720x1280) atau mendatar; diperbarui saat HP diputar.
  const [tegak, setTegak] = useState(() => host.offsetHeight > host.offsetWidth)
  useLayoutEffect(() => {
    const perbarui = () => setTegak(host.offsetHeight > host.offsetWidth)
    perbarui()
    const ro = new ResizeObserver(perbarui)
    ro.observe(host)
    return () => ro.disconnect()
  }, [host])
  const tata = useMemo(() => buatTata(meja.papan, tegak), [meja, tegak])
  const tataRef = useRef(tata)

  const [tampil, setTampil] = useState<Tampil>(() => ({
    keadaan: awal,
    pilih: null,
    ujung: null,
    sasaran: [],
    bisaGerak: [],
    fase: 'gerak',
    kabar: '',
    pesan: '',
    bisaCukup: false,
    bisaBatal: false,
    akhir: null,
    nomorGiliran: 0,
  }))
  const [fokus, setFokus] = useState<number | null>(null)
  const [pakaiKeyboard, setPakaiKeyboard] = useState(false)

  const svgRef = useRef<SVGSVGElement>(null)
  const elBidak = useRef(new Map<string, { luar: SVGGElement; dalam: SVGGElement }>())
  const peta = useRef<PetaBidak>({ di: new Map(), baki: [[], []] })
  const aksi = useRef<{ ketuk(i: number): void; cukup(): void; batal(): void } | null>(null)

  /** Letakkan semua bidak di posisinya (papan atau baki), dengan animasi `durasi` detik. */
  const posisikan = useCallback(
    (durasi: number) => {
      const t = tataRef.current
      const { di, baki } = peta.current
      const total = jumlahAwal
      const tween = (id: string, x: number, y: number, skala: number, tampak: boolean) => {
        const el = elBidak.current.get(id)
        if (!el) return
        if (durasi > 0) {
          gsap.to(el.luar, { x, y, autoAlpha: tampak ? 1 : 0, duration: durasi, ease: 'power2.inOut', overwrite: true })
          gsap.to(el.dalam, { scale: skala, y: 0, duration: durasi, ease: 'power2.inOut', overwrite: true })
        } else {
          gsap.set(el.luar, { x, y, autoAlpha: tampak ? 1 : 0 })
          gsap.set(el.dalam, { scale: skala, y: 0 })
        }
      }
      for (const [titik, id] of di) tween(id, t.titik[titik]!.x, t.titik[titik]!.y, 1, true)
      baki.forEach((ids, penangkap) => {
        const kartu = t.kartu[penangkap]!
        ids.forEach((id, i) => {
          const sl = slotBaki(t, kartu, i, total[lawanDari(penangkap as Pemain)])
          tween(id, sl.x, sl.y, sl.skala, true)
        })
      })
    },
    [jumlahAwal],
  )

  // Tata letak berubah (HP diputar): pindahkan bidak tanpa animasi.
  useLayoutEffect(() => {
    tataRef.current = tata
    posisikan(0)
  }, [tata, posisikan])

  // Alur permainan: satu pengendali per pemasangan; Jam menangani jeda & pelepasan.
  useLayoutEffect(() => {
    const jam = new Jam()
    kontrol.pasang(jam)
    const cpu = (p: Pemain) => players[p]!.avatar === 'cpu'
    const otak = players.some((p) => p.avatar === 'cpu') ? new OtakKomputer(VARIAN_AKTIF, meja, opsi.difficulty) : null
    const bisaBatalkan = mode === 'cpu'
    const mulai = performance.now()

    let k = awal
    let fase: Fase = 'gerak'
    let sah: Langkah[] = []
    let pilih: number | null = null
    let jalur: number[] = []
    let tangkap: number[] = []
    let kabar = ''
    let akhir: HasilAkhir | null = null
    let nomor = 0
    let sibuk = false
    /** Keadaan di awal setiap giliran pemain manusia (untuk Batalkan langkah). */
    const riwayat: { k: Keadaan; peta: PetaBidak }[] = []
    const salinPeta = (p: PetaBidak): PetaBidak => ({ di: new Map(p.di), baki: [p.baki[0].slice(), p.baki[1].slice()] })

    peta.current = { di: new Map(daftarBidak.map((b) => [b.titik, b.id])), baki: [[], []] }
    posisikan(0)

    const nama = (p: Pemain) => players[p]!.nama
    const tertangkap = (p: Pemain) => jumlahAwal[lawanDari(p)] - hitungBidak(k, lawanDari(p))

    const calon = () => (pilih === null ? [] : sah.filter((l) => cocokAwalan(l, pilih!, jalur)))

    const pesanGiliran = (): string => {
      const p = k.giliran
      if (fase === 'komputer') return `${nama(p)} sedang berpikir…`
      if (fase === 'selesai' || fase === 'gerak') return ''
      if (jalur.length > 0) {
        return ATURAN.wajibMakan ? 'Masih bisa menangkap. Lompat lagi!' : 'Masih bisa melompat lagi. Lompat terus, atau tekan Cukup.'
      }
      if (pilih !== null) return calon().some((l) => l.tangkap.length) ? 'Tap titik yang menyala. Titik merah = menangkap.' : 'Tap titik yang menyala.'
      const wajib = ATURAN.wajibMakan && sah.some((l) => l.tangkap.length)
      const awalan = mode === 'cpu' ? 'Giliranmu!' : `Giliran ${nama(p)} (bidak ${NAMA_WARNA[players[p]!.warna] ?? ''}).`
      return wajib ? `${awalan} Wajib makan: pilih bidak yang bisa menangkap.` : `${awalan} Tap bidak yang mau digerakkan.`
    }

    const segarkan = () => {
      const manusia = fase === 'pilih' && !cpu(k.giliran)
      // Sorotan pilihan tampil saat pemain memilih, dan saat komputer menunjukkan langkahnya.
      const sorot = manusia || (fase === 'gerak' && cpu(k.giliran))
      const daftar = sorot ? calon() : []
      const sasaran = new Map<number, boolean>()
      for (const l of daftar) {
        const t = l.jalur[jalur.length]
        if (t !== undefined) sasaran.set(t, (sasaran.get(t) ?? false) || l.tangkap.length > jalur.length)
      }
      const bisaGerak = new Map<number, boolean>()
      if (manusia && pilih === null) for (const l of sah) bisaGerak.set(l.dari, (bisaGerak.get(l.dari) ?? false) || l.tangkap.length > 0)
      setTampil({
        keadaan: k,
        pilih: sorot ? pilih : null,
        ujung: sorot && jalur.length ? jalur[jalur.length - 1]! : null,
        sasaran: [...sasaran].map(([titik, makan]) => ({ titik, makan })),
        bisaGerak: [...bisaGerak].map(([titik, makan]) => ({ titik, makan })),
        fase,
        kabar,
        pesan: pesanGiliran(),
        bisaCukup: manusia && jalur.length > 0 && daftar.some((l) => l.jalur.length === jalur.length),
        bisaBatal: bisaBatalkan && manusia && !sibuk && (jalur.length > 0 || riwayat.length >= 2),
        akhir,
        nomorGiliran: nomor,
      })
    }

    const hud = () =>
      kirimHud(host, {
        giliran: akhir ? null : players[k.giliran]!.id,
        skor: { [players[0]!.id]: `Menangkap ${tertangkap(0)}`, [players[1]!.id]: `Menangkap ${tertangkap(1)}` },
      })

    // ── Animasi ──────────────────────────────────────────
    const dur = (ms: number) => (gerakRef.current ? ms : 80) / 1000

    /** Bidak bergeser satu lompatan; bidak lawan yang dilompati terangkat ke baki penangkap. */
    const hop = async (dari: number, ke: number, lewat: number | null): Promise<{ angkat?: Promise<void> }> => {
      const t = tataRef.current
      const pt = peta.current
      const id = pt.di.get(dari)
      if (id === undefined) return {}
      pt.di.delete(dari)
      pt.di.set(ke, id)
      const el = elBidak.current.get(id)!
      // Bidak yang bergerak digambar paling atas (urutan di dalam lapisan bidak saja).
      el.luar.parentNode?.appendChild(el.luar)
      const tl = gsap.timeline().to(el.luar, { x: t.titik[ke]!.x, y: t.titik[ke]!.y, duration: dur(lewat === null ? LAMA_GESER : LAMA_GESER * 1.5), ease: 'power2.inOut' })
      if (gerakRef.current) tl.to(el.dalam, { scale: lewat === null ? 1.1 : 1.22, y: lewat === null ? -8 : -26, duration: dur(LAMA_GESER * 0.75), yoyo: true, repeat: 1, ease: 'power1.out' }, 0)
      await jam.animasi(tl)
      bunyi.letak()
      if (lewat === null) return {}
      const idL = pt.di.get(lewat)
      if (idL === undefined) return {}
      pt.di.delete(lewat)
      const penangkap = k.giliran
      const slot = slotBaki(t, t.kartu[penangkap]!, pt.baki[penangkap].length, jumlahAwal[lawanDari(penangkap)])
      pt.baki[penangkap].push(idL)
      bunyi.tangkap()
      const elL = elBidak.current.get(idL)!
      elL.luar.parentNode?.appendChild(elL.luar)
      const angkat = gsap.timeline()
      if (gerakRef.current) {
        angkat
          .to(elL.dalam, { scale: 1.35, y: -40, duration: dur(LAMA_ANGKAT * 0.35), ease: 'back.out(2)' })
          .to(elL.luar, { x: slot.x, y: slot.y, duration: dur(LAMA_ANGKAT * 0.65), ease: 'power2.in' })
          .to(elL.dalam, { scale: slot.skala, y: 0, duration: dur(LAMA_ANGKAT * 0.65), ease: 'power2.in' }, '<')
      } else {
        angkat.to(elL.luar, { autoAlpha: 0, duration: 0.1 }).set(elL.luar, { x: slot.x, y: slot.y }).set(elL.dalam, { scale: slot.skala }).to(elL.luar, { autoAlpha: 1, duration: 0.1 })
      }
      // Dibungkus objek supaya `await hop()` tidak ikut menunggu bidak selesai terangkat.
      return { angkat: jam.animasi(angkat) }
    }

    // ── Alur giliran ─────────────────────────────────────
    const selesai = async (h: HasilAkhir) => {
      akhir = h
      fase = 'selesai'
      kabar =
        h.pemenang === null
          ? `Seri! ${ATURAN.batasSeri} langkah berturut-turut tanpa ada bidak yang tertangkap.`
          : h.sebab === 'habis'
            ? `${nama(h.pemenang)} menang! Bidak ${nama(lawanDari(h.pemenang))} habis.`
            : `${nama(h.pemenang)} menang! Bidak ${nama(lawanDari(h.pemenang))} tidak bisa bergerak.`
      segarkan()
      hud()
      await jam.tunggu(JEDA_SELESAI)
      opsi.onFinish({
        pemenang: h.pemenang === null ? null : players[h.pemenang]!,
        skor: { [players[0]!.id]: tertangkap(0), [players[1]!.id]: tertangkap(1) },
        keteranganSkor: { [players[0]!.id]: `Menangkap ${tertangkap(0)}`, [players[1]!.id]: `Menangkap ${tertangkap(1)}` },
        durasiDetik: Math.round((performance.now() - mulai) / 1000),
      })
    }

    const giliranBaru = () => {
      if (jam.dihentikan) return
      pilih = null
      jalur = []
      tangkap = []
      const h = hasilAkhir(meja, k)
      hud()
      if (h) {
        void selesai(h)
        return
      }
      nomor++
      sah = langkahSah(meja, k)
      if (cpu(k.giliran)) {
        fase = 'komputer'
        segarkan()
        void jalanKomputer()
        return
      }
      fase = 'pilih'
      if (bisaBatalkan) riwayat.push({ k, peta: salinPeta(peta.current) })
      segarkan()
    }

    const akhiriGiliran = async (l: Langkah, tertunda: Promise<unknown>[]) => {
      const p = k.giliran
      k = terapkan(k, l)
      kabar = l.tangkap.length ? `${nama(p)} menangkap ${l.tangkap.length} bidak!` : ''
      if (k.tanpaMakan >= ATURAN.batasSeri / 2 && !l.tangkap.length) kabar = `Tanpa tangkapan: ${k.tanpaMakan}/${ATURAN.batasSeri} langkah.`
      pilih = null
      jalur = []
      tangkap = []
      segarkan()
      await Promise.all(tertunda)
      posisikan(0)
      await jam.tunggu(gerakRef.current ? 250 : 60)
      giliranBaru()
    }

    const jalanKomputer = async () => {
      const [l] = await Promise.all([otak!.minta(k), jam.tunggu(gerakRef.current ? JEDA_KOMPUTER : 200)])
      if (jam.dihentikan || !l) return
      fase = 'gerak'
      pilih = l.dari
      segarkan()
      bunyi.pilih()
      await jam.tunggu(gerakRef.current ? 280 : 60)
      const tertunda: Promise<unknown>[] = []
      let dari = l.dari
      for (let i = 0; i < l.jalur.length; i++) {
        const { angkat } = await hop(dari, l.jalur[i]!, l.tangkap[i] ?? null)
        if (angkat) tertunda.push(angkat)
        jalur.push(l.jalur[i]!)
        if (l.tangkap[i] !== undefined) tangkap.push(l.tangkap[i]!)
        segarkan()
        dari = l.jalur[i]!
        if (i + 1 < l.jalur.length) await jam.tunggu(gerakRef.current ? 220 : 40)
      }
      await akhiriGiliran(l, tertunda)
    }

    // Lompatan pemain manusia yang belum selesai menunggu angkatan bidak.
    let tertundaManusia: Promise<unknown>[] = []

    const langkahManusia = async (ke: number) => {
      const daftar = sah.filter((l) => cocokAwalan(l, pilih!, [...jalur, ke]))
      if (!daftar.length || pilih === null) return
      sibuk = true
      fase = 'gerak'
      const lewat = daftar[0]!.tangkap[jalur.length] ?? null
      const dari = jalur.length ? jalur[jalur.length - 1]! : pilih
      segarkan()
      const { angkat } = await hop(dari, ke, lewat)
      if (angkat) tertundaManusia.push(angkat)
      jalur.push(ke)
      if (lewat !== null) tangkap.push(lewat)
      sibuk = false
      const lanjut = daftar.some((l) => l.jalur.length > jalur.length)
      const lengkap = daftar.find((l) => l.jalur.length === jalur.length)
      if (lanjut) {
        fase = 'pilih'
        segarkan()
        return
      }
      const t = tertundaManusia
      tertundaManusia = []
      await akhiriGiliran(lengkap!, t)
    }

    aksi.current = {
      ketuk(i) {
        if (fase !== 'pilih' || sibuk || jam.dijeda || cpu(k.giliran)) return
        const daftar = calon()
        const ujung = jalur.length ? jalur[jalur.length - 1]! : null
        if (daftar.some((l) => l.jalur[jalur.length] === i)) {
          void langkahManusia(i)
          return
        }
        if (ujung !== null) {
          // Di tengah lompatan beruntun: tap bidak yang melompat = cukup.
          if (i === ujung) this.cukup()
          else bunyi.salah()
          return
        }
        if (k.isi[i] === k.giliran) {
          if (pilih === i) {
            pilih = null
          } else if (sah.some((l) => l.dari === i)) {
            pilih = i
            bunyi.pilih()
          } else {
            bunyi.salah()
            kabar = ATURAN.wajibMakan && sah.some((l) => l.tangkap.length) ? 'Wajib makan! Pilih bidak yang bisa menangkap.' : 'Bidak itu belum bisa bergerak.'
            pilih = null
            segarkan()
            kabar = ''
            return
          }
        } else {
          pilih = null
        }
        segarkan()
      },
      cukup() {
        if (fase !== 'pilih' || sibuk || jam.dijeda || !jalur.length) return
        const lengkap = calon().find((l) => l.jalur.length === jalur.length)
        if (!lengkap) return
        const t = tertundaManusia
        tertundaManusia = []
        void akhiriGiliran(lengkap, t)
      },
      batal() {
        if (!bisaBatalkan || fase !== 'pilih' || sibuk || jam.dijeda) return
        if (!jalur.length) {
          if (riwayat.length < 2) return
          riwayat.pop()
        } else if (!riwayat.length) return
        const r = riwayat[riwayat.length - 1]!
        tertundaManusia = []
        k = r.k
        kabar = 'Langkah dibatalkan.'
        peta.current = salinPeta(r.peta)
        bunyi.batal()
        posisikan(gerakRef.current ? 0.35 : 0)
        pilih = null
        jalur = []
        tangkap = []
        sah = langkahSah(meja, k)
        hud()
        segarkan()
      },
    }

    void (async () => {
      await jam.tunggu(gerakRef.current ? 400 : 50)
      giliranBaru()
    })()

    return () => {
      jam.hentikan()
      otak?.hentikan()
      aksi.current = null
      kontrol.lepas(jam)
    }
  }, [opsi, players, mode, host, kontrol, meja, awal, daftarBidak, jumlahAwal, posisikan])

  // ── Input ──────────────────────────────────────────────
  const ketukPapan = (e: ReactPointerEvent<SVGRectElement>) => {
    const svg = svgRef.current
    const ctm = svg?.getScreenCTM()
    if (!svg || !ctm) return
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse())
    setPakaiKeyboard(false)
    const i = titikTerdekat(tata, pt.x, pt.y)
    if (i >= 0) {
      setFokus(i)
      aksi.current?.ketuk(i)
    }
  }

  // Keyboard: panah memilih titik, Spasi/Enter mengetuk, Backspace membatalkan langkah.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('button, [role="dialog"], input')) return
      const arah: Record<string, [number, number]> = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
      }
      if (arah[e.key]) {
        e.preventDefault()
        setPakaiKeyboard(true)
        setFokus((f) => {
          if (f === null) return tampil.pilih ?? tampil.bisaGerak[0]?.titik ?? 0
          return titikKeArah(tata, f, ...arah[e.key]!)
        })
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setPakaiKeyboard(true)
        if (fokus !== null) aksi.current?.ketuk(fokus)
        else setFokus(tampil.bisaGerak[0]?.titik ?? 0)
      } else if (e.key === 'Backspace') {
        aksi.current?.batal()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fokus, tata, tampil.pilih, tampil.bisaGerak])

  // ── Tampilan ───────────────────────────────────────────
  const r = jariBidak(tata)
  const { keadaan, fase, akhir } = tampil
  const giliran = keadaan.giliran
  const tertangkap = (p: Pemain) => jumlahAwal[lawanDari(p)] - hitungBidak(keadaan, lawanDari(p))
  const pemainAktif = players[giliran]!
  const tampakKe = (i: number) => tata.titik[i]!

  return (
    <div className={`${s.arena} ${tata.tegak ? s.tegak : ''}`}>
      {/* Kartu pemain: pemain 1 di sisi atas papan, pemain 0 di sisi bawah */}
      {([1, 0] as const).map((p) => {
        const pl = players[p]!
        const k = tata.kartu[p]
        const aktif = fase !== 'selesai' && giliran === p
        const tangkapan = (
          <span className={s.hitungTangkap}>
            Menangkap <b>{tertangkap(p)}</b>
          </span>
        )
        return (
          <section
            key={p}
            className={`${s.kartu} ${aktif ? s.kartuAktif : ''} ${akhir?.pemenang === p ? s.kartuMenang : ''}`}
            style={{ left: k.x, top: k.y, width: k.w, height: k.h, ['--warna-pemain' as string]: pl.warna, ['--warna-pemain-gelap' as string]: gelap(pl.warna) }}
            aria-label={`${pl.nama}${aktif ? ', sedang giliran' : ''}`}
            aria-current={aktif || undefined}
          >
            {aktif && !tata.tegak && <span className={s.tandaGiliran}>GILIRAN</span>}
            <div className={s.kepalaKartu}>
              <span className={s.wajah}>
                <KepalaPemain p={pl} />
              </span>
              {/* Lencana warna bidak; bidak pemain 2 bertitik di tengah (beda bentuk, bukan hanya warna). */}
              <span className={`${s.contohBidak} ${p === 1 ? s.contohBidakTitik : ''}`} title={`Bidak ${NAMA_WARNA[pl.warna] ?? ''}`} aria-hidden="true" />
              <span className={s.infoKartu}>
                <span className={s.namaPemain}>{pl.nama}</span>
                {tata.tegak && tangkapan}
              </span>
            </div>
            {!tata.tegak && tangkapan}
          </section>
        )
      })}

      {/* Panel giliran, pesan, dan tombol */}
      <div className={s.panel} style={{ left: tata.panel.x, top: tata.panel.y, width: tata.panel.w, height: tata.panel.h }}>
        <div className={s.giliran} style={{ ['--warna-pemain' as string]: pemainAktif.warna }} aria-live="polite">
          {fase === 'selesai' ? (akhir?.pemenang === null ? 'Seri!' : 'Selesai!') : mode === 'cpu' && pemainAktif.avatar !== 'cpu' ? 'Giliranmu' : `Giliran ${pemainAktif.nama}`}
        </div>
        <p className={s.pesan} role="status">
          {tampil.kabar && <b className={s.kabar}>{tampil.kabar}</b>}
          {tampil.kabar && tampil.pesan ? ' ' : ''}
          {tampil.pesan}
        </p>
        <div className={s.tombolBaris}>
          {tampil.bisaCukup && (
            <button type="button" className={`${s.tombol} ${s.tombolUtama}`} onClick={() => aksi.current?.cukup()}>
              Cukup
            </button>
          )}
          {mode === 'cpu' && (
            <button type="button" className={s.tombol} disabled={!tampil.bisaBatal} onClick={() => aksi.current?.batal()}>
              <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 7 L4 12 L9 17 M4 12 H14 A6 6 0 0 1 14 24" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" transform="translate(0 -3)" />
              </svg>
              Batalkan langkah
            </button>
          )}
        </div>
      </div>

      {/* Papan, sorotan, dan bidak (satu SVG seukuran panggung) */}
      <svg ref={svgRef} className={s.svg} viewBox={`0 0 ${tata.lebar} ${tata.tinggi}`} width={tata.lebar} height={tata.tinggi}>
        <Papan papan={meja.papan} tata={tata} />

        {/* Bidak yang bisa digerakkan */}
        {tampil.bisaGerak.map(({ titik, makan }) => (
          <circle key={`g${titik}`} className={`${s.bisaGerak} ${makan ? s.bisaMakan : ''}`} cx={tampakKe(titik).x} cy={tampakKe(titik).y} r={r + 9} />
        ))}
        {/* Bidak terpilih / bidak yang sedang melompat */}
        {(tampil.ujung ?? tampil.pilih) !== null && fase !== 'selesai' && (
          <circle className={s.terpilih} cx={tampakKe(tampil.ujung ?? tampil.pilih!).x} cy={tampakKe(tampil.ujung ?? tampil.pilih!).y} r={r + 11} />
        )}

        <g>
        {daftarBidak.map((b) => (
          <g
            key={b.id}
            ref={(luar) => {
              const dalam = luar?.firstElementChild as SVGGElement | null
              if (luar && dalam) {
                // Skala & angkat bidak berporos di titik tengahnya.
                gsap.set(dalam, { svgOrigin: '0 0' })
                elBidak.current.set(b.id, { luar, dalam })
              } else elBidak.current.delete(b.id)
            }}
            className={s.bidak}
            style={{ ['--warna-pemain' as string]: players[b.p]!.warna, ['--warna-pemain-gelap' as string]: gelap(players[b.p]!.warna) }}
          >
            <g>
              <ellipse cx="0" cy={r * 0.32} rx={r * 0.98} ry={r * 0.9} className={s.bayangBidak} />
              <circle r={r} className={s.badanBidak} strokeWidth={Math.max(3, r * 0.1)} />
              <circle r={r * 0.62} className={s.motifBidak} strokeWidth={Math.max(2, r * 0.07)} />
              {b.p === 1 && <circle r={r * 0.22} className={s.titikBidak} />}
              <path d={`M${-r * 0.55} ${-r * 0.45} A${r * 0.75} ${r * 0.75} 0 0 1 ${r * 0.15} ${-r * 0.72}`} className={s.kilauBidak} strokeWidth={Math.max(2, r * 0.1)} />
            </g>
          </g>
        ))}
        </g>

        {pakaiKeyboard && fokus !== null && <circle className={s.fokus} cx={tampakKe(fokus).x} cy={tampakKe(fokus).y} r={r + 16} />}

        {/* Area sentuh: titik terdekat dari sentuhan */}
        <rect
          className={s.areaSentuh}
          x={tata.bingkai.x - 14}
          y={tata.bingkai.y - 14}
          width={tata.bingkai.w + 28}
          height={tata.bingkai.h + 28}
          onPointerDown={ketukPapan}
          aria-label="Papan dam-daman"
        />
      </svg>

      {/* Titik tujuan yang sah: lapisan HTML supaya denyutnya dikomposit GPU, bukan menggambar ulang SVG. */}
      {tampil.sasaran.map(({ titik, makan }) => (
        <span
          key={`s${titik}`}
          className={`${s.sasaran} ${makan ? s.sasaranMakan : ''}`}
          style={{ left: tampakKe(titik).x, top: tampakKe(titik).y, width: r * 1.5, height: r * 1.5 }}
          aria-hidden="true"
        />
      ))}

      {/* Sorotan pergantian giliran di mode bergantian */}
      {mode === 'hotseat' && gerak && fase !== 'selesai' && tampil.nomorGiliran > 0 && (
        <div key={tampil.nomorGiliran} className={s.sorotGiliran} style={{ ['--warna-pemain' as string]: pemainAktif.warna }} aria-hidden="true">
          Giliran {pemainAktif.nama}
        </div>
      )}
    </div>
  )
}
