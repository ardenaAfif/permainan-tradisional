import { useEffect, useState, useSyncExternalStore, type KeyboardEvent } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { useKotak } from '../app/store'
import { Karakter } from '../characters/Karakter'
import type { Tokoh } from '../characters/kit'
import { getGame } from '../data/games'
import { isGameReady } from '../games'
import { kelasKategori } from '../menu/kategori'
import { AnimasiKontrol } from './AnimasiKontrol'
import { audio } from './audio/AudioManager'
import { buatSesi, type Sesi } from './sesi'
import type { GameData, GameMode, IdGuru, Kesulitan } from './types'
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

/** Guru yang memperkenalkan permainan (kolom `guru` di games.json). */
const GURU: Record<IdGuru, { nama: string; who: Tokoh }> = {
  ahsan: { nama: 'Mr. Ahsan', who: 'guru' },
  pavi: { nama: 'Ms. Pavi', who: 'pavi' },
}

/** Satu halaman monolog guru di balon kata. */
type HalamanMonolog =
  | { jenis: 'kenalan'; vo: string; teks: string }
  | { jenis: 'budaya' | 'steam'; vo: string; teks: string; en?: string }
  | { jenis: 'pesan'; vo: string; teks: string }

const LABEL_BAGIAN = { budaya: 'Nilai budaya', steam: 'Sisi STEAM', pesan: 'Pesan utama' } as const

/** Deskripsi permainan, lalu pesan moral & STEAM (games.json), ditutup pesan utama. */
function susunMonolog(game: GameData): HalamanMonolog[] {
  const m = game.pesanMoral
  return [
    { jenis: 'kenalan', vo: `kenalan-${game.id}`, teks: game.deskripsi },
    ...m.balon.map((b, i) => ({ jenis: b.bagian, vo: `moral-${game.id}-${i + 1}`, teks: b.teks, en: b.en })),
    { jenis: 'pesan', vo: `moral-${game.id}-pesan`, teks: m.pesanUtama },
  ]
}

/** Aturan dibagi dua tab supaya kartu tidak memanjang dan tidak menyisakan ruang kosong. */
type IdTab = 'cara' | 'aturan'
const TAB: { id: IdTab; label: string }[] = [
  { id: 'cara', label: 'Cara main di web' },
  { id: 'aturan', label: 'Aturan asli' },
]

