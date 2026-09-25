/*
 * Character kit Kotak Dolanan — port TypeScript dari design/characters.js.
 * Bentuk, warna, dan pose sama persis dengan hasil Claude Design. Perubahan
 * struktur untuk animasi GSAP:
 * - Setiap bagian adalah <g data-part="..."> di dalam <g> posisi, sehingga
 *   titik asal (0,0) bagian = titik putarnya. Putar dengan
 *   gsap.to(el, { rotation, svgOrigin: '0 0' }).
 * - Rambut, penutup kepala, dan benda bawaan (kotak/buku) punya grup sendiri.
 * - Semua varian mata (data-mata) dan mulut (data-mulut) ikut dirender; yang
 *   tidak aktif disembunyikan, jadi ekspresi bisa diganti tanpa render ulang.
 * - Animasi (napas, kedip, bicara, dll.) diatur Karakter.tsx lewat GSAP.
 *
 * Warna di file ini adalah bagian dari aset gambar (bukan warna UI), sama
 * seperti gambar SVG; warna UI tetap diambil dari tokens.css.
 */
import type { GayaRambut, PenutupKepala, WarnaKulit } from '../shared/types'

export type Tokoh = 'guru' | 'bima' | 'sekar' | 'dimas' | 'avatar'
export type Pose = 'idle' | 'talk' | 'happy' | 'gobak' | 'engklek' | 'egrang'
export type Mata = 'open' | 'closed' | 'happy' | 'surprised'
export type Mulut = 'smile' | 'talk-a' | 'talk-o' | 'flat'
export const SEMUA_MATA: Mata[] = ['open', 'closed', 'happy', 'surprised']
export const SEMUA_MULUT: Mulut[] = ['smile', 'talk-a', 'talk-o', 'flat']
type Rambut = GayaRambut | 'guru' | 'none'

export interface KitOptions {
  uid: string
  who: Tokoh
  pose?: Pose
  eyes?: Mata
  mouth?: Mulut
  skin?: WarnaKulit
  hair?: GayaRambut
  headwear?: PenutupKepala
  silhouette?: boolean
  crop?: 'head'
  pivots?: boolean
  logo: string
}

const INK = '#2B211C'
const SIL = '#2A1A12'
const SKINS: [string, string][] = [
  ['#F4D2AE', '#E0B28A'],
  ['#E6B887', '#CD9A67'],
  ['#C68D5C', '#AA7445'],
  ['#9E6840', '#825330'],
  ['#6E4428', '#56331C'],
]
const HAIR: [string, string] = ['#2B211C', '#45362C']
const WHITE: [string, string] = ['#FFFDF8', '#E2D8C8']
const NILA: [string, string] = ['#2E4C7A', '#223A60']
const SHOE: [string, string] = ['#2A2320', '#4A3E37']

interface CharDef {
  skin: WarnaKulit
  hair?: Rambut
  hairC?: [string, string]
  glasses?: 'rect' | 'round'
  mustache?: boolean
  shirt?: 'batik'
  sleeve: 'long' | 'short' | 'rolled'
  pants?: [string, string]
  W?: number
  prop?: 'box' | 'book'
  headwear?: PenutupKepala | null
  bottom?: 'skirt'
  boldBrow?: boolean
}

const CHARS: Record<Tokoh, CharDef> = {
  guru: { skin: 2, hair: 'guru', hairC: ['#4F4843', '#6E665F'], glasses: 'rect', mustache: true, shirt: 'batik', sleeve: 'long', pants: ['#3F3532', '#5A4C47'], W: 82, prop: 'box' },
  bima: { skin: 3, hair: 'jabrik', sleeve: 'rolled', boldBrow: true },
  sekar: { skin: 1, headwear: 'kerudung', sleeve: 'long', bottom: 'skirt', prop: 'book' },
  dimas: { skin: 0, hair: 'belah', glasses: 'round', sleeve: 'short' },
  avatar: { skin: 2, hair: 'pendek', sleeve: 'short' },
}

