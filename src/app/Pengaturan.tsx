import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Halaman } from '../shared/ui/Halaman'
import { IkonKembali } from '../shared/ui/Ikon'
import { Modal } from '../shared/ui/Modal'
import { Tombol, TombolIkon } from '../shared/ui/Tombol'
import { TombolSuara } from '../shared/ui/TombolSuara'
import { useKotak, type Pengaturan as PengaturanT } from './store'
import s from './Pengaturan.module.css'

const PIN_VALID = /^\d{4}$/

export function Pengaturan() {
  const navigate = useNavigate()
  const pengaturan = useKotak((st) => st.pengaturan)
  const setPengaturan = useKotak((st) => st.setPengaturan)
  const resetProgres = useKotak((st) => st.resetProgres)
  const [tanyaReset, setTanyaReset] = useState(false)
  const [pesanReset, setPesanReset] = useState('')

  return (
    <Halaman
      kiri={
        <TombolIkon aria-label="Kembali ke menu" onClick={() => navigate('/menu')}>
          <IkonKembali />
        </TombolIkon>
      }
      judul="Pengaturan"
      kanan={<TombolSuara />}
    >
      <div className={s.tata}>
        <section className={s.panel} aria-labelledby="judul-suara">
          <h2 id="judul-suara" className={s.judulPanel}>
            Suara
          </h2>
          <Sakelar
            label="Semua suara"
            ket="Matikan untuk membuat seluruh game diam."
            nilai={pengaturan.suara}
            onUbah={(v) => setPengaturan({ suara: v })}
          />
          <Sakelar
            label="Musik"
            ket="Musik latar bernuansa gamelan."
            nilai={pengaturan.musik}
            nonaktif={!pengaturan.suara}
            onUbah={(v) => setPengaturan({ musik: v })}
          />
          <Sakelar
            label="Suara tokoh (VO)"
            ket="Pak Guru dan teman-teman membacakan dialog. Subtitle selalu tampil."
            nilai={pengaturan.vo}
            nonaktif={!pengaturan.suara}
            onUbah={(v) => setPengaturan({ vo: v })}
          />
        </section>

        <GantiPin pinSekarang={pengaturan.pinGuru} onSimpan={(pinGuru) => setPengaturan({ pinGuru })} />

        <section className={s.panel} aria-labelledby="judul-progres">
          <h2 id="judul-progres" className={s.judulPanel}>
            Progres
          </h2>
          <p className={s.teks}>
            Hapus semua stempel dan kembalikan kartu ke abu-abu. Avatar dan pengaturan tetap tersimpan.
          </p>
          <div>
            <Tombol varian="merah" onClick={() => setTanyaReset(true)}>
              Reset progres
            </Tombol>
          </div>
          {pesanReset && (
            <p className={s.berhasil} role="status">
              {pesanReset}
            </p>
          )}
        </section>
      </div>

      {tanyaReset && (
        <Modal
          judul="Reset progres?"
          onTutup={() => setTanyaReset(false)}
          aksi={
            <>
              <Tombol varian="sekunder" onClick={() => setTanyaReset(false)}>
                Batal
              </Tombol>
              <Tombol
                varian="merah"
                onClick={() => {
                  resetProgres()
                  setTanyaReset(false)
                  setPesanReset('Progres sudah direset. Semua kartu kembali abu-abu.')
                }}
              >
                Ya, reset
              </Tombol>
            </>
          }
        >
          <p className={s.teks}>Semua stempel, termasuk stempel emas dari guru, akan hilang dan tidak bisa dikembalikan.</p>
        </Modal>
      )}
    </Halaman>
  )
}

function Sakelar({
  label,
  ket,
  nilai,
  nonaktif,
  onUbah,
}: {
  label: string
  ket: string
  nilai: boolean
  nonaktif?: boolean
  onUbah: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={nilai}
      disabled={nonaktif}
      className={s.sakelar}
      onClick={() => onUbah(!nilai)}
    >
      <span className={s.sakelarTeks}>
        <span className={s.sakelarLabel}>{label}</span>
        <span className={s.sakelarKet}>{ket}</span>
      </span>
      <span className={`${s.rel} ${nilai && !nonaktif ? s.relNyala : ''}`} aria-hidden="true">
        <span className={s.kenop} />
      </span>
    </button>
  )
}

function GantiPin({ pinSekarang, onSimpan }: { pinSekarang: PengaturanT['pinGuru']; onSimpan: (pin: string) => void }) {
  const [lama, setLama] = useState('')
  const [baru, setBaru] = useState('')
  const [ulang, setUlang] = useState('')
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string } | null>(null)

  const kirim = (e: FormEvent) => {
    e.preventDefault()
    if (lama !== pinSekarang) return setPesan({ ok: false, teks: 'PIN lama salah.' })
    if (!PIN_VALID.test(baru)) return setPesan({ ok: false, teks: 'PIN baru harus 4 angka.' })
    if (baru !== ulang) return setPesan({ ok: false, teks: 'Ulangi PIN baru belum sama.' })
    onSimpan(baru)
    setLama('')
    setBaru('')
    setUlang('')
    setPesan({ ok: true, teks: 'PIN guru sudah diganti.' })
  }

  const kolom = (label: string, nilai: string, ubah: (v: string) => void) => (
    <label className={s.kolom}>
      <span className={s.kolomLabel}>{label}</span>
      <input
        className={s.masukanPin}
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        value={nilai}
        onChange={(e) => ubah(e.target.value.replace(/\D/g, ''))}
      />
    </label>
  )

  return (
    <section className={s.panel} aria-labelledby="judul-pin">
      <h2 id="judul-pin" className={s.judulPanel}>
        PIN guru
      </h2>
      <p className={s.teks}>
        PIN dipakai guru untuk memberi stempel emas Tantangan Lapangan. PIN bawaan: 1234. Ganti sebelum dipakai di kelas.
      </p>
      <form className={s.formPin} onSubmit={kirim}>
        {kolom('PIN lama', lama, setLama)}
        {kolom('PIN baru', baru, setBaru)}
        {kolom('Ulangi PIN baru', ulang, setUlang)}
        <Tombol type="submit" varian="nila" className={s.simpanPin}>
          Simpan PIN
        </Tombol>
      </form>
      {pesan && (
        <p className={pesan.ok ? s.berhasil : s.gagal} role="status">
          {pesan.teks}
        </p>
      )}
    </section>
  )
}
