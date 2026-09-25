import { useNavigate } from 'react-router'
import { useKotak } from '../app/store'
import { audio } from '../shared/audio/AudioManager'
import logoSnt from '../assets/snt-mark.png'
import { BendaGambar } from '../shared/benda/BendaGambar'
import { IkonMain } from '../shared/ui/Ikon'
import { TombolSuara } from '../shared/ui/TombolSuara'
import s from './Judul.module.css'

/** Layar judul (adegan 0). Tombol Mulai sekaligus menyalakan suara (tahap audio). */
export function Judul() {
  const navigate = useNavigate()
  const introDilihat = useKotak((st) => st.introSudahDilihat)
  const punyaAvatar = useKotak((st) => st.avatar !== null)

  const mulai = () => {
    audio.buka()
    // Intro otomatis hanya pada kunjungan pertama (bisa diputar ulang dari menu).
    navigate(!introDilihat ? '/intro' : punyaAvatar ? '/menu' : '/avatar')
  }

  return (
    <div className={s.judulLayar}>
      <div className={s.cahaya} aria-hidden="true" />
      <div className={s.atas}>
        <div className={s.sekolah}>
          <img src={logoSnt} alt="" />
          <span>SNT 2 Banyumas</span>
        </div>
        <TombolSuara gaya="kertas" />
      </div>
      <div className={s.tengah}>
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
        <p className={s.petunjuk}>Tap Mulai untuk menyalakan suara</p>
      </div>
      <p className={s.kaki}>Kokurikuler SMP · SNT 2 Banyumas</p>
    </div>
  )
}