const VB = '0 -30 200 412'
const VBW = '-50 -30 300 412'

interface PoseDef {
  y?: number
  rot?: number
  uL: number
  lL: number
  uR: number
  lR: number
  legL?: string
  legR?: string
  eyes: Mata
  mouth: Mulut
  brow: number
  shadow?: number
  vb?: string
  stilts?: boolean
  ground?: number
}

const POSES: Record<Pose, PoseDef> = {
  idle: { uL: 6, lL: -6, uR: -6, lR: 6, eyes: 'open', mouth: 'smile', brow: 0 },
  talk: { uL: 6, lL: -6, uR: -38, lR: -68, eyes: 'open', mouth: 'talk-a', brow: -2 },
  happy: { y: -28, uL: 150, lL: 16, uR: -150, lR: -16, legL: 'rotate(9)', legR: 'rotate(-9)', eyes: 'happy', mouth: 'talk-a', brow: -3, shadow: 0.62 },
  gobak: { rot: -5, uL: 84, lL: -14, uR: -84, lR: 14, legL: 'rotate(17)', legR: 'rotate(-17)', eyes: 'open', mouth: 'flat', brow: 0, vb: VBW },
  engklek: { y: -22, uL: 104, lL: -26, uR: -66, lR: 32, legL: 'rotate(3)', legR: 'translate(0,-6) rotate(-30) scale(1,.64)', eyes: 'open', mouth: 'flat', brow: 0, shadow: 0.7, vb: VBW },
  egrang: { y: -70, uL: 14, lL: -12, uR: -14, lR: 12, stilts: true, eyes: 'open', mouth: 'flat', brow: 0, vb: '-10 -80 220 486', ground: 400 },
}

