import gsap from 'gsap'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentType, type PointerEvent } from 'react'
import { useNavigate } from 'react-router'
import { useKotak } from '../app/store'
import { Stage } from '../app/stage/Stage'
import { STAGE_H, STAGE_W } from '../app/stage/stageCoords'
import { useStageScale } from '../app/stage/useStageScale'
import { audio } from '../shared/audio/AudioManager'
import { IkonLewati } from '../shared/ui/Ikon'
import { TombolSuara } from '../shared/ui/TombolSuara'
import { useReducedMotion } from '../shared/useReducedMotion'
import { Adegan1Istirahat } from './adegan/Adegan1Istirahat'
import { Adegan2GuruDatang } from './adegan/Adegan2GuruDatang'
import { Adegan3KotakDibuka } from './adegan/Adegan3KotakDibuka'
import { Adegan4KilasBalik } from './adegan/Adegan4KilasBalik'
import { Adegan5Memudar } from './adegan/Adegan5Memudar'
import { Adegan6Misi } from './adegan/Adegan6Misi'
import type { AdeganHandle, AdeganProps } from './adegan/umum'
import { Balon } from './Balon'
import { pilihMode } from './modeBalon'
import { ADEGAN, type IdAdegan } from './naskah'
import { Sutradara, type BarisAktif } from './sutradara'
import { Transisi, type TransisiHandle } from './Transisi'
import s from './Intro.module.css'

// Bagian karakter yang tidak ditemukan cukup dilewati tanpa memenuhi konsol.
gsap.config({ nullTargetWarn: false })

const KOMPONEN: Record<IdAdegan, ComponentType<AdeganProps>> = {
  istirahat: Adegan1Istirahat,
  'guru-datang': Adegan2GuruDatang,
  'kotak-dibuka': Adegan3KotakDibuka,
  'kilas-balik': Adegan4KilasBalik,
  memudar: Adegan5Memudar,
  misi: Adegan6Misi,
}

/**
 * Intro bercerita (adegan 1–6; adegan 0 = layar judul di Judul.tsx).
 * Naskah & waktu di script.json, animasi per adegan di adegan/, alur di sutradara.ts.
 */
