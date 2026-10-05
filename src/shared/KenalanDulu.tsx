import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { useKotak } from '../app/store'
import { PakGuru } from '../characters/Karakter'
import { getGame } from '../data/games'
import { isGameReady } from '../games'
import { kelasKategori } from '../menu/kategori'
import { AnimasiKontrol } from './AnimasiKontrol'
import { audio } from './audio/AudioManager'
import { buatSesi, type Sesi } from './sesi'
import type { GameData, GameMode, Kesulitan } from './types'
import { Halaman } from './ui/Halaman'
import { IkonKembali, IkonMain } from './ui/Ikon'
import { Tombol, TombolIkon } from './ui/Tombol'
import { TombolSuara } from './ui/TombolSuara'
import s from './KenalanDulu.module.css'

const MODE: Record<GameMode, { label: string; desc: string; ikon: string }> = {
  cpu: { label: 'Lawan Komputer', desc: 'Main sendiri melawan komputer', ikon: 'K' },
  hotseat: { label: 'Main Bergantian', desc: 'Satu perangkat, gantian giliran', ikon: '⇄' },
  split: { label: 'Duel Satu Layar', desc: 'Layar dibagi dua, main bersamaan', ikon: '½' },
}

const KESULITAN: { id: Kesulitan; label: string }[] = [
  { id: 'mudah', label: 'Mudah' },
  { id: 'sedang', label: 'Sedang' },
  { id: 'sulit', label: 'Sulit' },
]

/** Kenalan Dulu — design/Kenalan.dc.html. */
export function KenalanDulu() {
  const { gameId } = useParams()
  const game = getGame(gameId)
  const avatar = useKotak((st) => st.avatar)
  if (!game) return <Navigate to="/menu" replace />
  if (!avatar) return <Navigate to="/avatar" replace />
  return <IsiKenalan key={game.id} game={game} namaUtama={avatar.nama} />
}

