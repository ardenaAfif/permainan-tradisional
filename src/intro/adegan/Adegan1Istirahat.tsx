import { useRef, useState } from 'react'
import logoSnt from '../../assets/snt-mark.webp'
import type { Mata, Mulut } from '../../characters/kit'
import { Karakter, type KarakterHandle } from '../../characters/Karakter'
import { waktuAksi } from '../naskah'
import { Tokoh } from './Tokoh'
import { bagian, mulut, rot, useAdegan, type AdeganProps } from './umum'
import s from './adegan.module.css'

const T = waktuAksi('istirahat')

/** Adegan 1 · Jam istirahat: bel, Bima menguap, Sekar & HP lowbat, Dimas sendirian. */
export function Adegan1Istirahat({ ref, ...p }: AdeganProps) {
  const akar = useRef<HTMLDivElement>(null)
  const kamera = useRef<HTMLDivElement>(null)
  const bel = useRef<HTMLDivElement>(null)
  const kriing = useRef<HTMLDivElement>(null)
  const bima = useRef<KarakterHandle>(null)
  const sekar = useRef<KarakterHandle>(null)
  const isiBaterai = useRef<HTMLDivElement>(null)
  // Frame storyboard (reduce motion): Bima sedang menguap.
  const [wajahBima, setWajahBima] = useState<{ mata: Mata; mulut: Mulut }>(
    p.gerak ? { mata: 'open', mulut: 'flat' } : { mata: 'closed', mulut: 'talk-o' },
  )

  useAdegan(ref, akar, (tl) => {
    // Bel bergetar ±8° enam kali, "kriiing!" muncul.
    const b = T('bel')
    tl.fromTo(bel.current, { rotation: -8 }, { rotation: 8, duration: b.durasi / 6, ease: 'sine.inOut', yoyo: true, repeat: 5 }, b.t)
      .to(bel.current, { rotation: 0, duration: 0.1 })
      .fromTo(kriing.current, { scale: 0, rotation: -30 }, { scale: 1, rotation: -14, duration: 0.35, ease: 'back.out(2.2)' }, b.t + 0.05)

    // Bima menguap: kepala miring ke belakang, tangan ke mulut, mata tertutup, mulut O.
    const m = T('bima-menguap')
    tl.call(() => setWajahBima({ mata: 'closed', mulut: 'talk-o' }), [], m.t)
      .fromTo(bagian(bima, 'head'), rot(0), { ...rot(-6), duration: 0.35, ease: 'power2.out' }, m.t)
      .fromTo(bagian(bima, 'arm-upper-r'), rot(-6), { ...rot(100), duration: 0.4, ease: 'power2.out' }, m.t)
      .fromTo(bagian(bima, 'arm-lower-r'), rot(6), { ...rot(105), duration: 0.4, ease: 'power2.out' }, m.t)
      .to(bagian(bima, 'head'), { ...rot(0), duration: 0.4, ease: 'sine.inOut' }, m.t + m.durasi)
      .to(bagian(bima, 'arm-upper-r'), { ...rot(-6), duration: 0.45, ease: 'sine.inOut' }, m.t + m.durasi)
      .to(bagian(bima, 'arm-lower-r'), { ...rot(6), duration: 0.45, ease: 'sine.inOut' }, m.t + m.durasi)
      .call(() => setWajahBima({ mata: 'open', mulut: 'flat' }), [], m.t + m.durasi)

    // Sekar menunduk ke HP; baterai berkedip merah 3 kali.
    const k = T('sekar-menunduk')
    tl.fromTo(bagian(sekar, 'head'), rot(0, 0), { ...rot(8, 3), duration: k.durasi, ease: 'power2.out' }, k.t)
    const bt = T('baterai')
    tl.fromTo(isiBaterai.current, { autoAlpha: 1 }, { autoAlpha: 0, duration: bt.durasi / 6, ease: 'steps(1)', yoyo: true, repeat: 5 }, bt.t)

    // Kamera geser 30px ke arah Dimas.
    const kd = T('kamera-dimas')
    tl.fromTo(kamera.current, { x: 0 }, { x: -30, duration: kd.durasi, ease: 'sine.inOut' }, kd.t)
  })

  return (
    <div ref={akar} className={s.adegan}>
      <div ref={kamera} className={s.kamera}>
        <div className={s.listTapis} />
        <div className={s.papan}>
          <div className={s.papanTeks}>Jum'at · Kokurikuler</div>
          <img className={s.papanLogo} src={logoSnt} alt="" width={65} height={52} />
          <div className={s.papanRak} />
        </div>
        <div className={s.jendela} />
        <div ref={bel} className={s.bel} />
        <div ref={kriing} className={s.bunyi} style={{ left: 84, top: 22, transform: 'rotate(-14deg)' }}>
          kriiing!
        </div>
        <div className={s.lantai} />

        <Tokoh kotak={{ left: 140, bottom: 30, width: 200, height: 370 }}>
          <Karakter ref={bima} who="bima" eyes={wajahBima.mata} mouth={wajahBima.mulut} {...mulut(p, 'bima')} />
        </Tokoh>
        <Tokoh kotak={{ left: 520, bottom: 30, width: 200, height: 370 }}>
          <Karakter ref={sekar} who="sekar" pose="talk" mouth="flat" {...mulut(p, 'sekar')} />
        </Tokoh>
        <div className={s.hp} style={{ left: 684, top: 440, transform: 'rotate(-12deg)' }}>
          <div className={s.baterai}>
            <div ref={isiBaterai} className={s.bateraiIsi} />
          </div>
        </div>

        <Tokoh kotak={{ left: 1010, bottom: 78, width: 150, height: 280 }}>
          <Karakter who="dimas" mouth="flat" {...mulut(p, 'dimas')} />
        </Tokoh>
        <div className={s.meja} style={{ left: 960, bottom: 30, width: 250, height: 130 }} />
      </div>
    </div>
  )
}