/** Layar lebar & cukup tinggi: guru tampil utuh di samping balon; di HP cukup wajahnya. */
const QUERY_LEBAR = '(min-width: 700px) and (min-height: 501px)'
const pantauLebar = (cb: () => void) => {
  const mq = window.matchMedia(QUERY_LEBAR)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
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

  const guru = GURU[game.guru]
  const monolog = susunMonolog(game)
  const [hal, setHal] = useState(0)
  const isi = monolog[hal]!
  const terakhir = hal === monolog.length - 1

  // Guru bicara di setiap halaman: lip-sync jika ada rekaman VO, jika tidak mulut bergerak sebentar.
  const lineVO = isi.vo
  const pakaiVO = audio.adaVO(lineVO)
  const [bicara, setBicara] = useState(true)
  const lamaBicara = Math.min(9000, Math.max(2500, isi.teks.length * 40))
  useEffect(() => {
    let batal = false
    if (pakaiVO) {
      void audio.vo(lineVO).then(() => !batal && setBicara(false))
    } else {
      const t = window.setTimeout(() => setBicara(false), lamaBicara)
      return () => window.clearTimeout(t)
    }
    return () => {
      batal = true
      audio.hentikanVO()
    }
  }, [lineVO, pakaiVO, lamaBicara])
  const keHalaman = (i: number) => {
    setHal(i)
    setBicara(true)
  }

  const layarLebar = useSyncExternalStore(pantauLebar, () => window.matchMedia(QUERY_LEBAR).matches, () => true)
  const [tab, setTab] = useState<IdTab>('cara')
  // Panah kiri/kanan berpindah tab (pola tablist WAI-ARIA).
  const geserTab = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    const i = TAB.findIndex((t) => t.id === tab)
    const baru = TAB[(i + (e.key === 'ArrowRight' ? 1 : TAB.length - 1)) % TAB.length]!
    setTab(baru.id)
    document.getElementById(`tab-${baru.id}`)?.focus()
  }

  // Duel Satu Layar dua sisi (kiri/kanan) atau 2–4 pemain bersama (mis. egrang).
  const splitBanyak = maksPemain > 2
  const jumlahMain = mode === 'split' && !splitBanyak ? 2 : jumlah
  const isiKomputer = mode === 'split' && !!game.pesertaSplit && jumlahMain < game.pesertaSplit
  const pakaiKesulitan = game.pakaiKesulitan !== false && (mode === 'cpu' || (mode === 'split' && !!game.pesertaSplit))
  const main = () => {
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
        <section className={s.panggung} aria-label={`${guru.nama} bercerita`}>
          <div className={s.guruTokoh}>
            <Karakter
              who={guru.who}
              label={guru.nama}
              pose="talk"
              crop={layarLebar ? undefined : 'head'}
              bicara={bicara && !pakaiVO}
              lipSync={bicara && pakaiVO ? audio.levelVO : null}
            />
          </div>
          <span className={s.namaTokoh}>{guru.nama}</span>
          <div className={s.balon}>
            <div className={s.tumpukBalon} aria-live="polite">
              {monolog.map((m, i) => (
                <div key={m.vo} className={`${s.isiBalon} ${i === hal ? s.isiAktif : ''}`} aria-hidden={i !== hal}>
                  {m.jenis !== 'kenalan' && (
                    <div className={s.kepalaBalon}>
                      <span className={s.labelBagian}>{LABEL_BAGIAN[m.jenis]}</span>
                      <span className={s.chipSteam}>{game.pesanMoral.steam}</span>
                    </div>
                  )}
                  {m.jenis === 'pesan' ? <p className={s.pesanUtama}>“{m.teks}”</p> : <p className={s.teksBalon}>{m.teks}</p>}
                  {'en' in m && m.en && (
                    <p className={s.teksInggris} lang="en">
                      {m.en}
                    </p>
                  )}
                  {m.jenis === 'kenalan' && game.pesanGuru && (
                    <p className={s.pesanGuru}>
                      <span className={s.pesanGuruLabel}>Fair play</span>
                      {game.pesanGuru}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div className={s.navBalon}>
              <div className={s.titikHal} aria-label={`Bagian ${hal + 1} dari ${monolog.length}`} role="img">
                {monolog.map((m, i) => (
                  <span key={m.vo} className={`${s.titik} ${i === hal ? s.titikAktif : ''} ${i < hal ? s.titikLewat : ''}`} />
                ))}
              </div>
              <button
                type="button"
                className={`${s.tombolBalon} ${s.tombolBalonIkon}`}
                aria-label="Bagian sebelumnya"
                disabled={hal === 0}
                onClick={() => keHalaman(hal - 1)}
              >
                <IkonKembali ukuran={22} />
              </button>
              <button type="button" className={s.tombolBalon} onClick={() => keHalaman(terakhir ? 0 : hal + 1)}>
                {terakhir ? 'Dari awal' : 'Lanjut'}
                {!terakhir && (
                  <span className={s.panahLanjut} aria-hidden="true">
                    <IkonKembali ukuran={20} />
                  </span>
                )}
              </button>
            </div>
          </div>
        </section>

        <div className={s.bawah}>
          <section className={s.kartuInfo} aria-label="Tentang permainan">
            <div className={s.info}>
              <span className={`${s.chip} ${kelasKategori(game.kategori)}`}>{game.kategori}</span>
              <span className={s.chipPemain}>{game.jumlahPemainAsli}</span>
            </div>
            <div className={s.tab} role="tablist" aria-label="Aturan permainan" onKeyDown={geserTab}>
              {TAB.map((t) => (
                <button
                  key={t.id}
                  id={`tab-${t.id}`}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  aria-controls={`panel-${t.id}`}
                  tabIndex={tab === t.id ? 0 : -1}
                  className={`${s.tombolTab} ${tab === t.id ? s.tabAktif : ''}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {tab === 'cara' ? (
              <div id="panel-cara" role="tabpanel" aria-labelledby="tab-cara" className={s.panel}>
                <p className={s.teks}>{game.caraMainWeb}</p>
                {game.catatanWeb?.map((c) => (
                  <p key={c} className={s.catatanWeb}>
                    <span className={s.catatanLabel}>Penting</span>
                    {c}
                  </p>
                ))}
                <AnimasiKontrol jenis={game.jenisKontrol} />
              </div>
            ) : (
              <div id="panel-aturan" role="tabpanel" aria-labelledby="tab-aturan" className={s.panel}>
                <ol className={s.daftar}>
                  {game.aturanAsli.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ol>
              </div>
            )}
            {(game.asalDaerah || game.namaLain.length > 0) && (
              <div className={s.riset}>
                <span className={s.risetJudul}>Asal daerah &amp; nama lain</span>
                <span>{[game.asalDaerah, game.namaLain.join(', ')].filter(Boolean).join(' · ')}</span>
              </div>
            )}
          </section>

          <section className={s.panelMain} aria-labelledby="judul-siap">
            <h2 id="judul-siap" className={s.judulSiap}>
              Siap main?
            </h2>
            <section className={s.mode} aria-labelledby="judul-mode">
              <h2 id="judul-mode" className={s.subJudul}>
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
          </section>
        </div>
      </div>

      <div className={s.kaki}>
        <p className={s.ringkasan} aria-live="polite">
          <span className={s.ringkasanLabel}>Mode</span>
          {MODE[mode].label}
          {pakaiKesulitan && ` · ${KESULITAN.find((k) => k.id === kesulitan)!.label}`}
        </p>
        <Tombol className={s.main} disabled={!siap} onClick={main}>
          <IkonMain ukuran={26} />
          {siap ? 'Main' : 'Segera hadir'}
        </Tombol>
      </div>
    </Halaman>
  )
}
