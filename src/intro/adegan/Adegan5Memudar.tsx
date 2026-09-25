import { useRef, useState } from 'react'
import type { Ekspresi } from '../../characters/animasi'
import { Karakter, type KarakterHandle } from '../../characters/Karakter'
import { BendaGambar } from '../../shared/benda/BendaGambar'
import type { JenisBenda } from '../../shared/benda/benda'
import { waktuAksi } from '../naskah'
import { Tokoh } from './Tokoh'
import { bagian, mulut, PUTAR, useAdegan, type AdeganProps } from './umum'
import s from './adegan.module.css'

const T = waktuAksi('memudar')

/** Benda di atas meja (storyboard, posisi dari bawah). Kotak terakhir memudar. */
const BENDA: { jenis: JenisBenda; x: number; b: number; w: number; h: number }[] = [
  { jenis: 'dadu', x: 400, b: 250, w: 110, h: 88 },
  { jenis: 'kelereng', x: 500, b: 320, w: 110, h: 88 },
  { jenis: 'balon', x: 620, b: 330, w: 110, h: 88 },
  { jenis: 'bekel', x: 730, b: 250, w: 110, h: 88 },
  { jenis: 'kotak', x: 510, b: 92, w: 200, h: 160 },
]
const PERCIK = [
  { x: 760, b: 340, ukuran: 28 },
  { x: 470, b: 350, ukuran: 22 },
  { x: 640, b: 290, ukuran: 24 },
]

/** Adegan 5 · Warna memudar: benda berkedip lalu menjadi abu-abu satu per satu. */
export function Adegan5Memudar({ ref, ...p }: AdeganProps) {
  const akar = useRef<HTMLDivElement>(null)
  const tabir = useRef<HTMLDivElement>(null)
  const guru = useRef<KarakterHandle>(null)
  const benda = useRef<(HTMLDivElement | null)[]>([])
  const warna = useRef<(HTMLDivElement | null)[]>([])
  const percik = useRef<(HTMLDivElement | null)[]>([])
  const [siswa, setSiswa] = useState<Ekspresi>('surprised')

  useAdegan(ref, akar, (tl) => {
    // Latar kelas ikut kusam.
    tl.fromTo(tabir.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 10, ease: 'none' }, 0)

    // Benda yang masih melayang turun ke meja sambil berkedip 3 kali.
    const bt = T('benda-turun')
    const melayang = benda.current.slice(0, 4)
    tl.fromTo(melayang, { y: -120 }, { y: 0, duration: bt.durasi, ease: 'sine.out', stagger: 0.08 }, bt.t).fromTo(
      warna.current.slice(0, 4),
      { opacity: 1 },
      { opacity: 0.4, duration: 0.25, ease: 'steps(1)', yoyo: true, repeat: 5 },
      bt.t + 1,
    )

    // Pudar: saturasi 100% → 0% satu per satu (silang-pudar lapisan warna ke lapisan abu), kotak terakhir.
    const pd = T('pudar')
    tl.fromTo(warna.current, { autoAlpha: 1 }, { autoAlpha: 0, duration: 1, ease: 'power1.inOut', stagger: pd.durasi, immediateRender: false }, pd.t)
    percik.current.forEach((el, i) => {
      tl.fromTo(el, { autoAlpha: 0, y: 0 }, { autoAlpha: 1, y: -15, duration: 0.5, ease: 'power1.out' }, pd.t + 0.6 + i * 0.7).to(
        el,
        { autoAlpha: 0, y: -30, duration: 0.5, ease: 'power1.in' },
        '>',
      )
    })

    // Pak Guru menunjuk ke benda.
    const gm = T('guru-menunjuk')
    tl.fromTo(bagian(guru, 'arm-upper-r'), { rotation: -6 }, { rotation: -78, ...PUTAR, duration: 0.5, ease: 'power2.out' }, gm.t).fromTo(
      bagian(guru, 'arm-lower-r'),
      { rotation: 6 },
      { rotation: -12, ...PUTAR, duration: 0.5, ease: 'power2.out' },
      gm.t,
    )

    // Siswa: kaget lalu datar.
    tl.call(() => setSiswa('flat'), [], T('siswa-datar').t)
  })

  return (
    <div ref={akar} className={`${s.adegan} ${s.kusam}`}>
      <div className={s.listTapis} />
      <div className={s.lantai} />
      <div ref={tabir} className={s.tabirKusam} />

      <Tokoh kotak={{ left: 60, bottom: 30, width: 250, height: 480 }} className={s.tanpaProp}>
        <Karakter ref={guru} who="guru" pose={p.gerak ? 'idle' : 'talk'} {...mulut(p, 'guru')} />
      </Tokoh>
      <Tokoh kotak={{ left: 880, bottom: 30, width: 160, height: 300 }} balik>
        <Karakter who="bima" ekspresi={siswa} {...mulut(p, 'bima')} />
      </Tokoh>
      <Tokoh kotak={{ left: 1000, bottom: 30, width: 160, height: 300 }} balik>
        <Karakter who="sekar" ekspresi={siswa === 'surprised' ? 'surprised' : 'flat'} {...mulut(p, 'sekar')} />
      </Tokoh>
      <Tokoh kotak={{ left: 1120, bottom: 30, width: 150, height: 280 }} balik>
        <Karakter who="dimas" ekspresi="flat" {...mulut(p, 'dimas')} />
      </Tokoh>

      <div className={s.mejaPanjang} style={{ left: 380, bottom: 60, width: 460, height: 40 }} />
      {BENDA.map((b, i) => (
        <div
          key={b.jenis}
          ref={(el) => {
            benda.current[i] = el
          }}
          className={s.benda}
          style={{ left: b.x, bottom: b.b, width: b.w, height: b.h }}
        >
          <BendaGambar jenis={b.jenis} className={s.abu} />
          {/* Lapisan berwarna di atas lapisan abu; memudar = opacity lapisan ini turun. */}
          <div
            ref={(el) => {
              warna.current[i] = el
            }}
            className={s.warna}
            style={p.gerak ? undefined : { opacity: 0 }}
          >
            <BendaGambar jenis={b.jenis} className={s.isi} />
          </div>
        </div>
      ))}
      {PERCIK.map((c, i) => (
        <div
          key={i}
          ref={(el) => {
            percik.current[i] = el
          }}
          className={s.percik}
          style={{ left: c.x, bottom: c.b, fontSize: c.ukuran }}
          aria-hidden="true"
        >
          ✦
        </div>
      ))}
    </div>
  )
}
