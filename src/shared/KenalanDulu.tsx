import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { Karakter } from '../characters/Karakter'
import { getGame } from '../data/games'
import { isGameReady } from '../games'
import { kelasKategori } from '../menu/kategori'
import type { GameMode } from './types'
import { Halaman } from './ui/Halaman'
import { IkonKembali, IkonMain } from './ui/Ikon'
import { Tombol, TombolIkon } from './ui/Tombol'
import { TombolSuara } from './ui/TombolSuara'
import s from './KenalanDulu.module.css'

const MODE: { id: GameMode; label: string; desc: string; ikon: string }[] = [
  { id: 'cpu', label: 'Lawan Komputer', desc: 'Main sendiri melawan komputer', ikon: 'K' },
  { id: 'hotseat', label: 'Main Bergantian', desc: 'Satu perangkat, gantian giliran', ikon: '⇄' },
  { id: 'split', label: 'Duel Satu Layar', desc: 'Layar dibagi dua, main bersamaan', ikon: '½' },
]

/** Kenalan Dulu — design/Kenalan.dc.html. Versi lengkap (animasi kontrol) menyusul di tahap 3. */
export function KenalanDulu() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const game = getGame(gameId)
  const [mode, setMode] = useState<GameMode | undefined>(game?.mode[0])

  if (!game) return <Navigate to="/menu" replace />
  const siap = isGameReady(game.id)

  return (
    <Halaman
      kiri={
        <TombolIkon aria-label="Kembali ke menu" onClick={() => navigate('/menu')}>
          <IkonKembali />
        </TombolIkon>
      }
      label="Kenalan Dulu"
      judul={game.nama}
      kanan={<TombolSuara />}
    >
      <div className={s.tata}>
        <div className={s.guru}>
          <div className={s.balon}>
            <span className={s.namaTokoh}>Pak Guru</span>
            <p>{game.deskripsi}</p>
          </div>
          <div className={s.guruTokoh}>
            <Karakter who="guru" pose="talk" motion label="Pak Guru" />
          </div>
        </div>

        <div className={s.kanan}>
          <div className={s.info}>
            <span className={`${s.chip} ${kelasKategori(game.kategori)}`}>{game.kategori}</span>
            <span className={s.chipPemain}>{game.jumlahPemainAsli}</span>
          </div>
          <div className={s.duaKolom}>
            <section className={s.kartu}>
              <h2 className={s.kartuJudul}>
                <span className={`${s.kartuIkon} ${s.ikonKayu}`} aria-hidden="true">
                  ≡
                </span>
                Aturan asli
              </h2>
              <ul className={s.daftar}>
                {game.aturanAsli.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </section>
            <section className={s.kartu}>
              <h2 className={s.kartuJudul}>
                <span className={`${s.kartuIkon} ${s.ikonKunyit}`} aria-hidden="true">
                  ▭
                </span>
                Cara main di web
              </h2>
              <p className={s.teks}>{game.caraMainWeb}</p>
              <p className={s.kontrol}>Kontrol: {game.kontrol}</p>
            </section>
          </div>

          <div className={s.riset}>
            <span className={s.risetJudul}>Asal daerah &amp; nama lain</span>
            <span>{game.asalDaerah || 'Menunggu hasil riset kelompok siswa.'}</span>
          </div>

          <section className={s.mode}>
            <h2 className={s.kartuJudulNila}>Pilih mode</h2>
            <div className={s.barisMode}>
              {MODE.map((m) => {
                const didukung = game.mode.includes(m.id)
                return (
                  <button
                    key={m.id}
                    type="button"
                    className={`${s.tombolMode} ${mode === m.id ? s.modeAktif : ''}`}
                    disabled={!didukung}
                    aria-pressed={mode === m.id}
                    onClick={() => setMode(m.id)}
                  >
                    <span className={s.modeIkon} aria-hidden="true">
                      {m.ikon}
                    </span>
                    <span className={s.modeTeks}>
                      <span className={s.modeLabel}>{m.label}</span>
                      <span className={s.modeDesc}>{didukung ? m.desc : 'Tidak tersedia di game ini'}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        </div>
      </div>

      <div className={s.kaki}>
        <Tombol
          className={s.main}
          disabled={!siap}
          onClick={() => navigate(`/main/${game.id}`, { state: { mode } })}
        >
          <IkonMain ukuran={26} />
          {siap ? 'Main' : 'Segera hadir'}
        </Tombol>
      </div>
    </Halaman>
  )
}
