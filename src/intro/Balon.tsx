import type { CSSProperties } from 'react'
import { STAGE_H, STAGE_W } from '../app/stage/stageCoords'
import { NAMA_TOKOH, type Baris } from './naskah'
import { TEKS_MIN, TEKS_PANGGUNG, type ModeBalon } from './modeBalon'
import s from './Balon.module.css'

interface Props {
  baris: Baris
  scale: number
  mode: ModeBalon
}

/** Balon kata (subtitle selalu tampil) di dekat tokoh yang bicara. */
export function Balon({ baris, scale, mode }: Props) {
  const { balon } = baris
  const narasi = baris.gaya === 'narasi'
  const nama = narasi ? `${NAMA_TOKOH[baris.tokoh]} · narasi` : NAMA_TOKOH[baris.tokoh]
  const lebarPanggung = STAGE_W * scale
  const tinggiPanggung = STAGE_H * scale

  let gaya: CSSProperties
  let ekor = balon.ekor
  let ekorX = balon.ekorX

  if (mode === 'panel') {
    // Ekor menunjuk ke tokoh di panggung (di atas panel).
    const titik = balon.ekor === 'kiri' ? balon.x - 30 : balon.ekor === 'kanan' ? balon.x + balon.lebar + 30 : balon.x + balon.ekorX
    const px = Math.min(Math.max(titik * scale, 36), lebarPanggung - 36)
    ekor = narasi ? 'tanpa' : 'bawah'
    // Diletakkan di wadah panel (Intro), 12px dari tepi kiri layar.
    gaya = { '--u': 0.75, '--ekor-x': `${px - 12}px` } as CSSProperties
  } else {
    // u = px layar per px storyboard. Mode sempit membesarkan balon supaya teks ≥ 16px.
    const u = mode === 'panggung' ? scale : TEKS_MIN / TEKS_PANGGUNG
    const tepi = mode === 'panggung' ? 0 : 8
    const lebar = Math.min(balon.lebar * u, lebarPanggung - tepi * 2)
    if (narasi) {
      const kiri = Math.max(tepi, (lebarPanggung - lebar) / 2)
      gaya = { '--u': u, left: kiri, width: lebar, bottom: Math.max(tepi, 46 * scale) } as CSSProperties
    } else {
      const kiri = Math.min(Math.max(balon.x * scale, tepi), lebarPanggung - lebar - tepi)
      const atas = Math.min(Math.max(balon.y * scale, tepi + 14), tinggiPanggung * 0.7)
      // Geser ekor bawah supaya tetap menunjuk titik yang sama walau balon digeser.
      if (balon.ekor === 'bawah') {
        const titik = (balon.x + balon.ekorX) * scale
        ekorX = Math.min(Math.max(titik - kiri, 28 * u), lebar - 40 * u) / u
      }
      gaya = { '--u': u, left: kiri, top: atas, width: lebar } as CSSProperties
    }
    if (ekor === 'bawah') gaya = { ...gaya, '--ekor-x': `calc(${ekorX}px * var(--u))` } as CSSProperties
  }

  return (
    <div className={`${s.balon} ${s[mode]} ${narasi ? s.narasi : ''}`} style={gaya}>
      <span className={`${s.nama} ${s[baris.tokoh]}`}>{nama}</span>
      {ekor !== 'tanpa' && <span className={`${s.ekor} ${s['ekor-' + ekor]}`} aria-hidden="true" />}
      <p className={s.teks}>“{baris.teks}”</p>
    </div>
  )
}
