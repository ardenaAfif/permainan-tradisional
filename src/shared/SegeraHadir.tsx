import { Navigate, useNavigate, useParams } from 'react-router'
import { Stage } from '../app/stage/Stage'
import { Karakter } from '../characters/Karakter'
import { getGame } from '../data/games'
import { BendaGambar } from './benda/BendaGambar'
import { IkonRumah } from './ui/Ikon'
import { Tombol, TombolIkon } from './ui/Tombol'
import { TombolSuara } from './ui/TombolSuara'
import s from './SegeraHadir.module.css'

/**
 * Pengganti sementara layar main/hasil untuk game yang belum dibuat.
 * GameShell dan ResultScreen menggantikannya di tahap 3.
 */
export function SegeraHadir({ layar }: { layar: 'main' | 'hasil' }) {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const game = getGame(gameId)
  if (!game) return <Navigate to="/menu" replace />

  return (
    <Stage
      wajibMendatar={layar === 'main' && game.orientasi === 'landscape'}
      ui={
        <div className={s.atas}>
          <TombolIkon aria-label="Ke menu" onClick={() => navigate('/menu')}>
            <IkonRumah />
          </TombolIkon>
          <TombolSuara />
        </div>
      }
    >
      <div className={s.adegan}>
        <div className={s.benda}>
          <BendaGambar jenis={game.benda} />
        </div>
        <div className={s.guru}>
          <Karakter who="guru" pose="talk" motion />
        </div>
        <div className={s.balon}>
          <span className={s.nama}>Pak Guru</span>
          <p className={s.judul}>{game.nama}: segera hadir!</p>
          <p className={s.teks}>
            {layar === 'main'
              ? 'Permainan ini masih disiapkan. Sambil menunggu, coba mainkan versi aslinya bersama teman di lapangan sekolah.'
              : 'Layar hasil untuk permainan ini masih disiapkan.'}
          </p>
          <Tombol onClick={() => navigate('/menu')}>Kembali ke menu</Tombol>
        </div>
      </div>
    </Stage>
  )
}
