import gsap from 'gsap'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AvatarKarakter, Karakter } from '../../characters/Karakter'
import { audio } from '../../shared/audio/AudioManager'
import { BendaGambar } from '../../shared/benda/BendaGambar'
import { kirimHud } from '../../shared/hud'
import type { MountOptions, Player } from '../../shared/types'
import { useReducedMotion } from '../../shared/useReducedMotion'
import { hitungLangkah } from './aturan'
import { JEDA_KOMPUTER, JUMLAH_KOTAK, LAMA_DADU, LAMA_KARTU_KOMPUTER, LAMA_LANGKAH } from './config'
import { MukaDadu } from './Dadu'
import { TumpukanFakta, type Fakta } from './fakta'
import { geserBersama, PAPAN_X, PAPAN_Y, pusatKotak } from './geometri'
import { Jam } from './jam'
import { Papan } from './Papan'
import s from './UlarTangga.module.css'

export interface Kontrol {
  jam: Jam | null
}

type Fase = 'menunggu' | 'komputer' | 'berguling' | 'bergerak' | 'kartu' | 'selesai'

const keteranganKotak = (n: number) => (n <= 0 ? 'Belum mulai' : `Kotak ${n}`)

function KepalaPemain({ p }: { p: Player }) {
  return p.avatar === 'cpu' ? (
    <Karakter who={p.tokoh ?? 'bima'} crop="head" hidup={false} />
  ) : (
    <AvatarKarakter avatar={p.avatar} crop="head" hidup={false} />
  )
}

