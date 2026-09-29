import { useCallback, useMemo, useRef, type ReactNode } from 'react'
import { clientToStage, fitContain, STAGE_H, STAGE_W } from './stageCoords'
import { StageContext, type StageApi } from './StageContext'
import { useStageScale } from './useStageScale'
import s from './Stage.module.css'

interface StageProps {
  children: ReactNode
  /** Tampilkan ajakan "Putar HP-mu" saat layar tegak (game yang butuh layar lebar). */
  wajibMendatar?: boolean
  /**
   * Game orientasi 'any': di layar tegak panggung ikut tegak (720x1280), jadi
   * game tidak mengecil jadi pita tipis. Game membaca ukuran wadahnya sendiri.
   */
  bolehTegak?: boolean
  /**
   * Kontrol layar (Lewati, suara, jeda) yang TIDAK ikut diskalakan, supaya tetap
   * ≥ 48px walau panggung mengecil di HP tegak. Diletakkan tepat di atas panggung.
   */
  ui?: ReactNode
  className?: string
}

/** Panggung 1280x720 (atau 720x1280 bila bolehTegak) yang diskalakan agar pas di layar; letterbox diisi pola kain. */
export function Stage({ children, wajibMendatar = false, bolehTegak = false, ui, className }: StageProps) {
  const wadahRef = useRef<HTMLDivElement>(null)
  const panggungRef = useRef<HTMLDivElement>(null)
  const { width, height, portrait } = useStageScale(wadahRef)
  const tegak = bolehTegak && portrait
  const pw = tegak ? STAGE_H : STAGE_W
  const ph = tegak ? STAGE_W : STAGE_H
  const { scale, x, y } = fitContain(width, height, pw, ph)

  const toStage = useCallback<StageApi['toStage']>(
    (e) => {
      const el = panggungRef.current
      return el ? clientToStage(e.clientX, e.clientY, el, pw, ph) : { x: 0, y: 0, inside: false }
    },
    [pw, ph],
  )

  const api = useMemo(() => ({ scale, toStage }), [scale, toStage])
  // Hanya saat layar tegak (HP); di tablet 4:3 lapisan UI tetap pas di atas panggung.
  const atas = portrait && y > 90 ? Math.min(y, 160) : 0
  const putar = wajibMendatar && portrait

  return (
    <div ref={wadahRef} className={s.wadah}>
      <div
        ref={panggungRef}
        className={`${s.panggung} ${className ?? ''}`}
        style={{ width: pw, height: ph, transform: `translate(${x}px, ${y}px) scale(${scale})` }}
        aria-hidden={putar || undefined}
      >
        <StageContext.Provider value={api}>{children}</StageContext.Provider>
      </div>
      {ui && !putar && (
        // Di HP tegak, lapisan UI melebar ke area letterbox di atas panggung supaya
        // HUD/tombol tidak menutupi panggung yang kecil.
        <div className={s.ui} style={{ left: x, top: y - atas, width: pw * scale, height: ph * scale + atas }}>
          {ui}
        </div>
      )}
      {putar && (
        <div className={s.putar} role="alert">
          <svg className={s.putarIkon} width="96" height="96" viewBox="0 0 96 96" aria-hidden="true">
            <rect x="30" y="14" width="36" height="64" rx="8" fill="var(--kertas-terang)" />
            <rect x="35" y="22" width="26" height="46" rx="3" fill="var(--biru-nila)" />
            <path d="M14 58 A34 34 0 0 1 20 30" stroke="var(--cahaya-kelir)" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M12 34 L20 28 L25 37" stroke="var(--cahaya-kelir)" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className={s.putarJudul}>Putar HP-mu</p>
          <p className={s.putarTeks}>Permainan ini butuh layar lebar. Miringkan HP supaya mendatar.</p>
          <p className={s.putarCatatan}>Layar tidak ikut berputar? Nyalakan &ldquo;Putar otomatis&rdquo; (auto-rotate) di pengaturan cepat HP.</p>
        </div>
      )}
    </div>
  )
}
