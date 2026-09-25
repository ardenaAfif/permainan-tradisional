import { memo } from 'react'
import { JUMLAH_KOTAK, TANGGA, ULAR, type Tangga, type Ular } from './config'
import { PAPAN, pusatKotak, SEL } from './geometri'
import s from './UlarTangga.module.css'

/** Tangga bambu: dua batang dengan ruas, anak tangga setiap ±26px. */
function TanggaBambu({ t }: { t: Tangga }) {
  const a = pusatKotak(t.dari)
  const b = pusatKotak(t.ke)
  const dx = b.x - a.x
  const dy = b.y - a.y
  const panjang = Math.hypot(dx, dy)
  const ux = dx / panjang
  const uy = dy / panjang
  // tegak lurus
  const nx = -uy * 13
  const ny = ux * 13
  const anak = Math.floor(panjang / 26)
  const ruas = Math.floor(panjang / 44)
  const batang = (s: 1 | -1) => ({ x1: a.x + nx * s, y1: a.y + ny * s, x2: b.x + nx * s, y2: b.y + ny * s })
  return (
    <g>
      {Array.from({ length: anak }, (_, i) => {
        const k = (i + 0.5) * (panjang / anak)
        const cx = a.x + ux * k
        const cy = a.y + uy * k
        return (
          <line key={i} x1={cx - nx} y1={cy - ny} x2={cx + nx} y2={cy + ny} stroke="var(--kunyit-gelap)" strokeWidth="5" strokeLinecap="round" />
        )
      })}
      {([1, -1] as const).map((s) => (
        <g key={s}>
          <line {...batang(s)} stroke="var(--kayu-gelap)" strokeWidth="9" strokeLinecap="round" />
          <line {...batang(s)} stroke="var(--kayu-muda)" strokeWidth="6" strokeLinecap="round" />
          <line {...batang(s)} stroke="var(--lantai)" strokeWidth="1.6" strokeLinecap="round" transform={`translate(${-ny * 0.08} ${nx * 0.08})`} />
          {Array.from({ length: ruas }, (_, i) => {
            const k = (i + 1) * (panjang / (ruas + 1))
            const cx = a.x + ux * k + nx * s
            const cy = a.y + uy * k + ny * s
            return <circle key={i} cx={cx} cy={cy} r="3.6" fill="var(--kayu-gelap)" />
          })}
        </g>
      ))}
    </g>
  )
}

/** Ular bermotif batik: badan lengkung S dari kepala ke ekor. */
function UlarBatik({ u, i }: { u: Ular; i: number }) {
  const h = pusatKotak(u.kepala)
  const e = pusatKotak(u.ekor)
  const dx = e.x - h.x
  const dy = e.y - h.y
  const panjang = Math.hypot(dx, dy)
  const amp = Math.min(46, panjang * 0.28) * (i % 2 ? 1 : -1)
  const nx = (-dy / panjang) * amp
  const ny = (dx / panjang) * amp
  const d = `M${h.x} ${h.y} C${h.x + dx * 0.33 + nx} ${h.y + dy * 0.33 + ny} ${h.x + dx * 0.66 - nx} ${h.y + dy * 0.66 - ny} ${e.x} ${e.y}`
  const sudut = (Math.atan2(dy * 0.33 + ny, dx * 0.33 + nx) * 180) / Math.PI
  return (
    <g>
      <path d={d} fill="none" stroke="var(--kayu-gelap)" strokeWidth="22" strokeLinecap="round" />
      <path d={d} fill="none" stroke="url(#ut-batik)" strokeWidth="16" strokeLinecap="round" />
      <circle cx={e.x} cy={e.y} r="5" fill="var(--kayu-gelap)" />
      <g transform={`translate(${h.x} ${h.y}) rotate(${sudut + 180})`}>
        <path d="M-24 0 L-34 -4 M-24 0 L-34 4" stroke="var(--merah-bata-gelap)" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse rx="19" ry="15" fill="var(--kayu-gelap)" />
        <ellipse rx="16" ry="12.5" fill="var(--daun-pisang-gelap)" />
        <circle cx="-6" cy="-6" r="4" fill="var(--kertas-terang)" />
        <circle cx="-6" cy="6" r="4" fill="var(--kertas-terang)" />
        <circle cx="-7" cy="-6" r="2" fill="var(--tinta-gelap)" />
        <circle cx="-7" cy="6" r="2" fill="var(--tinta-gelap)" />
      </g>
    </g>
  )
}

