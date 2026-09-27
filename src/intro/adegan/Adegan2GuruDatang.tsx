import gsap from 'gsap'
import { useRef, useState } from 'react'
import type { Ekspresi } from '../../characters/animasi'
import { Karakter, type KarakterHandle } from '../../characters/Karakter'
import { waktuAksi } from '../naskah'
import { Tokoh } from './Tokoh'
import { bagian, mulut, rot, useAdegan, type AdeganProps } from './umum'
import s from './adegan.module.css'

const T = waktuAksi('guru-datang')
/** Tepi dalam kusen (kiri & bawah balok atas), px panggung: lihat .kusen di adegan.module.css. */
const LUBANG_PINTU = { kiri: 78, atas: 158 }

/** Adegan 2 · Pak Guru datang: pintu terbuka, egrang di punggung tersangkut kusen. */
export function Adegan2GuruDatang({ ref, ...p }: AdeganProps) {
  const akar = useRef<HTMLDivElement>(null)
  const kamera = useRef<HTMLDivElement>(null)
  const pintuTutup = useRef<HTMLDivElement>(null)
  const pintuBuka = useRef<HTMLDivElement>(null)
  const sinar = useRef<HTMLDivElement>(null)
  const grupGuru = useRef<HTMLDivElement>(null)
  const klipGuru = useRef<HTMLDivElement>(null)
  const guru = useRef<KarakterHandle>(null)
  const tuk = useRef<HTMLDivElement>(null)
  const hadapBima = useRef<HTMLDivElement>(null)
  const hadapSekar = useRef<HTMLDivElement>(null)
  const hadapDimas = useRef<HTMLDivElement>(null)
  const [siswa, setSiswa] = useState<Ekspresi>(p.gerak ? 'normal' : 'surprised')

  useAdegan(ref, akar, (tl, lepas) => {
    // Pintu berayun terbuka, cahaya lorong masuk.
    const pt = T('pintu')
    tl.fromTo(pintuTutup.current, { autoAlpha: 1, scaleX: 1 }, { scaleX: 0, duration: pt.durasi * 0.6, ease: 'power2.in' }, pt.t)
      .set(pintuTutup.current, { autoAlpha: 0 })
      .fromTo(pintuBuka.current, { scaleX: 0 }, { scaleX: 1, duration: pt.durasi * 0.4, ease: 'power2.out' })
      .fromTo(sinar.current, { autoAlpha: 0 }, { autoAlpha: 0.6, duration: 0.6 }, pt.t + 0.3)

    // Pak Ahsan masih di lorong: terpotong kusen kiri & dinding di atas pintu (di belakang kusen).
    tl.set(klipGuru.current, { zIndex: 1, clipPath: `inset(${LUBANG_PINTU.atas}px 0px 0px ${LUBANG_PINTU.kiri}px)` }, 0)

    // Pak Ahsan melangkah masuk dari kiri (muncul dari balik kusen), langkah naik-turun 6px.
    const gm = T('guru-masuk')
    tl.fromTo(grupGuru.current, { x: -320 }, { x: 0, duration: gm.durasi, ease: 'power1.out' }, gm.t).fromTo(
      grupGuru.current,
      { y: 0 },
      { y: -6, duration: gm.durasi / 8, ease: 'sine.inOut', yoyo: true, repeat: 7 },
      gm.t,
    )

    // Egrang tersangkut: tertahan & mundur 20px, "tuk!", layar goyang, menunduk 15°, lalu masuk lagi.
    const en = T('egrang-nyangkut')
    tl.to(grupGuru.current, { x: -20, duration: 0.15, ease: 'power2.out' }, en.t)
      .fromTo(tuk.current, { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(3)' }, en.t)
      .fromTo(kamera.current, { x: 0 }, { x: 4, duration: 0.05, ease: 'none', yoyo: true, repeat: 3 }, en.t)
      .set(kamera.current, { x: 0 }, en.t + 0.2)
      .fromTo(grupGuru.current, { rotation: 0 }, { rotation: 15, transformOrigin: '50% 100%', duration: 0.35, ease: 'power2.inOut' }, en.t + 0.45)
      // Sambil menunduk, melangkah melewati pintu masuk ke kelas (sekarang di depan kusen).
      .to(grupGuru.current, { x: 40, duration: 0.6, ease: 'power1.inOut' }, en.t + 0.9)
      .set(klipGuru.current, { zIndex: 3, clipPath: 'none' }, en.t + 1.2)
      .to(tuk.current, { autoAlpha: 0, duration: 0.3 }, en.t + 1.2)
      .to(grupGuru.current, { rotation: 0, duration: 0.45, ease: 'power2.out' }, en.t + en.durasi - 0.5)

    // Siswa menoleh ke pintu (dibalik), kaget, lalu tersenyum.
    const sm = T('siswa-menoleh')
    ;[hadapBima, hadapSekar, hadapDimas].forEach((h, i) => {
      tl.fromTo(h.current, { scaleX: 1 }, { scaleX: -1, duration: 0.2, ease: 'power2.inOut' }, sm.t + i * 0.12)
    })
    tl.call(() => setSiswa('surprised'), [], sm.t).call(() => setSiswa('happy'), [], sm.t + sm.durasi)

    // Pak Guru bercerita: lengan kanan terangkat, bergerak pelan.
    const gb = T('guru-bercerita')
    tl.fromTo(bagian(guru, 'arm-upper-r'), rot(-6), { ...rot(-38), duration: 0.4, ease: 'back.out(1.6)' }, gb.t)
      .fromTo(bagian(guru, 'arm-lower-r'), rot(6), { ...rot(-68), duration: 0.4, ease: 'back.out(1.6)' }, gb.t)
      .call(
        () =>
          lepas(() => {
            gsap.fromTo(
              bagian(guru, 'arm-lower-r'),
              rot(-68),
              { ...rot(-50), duration: 0.7, ease: 'sine.inOut', yoyo: true, repeat: -1 },
            )
          }),
        [],
        gb.t + 0.45,
      )
  })

  return (
    <div ref={akar} className={s.adegan}>
      <div ref={kamera} className={s.kamera}>
        <div className={s.listTapis} />
        <div className={s.lorong} />
        <div ref={pintuBuka} className={s.pintuBuka} />
        <div className={s.lantai} />
        <div ref={sinar} className={s.sinarLorong} />

        {/* Lapisan pemotong: saat di lorong hanya bagian di dalam lubang pintu yang terlihat. */}
        <div ref={klipGuru} className={s.klipGuru}>
          <Tokoh kotak={{ left: 100, bottom: 30, width: 250, height: 480 }} luarRef={grupGuru}>
            <div className={s.egrangPunggung} style={{ left: 50, top: -92, transform: 'rotate(-14deg)' }} />
            <div className={s.egrangPunggung} style={{ left: 80, top: -88, transform: 'rotate(-10deg)' }} />
            <Karakter ref={guru} who="guru" pose={p.gerak ? 'idle' : 'talk'} ekspresi="happy" {...mulut(p, 'guru')} />
          </Tokoh>
        </div>
        <div ref={pintuTutup} className={s.pintuTutup} />
        <div className={s.kusen} />
        <div ref={tuk} className={s.bunyi} style={{ left: 92, top: 96, fontSize: 34, zIndex: 4, transform: 'rotate(-10deg)' }}>
          tuk!
        </div>

        <Tokoh kotak={{ left: 640, bottom: 30, width: 190, height: 350 }} dalamRef={hadapBima} balik={!p.gerak}>
          <Karakter who="bima" ekspresi={siswa} {...mulut(p, 'bima')} />
        </Tokoh>
        <Tokoh kotak={{ left: 830, bottom: 30, width: 190, height: 350 }} dalamRef={hadapSekar} balik={!p.gerak}>
          <Karakter who="sekar" ekspresi={siswa} {...mulut(p, 'sekar')} />
        </Tokoh>
        <Tokoh kotak={{ left: 1030, bottom: 30, width: 180, height: 330 }} dalamRef={hadapDimas} balik={!p.gerak}>
          <Karakter who="dimas" ekspresi={siswa === 'surprised' ? 'surprised' : 'happy'} {...mulut(p, 'dimas')} />
        </Tokoh>
      </div>
    </div>
  )
}
