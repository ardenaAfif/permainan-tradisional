import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useKotak } from '../app/store'
import { AvatarKarakter, Karakter } from '../characters/Karakter'
import type { AvatarConfig, GayaRambut, PenutupKepala, WarnaKulit } from '../shared/types'
import { Halaman } from '../shared/ui/Halaman'
import { IkonKembali } from '../shared/ui/Ikon'
import { Tombol, TombolIkon } from '../shared/ui/Tombol'
import { TombolSuara } from '../shared/ui/TombolSuara'
import s from './BuatAvatar.module.css'

const KULIT: WarnaKulit[] = [0, 1, 2, 3, 4]
const RAMBUT: [GayaRambut, string][] = [
  ['pendek', 'Pendek'],
  ['jabrik', 'Jabrik'],
  ['belah', 'Belah samping'],
  ['keriting', 'Keriting'],
  ['kuncir', 'Kuncir'],
]
const PENUTUP: [PenutupKepala, string][] = [
  ['none', 'Tanpa'],
  ['kerudung', 'Kerudung'],
  ['peci', 'Peci'],
]

const AWAL: AvatarConfig = { nama: '', kulit: 2, rambut: 'keriting', penutupKepala: 'none' }
const acak = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)]!

export function BuatAvatar() {
  const navigate = useNavigate()
  const tersimpan = useKotak((st) => st.avatar)
  const setAvatar = useKotak((st) => st.setAvatar)
  const [a, setA] = useState<AvatarConfig>(tersimpan ?? AWAL)
  const [senang, setSenang] = useState(false)
  const timer = useRef<number>(undefined)
  const kerudung = a.penutupKepala === 'kerudung'

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const ubah = (p: Partial<AvatarConfig>) => {
    setA((lama) => ({ ...lama, ...p }))
    setSenang(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setSenang(false), 1200)
  }

  const simpan = () => {
    setAvatar({ ...a, nama: a.nama.trim() || 'Pemain' })
    navigate('/menu', { replace: !tersimpan })
  }

  const warnaKulit = ['--kulit-0', '--kulit-1', '--kulit-2', '--kulit-3', '--kulit-4']

  return (
    <Halaman
      className={s.halaman}
      kiri={
        <TombolIkon aria-label="Kembali" onClick={() => navigate(tersimpan ? '/menu' : '/')}>
          <IkonKembali />
        </TombolIkon>
      }
      judul="Buat avatarmu"
      label="Siswa baru SNT 2 Banyumas"
      kanan={<TombolSuara />}
    >
      <div className={s.tata}>
        <div className={s.pratinjauBingkai}>
          <div className={s.pratinjau}>
            <div className={s.lantai} aria-hidden="true" />
            <div className={s.tokoh}>
              <AvatarKarakter avatar={a} pose={senang ? 'happy' : 'idle'} motion label={`Avatar ${a.nama || 'Pemain'}`} />
            </div>
            <div className={s.papanNama}>{a.nama.trim() || 'Pemain'}</div>
          </div>
        </div>

        <div className={s.pilihan}>
          <div className={s.gulir}>
            <label className={s.bagian}>
              <span className={s.labelBagian}>Nama panggilan</span>
              <input
                className={s.masukan}
                value={a.nama}
                maxLength={12}
                placeholder="Tulis namamu"
                autoComplete="off"
                onChange={(e) => setA({ ...a, nama: e.target.value })}
              />
            </label>

            <fieldset className={s.bagian}>
              <legend className={s.labelBagian}>Warna kulit</legend>
              <div className={s.barisKulit}>
                {KULIT.map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={`${s.kulit} ${a.kulit === k ? s.terpilih : ''}`}
                    style={{ background: `var(${warnaKulit[k]})` }}
                    aria-label={`Warna kulit ${k + 1}`}
                    aria-pressed={a.kulit === k}
                    onClick={() => ubah({ kulit: k })}
                  />
                ))}
              </div>
            </fieldset>

            <fieldset className={s.bagian}>
              <legend className={s.labelBagian}>Penutup kepala</legend>
              <div className={s.barisPenutup}>
                {PENUTUP.map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    className={`${s.pilihTeks} ${a.penutupKepala === k ? s.pilihTeksAktif : ''}`}
                    aria-pressed={a.penutupKepala === k}
                    onClick={() => ubah({ penutupKepala: k })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className={s.bagian} disabled={kerudung}>
              <legend className={s.labelBagianBaris}>
                <span className={s.labelBagian}>Gaya rambut</span>
                {kerudung && <span className={s.catatan}>Tertutup kerudung</span>}
              </legend>
              <div className={s.barisRambut}>
                {RAMBUT.map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    className={`${s.rambut} ${!kerudung && a.rambut === k ? s.terpilih : ''}`}
                    aria-label={label}
                    aria-pressed={!kerudung && a.rambut === k}
                    onClick={() => ubah({ rambut: k })}
                  >
                    <Karakter who="avatar" crop="head" hair={k} skin={a.kulit} />
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <div className={s.aksi}>
            <Tombol
              varian="sekunder"
              onClick={() =>
                ubah({
                  kulit: acak(KULIT),
                  rambut: acak(RAMBUT)[0],
                  penutupKepala: acak(['none', 'none', 'kerudung', 'peci'] as const),
                })
              }
            >
              Acak
            </Tombol>
            <Tombol penuh onClick={simpan}>
              Simpan &amp; lanjut
            </Tombol>
          </div>
        </div>
      </div>
    </Halaman>
  )
}