export function karakterSvg(a: KitOptions): string {
  const who = a.who
  const C: CharDef = { ...CHARS[who] }
  if (a.skin != null) C.skin = a.skin
  if (a.hair) C.hair = a.hair
  if (a.headwear) C.headwear = a.headwear === 'none' ? null : a.headwear
  if (who === 'avatar' && C.headwear === 'kerudung') {
    C.sleeve = 'long'
    C.bottom = 'skirt'
    C.hair = 'none'
  }
  const P: PoseDef = { ...POSES[a.pose ?? 'idle'] }
  if (a.eyes) P.eyes = a.eyes
  if (a.mouth) P.mouth = a.mouth
  if (P.eyes === 'surprised') P.brow = -5

  const sil = !!a.silhouette
  const u = a.uid
  const face = !sil
  const col = (c: string) => (sil ? SIL : c)
  const sk = (SKINS[C.skin] ?? SKINS[2]!).map(col)
  const hc = (C.hairC ?? HAIR).map(col)
  const sh = (C.shirt === 'batik' ? ['url(#' + u + '-batik)', '#4A2C17'] : WHITE).map(col)
  const pants = (C.pants ?? NILA).map(col)
  const shoe = SHOE.map(col)
  const kc = WHITE.map(col)
  const W = C.W ?? 72
  const long = C.sleeve === 'long'
  const skirt = C.bottom === 'skirt'
  const kerudung = C.headwear === 'kerudung'
  const pvm = a.pivots && !sil ? '<circle r="4.2" fill="#B5462F" stroke="#fff" stroke-width="1.8"/>' : ''
  /** Bagian beranimasi: <g posisi><g data-part transform=putaran>…</g></g>. */
  const part = (n: string, pos: string, putar: string, inner: string) =>
    `<g transform="${pos}"><g id="${u}-${n}" data-part="${n}"${putar ? ` transform="${putar}"` : ''}>${inner}${pvm}</g></g>`
  const grup = (n: string, inner: string) => (inner ? `<g id="${u}-${n}" data-part="${n}">${inner}</g>` : '')
  const abs = (x: number, y: number, s: string) => `<g transform="translate(${-x},${-y})">${s}</g>`

  function prop(kind: CharDef['prop']): string {
    if (kind === 'box')
      return `<path d="M-7 4 L-16 22 M7 4 L16 22" stroke="${col('#4A2C17')}" stroke-width="3" fill="none"/>
        <rect x="-32" y="20" width="64" height="46" rx="6" fill="${col('#6B4226')}"/>
        <rect x="-32" y="20" width="64" height="12" rx="5" fill="${col('#4A2C17')}"/>
        <rect x="-6" y="28" width="12" height="10" rx="2" fill="${col('#E8A33D')}"/>
        <path d="M-26 46 H26 M-26 56 H26" stroke="${col('#4A2C17')}" stroke-width="2" opacity="${sil ? 0 : 0.45}"/>`
    if (kind === 'book')
      return `<g transform="rotate(8)"><rect x="-28" y="-16" width="30" height="38" rx="3" fill="${col(NILA[0])}"/><rect x="-28" y="-14" width="4" height="34" fill="${col('#FFF3DC')}"/><rect x="-18" y="-8" width="14" height="4" rx="2" fill="${col('#E8A33D')}"/></g>`
    return ''
  }

  function arm(s: 'l' | 'r'): string {
    const L = s === 'l'
    const sx = L ? 100 - (W / 2 - 8) : 100 + (W / 2 - 8)
    let up = `<rect x="-10" y="-8" width="20" height="58" rx="10" fill="${long ? sh[0] : sk[0]}"/>`
    if (C.sleeve === 'short') up += `<rect x="-12" y="-10" width="24" height="34" rx="11" fill="${sh[0]}"/><rect x="-12" y="19" width="24" height="5" rx="2.5" fill="${sh[1]}"/>`
    if (C.sleeve === 'rolled') up += `<rect x="-12" y="-10" width="24" height="40" rx="11" fill="${sh[0]}"/><rect x="-12.5" y="26" width="25" height="10" rx="5" fill="${sh[1]}"/>`
    let lo = `<rect x="-9" y="-6" width="18" height="52" rx="9" fill="${long ? sh[0] : sk[0]}"/>`
    if (long) lo += `<rect x="-10" y="36" width="20" height="8" rx="4" fill="${sh[1]}"/>`
    const hand =
      (L && C.prop ? grup('prop', prop(C.prop)) : '') +
      `<circle cy="3" r="11" fill="${sk[0]}"/>` +
      (face ? `<path d="M-6 9 Q0 13 6 9" stroke="${sk[1]}" stroke-width="2.5" fill="none" stroke-linecap="round"/>` : '')
    return part(
      'arm-upper-' + s,
      `translate(${sx},122)`,
      `rotate(${L ? P.uL : P.uR})`,
      up + part('arm-lower-' + s, 'translate(0,48)', `rotate(${L ? P.lL : P.lR})`, lo + part('hand-' + s, 'translate(0,46)', '', hand)),
    )
  }

  function leg(s: 'l' | 'r'): string {
    const L = s === 'l'
    const cx = L ? 86 : 114
    const t = (L ? P.legL : P.legR) ?? ''
    const sx = L ? -17 : -13
    const sho = part('shoe-' + s, 'translate(0,112)', '', `<rect x="${sx}" y="-6" width="30" height="20" rx="10" fill="${shoe[0]}"/><rect x="${sx}" y="9" width="30" height="5" rx="2.5" fill="${shoe[1]}"/>`)
    return part(
      'leg-' + s,
      `translate(${cx},246)`,
      t,
      `<rect x="-11" y="-6" width="22" height="118" rx="10" fill="${pants[0]}"/>` +
        (face && !skirt ? `<rect x="-11" y="96" width="22" height="6" rx="3" fill="${pants[1]}"/>` : '') +
        sho,
    )
  }

  function torso(): string {
    const x0 = 100 - W / 2
    const shirt = `<rect x="${x0}" y="106" width="${W}" height="${C.shirt === 'batik' ? 124 : 112}" rx="${W > 76 ? 26 : 20}" fill="${sh[0]}"/>`
    const waist = `<rect x="${x0 + 4}" y="210" width="${W - 8}" height="42" rx="12" fill="${pants[0]}"/>`
    let s = `<rect x="91" y="92" width="18" height="24" rx="6" fill="${sk[1]}"/>`
    if (C.shirt === 'batik') s += waist + shirt
    else if (skirt)
      s += shirt + `<path d="M70 206 L130 206 L144 352 Q100 360 56 352 Z" fill="${pants[0]}"/>` + (face ? `<path d="M86 214 L80 352 M114 214 L120 352" stroke="${pants[1]}" stroke-width="3"/>` : '')
    else s += shirt + waist + `<rect x="${x0 + 4}" y="210" width="${W - 8}" height="7" rx="3" fill="${col('#2A2320')}"/>`
    if (face) {
      s += `<rect x="98.5" y="124" width="3" height="${C.shirt === 'batik' ? 104 : 84}" rx="1.5" fill="${sh[1]}"/>`
      if (!kerudung) s += `<path d="M86 106 L100 124 L92 132 L80 112Z M114 106 L100 124 L108 132 L120 112Z" fill="${sh[1]}"/>`
      if (C.shirt !== 'batik')
        s += `<rect x="105" y="140" width="22" height="19" rx="4" fill="${sh[1]}"/><image href="${a.logo}" x="107" y="141.5" width="18" height="14.5" preserveAspectRatio="xMidYMid meet"/>`
    }
    return part('torso', 'translate(100,244)', '', abs(100, 244, s))
  }

  function hair(st: Rambut | undefined): string {
    const f0 = hc[0]
    const f1 = hc[1]
    const hl = (d: string) => (face ? `<path d="${d}" stroke="${f1}" stroke-width="4" fill="none" stroke-linecap="round"/>` : '')
    const cap = `<path d="M64 68 Q60 22 100 20 Q140 22 136 68 Q134 50 124 44 Q112 50 100 48 Q84 50 76 44 Q66 50 64 68Z" fill="${f0}"/>`
    switch (st) {
      case 'none':
        return ''
      case 'jabrik':
        return `<polygon points="64,66 60,40 68,36 62,14 82,28 88,4 102,24 116,4 120,28 140,18 134,40 140,44 136,66 130,48 100,42 70,48" fill="${f0}"/>` + hl('M84 34 L90 22 M108 34 L114 22')
      case 'belah':
        return `<path d="M64 70 Q56 22 104 20 Q144 22 136 68 Q132 44 110 40 Q94 52 70 50 Q66 58 64 70Z" fill="${f0}"/>` + hl('M110 24 Q106 32 110 40')
      case 'keriting':
        return (
          cap +
          [[68, 48], [74, 32], [88, 22], [104, 20], [118, 24], [130, 34], [134, 50], [64, 60], [136, 62], [82, 40], [120, 40]]
            .map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="${i > 8 ? 7 : 11}" fill="${i > 8 ? f1 : f0}"/>`)
            .join('')
        )
      case 'kuncir':
        return `<path d="M64 70 Q60 20 100 20 Q140 20 136 70 Q130 46 112 42 Q100 50 88 42 Q70 46 64 70Z" fill="${f0}"/>` + hl('M80 30 Q100 22 120 30')
      case 'guru':
        return `<path d="M66 60 Q64 24 100 22 Q136 24 134 60 Q130 44 118 40 Q100 36 82 40 Q70 44 66 60Z" fill="${f0}"/><rect x="62" y="48" width="8" height="20" rx="4" fill="${f1}"/><rect x="130" y="48" width="8" height="20" rx="4" fill="${f1}"/>`
      default:
        return cap + hl('M80 30 Q100 22 120 30')
    }
  }

  function eye(x: number, t: Mata): string {
    const st = `stroke="${INK}" stroke-width="3.2" fill="none" stroke-linecap="round"`
    if (t === 'closed') return `<path d="M${x - 6} 0 Q${x} 5 ${x + 6} 0" ${st}/>`
    if (t === 'happy') return `<path d="M${x - 6} 3 Q${x} -5 ${x + 6} 3" ${st}/>`
    if (t === 'surprised') return `<circle cx="${x}" r="7" fill="#fff" stroke="${INK}" stroke-width="2"/><circle cx="${x}" cy=".5" r="3.2" fill="${INK}"/>`
    return `<ellipse cx="${x}" rx="4.2" ry="5.6" fill="${INK}"/><circle cx="${x + 1.6}" cy="-2" r="1.6" fill="#fff"/>`
  }

  const MOUTH: Record<Mulut, string> = {
    smile: `<path d="M-9 -2 Q0 8 9 -2" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
    'talk-a': `<path d="M-10 -3 Q0 -4 10 -3 Q8 11 0 11 Q-8 11 -10 -3Z" fill="#5A2A1E"/><ellipse cy="7" rx="5" ry="2.6" fill="#C8604A"/>`,
    'talk-o': `<ellipse cy="3" rx="5.5" ry="7" fill="#5A2A1E"/>`,
    flat: `<path d="M-7 2 L7 2" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`,
  }

  function head(): string {
    let s = ''
    if (kerudung) s += `<path d="M56 66 Q56 14 100 14 Q144 14 144 66 L150 122 Q100 142 50 122 Z" fill="${kc[0]}"/>`
    if (C.hair === 'kuncir' && !kerudung)
      s += grup('hair-back', `<ellipse cx="142" cy="76" rx="11" ry="24" transform="rotate(-18 142 76)" fill="${hc[0]}"/><circle cx="135" cy="52" r="5" fill="${col('#E8A33D')}"/>`)
    if (!kerudung)
      s += `<circle cx="66" cy="68" r="8" fill="${sk[0]}"/><circle cx="134" cy="68" r="8" fill="${sk[0]}"/>` + (face ? `<circle cx="66" cy="68" r="3.5" fill="${sk[1]}"/><circle cx="134" cy="68" r="3.5" fill="${sk[1]}"/>` : '')
    s += `<ellipse cx="100" cy="64" rx="${kerudung ? 31 : 34}" ry="${kerudung ? 36 : 38}" fill="${sk[0]}"/>`
    if (face)
      s += `<ellipse cx="100" cy="77" rx="3.6" ry="2.6" fill="${sk[1]}"/><circle cx="79" cy="82" r="5.5" fill="#B5462F" opacity=".16"/><circle cx="121" cy="82" r="5.5" fill="#B5462F" opacity=".16"/>`
    s += grup('hair', hair(kerudung ? 'none' : C.hair))
    let wear = ''
    if (kerudung)
      wear += `<path d="M68 62 Q66 28 100 28 Q134 28 132 62 Q120 44 100 44 Q80 44 68 62Z" fill="${kc[0]}"/>` + (face ? `<path d="M72 100 Q100 122 128 100 L132 114 Q100 132 68 114Z" fill="${kc[1]}"/>` : '')
    if (C.headwear === 'peci')
      wear += `<path d="M66 42 L70 14 Q100 8 130 14 L134 42 Q100 36 66 42Z" fill="${col('#24211F')}"/>` + (face ? `<path d="M67 35 Q100 29 133 35 L134 42 Q100 36 66 42Z" fill="#3E3935"/>` : '')
    s += grup('headwear', wear)
    if (C.mustache) s += grup('mustache', `<path d="M86 84 Q100 76 114 84 Q107 88 100 85 Q93 88 86 84Z" fill="${hc[0]}"/>`)
    let inner = abs(100, 108, s)
    if (face) {
      const bh = C.boldBrow ? 6 : 4.5
      inner += part(
        'brows',
        'translate(0,-55)',
        `translate(0,${P.brow})`,
        `<rect x="-22" y="${-bh / 2}" width="15" height="${bh}" rx="${bh / 2}" fill="${hc[0]}" transform="rotate(-4 -14.5 0)"/><rect x="7" y="${-bh / 2}" width="15" height="${bh}" rx="${bh / 2}" fill="${hc[0]}" transform="rotate(4 14.5 0)"/>`,
      )
      const mata = SEMUA_MATA.map((m) => `<g data-mata="${m}"${m === P.eyes ? '' : ' display="none"'}>${eye(-14, m)}${eye(14, m)}</g>`).join('')
      inner += part('eyes', 'translate(0,-42)', '', `<g data-anim="kedip">${mata}</g>`)
      if (C.glasses === 'rect')
        inner += part('glasses', 'translate(0,-42)', '', `<g stroke="${INK}" stroke-width="2.6" fill="#fff" fill-opacity=".18"><rect x="-26" y="-9" width="23" height="17" rx="5"/><rect x="3" y="-9" width="23" height="17" rx="5"/></g><path d="M-3 -3 Q0 -5 3 -3 M-26 -4 L-33 -2 M26 -4 L33 -2" stroke="${INK}" stroke-width="2.6" fill="none"/>`)
      if (C.glasses === 'round')
        inner += part('glasses', 'translate(0,-42)', '', `<g stroke="${INK}" stroke-width="2.6" fill="#fff" fill-opacity=".18"><circle cx="-14" r="11"/><circle cx="14" r="11"/></g><path d="M-3 -2 Q0 -4 3 -2 M-25 -3 L-33 -1 M25 -3 L33 -1" stroke="${INK}" stroke-width="2.6" fill="none"/>`)
      const my = C.mustache ? -16 : -20
      const m = SEMUA_MULUT.map((k) => `<g data-mulut="${k}"${k === P.mouth ? '' : ' display="none"'}>${MOUTH[k]}</g>`).join('')
      inner += part('mouth', `translate(0,${my})`, '', m)
    }
    return part('head', 'translate(100,108)', '', inner)
  }

  const defs =
    C.shirt === 'batik' && !sil
      ? `<defs><pattern id="${u}-batik" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="#6B4226"/><g fill="#E8A33D"><ellipse cx="9" cy="3.6" rx="2.3" ry="3.4"/><ellipse cx="9" cy="14.4" rx="2.3" ry="3.4"/><ellipse cx="3.6" cy="9" rx="3.4" ry="2.3"/><ellipse cx="14.4" cy="9" rx="3.4" ry="2.3"/><circle r="1.6"/><circle cx="18" r="1.6"/><circle cy="18" r="1.6"/><circle cx="18" cy="18" r="1.6"/></g></pattern></defs>`
      : ''
  const ground = P.ground ?? 374
  const shadow = sil ? '' : `<ellipse cx="100" cy="${ground}" rx="${48 * (P.shadow ?? 1)}" ry="7" fill="#4A2C17" opacity=".13"/>`
  const stilts = P.stilts
    ? `<g fill="${col('#8A5A34')}"><rect x="54" y="186" width="9" height="284" rx="4"/><rect x="137" y="186" width="9" height="284" rx="4"/><rect x="54" y="370" width="26" height="8" rx="3"/><rect x="120" y="370" width="26" height="8" rx="3"/></g>`
    : ''
  const upper = `<g data-part="upper">${torso()}${arm('l')}${arm('r')}${head()}</g>`
  const body = `<g transform="translate(0,${P.y ?? 0}) rotate(${P.rot ?? 0} 100 300)"><g data-part="body">${leg('l')}${leg('r')}${upper}</g></g>`
  const body2 = P.stilts ? grup('stilts', `<g transform="translate(0,${P.y})">${stilts}</g>`) : ''
  const vb = a.crop === 'head' ? '46 -2 108 122' : (P.vb ?? VB)
  return `<svg viewBox="${vb}" preserveAspectRatio="xMidYMax meet" style="${a.crop === 'head' ? 'overflow:hidden' : ''}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${defs}${shadow}<g id="${u}-root" data-part="root">${body2}${body}</g></svg>`
}
