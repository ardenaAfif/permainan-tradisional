import { Link } from 'react-router'
import type { ProgresGame } from '../app/store'
import { BENDA_LATAR } from '../shared/benda/benda'
import { BendaGambar } from '../shared/benda/BendaGambar'
import type { GameData } from '../shared/types'
import { Bintang } from '../shared/ui/Ikon'
import { kelasKategori } from './kategori'
import s from './KartuGame.module.css'

interface Props {
  game: GameData
  progres: ProgresGame
  siap: boolean
}

export function KartuGame({ game, progres, siap }: Props) {
  const berwarna = progres.sudahDimainkan
  return (
    <article
      className={`${s.kartu} ${berwarna ? s.berwarna : s.abu}`}
      aria-label={`${game.nama}, ${game.kategori}${berwarna ? ', sudah dimainkan' : ', belum dimainkan'}`}
    >
      {game.isBonus && (
        <div className={s.pita} aria-label="Game bonus">
          <Bintang ukuran={16} nyala />
          <span>BONUS</span>
        </div>
      )}
      <div className={s.dalam}>
        <div className={s.gambar} style={{ ['--latar-benda' as string]: BENDA_LATAR[game.benda] }}>
          <BendaGambar jenis={game.benda} className={s.benda} />
          {!siap ? (
            <span className={s.lencana}>Segera hadir</span>
          ) : (
            !berwarna && <span className={s.lencana}>Belum dimainkan</span>
          )}
          {progres.stempel && <StempelKecil emas={progres.stempelEmas} />}
        </div>
        <div className={s.info}>
          <span className={`${s.chip} ${kelasKategori(game.kategori)}`}>{game.kategori}</span>
          <h2 className={s.nama}>{game.nama}</h2>
          <div className={s.meta}>
            <span>{game.jumlahPemainAsli}</span>
            <span className={s.bintang} role="img" aria-label={`Kesulitan ${game.bintang} dari 3 bintang`}>
              {[1, 2, 3].map((i) => (
                <Bintang key={i} nyala={i <= game.bintang} abu={!berwarna} />
              ))}
            </span>
          </div>
          <Link className={s.main} to={`/kenalan/${game.id}`}>
            {berwarna ? 'Main lagi' : 'Main'}
          </Link>
        </div>
      </div>
    </article>
  )
}

function StempelKecil({ emas }: { emas: boolean }) {
  return (
    <svg className={s.stempel} viewBox="0 0 200 200" aria-label={emas ? 'Stempel emas' : 'Stempel'} role="img">
      <circle cx="100" cy="100" r="90" fill={emas ? 'var(--cahaya-kelir)' : 'var(--kertas-terang)'} fillOpacity=".8" stroke="var(--merah-bata)" strokeWidth="10" />
      <circle cx="100" cy="100" r="70" fill="none" stroke="var(--merah-bata)" strokeWidth="4" />
      <g fill="var(--merah-bata)">
        <ellipse cx="100" cy="74" rx="14" ry="22" />
        <ellipse cx="100" cy="126" rx="14" ry="22" />
        <ellipse cx="74" cy="100" rx="22" ry="14" />
        <ellipse cx="126" cy="100" rx="22" ry="14" />
      </g>
    </svg>
  )
}
