import { useRef, useState } from 'react'
import type { Ekspresi } from '../../characters/animasi'
import { Karakter, type KarakterHandle } from '../../characters/Karakter'
import { BendaGambar } from '../../shared/benda/BendaGambar'
import { waktuAksi } from '../naskah'
import { Tokoh } from './Tokoh'
import { bagian, mulut, PUTAR, useAdegan, type AdeganProps } from './umum'
import s from './adegan.module.css'

const T = waktuAksi('misi')
/** Kotak di lantai (storyboard): kiri 880, bawah 40, 170x136 → titik tengah. */
const KOTAK = { x: 880, b: 40, w: 170, h: 136 }
const TENGAH_KOTAK = { x: KOTAK.x + KOTAK.w / 2, y: 720 - KOTAK.b - KOTAK.h / 2 }

/** Adegan 6 · Misi: Dimas berdiri, Pak Guru mengajak, kamera zoom ke kotak. */
export function Adegan6Misi({ ref, ...p }: AdeganProps) {
  const akar = useRef<HTMLDivElement>(null)
  const kamera = useRef<HTMLDivElement>(null)
  const pendar = useRef<HTMLDivElement>(null)
  const dimas = useRef<HTMLDivElement>(null)
  const dimasK = useRef<KarakterHandle>(null)
  const guru = useRef<KarakterHandle>(null)
  const bima = useRef<KarakterHandle>(null)
  const sekar = useRef<KarakterHandle>(null)
  const warnaKotak = useRef<HTMLDivElement>(null)
  const kilau = useRef<SVGSVGElement>(null)
  const [siswa, setSiswa] = useState<Ekspresi>(p.gerak ? 'normal' : 'surprised')
  const [guruEk, setGuruEk] = useState<Ekspresi>(p.gerak ? 'normal' : 'happy')

  useAdegan(ref, akar, (tl) => {
    // Dimas berdiri pelan dari kursi, kepala menunduk lalu tegak.
    const db = T('dimas-berdiri')
    tl.fromTo(dimas.current, { y: 60 }, { y: 0, duration: db.durasi, ease: 'power1.inOut' }, db.t).fromTo(
      bagian(dimasK, 'head'),
      { rotation: 0, y: 0 },
      { rotation: 6, y: 3, ...PUTAR, duration: db.durasi / 2, ease: 'sine.inOut', yoyo: true, repeat: 1 },
      db.t,
    )

    // Bima & Sekar menoleh ke Dimas: kaget lalu tersenyum.
    const sm = T('siswa-menoleh')
    tl.fromTo([...bagian(bima, 'head'), ...bagian(sekar, 'head')], { rotation: 0 }, { rotation: 10, ...PUTAR, duration: 0.3, ease: 'power2.out' }, sm.t)
      .call(() => setSiswa('surprised'), [], sm.t)
      .call(() => setSiswa('happy'), [], sm.t + sm.durasi + 0.5)

    // Cahaya hangat di belakang Dimas membesar 80% → 100%.
    const cd = T('cahaya-dimas')
    tl.fromTo(pendar.current, { scale: 0.8, autoAlpha: 0.5 }, { scale: 1, autoAlpha: 1, duration: cd.durasi, ease: 'sine.out' }, cd.t)

    // Pak Guru tersenyum dan mengangguk dua kali.
    const ga = T('guru-mengangguk')
    tl.call(() => setGuruEk('happy'), [], ga.t).fromTo(
      bagian(guru, 'head'),
      { y: 0, rotation: 0 },
      { y: 5, rotation: 6, ...PUTAR, duration: ga.durasi / 4, ease: 'sine.inOut', yoyo: true, repeat: 3 },
      ga.t,
    )

    // Kamera zoom ke kotak (kotak ke tengah layar, 100% → 260%), kotak berkilau dan berwarna lagi.
    const z = T('zoom-kotak')
    tl.fromTo(
      kamera.current,
      { x: 0, y: 0, scale: 1 },
      {
        x: 640 - TENGAH_KOTAK.x,
        y: 360 - TENGAH_KOTAK.y,
        scale: 2.6,
        transformOrigin: `${TENGAH_KOTAK.x}px ${TENGAH_KOTAK.y}px`,
        duration: z.durasi,
        ease: 'power2.in',
      },
      z.t,
    )
      .fromTo(warnaKotak.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, ease: 'power1.out' }, z.t + 0.6)
      .fromTo(kilau.current, { autoAlpha: 0, scale: 0, rotation: -45 }, { autoAlpha: 1, scale: 1.3, rotation: 20, duration: 0.3, ease: 'back.out(2)' }, z.t + 0.9)
      .to(kilau.current, { autoAlpha: 0, scale: 0.4, duration: 0.3, ease: 'power1.in' }, z.t + 1.3)
  })

  return (
    <div ref={akar} className={s.adegan}>
      <div ref={kamera} className={s.kamera}>
        <div className={s.listTapis} />
        <div className={s.lantai} />
        <div ref={pendar} className={s.pendarDimas} />

        <Tokoh kotak={{ left: 60, bottom: 30, width: 250, height: 480 }} className={s.tanpaProp}>
          <Karakter ref={guru} who="guru" ekspresi={guruEk} {...mulut(p, 'guru')} />
        </Tokoh>
        <Tokoh kotak={{ left: 340, bottom: 30, width: 180, height: 330 }}>
          <Karakter ref={bima} who="bima" ekspresi={siswa} {...mulut(p, 'bima')} />
        </Tokoh>
        <Tokoh kotak={{ left: 640, bottom: 30, width: 200, height: 370 }} luarRef={dimas}>
          <Karakter ref={dimasK} who="dimas" pose={p.gerak ? 'idle' : 'talk'} {...mulut(p, 'dimas')} />
        </Tokoh>
        <div className={s.meja} style={{ left: 612, bottom: 30, width: 256, height: 110 }} />
        <Tokoh kotak={{ left: 1080, bottom: 30, width: 180, height: 330 }} balik>
          <Karakter ref={sekar} who="sekar" ekspresi={siswa} {...mulut(p, 'sekar')} />
        </Tokoh>

        <div className={s.benda} style={{ left: KOTAK.x, bottom: KOTAK.b, width: KOTAK.w, height: KOTAK.h }}>
          <BendaGambar jenis="kotak" className={s.abu} />
          <div ref={warnaKotak} className={s.warna} style={{ opacity: 0 }}>
            <BendaGambar jenis="kotak" className={s.isi} />
          </div>
        </div>
        <svg ref={kilau} className={s.kilau} style={{ left: TENGAH_KOTAK.x - 5, top: TENGAH_KOTAK.y - 110 }} viewBox="0 0 90 90" aria-hidden="true">
          <path d="M45 0 L55 35 L90 45 L55 55 L45 90 L35 55 L0 45 L35 35 Z" />
        </svg>
      </div>
    </div>
  )
}
