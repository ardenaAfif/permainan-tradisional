import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { hitungStempel, useKotak } from '../app/store'
import logoSnt from '../assets/snt-mark-kecil.webp'
import { AvatarKarakter } from '../characters/Karakter'
import { GAMES, KATEGORI } from '../data/games'
import { isGameReady } from '../games'
import type { Kategori } from '../shared/types'
import { IkonPengaturan, IkonUlang } from '../shared/ui/Ikon'
import { Tombol, TombolIkon } from '../shared/ui/Tombol'
import { TombolSuara } from '../shared/ui/TombolSuara'
import { KartuGame } from './KartuGame'
import { kelasKategori } from './kategori'
import k from './kategori.module.css'
import s from './Menu.module.css'

type Filter = 'semua' | Kategori

export function Menu() {
  const avatar = useKotak((st) => st.avatar)
  const progres = useKotak((st) => st.progres)
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('semua')

  if (!avatar) return <Navigate to="/avatar" replace />

  const jumlahStempel = hitungStempel(progres)
  const jumlahBerwarna = GAMES.filter((g) => progres[g.id].sudahDimainkan).length
  const tampil = GAMES.filter((g) => filter === 'semua' || g.kategori === filter)

  return (
    <div className={s.menu}>
      <div className={s.pita} aria-hidden="true" />
      <header className={s.kepala}>
        <img className={s.logo} src={logoSnt} alt="SNT 2 Banyumas" width={45} height={36} />
        <h1 className={s.judul}>Kotak Dolanan</h1>
        <div className={s.stempel} role="status" aria-label={`Stempel terkumpul ${jumlahStempel} dari ${GAMES.length}`}>
          <svg width="40" height="40" viewBox="0 0 200 200" aria-hidden="true" className={s.stempelIkon}>
            <circle cx="100" cy="100" r="88" fill="none" stroke="var(--merah-bata)" strokeWidth="14" />
            <g fill="var(--merah-bata)">
              <ellipse cx="100" cy="68" rx="18" ry="28" />
              <ellipse cx="100" cy="132" rx="18" ry="28" />
              <ellipse cx="68" cy="100" rx="28" ry="18" />
              <ellipse cx="132" cy="100" rx="28" ry="18" />
            </g>
          </svg>
          <span>
            {jumlahStempel}/{GAMES.length}
          </span>
        </div>
        <Link className={s.avatar} to="/avatar" aria-label={`Ubah avatar ${avatar.nama}`}>
          <span className={s.avatarWajah}>
            <AvatarKarakter avatar={avatar} crop="head" />
          </span>
          <span className={s.avatarNama}>{avatar.nama}</span>
        </Link>
      </header>

      <section className={s.alat} aria-label="Progres dan pengaturan">
        <div className={s.progres}>
          <div className={s.progresTeks}>
            {jumlahBerwarna} dari {GAMES.length} benda sudah berwarna lagi
          </div>
          <div
            className={s.progresBar}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={GAMES.length}
            aria-valuenow={jumlahBerwarna}
            aria-label="Benda yang sudah berwarna lagi"
          >
            <div className={s.progresIsi} style={{ width: `${(jumlahBerwarna / GAMES.length) * 100}%` }} />
          </div>
        </div>
        <div className={s.aksi}>
          <Tombol varian="sekunder" className={s.tombolIntro} onClick={() => navigate('/intro')}>
            <IkonUlang />
            Putar intro lagi
          </Tombol>
          <TombolIkon aria-label="Pengaturan" onClick={() => navigate('/pengaturan')}>
            <IkonPengaturan />
          </TombolIkon>
          <TombolSuara />
        </div>
      </section>

      <nav className={s.filter} aria-label="Filter kategori">
        {(['semua', ...KATEGORI] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            className={`${s.chip} ${f === 'semua' ? k.semua : kelasKategori(f)} ${f === filter ? s.chipAktif : ''}`}
            aria-pressed={f === filter}
            onClick={() => setFilter(f)}
          >
            <span className={`${s.titik} ${f === 'Adu Strategi' ? s.titikBelah : ''}`} aria-hidden="true">
              {f === 'Adu Kekompakan' && <span className={s.titikKedua} />}
            </span>
            {f === 'semua' ? 'Semua' : f}
          </button>
        ))}
      </nav>

      <main className={s.grid}>
        {tampil.map((g) => (
          <KartuGame key={g.id} game={g} progres={progres[g.id]} siap={isGameReady(g.id)} />
        ))}
      </main>
    </div>
  )
}
