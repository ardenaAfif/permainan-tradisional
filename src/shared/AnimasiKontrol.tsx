import type { JenisKontrol } from './types'
import s from './AnimasiKontrol.module.css'

const LABEL: Record<JenisKontrol, string> = {
  tap: 'Tap',
  irama: 'Tap berirama',
  joystick: 'Geser joystick',
  'swipe-tap': 'Usap ke atas, lalu tap',
  'kiri-kanan': 'Tap kiri–kanan bergantian',
  'tarik-lepas': 'Tarik, lalu lepas',
  seret: 'Seret pelan-pelan',
}

/** Ujung jari: lingkaran putih bergaris kayu. */
const Jari = ({ className }: { className?: string }) => (
  <g className={className}>
    <circle r="11" fill="var(--kertas-terang)" stroke="var(--kayu)" strokeWidth="3" />
    <circle r="4" fill="var(--kayu)" opacity=".25" />
  </g>
)

/** Animasi kecil cara kontrol di layar Kenalan Dulu. */
export function AnimasiKontrol({ jenis }: { jenis: JenisKontrol }) {
  return (
    <div className={s.wadah}>
      <svg className={s.gambar} viewBox="0 0 160 100" role="img" aria-label={`Animasi kontrol: ${LABEL[jenis]}`}>
        {jenis === 'tap' && (
          <>
            <circle cx="80" cy="54" r="26" fill="var(--kunyit)" />
            <circle className={s.riak} cx="80" cy="54" r="26" fill="none" stroke="var(--kunyit)" strokeWidth="3" />
            <g transform="translate(80 54)">
              <Jari className={s.tekan} />
            </g>
          </>
        )}
        {jenis === 'irama' && (
          <>
            <circle className={s.ketukKiri} cx="52" cy="56" r="22" fill="var(--merah-bata)" />
            <circle className={s.ketukKanan} cx="108" cy="56" r="22" fill="var(--biru-nila)" />
            <g className={s.ketukan} fill="var(--kayu)">
              <circle cx="62" cy="14" r="4" />
              <circle cx="80" cy="14" r="4" />
              <circle cx="98" cy="14" r="4" />
            </g>
          </>
        )}
        {jenis === 'joystick' && (
          <>
            <circle cx="80" cy="54" r="34" fill="var(--kertas-krem-gelap)" stroke="var(--kayu)" strokeWidth="3" />
            <g className={s.tuas}>
              <circle cx="80" cy="54" r="15" fill="var(--biru-nila)" />
            </g>
          </>
        )}
        {jenis === 'swipe-tap' && (
          <>
            <circle className={s.bola} cx="80" cy="80" r="9" fill="var(--merah-bata)" />
            <path d="M80 86 V26" stroke="var(--garis-krem-gelap)" strokeWidth="3" strokeDasharray="5 6" />
            <g className={s.usap}>
              <Jari />
            </g>
          </>
        )}
        {jenis === 'kiri-kanan' && (
          <>
            <rect className={s.ketukKiri} x="18" y="30" width="54" height="50" rx="14" fill="var(--merah-bata)" />
            <rect className={s.ketukKanan} x="88" y="30" width="54" height="50" rx="14" fill="var(--biru-nila)" />
            <text x="45" y="62" textAnchor="middle" className={s.huruf}>
              Ki
            </text>
            <text x="115" y="62" textAnchor="middle" className={s.huruf}>
              Ka
            </text>
          </>
        )}
        {jenis === 'tarik-lepas' && (
          <>
            <circle cx="112" cy="50" r="12" fill="var(--daun-pisang)" />
            <g className={s.tarik}>
              <circle cx="60" cy="50" r="10" fill="var(--biru-nila)" />
              <path className={s.garisBidik} d="M60 50 H100" stroke="var(--kayu)" strokeWidth="3" strokeDasharray="4 5" />
              <g transform="translate(60 50)">
                <Jari />
              </g>
            </g>
          </>
        )}
        {jenis === 'seret' && (
          <>
            <path d="M24 70 Q80 20 136 70" stroke="var(--garis-krem-gelap)" strokeWidth="3" fill="none" strokeDasharray="5 6" />
            <g className={s.seret}>
              <ellipse cx="0" cy="-14" rx="12" ry="14" fill="var(--biru-nila)" opacity=".85" />
              <Jari />
            </g>
          </>
        )}
      </svg>
      <span className={s.label}>{LABEL[jenis]}</span>
    </div>
  )
}
