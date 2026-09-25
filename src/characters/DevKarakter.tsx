/**
 * /dev/karakter — halaman uji animasi karakter (hanya mode development).
 */
import gsap from 'gsap'
import { useEffect, useRef, useState } from 'react'
import { useKotak } from '../app/store'
import { Halaman } from '../shared/ui/Halaman'
import { Tombol } from '../shared/ui/Tombol'
import { levelDariAnalyser, type Aksi, type Ekspresi } from './animasi'
import { Karakter, type KarakterHandle } from './Karakter'
import type { Pose, Tokoh } from './kit'
import s from './DevKarakter.module.css'

const TOKOH: Tokoh[] = ['guru', 'bima', 'sekar', 'dimas', 'avatar']
const EKSPRESI: Ekspresi[] = ['normal', 'happy', 'surprised', 'flat']
const POSE: Pose[] = ['idle', 'talk', 'happy', 'gobak', 'engklek', 'egrang']

function Pilihan<T extends string>({ label, nilai, pilihan, onUbah }: { label: string; nilai: T; pilihan: readonly T[]; onUbah: (v: T) => void }) {
  return (
    <fieldset className={s.pilihan}>
      <legend>{label}</legend>
      {pilihan.map((p) => (
        <button key={p} type="button" aria-pressed={nilai === p} className={nilai === p ? s.aktif : ''} onClick={() => onUbah(p)}>
          {p}
        </button>
      ))}
    </fieldset>
  )
}

function Sakelar({ label, nilai, onUbah }: { label: string; nilai: boolean; onUbah: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={nilai} className={`${s.sakelar} ${nilai ? s.aktif : ''}`} onClick={() => onUbah(!nilai)}>
      {label}: {nilai ? 'ya' : 'tidak'}
    </button>
  )
}

export function DevKarakter() {
  const avatar = useKotak((st) => st.avatar)
  const [ekspresi, setEkspresi] = useState<Ekspresi>('normal')
  const [pose, setPose] = useState<Pose>('idle')
  const [aksi, setAksi] = useState<'-' | Aksi>('-')
  const [bicara, setBicara] = useState(false)
  const [hidup, setHidup] = useState(true)
  const [siluet, setSiluet] = useState(false)
  const [pivots, setPivots] = useState(false)
  const [lipSync, setLipSync] = useState<(() => number) | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const guru = useRef<KarakterHandle>(null)

  useEffect(() => () => void ctxRef.current?.close(), [])

  /** Nada berdenyut acak lewat AnalyserNode untuk menguji lip-sync. */
  const tesLipSync = () => {
    const ctx = (ctxRef.current ??= new AudioContext())
    void ctx.resume()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const analyser = ctx.createAnalyser()
    const keluar = ctx.createGain()
    analyser.fftSize = 512
    osc.frequency.value = 180
    keluar.gain.value = 0.15
    osc.connect(gain).connect(analyser).connect(keluar).connect(ctx.destination)
    const t = ctx.currentTime
    for (let i = 0; i < 24; i++) gain.gain.setValueAtTime(Math.random() < 0.3 ? 0 : Math.random(), t + i * 0.16)
    osc.start()
    osc.stop(t + 4)
    const level = levelDariAnalyser(analyser)
    setLipSync(() => level)
    osc.onended = () => setLipSync(null)
  }

  const angguk = () => {
    const kepala = guru.current?.part('head')
    if (kepala) gsap.to(kepala, { rotation: 8, svgOrigin: '0 0', duration: 0.18, yoyo: true, repeat: 3 })
  }

  const props = {
    pose,
    ekspresi,
    bicara,
    lipSync,
    aksi: aksi === '-' ? null : aksi,
    hidup,
    silhouette: siluet,
    pivots,
  }

  return (
    <Halaman judul="Uji karakter" label="Halaman pengembang">
      <div className={s.kontrol}>
        <Pilihan label="Ekspresi" nilai={ekspresi} pilihan={EKSPRESI} onUbah={setEkspresi} />
        <Pilihan label="Pose" nilai={pose} pilihan={POSE} onUbah={setPose} />
        <Pilihan label="Aksi" nilai={aksi} pilihan={['-', 'wave', 'jump'] as const} onUbah={setAksi} />
        <div className={s.baris}>
          <Sakelar label="Bicara" nilai={bicara} onUbah={setBicara} />
          <Sakelar label="Hidup (napas + kedip)" nilai={hidup} onUbah={setHidup} />
          <Sakelar label="Siluet" nilai={siluet} onUbah={setSiluet} />
          <Sakelar label="Titik putar" nilai={pivots} onUbah={setPivots} />
        </div>
        <div className={s.baris}>
          <Tombol varian="nila" onClick={tesLipSync} disabled={!!lipSync}>
            {lipSync ? 'Lip-sync berjalan…' : 'Tes lip-sync (nada 4 dtk)'}
          </Tombol>
          <Tombol varian="sekunder" onClick={angguk}>
            Pak Ahsan mengangguk (ref.part)
          </Tombol>
          <Tombol varian="sekunder" onClick={() => guru.current?.kedip()}>
            Kedip sekarang
          </Tombol>
        </div>
      </div>

      <div className={`${s.panggung} ${siluet ? s.kelir : ''}`}>
        {TOKOH.map((t) => (
          <figure key={t} className={s.tokoh}>
            <div className={s.gambar}>
              {t === 'avatar' && avatar ? (
                <Karakter who="avatar" skin={avatar.kulit} hair={avatar.rambut} headwear={avatar.penutupKepala} {...props} />
              ) : (
                <Karakter who={t} ref={t === 'guru' ? guru : undefined} {...props} />
              )}
            </div>
            <figcaption>{t}</figcaption>
          </figure>
        ))}
      </div>

    </Halaman>
  )
}