/** Papan 10x10 zig-zag bermotif kawung, tangga bambu, dan ular batik. Digambar sekali (memo). */
export const Papan = memo(function Papan() {
  const kotak = Array.from({ length: JUMLAH_KOTAK }, (_, i) => i + 1)
  return (
    <svg className={s.papanSvg} viewBox={`-14 -14 ${PAPAN + 28} ${PAPAN + 28}`} width={PAPAN + 28} height={PAPAN + 28} aria-hidden="true">
      <defs>
        <pattern id="ut-kawung" width="22" height="22" patternUnits="userSpaceOnUse">
          <g fill="var(--kunyit)" opacity=".22">
            <ellipse cx="11" cy="5" rx="3" ry="4.6" />
            <ellipse cx="11" cy="17" rx="3" ry="4.6" />
            <ellipse cx="5" cy="11" rx="4.6" ry="3" />
            <ellipse cx="17" cy="11" rx="4.6" ry="3" />
          </g>
        </pattern>
        <pattern id="ut-batik" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="16" height="16" fill="var(--daun-pisang-gelap)" />
          <rect width="16" height="5" fill="var(--daun-pisang)" />
          <circle cx="8" cy="11" r="2.6" fill="var(--kunyit)" />
          <circle cx="0" cy="11" r="1.4" fill="var(--cahaya-kelir)" />
          <circle cx="16" cy="11" r="1.4" fill="var(--cahaya-kelir)" />
        </pattern>
      </defs>

      {/* Bingkai kayu + pita */}
      <rect x="-14" y="-14" width={PAPAN + 28} height={PAPAN + 28} rx="18" fill="var(--kayu)" />
      <rect x="-6" y="-6" width={PAPAN + 12} height={PAPAN + 12} rx="10" fill="var(--kayu-gelap)" />

      {kotak.map((n) => {
        const p = pusatKotak(n)
        const x = p.x - SEL / 2
        const y = p.y - SEL / 2
        const genap = n % 2 === 0
        const khusus = n === 1 || n === JUMLAH_KOTAK
        return (
          <g key={n}>
            <rect x={x} y={y} width={SEL} height={SEL} fill={khusus ? 'var(--kunyit)' : genap ? 'var(--kertas-terang)' : 'var(--kertas-krem-gelap)'} />
            {!genap && !khusus && <rect x={x} y={y} width={SEL} height={SEL} fill="url(#ut-kawung)" />}
            <text x={x + 5} y={y + 20} className={s.angka}>
              {n}
            </text>
            {n === JUMLAH_KOTAK && (
              <polygon
                transform={`translate(${p.x} ${p.y + 8}) scale(.9)`}
                points="0,-18 5.3,-6 18,-5.6 8,3 11.2,16 0,9 -11.2,16 -8,3 -18,-5.6 -5.3,-6"
                fill="var(--kertas-terang)"
                stroke="var(--kayu)"
                strokeWidth="2"
              />
            )}
          </g>
        )
      })}
      <path
        d={Array.from({ length: 11 }, (_, i) => `M${i * SEL} 0 V${PAPAN} M0 ${i * SEL} H${PAPAN}`).join(' ')}
        stroke="var(--garis-krem-gelap)"
        strokeWidth="1.5"
      />

      {TANGGA.map((t) => (
        <TanggaBambu key={`t${t.dari}`} t={t} />
      ))}
      {ULAR.map((u, i) => (
        <UlarBatik key={`u${u.kepala}`} u={u} i={i} />
      ))}

    </svg>
  )
})
