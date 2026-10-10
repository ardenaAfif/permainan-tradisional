import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Halaman } from '../shared/ui/Halaman'
import { IkonKembali, IkonPasang } from '../shared/ui/Ikon'
import { Modal } from '../shared/ui/Modal'
import { Tombol, TombolIkon } from '../shared/ui/Tombol'
import { TombolSuara } from '../shared/ui/TombolSuara'
import { alasanBelumBisa, simpanSemuaUntukOffline } from './offline'
import { pasangAplikasi, perangkatIos, sudahTerpasang, useBisaPasang } from './pwa'
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
            ket="Pak Ahsan, Bu Pavi, dan teman-teman membacakan dialog. Subtitle selalu tampil."
            nilai={pengaturan.vo}
            nonaktif={!pengaturan.suara}
            onUbah={(v) => setPengaturan({ vo: v })}
          />
        </section>

        <PasangDanOffline />

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

        <section className={s.panel} aria-labelledby="judul-tentang">
          <h2 id="judul-tentang" className={s.judulPanel}>
            Tentang
          </h2>
          <p className={s.teks}>Tim guru dan siswa, sumber suara, dan sumber riset asal daerah setiap permainan.</p>
          <div>
            <Tombol varian="sekunder" onClick={() => navigate('/kredit')}>
              Lihat kredit
            </Tombol>
          </div>
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

function PasangDanOffline() {
  const bisaPasang = useBisaPasang()
  const terpasang = sudahTerpasang()
  const [progres, setProgres] = useState<{ selesai: number; total: number } | null>(null)
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string } | null>(null)
  const sedangMenyimpan = progres !== null && progres.selesai < progres.total

  const simpan = async () => {
    const alasan = alasanBelumBisa()
    if (alasan) return setPesan({ ok: false, teks: alasan })
    setPesan(null)
    try {
      const { gagal } = await simpanSemuaUntukOffline((selesai, total) => setProgres({ selesai, total }))
      setPesan(
        gagal === 0
          ? { ok: true, teks: 'Semua game sudah tersimpan. Sekarang bisa dimainkan tanpa internet.' }
          : { ok: false, teks: `${gagal} berkas gagal diunduh. Cek sambungan, lalu tekan lagi.` },
      )
    } catch {
      setPesan({ ok: false, teks: 'Daftar game belum bisa diunduh. Cek sambungan, lalu coba lagi.' })
    }
    setProgres(null)
  }

  return (
    <section className={s.panel} aria-labelledby="judul-offline">
      <h2 id="judul-offline" className={s.judulPanel}>
        Pasang &amp; offline
      </h2>
      {terpasang ? (
        <p className={s.teks}>Kotak Dolanan sudah terpasang di perangkat ini.</p>
      ) : bisaPasang ? (
        <>
          <p className={s.teks}>Pasang Kotak Dolanan di layar utama supaya bisa dibuka seperti aplikasi, juga saat WiFi putus.</p>
          <div>
            <Tombol varian="nila" onClick={() => void pasangAplikasi()}>
              <IkonPasang />
              Pasang di HP
            </Tombol>
          </div>
        </>
      ) : (
        <p className={s.teks}>
          {perangkatIos()
            ? 'Untuk memasang di iPhone atau iPad: buka di Safari, tap tombol Bagikan, lalu pilih "Tambah ke Layar Utama".'
            : 'Untuk memasang: buka di Chrome atau Edge, lalu pilih menu ⋮ → "Tambahkan ke layar utama" atau "Instal aplikasi".'}
        </p>
      )}
      <p className={s.teks}>
        Game tersimpan otomatis di perangkat setelah dibuka sekali. Guru bisa menyimpan semuanya sekaligus sebelum kelas
        dimulai (±1,5 MB).
      </p>
      <div>
        <Tombol varian="sekunder" disabled={sedangMenyimpan} onClick={() => void simpan()}>
          {sedangMenyimpan ? `Menyimpan… ${progres.selesai}/${progres.total}` : 'Simpan semua game'}
        </Tombol>
      </div>
      {pesan && (
        <p className={pesan.ok ? s.berhasil : s.gagal} role="status">
          {pesan.teks}
        </p>
      )}
    </section>
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