function IsiKenalan({ game, namaUtama }: { game: GameData; namaUtama: string }) {
  const navigate = useNavigate()
  const avatar = useKotak((st) => st.avatar)!
  const siap = isGameReady(game.id)
  const [mode, setMode] = useState<GameMode>(game.mode[0]!)
  const [kesulitan, setKesulitan] = useState<Kesulitan>('sedang')
  const [minPemain, maksPemain] = game.pemainBergantian
  const [jumlah, setJumlah] = useState(minPemain)
  const [minCpu, maksCpu] = game.lawanKomputer
  const [jumlahCpu, setJumlahCpu] = useState(minCpu)
  const [nama, setNama] = useState<string[]>([namaUtama, 'Pemain 2', 'Pemain 3', 'Pemain 4'])
  const [pilihan, setPilihan] = useState<Record<string, string>>(() =>
    Object.fromEntries((game.pilihan ?? []).map((p) => [p.id, p.bawaan])),
  )

  // Pak Guru menyapa: lip-sync jika ada rekaman VO, jika tidak mulut bergerak sebentar.
  const lineVO = `kenalan-${game.id}`
  const pakaiVO = audio.adaVO(lineVO)
  const [bicara, setBicara] = useState(true)
  useEffect(() => {
    let batal = false
    if (pakaiVO) {
      void audio.vo(lineVO).then(() => !batal && setBicara(false))
    } else {
      const t = window.setTimeout(() => setBicara(false), 3500)
      return () => window.clearTimeout(t)
    }
    return () => {
      batal = true
      audio.hentikanVO()
    }
  }, [lineVO, pakaiVO])

  // Duel Satu Layar dua sisi (kiri/kanan) atau 2–4 pemain bersama (mis. egrang).
  const splitBanyak = maksPemain > 2
  const jumlahMain = mode === 'split' && !splitBanyak ? 2 : jumlah
  const isiKomputer = mode === 'split' && !!game.pesertaSplit && jumlahMain < game.pesertaSplit
  const pakaiKesulitan = game.pakaiKesulitan !== false && (mode === 'cpu' || (mode === 'split' && !!game.pesertaSplit))
  const main = () => {
    audio.sfx('tap')
    const sesi: Sesi = buatSesi({
      mode,
      difficulty: kesulitan,
      pemainUtama: avatar,
      namaPemain: nama.slice(0, jumlahMain),
      lawanKomputer: jumlahCpu,
      pesertaSplit: game.pesertaSplit,
      pilihan,
    })
    navigate(`/main/${game.id}`, { state: { sesi } })
  }

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
            <span className={s.namaTokoh}>Mr. Ahsan</span>
            <p>{game.deskripsi}</p>
            {game.pesanGuru && (
              <p className={s.pesanGuru}>
                <span className={s.pesanGuruLabel}>Fair play</span>
                {game.pesanGuru}
              </p>
            )}
          </div>
          <div className={s.guruTokoh}>
            <PakGuru
              pose="talk"
              bicara={bicara && !pakaiVO}
              lipSync={bicara && pakaiVO ? audio.levelVO : null}
            />
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
              {game.catatanWeb?.map((c) => (
                <p key={c} className={s.catatanWeb}>
                  <span className={s.catatanLabel}>Penting</span>
                  {c}
                </p>
              ))}
              <AnimasiKontrol jenis={game.jenisKontrol} />
            </section>
          </div>

          {(game.asalDaerah || game.namaLain.length > 0) && (
            <div className={s.riset}>
              <span className={s.risetJudul}>Asal daerah &amp; nama lain</span>
              <span>{[game.asalDaerah, game.namaLain.join(', ')].filter(Boolean).join(' · ')}</span>
            </div>
          )}

          <section className={s.mode} aria-labelledby="judul-mode">
            <h2 id="judul-mode" className={s.kartuJudulNila}>
              Pilih mode
            </h2>
            <div className={s.barisMode}>
              {game.mode.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`${s.tombolMode} ${mode === m ? s.modeAktif : ''}`}
                  aria-pressed={mode === m}
                  onClick={() => setMode(m)}
                >
                  <span className={s.modeIkon} aria-hidden="true">
                    {MODE[m].ikon}
                  </span>
                  <span className={s.modeTeks}>
                    <span className={s.modeLabel}>{MODE[m].label}</span>
                    <span className={s.modeDesc}>
                      {m === 'split' && splitBanyak ? `Satu layar, ${minPemain}–${maksPemain} pemain bersamaan` : MODE[m].desc}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          {game.pilihan?.map((p) => (
            <section key={p.id} className={s.pengaturanMain} aria-labelledby={`judul-pilihan-${p.id}`}>
              <h2 id={`judul-pilihan-${p.id}`} className={s.subJudul}>
                {p.label}
              </h2>
              <div className={s.pilSegmen} role="radiogroup" aria-labelledby={`judul-pilihan-${p.id}`}>
                {p.opsi.map((o) => (
                  <button
                    key={o.nilai}
                    type="button"
                    role="radio"
                    aria-checked={pilihan[p.id] === o.nilai}
                    className={`${s.segmen} ${pilihan[p.id] === o.nilai ? s.segmenAktif : ''}`}
                    onClick={() => setPilihan({ ...pilihan, [p.id]: o.nilai })}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </section>
          ))}

          {mode === 'cpu' && maksCpu > minCpu && (
            <section className={s.pengaturanMain} aria-labelledby="judul-lawan">
              <h2 id="judul-lawan" className={s.subJudul}>
                Jumlah lawan komputer
              </h2>
              <div className={s.pilSegmen} role="radiogroup" aria-labelledby="judul-lawan">
                {Array.from({ length: maksCpu - minCpu + 1 }, (_, i) => minCpu + i).map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={jumlahCpu === n}
                    className={`${s.segmen} ${jumlahCpu === n ? s.segmenAktif : ''}`}
                    onClick={() => setJumlahCpu(n)}
                  >
                    {n} lawan
                  </button>
                ))}
              </div>
            </section>
          )}

          {pakaiKesulitan && (
            <section className={s.pengaturanMain} aria-labelledby="judul-kesulitan">
              <h2 id="judul-kesulitan" className={s.subJudul}>
                Tingkat kesulitan
              </h2>
              <div className={s.pilSegmen} role="radiogroup" aria-labelledby="judul-kesulitan">
                {KESULITAN.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    role="radio"
                    aria-checked={kesulitan === k.id}
                    className={`${s.segmen} ${kesulitan === k.id ? s.segmenAktif : ''}`}
                    onClick={() => setKesulitan(k.id)}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
            </section>
          )}

          {mode !== 'cpu' && (
            <section className={s.pengaturanMain} aria-labelledby="judul-pemain">
              <h2 id="judul-pemain" className={s.subJudul}>
                {mode === 'split' && !splitBanyak ? 'Nama pemain kiri & kanan' : 'Jumlah & nama pemain'}
              </h2>
              {maksPemain > minPemain && (
                <div className={s.pilSegmen} role="radiogroup" aria-label="Jumlah pemain">
                  {Array.from({ length: maksPemain - minPemain + 1 }, (_, i) => minPemain + i).map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={jumlah === n}
                      className={`${s.segmen} ${jumlah === n ? s.segmenAktif : ''}`}
                      onClick={() => setJumlah(n)}
                    >
                      {n} pemain
                    </button>
                  ))}
                </div>
              )}
              <div className={s.daftarNama}>
                {nama.slice(0, jumlahMain).map((n, i) => (
                  <label key={i} className={s.kolomNama}>
                    <span className={s.labelNama}>
                      {mode === 'split' && !splitBanyak ? (i === 0 ? 'Kiri' : 'Kanan') : `Pemain ${i + 1}`}
                    </span>
                    <input
                      className={s.masukan}
                      value={n}
                      maxLength={12}
                      onChange={(e) => setNama(nama.map((x, j) => (j === i ? e.target.value : x)))}
                    />
                  </label>
                ))}
              </div>
              {isiKomputer && <p className={s.teks}>Lintasan yang kosong diisi pemain komputer.</p>}
            </section>
          )}
        </div>
      </div>

      <div className={s.kaki}>
        <Tombol className={s.main} disabled={!siap} onClick={main}>
          <IkonMain ukuran={26} />
          {siap ? 'Main' : 'Segera hadir'}
        </Tombol>
      </div>
    </Halaman>
  )
}
