/*
 * Gambar benda permainan — port dari design/objects.js (flat geometris).
 * Warna di sini adalah bagian dari ilustrasi, bukan warna UI.
 */
import type { Benda } from '../types'

export type JenisBenda = Benda | 'kotak'

const W = '#FFF8EA'

export const BENDA_SVG: Record<JenisBenda, string> = {
  dadu: `<g transform="rotate(-10 100 80)"><rect x="52" y="34" width="96" height="96" rx="20" fill="#B5462F"/><rect x="52" y="112" width="96" height="18" rx="9" fill="#8A3321"/><g fill="${W}"><circle cx="76" cy="58" r="9"/><circle cx="100" cy="80" r="9"/><circle cx="124" cy="102" r="9"/></g></g>`,
  papan: `<g transform="rotate(-6 100 80)"><rect x="40" y="22" width="120" height="120" rx="12" fill="#6B4226"/><rect x="50" y="32" width="100" height="100" rx="4" fill="#E8C68A"/><g stroke="#6B4226" stroke-width="3"><path d="M50 32 L150 132 M150 32 L50 132 M100 32 V132 M50 82 H150 M75 32 V132 M125 32 V132 M50 57 H150 M50 107 H150"/></g><g><circle cx="75" cy="57" r="9" fill="#2E4C7A"/><circle cx="125" cy="57" r="9" fill="#2E4C7A"/><circle cx="100" cy="82" r="9" fill="#2E4C7A"/><circle cx="75" cy="107" r="9" fill="#B5462F"/><circle cx="125" cy="107" r="9" fill="#B5462F"/></g></g>`,
  gacuk: `<rect x="30" y="118" width="140" height="10" rx="5" fill="#fff" opacity=".7"/><rect x="62" y="46" width="76" height="76" fill="none" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><ellipse cx="100" cy="92" rx="34" ry="22" fill="#6E9F3D"/><ellipse cx="100" cy="86" rx="34" ry="20" fill="#8BBE54"/>`,
  kapur: `<g transform="rotate(-28 100 80)"><rect x="40" y="66" width="120" height="30" rx="15" fill="${W}"/><rect x="40" y="84" width="120" height="12" rx="6" fill="#E2D8C8"/><rect x="118" y="66" width="42" height="30" rx="15" fill="#E8A33D"/></g><path d="M28 136 Q70 120 110 134 T172 130" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".85"/>`,
  bekel: `<circle cx="84" cy="72" r="36" fill="#B5462F"/><path d="M52 64 Q84 84 116 64" stroke="#E8A33D" stroke-width="7" fill="none"/><circle cx="84" cy="44" r="8" fill="#fff" opacity=".35"/><g fill="#E8C68A" stroke="#6B4226" stroke-width="2"><path d="M134 116 l10 -8 l10 8 l-10 8z"/><path d="M150 132 l10 -8 l10 8 l-10 8z"/><path d="M122 138 l10 -8 l10 8 l-10 8z"/></g>`,
  bakiak: `<g transform="rotate(-8 100 80)"><rect x="30" y="54" width="140" height="28" rx="12" fill="#8A5A34"/><rect x="30" y="74" width="140" height="8" rx="4" fill="#6B4226"/><rect x="30" y="96" width="140" height="28" rx="12" fill="#8A5A34"/><rect x="30" y="116" width="140" height="8" rx="4" fill="#6B4226"/><g fill="#B5462F"><rect x="46" y="44" width="16" height="22" rx="5"/><rect x="92" y="44" width="16" height="22" rx="5"/><rect x="138" y="44" width="16" height="22" rx="5"/><rect x="46" y="86" width="16" height="22" rx="5"/><rect x="92" y="86" width="16" height="22" rx="5"/><rect x="138" y="86" width="16" height="22" rx="5"/></g></g>`,
  egrang: `<g transform="rotate(6 100 80)"><rect x="66" y="10" width="12" height="140" rx="6" fill="#8A5A34"/><rect x="122" y="10" width="12" height="140" rx="6" fill="#8A5A34"/><rect x="50" y="98" width="30" height="12" rx="4" fill="#6B4226"/><rect x="120" y="98" width="30" height="12" rx="4" fill="#6B4226"/><rect x="66" y="10" width="12" height="16" rx="6" fill="#E8A33D"/><rect x="122" y="10" width="12" height="16" rx="6" fill="#E8A33D"/></g>`,
  kelereng: `<circle cx="78" cy="82" r="32" fill="#2E4C7A"/><path d="M58 70 Q78 96 100 76" stroke="#E8A33D" stroke-width="7" fill="none"/><circle cx="130" cy="62" r="20" fill="#6E9F3D"/><path d="M118 56 Q130 72 144 58" stroke="#FFD58A" stroke-width="5" fill="none"/><circle cx="138" cy="112" r="16" fill="#B5462F"/><circle cx="68" cy="66" r="7" fill="#fff" opacity=".5"/><circle cx="124" cy="54" r="4.5" fill="#fff" opacity=".5"/><circle cx="133" cy="106" r="4" fill="#fff" opacity=".5"/>`,
  balon: `<ellipse cx="96" cy="74" rx="44" ry="50" fill="#4F8FC9"/><ellipse cx="96" cy="82" rx="44" ry="42" fill="#3A76B0" opacity=".45"/><path d="M90 122 L102 122 L96 132Z" fill="#3A76B0"/><ellipse cx="78" cy="50" rx="10" ry="14" fill="#fff" opacity=".45"/><circle cx="150" cy="118" r="7" fill="#4F8FC9"/><circle cx="160" cy="98" r="4" fill="#4F8FC9"/>`,
  kotak: `<rect x="26" y="58" width="148" height="92" rx="14" fill="#6B4226"/><rect x="26" y="58" width="148" height="18" fill="#4A2C17"/><path d="M34 90 H166 M34 112 H166 M34 134 H166" stroke="#4A2C17" stroke-width="3" opacity=".45"/><g transform="rotate(-14 26 58)"><rect x="22" y="30" width="156" height="30" rx="10" fill="#8A5A34"/><rect x="22" y="50" width="156" height="10" rx="5" fill="#6B4226"/></g><rect x="88" y="66" width="24" height="20" rx="4" fill="#E8A33D"/><circle cx="100" cy="76" r="4" fill="#4A2C17"/>`,
}

/** Warna latar kartu per benda (dari design/objects.js). */
export const BENDA_LATAR: Record<JenisBenda, string> = {
  dadu: '#F6D89C',
  papan: '#EFD9B4',
  gacuk: '#9A8672',
  kapur: '#6E9F3D',
  bekel: '#F3D9CF',
  bakiak: '#E7D3B0',
  egrang: '#CFE0EE',
  kelereng: '#C9B08A',
  balon: '#D6E6F2',
  kotak: 'transparent',
}
