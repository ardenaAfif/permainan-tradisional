import { useNavigate } from 'react-router'
import { GAMES } from '../data/games'
import kredit from '../data/kredit.json'
import logoSnt from '../assets/snt-mark-kecil.webp'
import { Halaman } from '../shared/ui/Halaman'
import { IkonKembali } from '../shared/ui/Ikon'
import { TombolIkon } from '../shared/ui/Tombol'
import { TombolSuara } from '../shared/ui/TombolSuara'
import s from './Kredit.module.css'

/** Bentuk src/data/kredit.json (lihat README, bagian "Mengisi kredit"). */
interface Orang {
  nama: string
  /** Mis. "Guru pendamping", "Kelas 8A", "Pengisi suara Bima". */
  peran?: string
}
interface SumberSuara {
  judul: string
  pembuat: string
  sumber: string
  lisensi: string
  tautan?: string
}
interface Pustaka {
  nama: string
  pembuat: string
  lisensi: string
  tautan?: string
}
interface DataKredit {
  guru: Orang[]
  siswa: Orang[]
  musikDanSuara: SumberSuara[]
  pustaka: Pustaka[]
}

const DATA = kredit as DataKredit

/** Halaman Kredit: tim sekolah, sumber suara + lisensi, pustaka, dan sumber riset asal daerah. */
export function Kredit() {
  const navigate = useNavigate()
  // Kembali ke layar sebelumnya (judul atau pengaturan); dari tautan langsung ke layar judul.
  const kembali = () => ((window.history.state as { idx?: number } | null)?.idx ? navigate(-1) : navigate('/'))

  return (
    <Halaman
      kiri={
        <TombolIkon aria-label="Kembali" onClick={kembali}>
          <IkonKembali />
        </TombolIkon>
      }
      label="Kotak Dolanan"
      judul="Kredit"
      kanan={<TombolSuara />}
    >
      <div className={s.tata}>
        <section className={`${s.panel} ${s.sekolah}`} aria-labelledby="kredit-sekolah">
          <img src={logoSnt} alt="" width={70} height={56} className={s.logo} />
          <div>
            <h2 id="kredit-sekolah" className={s.judulPanel}>
              SNT 2 Banyumas
            </h2>
            <p className={s.teks}>
              Kotak Dolanan dibuat untuk kegiatan kokurikuler SMP di SNT 2 Banyumas (Sekolah Nasional Terintegrasi).
            </p>
          </div>
        </section>

        <section className={s.panel} aria-labelledby="kredit-tim">
          <h2 id="kredit-tim" className={s.judulPanel}>
            Tim
          </h2>
          <DaftarOrang judul="Guru" orang={DATA.guru} kosong="Nama guru pendamping akan diisi." />
          <DaftarOrang judul="Siswa" orang={DATA.siswa} kosong="Nama siswa yang ikut meriset, menguji, dan mengisi suara akan diisi." />
        </section>

        <section className={s.panel} aria-labelledby="kredit-suara">
          <h2 id="kredit-suara" className={s.judulPanel}>
            Musik &amp; efek suara
          </h2>
          {DATA.musikDanSuara.length === 0 ? (
            <p className={s.kosong}>Belum ada musik atau efek suara dari luar.</p>
          ) : (
            <ul className={s.daftar}>
              {DATA.musikDanSuara.map((a) => (
                <li key={a.judul} className={s.butir}>
                  <span className={s.nama}>{a.judul}</span>
                  <span className={s.ket}>
                    {a.pembuat} · {a.sumber}
                  </span>
                  <span className={s.lisensi}>
                    Lisensi: <Tautan href={a.tautan}>{a.lisensi}</Tautan>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={s.panel} aria-labelledby="kredit-riset">
          <h2 id="kredit-riset" className={s.judulPanel}>
            Riset asal daerah
          </h2>
          <p className={s.teks}>Asal daerah dan nama lain setiap permainan diisi dari riset siswa, lengkap dengan sumbernya.</p>
          <ul className={s.daftar}>
            {GAMES.map((g) => {
              const ada = g.asalDaerah || g.namaLain.length > 0
              return (
                <li key={g.id} className={s.butir}>
                  <span className={s.nama}>{g.nama}</span>
                  {ada ? (
                    <span className={s.ket}>
                      {[g.asalDaerah, g.namaLain.length > 0 && `Nama lain: ${g.namaLain.join(', ')}`].filter(Boolean).join(' · ')}
                    </span>
                  ) : (
                    <span className={s.kosong}>Menunggu hasil riset siswa.</span>
                  )}
                  {g.sumberAsal.length > 0 && (
                    <span className={s.lisensi}>Sumber: {g.sumberAsal.join('; ')}</span>
                  )}
                </li>
              )
            })}
          </ul>
        </section>

        <section className={s.panel} aria-labelledby="kredit-pustaka">
          <h2 id="kredit-pustaka" className={s.judulPanel}>
            Huruf &amp; pustaka kode
          </h2>
          <ul className={s.daftar}>
            {DATA.pustaka.map((p) => (
              <li key={p.nama} className={s.butir}>
                <span className={s.nama}>
                  <Tautan href={p.tautan}>{p.nama}</Tautan>
                </span>
                <span className={s.ket}>{p.pembuat}</span>
                <span className={s.lisensi}>Lisensi: {p.lisensi}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Halaman>
  )
}

function DaftarOrang({ judul, orang, kosong }: { judul: string; orang: Orang[]; kosong: string }) {
  return (
    <div className={s.kelompok}>
      <h3 className={s.subjudul}>{judul}</h3>
      {orang.length === 0 ? (
        <p className={s.kosong}>{kosong}</p>
      ) : (
        <ul className={s.daftarNama}>
          {orang.map((o) => (
            <li key={`${o.nama}-${o.peran ?? ''}`}>
              <span className={s.nama}>{o.nama}</span>
              {o.peran && <span className={s.ket}> · {o.peran}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Tautan({ href, children }: { href?: string; children: string }) {
  if (!href) return <>{children}</>
  return (
    <a className={s.tautan} href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  )
}