export function UlarTangga({ opsi, host, kontrol }: { opsi: MountOptions; host: HTMLElement; kontrol: Kontrol }) {
  const { players } = opsi
  const gerak = !useReducedMotion()
  // Dibaca lewat ref supaya mengubah reduce-motion di tengah permainan tidak mengulang game.
  const gerakRef = useRef(gerak)
  useEffect(() => {
    gerakRef.current = gerak
  }, [gerak])
  const [posisi, setPosisi] = useState<Record<string, number>>(() => Object.fromEntries(players.map((p) => [p.id, 0])))
  const [giliran, setGiliran] = useState(0)
  const [fase, setFase] = useState<Fase>('menunggu')
  const [angka, setAngka] = useState(6)
  const [pesan, setPesan] = useState('')
  const [kartu, setKartu] = useState<{ fakta: Fakta; otomatis: boolean } | null>(null)
  const [pemenang, setPemenang] = useState<string | null>(null)

  const pion = useRef(new Map<string, { luar: HTMLDivElement; dalam: HTMLDivElement }>())
  const tungguLempar = useRef<(() => void) | null>(null)
  const tungguTutup = useRef<(() => void) | null>(null)
  const jamRef = useRef<Jam | null>(null)

  const aktif = players[giliran]!
  const manusiaGiliran = aktif.avatar !== 'cpu'

  // Dadu berganti muka acak selama berguling.
  useEffect(() => {
    if (fase !== 'berguling') return
    const t = window.setInterval(() => setAngka(1 + Math.floor(Math.random() * 6)), 70)
    return () => window.clearInterval(t)
  }, [fase])

  // Alur permainan: satu async loop per pemasangan; Jam menangani jeda & pelepasan.
  useLayoutEffect(() => {
    const jam = new Jam()
    jamRef.current = jam
    kontrol.jam = jam
    const tumpukan = new TumpukanFakta('ular-tangga')
    const mulai = performance.now()
    let pos: Record<string, number> = Object.fromEntries(players.map((p) => [p.id, 0]))

    const titik = (id: string, n: number, bersama: boolean) => {
      const c = pusatKotak(n)
      let dx = 0
      let dy = 0
      if (bersama) {
        const sama = players.filter((p) => pos[p.id] === n)
        const i = sama.findIndex((p) => p.id === id)
        ;({ dx, dy } = geserBersama(i, sama.length, n))
      }
      return { x: PAPAN_X + c.x + dx, y: PAPAN_Y + c.y + dy }
    }

    const rapikan = (durasi: number) =>
      Promise.all(
        players.map((p) => {
          const el = pion.current.get(p.id)
          if (!el) return Promise.resolve()
          const t = titik(p.id, pos[p.id]!, true)
          const kecil = pos[p.id]! > 0 && players.filter((q) => pos[q.id] === pos[p.id]).length > 1
          return jam.animasi(gsap.to(el.luar, { ...t, scale: kecil ? 0.78 : 1, duration: durasi, ease: 'power2.out' }))
        }),
      )

    const lompat = (id: string, n: number) => {
      const el = pion.current.get(id)
      if (!el) return Promise.resolve()
      const d = (gerakRef.current ? LAMA_LANGKAH : 60) / 1000
      const tl = gsap.timeline().to(el.luar, { ...titik(id, n, false), scale: 1, duration: d, ease: 'power1.inOut' })
      if (gerakRef.current) tl.to(el.dalam, { y: -22, duration: d / 2, yoyo: true, repeat: 1, ease: 'power1.out' }, 0)
      audio.sfx('langkah', 0.5)
      return jam.animasi(tl)
    }

    const luncur = (id: string, n: number, ular: boolean) => {
      const el = pion.current.get(id)
      if (!el) return Promise.resolve()
      const tl = gsap.timeline().to(el.luar, { ...titik(id, n, false), duration: gerakRef.current ? (ular ? 1 : 0.8) : 0.1, ease: 'power2.inOut' })
      if (gerakRef.current && ular) tl.to(el.dalam, { rotation: 14, duration: 0.12, yoyo: true, repeat: 7, ease: 'sine.inOut' }, 0).set(el.dalam, { rotation: 0 })
      return jam.animasi(tl)
    }

    const hud = (i: number) =>
      kirimHud(host, { giliran: players[i]!.id, skor: Object.fromEntries(players.map((p) => [p.id, keteranganKotak(pos[p.id]!)])) })

    const jalan = async () => {
      await rapikan(0)
      let i = 0
      // Setiap `await` bisa kembali setelah game dilepas (mis. efek ganda StrictMode);
      // loop lama berhenti di sini supaya tidak mengambil alih tombol dadu.
      for (;;) {
        if (jam.dihentikan) return
        const p = players[i]!
        setGiliran(i)
        hud(i)
        if (p.avatar === 'cpu') {
          setFase('komputer')
          setPesan(`${p.nama} bersiap melempar dadu…`)
          await jam.tunggu(JEDA_KOMPUTER)
        } else {
          setFase('menunggu')
          setPesan(`Giliran ${p.nama}. Lempar dadunya!`)
          await new Promise<void>((res) => (tungguLempar.current = res))
          tungguLempar.current = null
        }
        if (jam.dihentikan) return

        // Dadu berguling ±0,8 detik.
        setFase('berguling')
        audio.sfx('dadu')
        const hasilDadu = 1 + Math.floor(Math.random() * 6)
        await jam.tunggu(gerakRef.current ? LAMA_DADU : 200)
        setAngka(hasilDadu)
        setFase('bergerak')
        setPesan(`${p.nama} dapat ${hasilDadu}.`)

        // Pion melompat kotak demi kotak (termasuk pantulan).
        const h = hitungLangkah(pos[p.id]!, hasilDadu)
        for (const n of h.jalur) {
          pos = { ...pos, [p.id]: n }
          await lompat(p.id, n)
        }
        setPosisi(pos)
        if (h.memantul) {
          audio.sfx('pantul')
          setPesan(`Kelebihan! Kotak ${JUMLAH_KOTAK} harus pas, jadi ${p.nama} memantul mundur ke kotak ${h.mendarat}.`)
          await jam.tunggu(900)
        }

        if (h.tangga) {
          audio.sfx('tangga')
          setPesan(`Naik tangga! ${h.tangga.dari} → ${h.tangga.ke}`)
          pos = { ...pos, [p.id]: h.tangga.ke }
          await luncur(p.id, h.tangga.ke, false)
          setPosisi(pos)
          // Kartu "Tahukah kamu?"
          const otomatis = p.avatar === 'cpu'
          setFase('kartu')
          setKartu({ fakta: tumpukan.ambil(), otomatis })
          audio.sfx('kartu')
          const tutup = new Promise<void>((res) => (tungguTutup.current = res))
          await (otomatis ? Promise.race([tutup, jam.tunggu(LAMA_KARTU_KOMPUTER)]) : tutup)
          tungguTutup.current = null
          setKartu(null)
          setFase('bergerak')
        } else if (h.ular) {
          audio.sfx('ular')
          setPesan(`Aduh, kepala ular! ${h.ular.kepala} → ${h.ular.ekor}`)
          pos = { ...pos, [p.id]: h.ular.ekor }
          await luncur(p.id, h.ular.ekor, true)
          setPosisi(pos)
        }

        await rapikan(0.2)
        hud(i)

        if (h.menang) {
          setFase('selesai')
          setPemenang(p.id)
          setPesan(`${p.nama} sampai di kotak ${JUMLAH_KOTAK}!`)
          audio.sfx('menang')
          const el = pion.current.get(p.id)
          if (el && gerakRef.current) await jam.animasi(gsap.to(el.dalam, { y: -30, duration: 0.22, yoyo: true, repeat: 5, ease: 'power1.out' }))
          await jam.tunggu(900)
          opsi.onFinish({
            pemenang: p,
            skor: pos,
            keteranganSkor: Object.fromEntries(players.map((q) => [q.id, keteranganKotak(pos[q.id]!)])),
            durasiDetik: Math.round((performance.now() - mulai) / 1000),
          })
          return
        }
        i = (i + 1) % players.length
        await jam.tunggu(350)
      }
    }
    void jalan()

    return () => {
      jam.hentikan()
      if (kontrol.jam === jam) kontrol.jam = null
      jamRef.current = null
    }
  }, [opsi, players, host, kontrol])

  const lempar = useCallback(() => {
    if (!tungguLempar.current || jamRef.current?.dijeda) return
    tungguLempar.current()
    tungguLempar.current = null
  }, [])

  const tutupKartu = useCallback(() => {
    if (!tungguTutup.current || jamRef.current?.dijeda) return
    tungguTutup.current()
    tungguTutup.current = null
  }, [])

  // Keyboard: Spasi/Enter melempar dadu atau menutup kartu.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== ' ' && e.key !== 'Enter') return
      if (e.target instanceof HTMLElement && e.target.closest('[role="dialog"]')) return
      e.preventDefault()
      if (tungguTutup.current) tutupKartu()
      else lempar()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lempar, tutupKartu])

  const bisaLempar = fase === 'menunggu' && manusiaGiliran

  return (
    <div className={s.arena}>
      {/* Kiri: daftar pemain */}
      <ol className={s.daftarPemain} aria-label="Pemain">
        {players.map((p, i) => (
          <li
            key={p.id}
            className={`${s.pemain} ${i === giliran && fase !== 'selesai' ? s.pemainAktif : ''} ${pemenang === p.id ? s.pemainMenang : ''}`}
            style={{ ['--warna-pemain' as string]: p.warna }}
            aria-current={i === giliran || undefined}
          >
            {i === giliran && fase !== 'selesai' && <span className={s.tandaGiliran}>GILIRAN</span>}
            <span className={s.kepalaPemain}>
              <KepalaPemain p={p} />
            </span>
            <span className={s.infoPemain}>
              <span className={s.namaPemain}>
                {p.nama}
                {p.avatar === 'cpu' && <span className={s.cpu}> · komputer</span>}
              </span>
              <span className={s.kotakPemain}>{keteranganKotak(posisi[p.id]!)}</span>
            </span>
          </li>
        ))}
      </ol>

      {/* Tengah: papan + pion */}
      <div className={s.papan} style={{ left: PAPAN_X - 14, top: PAPAN_Y - 14 }}>
        <Papan />
      </div>
      <div className={s.alasMulai} style={{ left: PAPAN_X + pusatKotak(0).x - 118, top: PAPAN_Y + pusatKotak(0).y - 70 }}>
        <span>Mulai</span>
      </div>
      {players.map((p, i) => (
        <div
          key={p.id}
          className={s.pion}
          style={{ ['--warna-pemain' as string]: p.warna, zIndex: i === giliran ? 3 : 2 }}
          ref={(luar) => {
            const dalam = luar?.firstElementChild as HTMLDivElement | null
            if (luar && dalam) pion.current.set(p.id, { luar, dalam })
            else pion.current.delete(p.id)
          }}
        >
          <div className={s.pionDalam}>
            <span className={s.pionKepala}>
              <KepalaPemain p={p} />
            </span>
          </div>
        </div>
      ))}

      {/* Kanan: dadu */}
      <div className={s.panelDadu}>
        <div className={s.giliran} aria-live="polite">
          {fase === 'selesai' ? 'Selesai!' : `Giliran ${aktif.nama}`}
        </div>
        <button
          type="button"
          className={`${s.dadu} ${fase === 'berguling' && gerak ? s.berguling : ''} ${bisaLempar ? s.daduSiap : ''}`}
          disabled={!bisaLempar}
          onClick={lempar}
          aria-label={bisaLempar ? 'Lempar dadu' : `Dadu: ${angka}`}
        >
          <MukaDadu angka={angka} className={s.mukaDadu} />
        </button>
        <div className={s.petunjuk}>
          {bisaLempar ? 'Tap dadu atau tekan Spasi' : aktif.avatar === 'cpu' && fase !== 'selesai' ? `${aktif.nama} (komputer) bermain…` : ' '}
        </div>
        <p className={s.pesan} role="status">
          {pesan}
        </p>
      </div>

      {/* Kartu "Tahukah kamu?" */}
      {kartu && (
        <div className={s.tabirKartu}>
          <div className={s.kartu} role="dialog" aria-modal="false" aria-labelledby="ut-judul-kartu">
            <div className={s.pitaKartu} aria-hidden="true" />
            <div className={s.isiKartu}>
              <div className={s.kepalaKartu}>
                <div className={s.bendaKartu}>
                  <BendaGambar jenis={kartu.fakta.benda} />
                </div>
                <div>
                  <div id="ut-judul-kartu" className={s.judulKartu}>
                    Tahukah kamu?
                  </div>
                  <div className={s.namaKartu}>{kartu.fakta.nama}</div>
                </div>
              </div>
              <p className={s.teksKartu}>“{kartu.fakta.teks}”</p>
              <div className={s.kakiKartu}>
                <span className={s.sumberKartu}>{kartu.fakta.sumber}</span>
                <button type="button" className={s.lanjut} onClick={tutupKartu} autoFocus={!kartu.otomatis}>
                  Lanjut
                </button>
              </div>
              {kartu.otomatis && (
                <div className={s.waktuKartu} style={{ animationDuration: `${LAMA_KARTU_KOMPUTER}ms` }} aria-hidden="true" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
