import { Link, useNavigate } from 'react-router'
import { pasangAplikasi, sudahTerpasang, useBisaPasang } from '../app/pwa'
import { useKotak } from '../app/store'
import { audio } from '../shared/audio/AudioManager'
import { useAudioTerbuka } from '../shared/audio/useAudioTerbuka'
import logoSnt from '../assets/snt-mark-kecil.webp'
import { BendaGambar } from '../shared/benda/BendaGambar'
import { IkonMain, IkonPasang, IkonSuara } from '../shared/ui/Ikon'
import { TombolSuara } from '../shared/ui/TombolSuara'
import s from './Judul.module.css'

/** Layar judul (adegan 0). Tombol Mulai sekaligus menyalakan suara (tahap audio). */
export function Judul() {
  const navigate = useNavigate()
  const introDilihat = useKotak((st) => st.introSudahDilihat)
  const punyaAvatar = useKotak((st) => st.avatar !== null)
  const bisaPasang = useBisaPasang() && !sudahTerpasang()
  const suaraTerbuka = useAudioTerbuka()
  const suaraAktif = useKotak((st) => st.pengaturan.suara)

  const mulai = () => {
    audio.buka()
    // Intro otomatis hanya pada kunjungan pertama (bisa diputar ulang dari menu).
    navigate(!introDilihat ? '/intro' : punyaAvatar ? '/menu' : '/avatar')
  }

  return (
    <div className={s.judulLayar}>
      <div className={s.cahaya} aria-hidden="true" />
      <header className={s.atas}>
        <div className={s.sekolah}>
          <img src={logoSnt} alt="" width={45} height={36} />
          <span>SNT 2 Banyumas</span>
        </div>
        <TombolSuara gaya="kertas" />
      </header>
      <main className={s.tengah}>
        <div className={s.judulBlok}>
          <h1 className={s.judul}>
            Kotak
            <br />
            Dolanan
          </h1>
          <p className={s.sub}>9 permainan tradisional</p>
        </div>
        <div className={s.kotak} aria-hidden="true">
          <div className={s.bayang} />
          <BendaGambar jenis="kotak" className={s.kotakGambar} />
          <BendaGambar jenis="dadu" className={`${s.melayang} ${s.dadu}`} />
          <BendaGambar jenis="kelereng" className={`${s.melayang} ${s.kelereng}`} />
          <BendaGambar jenis="balon" className={`${s.melayang} ${s.balon}`} />
        </div>
        <button type="button" className={s.mulai} onClick={mulai}>
          <IkonMain ukuran={30} />
          Mulai
        </button>
        {/* Browser baru mengizinkan suara setelah layar disentuh; tempatnya tetap dipakai supaya tata letak tidak melompat. */}
        <p className={`${s.petunjuk} ${suaraTerbuka || !suaraAktif ? s.petunjukSelesai : ''}`} aria-hidden={suaraTerbuka || !suaraAktif}>
          <span className={s.petunjukIkon}>
            <IkonSuara ukuran={22} aktif />
          </span>
          Ketuk di mana saja untuk menyalakan suara
        </p>
      </main>
      <footer className={s.kaki}>
        <p className={s.kakiTeks}>Kokurikuler SMP · SNT 2 Banyumas</p>
        <div className={s.kakiAksi}>
          {bisaPasang && (
            <button type="button" className={s.kakiTombol} onClick={() => void pasangAplikasi()}>
              <IkonPasang ukuran={20} />
              Pasang di HP
            </button>
          )}
          <Link className={s.kakiTombol} to="/kredit">
            Kredit
          </Link>
        </div>
      </footer>
    </div>
  )
}
