import { useNavigate } from 'react-router'
import { useKotak } from '../app/store'
import { Stage } from '../app/stage/Stage'
import { Karakter } from '../characters/Karakter'
import { IkonLewati } from '../shared/ui/Ikon'
import { TombolSuara } from '../shared/ui/TombolSuara'
import s from './Intro.module.css'

/**
 * Intro 7 adegan dibuat di tahap 4 (GSAP + script.json). Sementara ini tampil
 * satu adegan kelir supaya alur judul → intro → avatar → menu sudah jalan.
 */
export function Intro() {
  const navigate = useNavigate()
  const punyaAvatar = useKotak((st) => st.avatar !== null)
  const tandaiIntroDilihat = useKotak((st) => st.tandaiIntroDilihat)

  const selesai = () => {
    tandaiIntroDilihat()
    navigate(punyaAvatar ? '/menu' : '/avatar', { replace: true })
  }

  return (
    <Stage
      ui={
        <>
          <div className={s.suara}>
            <TombolSuara gaya="tabir" />
          </div>
          <button type="button" className={s.lewati} onClick={selesai}>
            Lewati
            <IkonLewati />
          </button>
        </>
      }
    >
      <div className={s.adegan}>
        <div className={s.kelir}>
          <div className={s.blencongTudung} />
          <div className={s.blencong} />
          <div className={s.tanah} />
          <div className={`${s.siluet} ${s.gobak}`}>
            <Karakter who="avatar" hair="pendek" pose="gobak" silhouette />
          </div>
          <div className={`${s.siluet} ${s.engklek}`}>
            <Karakter who="avatar" hair="kuncir" pose="engklek" silhouette />
          </div>
          <div className={`${s.siluet} ${s.egrang}`}>
            <Karakter who="avatar" headwear="peci" pose="egrang" silhouette />
          </div>
          <div className={s.narasi}>
            <span className={s.nama}>Pak Guru · narasi</span>
            <p>“Dulu lapangan adalah taman bermain kami. Dari permainan ini kami belajar sportif, kompak, dan sabar.”</p>
          </div>
        </div>
      </div>
    </Stage>
  )
}
