import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { useKotak } from '../app/store'
import { Stage } from '../app/stage/Stage'
import { useStageScale } from '../app/stage/useStageScale'
import { AvatarKarakter, Karakter } from '../characters/Karakter'
import { getGame } from '../data/games'
import { muatGame } from '../games'
import { audio } from './audio/AudioManager'
import { HUD_EVENT, type HudData } from './hud'
import { pemainUtamaMenang, type Sesi } from './sesi'
import type { GameData, GameModule, GameResult, Player } from './types'
import { IkonMain, IkonRumah, IkonUlang } from './ui/Ikon'
import { Modal } from './ui/Modal'
import { Tombol, TombolIkon } from './ui/Tombol'
import { TombolSuara } from './ui/TombolSuara'
import s from './GameShell.module.css'

const IkonJeda = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="6" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
    <rect x="14" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
  </svg>
)

export interface StateHasil {
  sesi: Sesi
  hasil: GameResult
  stempelBaru: boolean
}

/** Rute /main/:gameId — butuh sesi dari Kenalan Dulu (state navigasi). */
export function GameShell() {
  const { gameId } = useParams()
  const lokasi = useLocation()
  const game = getGame(gameId)
  const sesi = (lokasi.state as { sesi?: Sesi } | null)?.sesi
  if (!game) return <Navigate to="/menu" replace />
  if (!sesi) return <Navigate to={`/kenalan/${game.id}`} replace />
  return <Shell key={lokasi.key} game={game} sesi={sesi} />
}

function Shell({ game, sesi }: { game: GameData; sesi: Sesi }) {
  const navigate = useNavigate()
  const catatHasil = useKotak((st) => st.catatHasil)
  const [modul, setModul] = useState<GameModule | null>(null)
  const [gagal, setGagal] = useState(false)
  const [putaran, setPutaran] = useState(0)
  const [jeda, setJeda] = useState(false)
  const [hud, setHud] = useState<HudData>({})
  const host = useRef<HTMLDivElement>(null)
  const selesai = useRef(false)
  const wajibMendatar = (modul?.orientation ?? game.orientasi) === 'landscape'
  const { portrait } = useStageScale()

  // Muat modul game (lazy, per folder).
  useEffect(() => {
    let batal = false
    muatGame(game.id)
      .then((m) => {
        if (batal) return
        if (m) setModul(m)
        else setGagal(true)
      })
      .catch(() => !batal && setGagal(true))
    return () => {
      batal = true
    }
  }, [game.id])

  const onFinish = useCallback(
    (hasil: GameResult) => {
      if (selesai.current) return
      selesai.current = true
      const stempelBaru = catatHasil(game.id, pemainUtamaMenang(hasil.pemenang))
      audio.sfx(hasil.pemenang ? 'menang' : 'seri')
      const state: StateHasil = { sesi, hasil, stempelBaru }
      navigate(`/hasil/${game.id}`, { replace: true, state })
    },
    [catatHasil, game.id, navigate, sesi],
  )

  // Pasang game; `putaran` bertambah saat "Ulang" sehingga game dipasang ulang.
  useEffect(() => {
    const el = host.current
    if (!modul || !el) return
    selesai.current = false
    const onHud = (e: Event) => setHud((lama) => ({ ...lama, ...(e as CustomEvent<HudData>).detail }))
    el.addEventListener(HUD_EVENT, onHud)
    modul.mount(el, { mode: sesi.mode, players: sesi.players, difficulty: sesi.difficulty, onFinish })
    return () => {
      el.removeEventListener(HUD_EVENT, onHud)
      modul.unmount()
      setHud({})
    }
  }, [modul, putaran, sesi, onFinish])

  const bukaJeda = useCallback(() => {
    if (!modul || selesai.current) return
    modul.pause()
    setJeda(true)
  }, [modul])

  const lanjut = () => {
    setJeda(false)
    modul?.resume()
  }

  // Jeda otomatis: tab disembunyikan, atau HP diputar tegak di game layar lebar.
  useEffect(() => {
    const onVis = () => document.hidden && bukaJeda()
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [bukaJeda])

  // HP tegak di game layar lebar: game dijeda diam-diam dan hanya ajakan
  // "Putar HP-mu" yang tampil (menu jeda tidak boleh menutupinya). Setelah HP
  // mendatar lagi, menu jeda muncul supaya pemain melanjutkan saat siap.
  const perluPutar = wajibMendatar && portrait
  const jedaKarenaPutar = useRef(false)
  useEffect(() => {
    if (!modul || selesai.current) return
    if (perluPutar) {
      modul.pause()
      jedaKarenaPutar.current = true
    } else if (jedaKarenaPutar.current) {
      jedaKarenaPutar.current = false
      bukaJeda()
    }
  }, [perluPutar, modul, bukaJeda])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || jeda) return // Modal menangani Escape saat jeda
      bukaJeda()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [bukaJeda, jeda])

  const hudUi = (
    <Hud
      game={game}
      players={sesi.players}
      hud={hud}
      split={sesi.mode === 'split'}
      hanyaTombol={modul?.hud === 'tombol'}
      onJeda={bukaJeda}
    />
  )

  return (
    <>
      <Stage wajibMendatar={wajibMendatar} ui={modul && hudUi}>
        <div ref={host} className={s.host} />
        {!modul && (
          <div className={s.memuat}>
            <p>{gagal ? 'Permainan ini belum tersedia.' : 'Menyiapkan permainan…'}</p>
            {gagal && <Tombol onClick={() => navigate('/menu')}>Kembali ke menu</Tombol>}
          </div>
        )}
      </Stage>

      {jeda && !perluPutar && (
        <Modal
          judul="Jeda"
          onTutup={lanjut}
          aksi={
            <div className={s.aksiJeda}>
              <Tombol penuh onClick={lanjut}>
                <IkonMain /> Lanjut
              </Tombol>
              <Tombol
                penuh
                varian="sekunder"
                onClick={() => {
                  setJeda(false)
                  setPutaran((n) => n + 1)
                }}
              >
                <IkonUlang /> Ulang dari awal
              </Tombol>
              <Tombol penuh varian="merah" onClick={() => navigate('/menu')}>
                <IkonRumah /> Keluar ke menu
              </Tombol>
            </div>
          }
        >
          <p className={s.teksJeda}>{game.nama} dijeda. Mau lanjut, ulang, atau keluar?</p>
        </Modal>
      )}
    </>
  )
}

