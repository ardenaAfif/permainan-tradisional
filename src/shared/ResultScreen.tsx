import gsap from 'gsap'
import { useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { hitungStempel, useKotak } from '../app/store'
import { AvatarKarakter, Karakter } from '../characters/Karakter'
import { GAMES, getGame } from '../data/games'
import { audio } from './audio/AudioManager'
import type { StateHasil } from './GameShell'
import { pilihKomentar, type JenisHasil } from './komentar'
import { pemainUtamaMenang } from './sesi'
import { Stempel } from './Stempel'
import type { GameData, GameMode, Player } from './types'
import { IkonGembok } from './ui/Ikon'
import { Modal } from './ui/Modal'
import { Tombol } from './ui/Tombol'
import { TombolSuara } from './ui/TombolSuara'
import { useReducedMotion } from './useReducedMotion'
import s from './ResultScreen.module.css'

const NAMA_MODE: Record<GameMode, string> = {
  cpu: 'Lawan Komputer',
  hotseat: 'Main Bergantian',
  split: 'Duel Satu Layar',
}

/** Rute /hasil/:gameId — design/Hasil.dc.html. */
export function ResultScreen() {
  const { gameId } = useParams()
  const lokasi = useLocation()
  const game = getGame(gameId)
  const state = lokasi.state as StateHasil | null
  if (!game || !state?.hasil) return <Navigate to="/menu" replace />
  return <Hasil key={lokasi.key} game={game} {...state} />
}

function TokohPemain({ p, menang }: { p: Player; menang: boolean }) {
  const props = { ekspresi: menang ? ('happy' as const) : ('normal' as const), aksi: menang ? ('jump' as const) : ('wave' as const) }
  return p.avatar === 'cpu' ? <Karakter who={p.tokoh ?? 'bima'} {...props} /> : <AvatarKarakter avatar={p.avatar} {...props} />
}

function Hasil({ game, sesi, hasil, stempelBaru }: StateHasil & { game: GameData }) {
  const navigate = useNavigate()
  const progres = useKotak((st) => st.progres)
  const pinGuru = useKotak((st) => st.pengaturan.pinGuru)
  const beriStempelEmas = useKotak((st) => st.beriStempelEmas)
  const kurangiGerak = useReducedMotion()
  const stempelRef = useRef<SVGSVGElement>(null)
  const emasRef = useRef<SVGSVGElement>(null)

  const daftarMenang = hasil.pemenang ? (Array.isArray(hasil.pemenang) ? hasil.pemenang : [hasil.pemenang]) : []
  const namaPemenang = daftarMenang.map((p) => p.nama).join(' & ')
  const jenis: JenisHasil = !hasil.pemenang ? 'seri' : pemainUtamaMenang(hasil.pemenang) || sesi.mode !== 'cpu' ? 'menang' : 'kalah'
  const [komentar] = useState(() => pilihKomentar(jenis, namaPemenang))
  const tokohUtama = daftarMenang[0] ?? sesi.players[0]!

  const urutan = [...sesi.players].sort((a, b) => {
    const menangA = daftarMenang.some((p) => p.id === a.id) ? 1 : 0
    const menangB = daftarMenang.some((p) => p.id === b.id) ? 1 : 0
    return menangB - menangA || (hasil.skor?.[b.id] ?? 0) - (hasil.skor?.[a.id] ?? 0)
  })

  const progresGame = progres[game.id as keyof typeof progres]
  const [emasBaru, setEmasBaru] = useState(false)
  const sudahEmas = !!progresGame?.stempelEmas || emasBaru
  const jumlahStempel = hitungStempel(progres)
  const [tanyaPin, setTanyaPin] = useState(false)

  // Stempel "dicapkan": jatuh dari besar, memantul, lalu kertas sedikit bergetar.
  useLayoutEffect(() => {
    const el = stempelRef.current
    if (!el || kurangiGerak) return
    // gsap.context + revert: aman untuk efek ganda StrictMode (from() tidak "terkunci" di opacity 0).
    const ctx = gsap.context(() => {
      gsap
        .timeline({ delay: 0.5, onStart: () => audio.sfx('stempel') })
        .from(el, { scale: 2.6, rotation: -40, opacity: 0, duration: 0.45, ease: 'power3.in', transformOrigin: '50% 50%' })
        .to(el.parentElement, { x: 3, duration: 0.05, yoyo: true, repeat: 3, ease: 'none' })
    })
    return () => ctx.revert()
  }, [kurangiGerak])

  useLayoutEffect(() => {
    const el = emasRef.current
    if (!el || !emasBaru || kurangiGerak) return
    const ctx = gsap.context(() => {
      gsap.from(el, { scale: 2.4, rotation: 30, opacity: 0, duration: 0.5, ease: 'back.out(1.4)', transformOrigin: '50% 50%' })
    })
    return () => ctx.revert()
  }, [emasBaru, kurangiGerak])

  const judul = !hasil.pemenang ? 'Seri!' : `${namaPemenang} menang!`

  return (
    <div className={s.hasil}>
      <div className={s.pita} aria-hidden="true" />
      <main className={s.isi}>
        <section className={s.pahlawan} aria-labelledby="judul-hasil">
          <div className={s.kepalaPahlawan}>
            <div className={s.subjudul}>
              {game.nama} · {NAMA_MODE[sesi.mode]}
            </div>
            <h1 id="judul-hasil" className={s.judul}>
              {judul}
            </h1>
          </div>
          <div className={s.panggung}>
            <div className={s.lantai} aria-hidden="true" />
            <div className={s.tokoh}>
              <TokohPemain p={tokohUtama} menang={!!hasil.pemenang} />
            </div>
          </div>
          <ol className={s.peringkat}>
            {urutan.map((p, i) => {
              const menang = daftarMenang.some((w) => w.id === p.id)
              const skor = hasil.keteranganSkor?.[p.id] ?? (hasil.skor?.[p.id] !== undefined ? `${hasil.skor[p.id]} poin` : undefined)
              return (
                <li key={p.id} className={`${s.baris} ${menang ? s.barisMenang : ''}`}>
                  <span className={s.nomor}>{hasil.pemenang ? i + 1 : '='}</span>
                  <span className={s.namaPemain}>
                    {p.nama}
                    {p.avatar === 'cpu' && ' (komputer)'}
                  </span>
                  {skor !== undefined && <span className={s.catatan}>{skor}</span>}
                </li>
              )
            })}
          </ol>
        </section>

        <div className={s.kolomKanan}>
          <section className={s.kartuStempel} aria-live="polite">
            <div className={s.wadahStempel}>
              <Stempel ref={stempelRef} namaGame={game.nama} className={s.stempel} />
            </div>
            <div className={s.teksStempel}>
              <h2 className={s.judulKartu}>{stempelBaru ? 'Stempel baru!' : 'Stempel sudah terkumpul'}</h2>
              <p className={s.teks}>
                {stempelBaru ? `Kartu ${game.nama} di kotak sudah berwarna lagi. ` : ''}
                Stempelmu sekarang {jumlahStempel} dari {GAMES.length}.
              </p>
            </div>
          </section>

          <div className={s.komentar}>
            <div className={s.wajahKomentator}>
              <Karakter who={komentar.tokoh} crop="head" ekspresi={jenis === 'kalah' ? 'normal' : 'happy'} bicara />
            </div>
            <div className={s.balon}>
              <span className={`${s.namaTokoh} ${s[komentar.tokoh]}`}>{komentar.tokoh[0]!.toUpperCase() + komentar.tokoh.slice(1)}</span>
              <p>{komentar.teks}</p>
            </div>
          </div>

          <section className={s.tantangan} aria-labelledby="judul-tantangan">
            <div className={s.kepalaTantangan}>
              <div className={s.slotEmas}>
                {sudahEmas ? (
                  <Stempel ref={emasRef} namaGame={game.nama} emas className={s.stempelEmas} />
                ) : (
                  <svg width="50%" height="50%" viewBox="0 0 24 24" aria-hidden="true">
                    <polygon
                      points="12,2 14.9,8.6 22,9.3 16.6,14 18.2,21 12,17.3 5.8,21 7.4,14 2,9.3 9.1,8.6"
                      fill="none"
                      stroke="var(--cahaya-kelir)"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <div>
                <div className={s.labelTantangan}>Tantangan Lapangan</div>
                <h2 id="judul-tantangan" className={s.judulTantangan}>
                  {sudahEmas ? 'Sudah dimainkan di lapangan!' : 'Main versi aslinya'}
                </h2>
              </div>
            </div>
            <p className={s.teksTantangan}>
              {game.tantanganLapangan} Setelah selesai, minta guru mencentang tantangan ini.
            </p>
            {!sudahEmas && (
              <button type="button" className={s.tombolPin} onClick={() => setTanyaPin(true)}>
                <IkonGembok />
                Guru: tandai sudah dimainkan di lapangan
              </button>
            )}
          </section>
        </div>
      </main>

      <div className={s.kaki}>
        <TombolSuara />
        <span className={s.pengisi} />
        <Tombol varian="sekunder" onClick={() => navigate(`/main/${game.id}`, { state: { sesi } })}>
          Main lagi
        </Tombol>
        <Tombol onClick={() => navigate('/menu')}>Kembali ke menu</Tombol>
      </div>

      {tanyaPin && (
        <PinGuru
          namaGame={game.nama}
          pinBenar={pinGuru}
          onBatal={() => setTanyaPin(false)}
          onBerhasil={() => {
            beriStempelEmas(game.id)
            audio.sfx('stempel-emas')
            setTanyaPin(false)
            setEmasBaru(true)
          }}
        />
      )}
    </div>
  )
}

function PinGuru({
  namaGame,
  pinBenar,
  onBatal,
  onBerhasil,
}: {
  namaGame: string
  pinBenar: string
  onBatal: () => void
  onBerhasil: () => void
}) {
  const [pin, setPin] = useState('')
  const [salah, setSalah] = useState(false)
  const masukan = useRef<HTMLInputElement>(null)
  const kirim = (e?: FormEvent) => {
    e?.preventDefault()
    if (pin === pinBenar) return onBerhasil()
    setSalah(true)
    setPin('')
    masukan.current?.focus()
  }
  return (
    <Modal
      judul="PIN Guru"
      onTutup={onBatal}
      aksi={
        <>
          <Tombol varian="sekunder" onClick={onBatal}>
            Batal
          </Tombol>
          <Tombol disabled={pin.length !== 4} onClick={() => kirim()}>
            Beri stempel emas
          </Tombol>
        </>
      }
    >
      <p className={s.teks}>
        Sudah memainkan {namaGame} versi aslinya di lapangan? Guru memasukkan PIN untuk memberi stempel emas.
      </p>
      <form onSubmit={kirim} className={s.formPin}>
        <label className="sr-only" htmlFor="pin-guru">
          PIN guru 4 angka
        </label>
        <input
          ref={masukan}
          id="pin-guru"
          className={`${s.masukanPin} ${salah ? s.goyang : ''}`}
          type="password"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          maxLength={4}
          value={pin}
          aria-invalid={salah}
          aria-describedby={salah ? 'pin-salah' : undefined}
          onChange={(e) => {
            setSalah(false)
            setPin(e.target.value.replace(/\D/g, ''))
          }}
        />
        <div className={s.titikPin} aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`${s.kotakPin} ${i < pin.length ? s.kotakIsi : ''} ${i === pin.length ? s.kotakAktif : ''}`}>
              {i < pin.length ? '•' : ''}
            </span>
          ))}
        </div>
      </form>
      {salah && (
        <p id="pin-salah" className={s.pinSalah} role="alert">
          PIN salah. Coba lagi.
        </p>
      )}
    </Modal>
  )
}
