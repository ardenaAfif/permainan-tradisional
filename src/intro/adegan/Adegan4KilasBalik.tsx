import gsap from 'gsap'
import { useRef } from 'react'
import { Karakter, type KarakterHandle } from '../../characters/Karakter'
import { waktuAksi } from '../naskah'
import { Tokoh } from './Tokoh'
import { bagian, PUTAR, useAdegan, type AdeganProps } from './umum'
import s from './adegan.module.css'

const T = waktuAksi('kilas-balik')
const DASAR = { transformOrigin: '50% 100%' }

/** Adegan 4 · Kilas balik wayang: kelir, lampu blencong, siluet gobak sodor, engklek, egrang. */
export function Adegan4KilasBalik({ ref }: AdeganProps) {
  const akar = useRef<HTMLDivElement>(null)
  const pid = useRef<HTMLDivElement>(null)
  const cahaya = useRef<HTMLDivElement>(null)
  const blencong = useRef<HTMLDivElement>(null)
  const gobak = useRef<HTMLDivElement>(null)
  const engklek = useRef<HTMLDivElement>(null)
  const egrang = useRef<HTMLDivElement>(null)
  const gobakK = useRef<KarakterHandle>(null)

  useAdegan(ref, akar, (tl, lepas) => {
    // Kamera menembus layar PID: zoom 100% → 140% sambil memudar ke kelir.
    const mp = T('masuk-pid')
    tl.fromTo(pid.current, { autoAlpha: 1, scale: 1 }, { autoAlpha: 0, scale: 1.4, duration: mp.durasi, ease: 'power2.in' }, mp.t)

    // Lampu blencong berkedip halus; bayangan ikut bergoyang (goyang siluet dari Karakter).
    lepas(() => {
      gsap.to(cahaya.current, { opacity: 'random(0.85, 1)', duration: 0.22, ease: 'steps(2)', repeat: -1, repeatRefresh: true })
      gsap.to(blencong.current, { x: 'random(-2, 2)', opacity: 'random(0.85, 1)', duration: 0.18, ease: 'steps(2)', repeat: -1, repeatRefresh: true })
    })

    // Gobak sodor: masuk dari kiri sambil berayun seperti dipegang dalang, lalu merentangkan tangan.
    const g = T('gobak')
    tl.fromTo(gobak.current, { x: -440 }, { x: 0, duration: 2, ease: 'power1.out' }, g.t)
      .fromTo(gobak.current, { rotation: -6 }, { rotation: 6, ...DASAR, duration: 0.4, ease: 'sine.inOut', yoyo: true, repeat: 4 }, g.t)
      .to(gobak.current, { rotation: 0, duration: 0.3, ease: 'sine.out' }, g.t + 2)
      .fromTo(bagian(gobakK, 'arm-upper-l'), { rotation: 10 }, { rotation: 84, ...PUTAR, duration: 0.5, ease: 'back.out(1.8)' }, g.t + 2.2)
      .fromTo(bagian(gobakK, 'arm-upper-r'), { rotation: -10 }, { rotation: -84, ...PUTAR, duration: 0.5, ease: 'back.out(1.8)' }, g.t + 2.2)

    // Engklek: muncul di tengah, lompat satu kaki 3 kali (naik 40px, maju 60px).
    const e = T('engklek')
    tl.fromTo(engklek.current, { autoAlpha: 0, x: -90, y: 0 }, { autoAlpha: 1, duration: 0.5 }, e.t)
    for (let i = 0; i < 3; i++) {
      const t = e.t + 0.8 + i * 1.6
      tl.to(engklek.current, { x: -90 + 60 * (i + 1), duration: 0.5, ease: 'none' }, t)
        .to(engklek.current, { y: -40, duration: 0.25, ease: 'power2.out' }, t)
        .to(engklek.current, { y: 0, duration: 0.25, ease: 'power2.in' }, t + 0.25)
    }

    // Egrang: masuk dari kanan, melangkah bergantian (naik 20px, 0,7 dtk per langkah).
    const eg = T('egrang')
    const langkah = 6
    tl.fromTo(egrang.current, { x: 440 }, { x: 0, duration: langkah * 0.7, ease: 'none' }, eg.t)
    for (let i = 0; i < langkah; i++) {
      tl.fromTo(
        egrang.current,
        { y: 0, rotation: 0 },
        { y: -20, rotation: i % 2 ? 3 : -3, ...DASAR, duration: 0.35, ease: 'sine.out', yoyo: true, repeat: 1, immediateRender: false },
        eg.t + i * 0.7,
      )
    }
  })

  return (
    <div ref={akar} className={`${s.adegan} ${s.kayu}`}>
      <div className={s.kelir}>
        <div ref={cahaya} className={s.cahayaKelir} />
        <div className={s.blencongTudung} />
        <div ref={blencong} className={s.blencong} />
        <div className={s.tanah} />
        <Tokoh kotak={{ left: 130, bottom: 120, width: 290, height: 400 }} luarRef={gobak}>
          <div className={s.gapit} />
          <Karakter ref={gobakK} who="avatar" hair="pendek" pose="gobak" silhouette />
        </Tokoh>
        <Tokoh kotak={{ left: 480, bottom: 120, width: 290, height: 400 }} luarRef={engklek}>
          <div className={s.gapit} />
          <Karakter who="avatar" hair="kuncir" pose="engklek" silhouette />
        </Tokoh>
        <Tokoh kotak={{ left: 860, bottom: 116, width: 210, height: 470 }} luarRef={egrang}>
          <Karakter who="avatar" headwear="peci" pose="egrang" silhouette />
        </Tokoh>
      </div>
      <div ref={pid} className={s.pid} />
    </div>
  )
}