function Hud({
  game,
  players,
  hud,
  split,
  hanyaTombol,
  onJeda,
}: {
  game: GameData
  players: Player[]
  hud: HudData
  split: boolean
  hanyaTombol: boolean
  onJeda: () => void
}) {
  if (hanyaTombol) {
    return (
      <div className={`${s.hud} ${s.hudTombol}`}>
        <TombolIkon aria-label="Jeda" onClick={onJeda}>
          <IkonJeda />
        </TombolIkon>
        <TombolSuara />
      </div>
    )
  }
  return (
    <div className={s.hud}>
      <TombolIkon aria-label="Jeda" onClick={onJeda}>
        <IkonJeda />
      </TombolIkon>
      <div className={s.tengah}>
        <div className={s.namaGame}>{game.nama}</div>
        <ul className={`${s.pemain} ${split ? s.pemainSplit : ''}`} aria-label="Skor pemain">
          {players.map((p) => {
            const aktif = hud.giliran === p.id
            const skor = hud.skor?.[p.id]
            return (
              <li
                key={p.id}
                className={`${s.chip} ${aktif ? s.aktif : ''}`}
                style={{ ['--warna-pemain' as string]: p.warna }}
                aria-current={aktif || undefined}
                // Di layar sempit daftar bisa digeser; pastikan yang giliran terlihat.
                ref={aktif ? (el) => el?.scrollIntoView({ inline: 'center', block: 'nearest' }) : undefined}
              >
                {aktif && <span className={s.tanda}>GILIRAN</span>}
                <span className={s.wajah}>
                  {p.avatar === 'cpu' ? (
                    <Karakter who={p.tokoh ?? 'bima'} crop="head" hidup={false} />
                  ) : (
                    <AvatarKarakter avatar={p.avatar} crop="head" hidup={false} />
                  )}
                </span>
                <span className={s.nama}>{p.nama}</span>
                {skor !== undefined && <span className={s.skor}>{skor}</span>}
              </li>
            )
          })}
        </ul>
        {hud.pesan && (
          <div className={s.pesan} role="status">
            {hud.pesan}
          </div>
        )}
      </div>
      <TombolSuara />
    </div>
  )
}
