import gsap from 'gsap'
import { useRef } from 'react'
import { Karakter } from '../../characters/Karakter'
import { BendaGambar } from '../../shared/benda/BendaGambar'
import type { JenisBenda } from '../../shared/benda/benda'
import { waktuAksi } from '../naskah'
import { KotakKayu } from './KotakKayu'
import { Tokoh } from './Tokoh'
import { mulut, useAdegan, type AdeganProps } from './umum'
import s from './adegan.module.css'

const T = waktuAksi('kotak-dibuka')

/** Urutan keluar dari kotak (storyboard): bidak, gacuk, dadu, kapur, bola bekel, bakiak, kelereng, balon. */
const BENDA: { jenis: JenisBenda; x: number; y: number; w: number; h: number; putar: number }[] = [
  { jenis: 'papan', x: 250, y: 300, w: 150, h: 120, putar: -10 },
  { jenis: 'gacuk', x: 330, y: 150, w: 130, h: 104, putar: 0 },
  { jenis: 'dadu', x: 480, y: 70, w: 130, h: 104, putar: 12 },
  { jenis: 'kapur', x: 630, y: 40, w: 140, h: 112, putar: 0 },
  { jenis: 'bekel', x: 780, y: 90, w: 130, h: 104, putar: 0 },
  { jenis: 'bakiak', x: 880, y: 220, w: 150, h: 120, putar: 14 },
  { jenis: 'kelereng', x: 560, y: 230, w: 110, h: 88, putar: 0 },
  { jenis: 'balon', x: 690, y: 230, w: 120, h: 96, putar: 0 },
]
/** Mulut kotak (titik asal benda melayang). */
const ASAL = { x: 640, y: 500 }

/** Adegan 3 · Kotak dibuka: cahaya keemasan, 8 benda melayang, Sekar penasaran. */
export function Adegan3KotakDibuka({ ref, ...p }: AdeganProps) {
  const akar = useRef<HTMLDivElement>(null)
  const kamera = useRef<HTMLDivElement>(null)
  const kotak = useRef<HTMLDivElement>(null)
  const tutup = useRef<SVGGElement>(null)
  const sinar = useRef<HTMLDivElement>(null)
  const pendar = useRef<HTMLDivElement>(null)
  const benda = useRef<(HTMLDivElement | null)[]>([])
  const apung = useRef<(HTMLDivElement | null)[]>([])
  const sekar = useRef<HTMLDivElement>(null)

  useAdegan(ref, akar, (tl, lepas) => {
    // Kamera zoom pelan sepanjang adegan.
    tl.fromTo(kamera.current, { scale: 1 }, { scale: 1.06, transformOrigin: '50% 60%', duration: 10, ease: 'none' }, 0)

    // Tutup berputar terbuka di engsel kiri, kotak melompat 8px.
    const tp = T('tutup')
    tl.fromTo(
      tutup.current,
      { attr: { transform: 'rotate(0 26 58)' } },
      { attr: { transform: 'rotate(-60 26 58)' }, duration: tp.durasi, ease: 'back.out(1.4)' },
      tp.t,
    ).fromTo(
      kotak.current,
      { y: 0 },
      { y: -8, duration: 0.15, ease: 'power2.out', yoyo: true, repeat: 1 },
      tp.t,
    )

    // Cahaya keluar, sinar berputar pelan 10°/dtk.
    const c = T('cahaya')
    tl.fromTo([pendar.current, sinar.current], { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: c.durasi, ease: 'power2.out' }, c.t).call(
      () => lepas(() => void gsap.to(sinar.current, { rotation: '+=360', duration: 36, ease: 'none', repeat: -1 })),
      [],
      c.t,
    )

    // Benda melayang naik satu per satu dengan lengkung ke luar, lalu mengapung ±6px.
    const bd = T('benda')
    BENDA.forEach((b, i) => {
      const el = benda.current[i] ?? null
      const t = bd.t + i * bd.durasi
      const dx = ASAL.x - (b.x + b.w / 2)
      const dy = ASAL.y - (b.y + b.h / 2)
      tl.fromTo(el, { x: dx, scale: 0.3, autoAlpha: 0 }, { x: 0, scale: 1, autoAlpha: 1, duration: 0.9, ease: 'power1.out' }, t)
        .fromTo(el, { y: dy }, { y: 0, duration: 0.9, ease: 'back.out(1.3)' }, t)
        .call(
          () =>
            lepas(() => {
              const a = apung.current[i]
              if (a) gsap.fromTo(a, { y: 0 }, { y: -6, duration: 1, ease: 'sine.inOut', yoyo: true, repeat: -1 })
            }),
          [],
          t + 0.9,
        )
    })

    // Sekar muncul dari kanan bawah.
    const sm = T('sekar-masuk')
    tl.fromTo(sekar.current, { x: 80, y: 480 }, { x: 0, y: 0, duration: sm.durasi, ease: 'back.out(1.2)' }, sm.t)
  })

  return (
    <div ref={akar} className={`${s.adegan} ${s.hangat}`}>
      <div ref={kamera} className={s.kamera}>
        <div className={s.lantaiHangat} />
        <div ref={sinar} className={s.sinar} />
        <div ref={pendar} className={s.pendar} />
        <div ref={kotak} className={s.benda} style={{ left: 470, top: 400, width: 340, height: 272 }}>
          <KotakKayu tutupRef={tutup} />
        </div>
        {BENDA.map((b, i) => (
          <div
            key={b.jenis}
            ref={(el) => {
              benda.current[i] = el
            }}
            className={s.benda}
            style={{ left: b.x, top: b.y, width: b.w, height: b.h }}
          >
            <div
              ref={(el) => {
                apung.current[i] = el
              }}
              className={s.isi}
            >
              {/* Rotasi di elemen terdalam supaya tidak bentrok dengan tween GSAP. */}
              <div className={s.isi} style={{ transform: `rotate(${b.putar}deg)` }}>
                <BendaGambar jenis={b.jenis} className={s.isi} />
              </div>
            </div>
          </div>
        ))}
        <Tokoh kotak={{ left: 1040, bottom: -80, width: 240, height: 450 }} luarRef={sekar} balik>
          <Karakter who="sekar" pose="talk" ekspresi="surprised" {...mulut(p, 'sekar')} />
        </Tokoh>
      </div>
    </div>
  )
}