export function Intro() {
  const navigate = useNavigate()
  const punyaAvatar = useKotak((st) => st.avatar !== null)
  const tandaiIntroDilihat = useKotak((st) => st.tandaiIntroDilihat)
  const gerak = !useReducedMotion()
  const { scale, x, y, height } = useStageScale()

  const [indeks, setIndeks] = useState(0)
  const [aktif, setAktif] = useState<BarisAktif | null>(null)
  const adeganRef = useRef<AdeganHandle>(null)
  const transisiRef = useRef<TransisiHandle>(null)
  const sutradaraRef = useRef<Sutradara | null>(null)
  const hidup = useRef(true)
  const selesaiRef = useRef(false)
  const indeksRef = useRef(0)

  const selesai = useCallback(() => {
    if (selesaiRef.current) return
    selesaiRef.current = true
    sutradaraRef.current?.hentikanAdegan()
    audio.hentikanVO()
    tandaiIntroDilihat()
    navigate(punyaAvatar ? '/menu' : '/avatar', { replace: true })
  }, [navigate, punyaAvatar, tandaiIntroDilihat])

  // Pindah adegan: tutup transisi → ganti adegan → buka. Setelah adegan terakhir → layar avatar.
  const keAdeganBerikut = useCallback(async () => {
    const sut = sutradaraRef.current
    if (!sut || selesaiRef.current) return
    sut.kunci = true
    const jenis = ADEGAN[indeksRef.current]?.transisiKeluar ?? 'kain'
    const t = transisiRef.current
    if (t) await t.tutup(gerak || jenis === 'potong' ? jenis : 'fade')
    if (!hidup.current) return
    const berikut = indeksRef.current + 1
    if (berikut >= ADEGAN.length) {
      selesai()
      return
    }
    indeksRef.current = berikut
    setIndeks(berikut)
    if (t) await t.buka()
    if (hidup.current) sut.kunci = false
  }, [gerak, selesai])

  const keAdeganBerikutRef = useRef(keAdeganBerikut)
  useLayoutEffect(() => {
    keAdeganBerikutRef.current = keAdeganBerikut
  }, [keAdeganBerikut])

  // Satu sutradara selama layar intro terbuka.
  useLayoutEffect(() => {
    hidup.current = true
    const sut = new Sutradara({
      onBaris: (b) => {
        if (hidup.current) setAktif(b)
      },
      onAdeganSelesai: () => void keAdeganBerikutRef.current(),
    })
    sutradaraRef.current = sut
    audio.musik('intro')
    // Kain tersingkap di awal intro.
    sut.kunci = true
    void transisiRef.current?.buka().then(() => {
      if (hidup.current) sut.kunci = false
    })
    return () => {
      hidup.current = false
      sut.hentikanAdegan()
      sutradaraRef.current = null
      audio.hentikanVO()
      audio.hentikanMusik()
    }
  }, [])

  // Setiap adegan baru terpasang: bangun timeline-nya lalu putar.
  useLayoutEffect(() => {
    const sut = sutradaraRef.current
    const data = ADEGAN[indeks]
    if (!sut || !data) return
    const h = adeganRef.current
    sut.putar(data, gerak && h ? h.bangun : null, h?.el ?? null)
    return () => sut.hentikanAdegan()
  }, [indeks, gerak])

  // Keyboard: Spasi / Enter / → = lanjut, Esc = lewati.
  useEffect(() => {
    const tekan = (e: KeyboardEvent) => {
      if (e.repeat) return
      const t = e.target as HTMLElement | null
      if (t?.closest('button, a, input')) return
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault()
        sutradaraRef.current?.lanjut()
      } else if (e.key === 'Escape') selesai()
    }
    window.addEventListener('keydown', tekan)
    return () => window.removeEventListener('keydown', tekan)
  }, [selesai])

  // Tap di mana saja (termasuk area letterbox) mempercepat ke baris berikutnya.
  const tap = (e: PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary || e.button > 0) return
    if ((e.target as HTMLElement).closest('button, a')) return
    audio.buka()
    sutradaraRef.current?.lanjut()
  }

  const data = ADEGAN[indeks]
  const Komponen = data ? KOMPONEN[data.id] : null
  const tinggiPanggung = STAGE_H * scale
  const mode = pilihMode(scale, height - (y + tinggiPanggung))

  return (
    <div className={s.intro} onPointerUp={tap}>
      <Stage
        ui={
          <>
            <div className={s.suara}>
              <TombolSuara gaya="tabir" />
            </div>
            <button type="button" className={s.lewati} onClick={selesai}>
              Lewati
              <IkonLewati />
            </button>
          </>
        }
      >
        {Komponen && data && (
          <Komponen key={data.id} ref={adeganRef} gerak={gerak} bicara={aktif?.baris.tokoh ?? null} lipSync={aktif?.lipSync ?? null} />
        )}
        <Transisi ref={transisiRef} awalTertutup />
      </Stage>
      {/* Subtitle punya lapisan sendiri, tepat di atas panggung (tidak bergantung pada lapisan ui Stage). */}
      {mode === 'panel' ? (
        // HP tegak: subtitle di area letterbox bawah panggung supaya teks tetap besar.
        <div className={s.panelBawah} style={{ top: y + tinggiPanggung + 14 }} aria-live="polite">
          {aktif && <Balon key={aktif.baris.lineId} baris={aktif.baris} scale={scale} mode={mode} />}
          <p className={s.petunjuk}>Tap layar untuk lanjut</p>
        </div>
      ) : (
        <div className={s.lapisSubtitle} style={{ left: x, top: y, width: STAGE_W * scale, height: tinggiPanggung }} aria-live="polite">
          {aktif && <Balon key={aktif.baris.lineId} baris={aktif.baris} scale={scale} mode={mode} />}
          {/* Cukup di adegan pertama; setelah itu pemain sudah tahu. */}
          {indeks === 0 && <p className={`${s.petunjuk} ${s.petunjukSudut}`}>Tap untuk lanjut</p>}
        </div>
      )}
    </div>
  )
}
