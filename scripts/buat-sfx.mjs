/**
 * Membuat efek suara intro, layar, dan Ular Tangga dengan sintesis (tanpa rekaman dari luar,
 * jadi bebas lisensi). Palet bunyi: bilah logam gamelan (laras slendro), bambu angklung,
 * dan kayu kentongan, sesuai brief.
 *
 *   npm run sfx      # → audio-mentah/sfx/*.wav, lalu jalankan npm run audio
 *
 * Hasilnya bisa ditimpa rekaman asli: taruh file dengan nama sama di audio-mentah/sfx/
 * dan hapus resepnya dari daftar RESEP di bawah.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SR = 44100
const TUJUAN = join('audio-mentah', 'sfx')

// ── Dasar ────────────────────────────────────────────────────

/** Acak berbenih supaya hasil sama setiap kali dibuat. */
let benih = 7
const acak = () => {
  benih = (benih * 1664525 + 1013904223) >>> 0
  return benih / 2 ** 32
}
const derau = () => acak() * 2 - 1

const kosong = (detik) => new Float32Array(Math.ceil(detik * SR))

/** Tambahkan `src` ke `dst` mulai detik `t` dengan penguatan `g`. */
function tambah(dst, src, t = 0, g = 1) {
  const o = Math.round(t * SR)
  for (let i = 0; i < src.length && o + i < dst.length; i++) if (o + i >= 0) dst[o + i] += src[i] * g
  return dst
}

/** Nada laras slendro (langkah ±240 sen) dari nada dasar `dasar`. */
const slendro = (k, dasar = 392) => dasar * 2 ** ((k * 240) / 1200)

/** Filter biquad (resep RBJ). */
function biquad(x, jenis, f, q = 0.707) {
  const w = (2 * Math.PI * f) / SR
  const a = Math.sin(w) / (2 * q)
  const c = Math.cos(w)
  let b0, b1, b2
  if (jenis === 'lp') [b0, b1, b2] = [(1 - c) / 2, 1 - c, (1 - c) / 2]
  else if (jenis === 'hp') [b0, b1, b2] = [(1 + c) / 2, -(1 + c), (1 + c) / 2]
  else [b0, b1, b2] = [a, 0, -a] // bp
  const a0 = 1 + a
  const a1 = -2 * c
  const a2 = 1 - a
  const y = new Float32Array(x.length)
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0
  for (let i = 0; i < x.length; i++) {
    const v = (b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0
    x2 = x1; x1 = x[i]; y2 = y1; y1 = v
    y[i] = v
  }
  return y
}

/** Gema ruang sederhana (Schroeder): 4 comb + 2 allpass. */
function gema(x, basah = 0.3, ekor = 1.2) {
  const y = new Float32Array(x.length + Math.ceil(ekor * SR))
  y.set(x)
  const kering = Float32Array.from(y)
  const comb = [1557, 1617, 1491, 1422].map((d) => {
    const buf = new Float32Array(d)
    let i = 0
    const fb = 0.8
    return (v) => {
      const o = buf[i]
      buf[i] = v + o * fb
      i = (i + 1) % d
      return o
    }
  })
  const allpass = [225, 556].map((d) => {
    const buf = new Float32Array(d)
    let i = 0
    return (v) => {
      const o = buf[i]
      const w = v + o * 0.5
      buf[i] = w
      i = (i + 1) % d
      return o - w * 0.5
    }
  })
  for (let n = 0; n < y.length; n++) {
    let v = 0
    for (const c of comb) v += c(kering[n] * 0.25)
    for (const a of allpass) v = a(v)
    y[n] = kering[n] * (1 - basah) + v * basah
  }
  return y
}

/** Samakan puncak ke `puncak`, lalu fade pendek di ujung supaya tidak berbunyi "klik". */
function rapikan(x, puncak) {
  let m = 0
  for (const v of x) m = Math.max(m, Math.abs(v))
  const g = m ? puncak / m : 0
  const fade = Math.min(x.length, Math.round(0.01 * SR))
  for (let i = 0; i < x.length; i++) {
    let e = 1
    if (i < 32) e = i / 32
    if (i > x.length - fade) e = (x.length - i) / fade
    x[i] *= g * e
  }
  // Buang hening di akhir.
  let akhir = x.length
  while (akhir > 0 && Math.abs(x[akhir - 1]) < 0.0008) akhir--
  return x.subarray(0, Math.max(akhir, 1))
}

/** Turunkan pelan ke nol di `detik` terakhir (buffer instrumen tidak berhenti mendadak). */
function ujung(x, detik = 0.25) {
  const n = Math.min(x.length, Math.round(detik * SR))
  for (let i = 0; i < n; i++) x[x.length - 1 - i] *= i / n
  return x
}

// ── Instrumen ────────────────────────────────────────────────

/**
 * Bilah logam gamelan (saron/bonang): parsial tak harmonis, parsial tinggi cepat hilang,
 * dan pasangan nada yang sedikit sumbang (ombak) khas gamelan.
 */
function logam(f, detik = 1.2, terang = 1) {
  const x = kosong(detik)
  const parsial = [
    [1, 1, 1],
    [2.76, 0.35 * terang, 2.6],
    [5.4, 0.12 * terang, 5],
  ]
  for (let i = 0; i < x.length; i++) {
    const t = i / SR
    let v = 0
    for (const [r, a, cepat] of parsial) {
      const e = Math.exp((-t * cepat * 3) / detik)
      v += a * e * (Math.sin(2 * Math.PI * f * r * t) + 0.6 * Math.sin(2 * Math.PI * (f * r + 3.5) * t))
    }
    // Pukulan panggul: derau sangat pendek.
    if (t < 0.006) v += derau() * 0.4 * (1 - t / 0.006) * terang
    x[i] = v
  }
  return ujung(x, detik * 0.3)
}

/** Bambu angklung: tabung bambu digoyang (pukulan berulang ±14 kali per detik). */
function angklung(f, detik = 0.45) {
  const x = kosong(detik + 0.25)
  const satu = (lama) => {
    const p = kosong(lama)
    for (let i = 0; i < p.length; i++) {
      const t = i / SR
      const e = Math.exp(-t * 22)
      p[i] = e * (Math.sin(2 * Math.PI * f * t) + 0.45 * Math.sin(2 * Math.PI * f * 2 * t) + 0.2 * Math.sin(2 * Math.PI * f * 3.02 * t))
      if (t < 0.003) p[i] += derau() * 0.5
    }
    return p
  }
  const jarak = 1 / 14
  for (let t = 0, k = 0; t < detik; t += jarak, k++) tambah(x, satu(0.25), t + (acak() - 0.5) * 0.008, k === 0 ? 1 : 0.7)
  return x
}

/** Ketukan kayu (kentongan/papan): nada turun cepat + klik. */
function kayu(f, detik = 0.08, rongga = 1) {
  const x = kosong(detik)
  let fase = 0
  for (let i = 0; i < x.length; i++) {
    const t = i / SR
    const fr = f * (1 + 0.5 * Math.exp(-t * 120))
    fase += (2 * Math.PI * fr) / SR
    const e = Math.exp((-t * 5) / detik)
    x[i] = e * (Math.sin(fase) + 0.3 * rongga * Math.sin(fase * 2.3)) + (t < 0.004 ? derau() * 0.6 : 0)
  }
  return x
}

/** Gong ageng: nada rendah panjang dengan ombak lambat. */
function gong(f = 82, detik = 2.6) {
  const x = kosong(detik)
  for (let i = 0; i < x.length; i++) {
    const t = i / SR
    const serang = Math.min(1, t / 0.02)
    const e = Math.exp((-t * 2.2) / detik)
    const ombak = 1 + 0.35 * Math.sin(2 * Math.PI * 1.6 * t)
    x[i] = serang * e * ombak * (Math.sin(2 * Math.PI * f * t) + 0.4 * Math.sin(2 * Math.PI * f * 2.01 * t) * Math.exp(-t * 2) + 0.15 * Math.sin(2 * Math.PI * f * 2.97 * t) * Math.exp(-t * 3))
  }
  return ujung(x, detik * 0.4)
}

/** Desir derau (kertas, udara) dengan selubung naik-turun. */
function desir(detik, f, q = 1, puncakDi = 0.4) {
  const x = kosong(detik)
  for (let i = 0; i < x.length; i++) x[i] = derau()
  const y = biquad(x, 'bp', f, q)
  for (let i = 0; i < y.length; i++) {
    const r = i / y.length
    y[i] *= r < puncakDi ? r / puncakDi : (1 - r) / (1 - puncakDi)
  }
  return y
}

/**
 * Derit kayu (pintu, tutup kotak): gesekan tersendat (stick-slip) berupa klik kecil
 * dengan laju berubah, lewat resonansi papan kayu.
 */
function derit(detik, lajuAwal, lajuAkhir, resonansi) {
  const x = kosong(detik)
  let t = 0
  while (t < detik) {
    const r = t / detik
    const laju = lajuAwal + (lajuAkhir - lajuAwal) * r + Math.sin(r * 9) * 8
    const i = Math.round(t * SR)
    const kuat = Math.sin(Math.PI * Math.min(1, r * 1.15)) * (0.7 + 0.3 * acak())
    for (let k = 0; k < 40 && i + k < x.length; k++) x[i + k] += kuat * Math.exp(-k / 4) * (k % 2 ? -0.6 : 1)
    t += 1 / laju
  }
  let y = new Float32Array(x.length)
  for (const f of resonansi) {
    const b = biquad(x, 'bp', f, 9)
    for (let i = 0; i < y.length; i++) y[i] += b[i]
  }
  y = biquad(y, 'hp', 250)
  return y
}

/** Nada sinus dengan pitch bergeser (slide whistle, per), plus vibrato. */
function geser(f0, f1, detik, vibrato = 0, lajuVib = 6) {
  const x = kosong(detik)
  let fase = 0
  for (let i = 0; i < x.length; i++) {
    const r = i / x.length
    const t = i / SR
    const f = f0 * (f1 / f0) ** r * (1 + vibrato * Math.sin(2 * Math.PI * lajuVib * t))
    fase += (2 * Math.PI * f) / SR
    const e = Math.min(1, t / 0.02) * Math.min(1, (x.length - i) / (0.08 * SR))
    x[i] = e * (Math.sin(fase) + 0.25 * Math.sin(2 * fase))
  }
  return x
}

/** Dentum rendah (stempel, benda mendarat). */
function dentum(f0 = 120, f1 = 48, detik = 0.18) {
  const x = kosong(detik)
  let fase = 0
  for (let i = 0; i < x.length; i++) {
    const t = i / SR
    const f = f1 + (f0 - f1) * Math.exp(-t * 30)
    fase += (2 * Math.PI * f) / SR
    x[i] = Math.exp((-t * 4) / detik) * Math.sin(fase)
  }
  return x
}

/**
 * Tepuk tangan penonton: ratusan tepukan pendek (derau berpita acak) yang makin ramai
 * lalu mereda. `ramai` = tepukan per detik di puncaknya.
 */
function tepuk(detik, ramai = 110, naik = 0.25) {
  const x = kosong(detik)
  for (let t = 0; t < detik; ) {
    const r = t / detik
    const kerapatan = Math.min(1, 0.3 + t / naik) * (r < 0.45 ? 1 : Math.max(0.05, 1 - (r - 0.45) / 0.55))
    const lama = 0.006 + acak() * 0.01
    const p = kosong(lama + 0.02)
    for (let i = 0; i < p.length; i++) p[i] = derau() * Math.exp(-i / (lama * SR * 0.35))
    const satu = biquad(p, 'bp', 900 + acak() * 1800, 1.5 + acak())
    tambah(x, satu, t, (0.4 + acak() * 0.6) * kerapatan)
    t += (-Math.log(1 - acak()) / ramai) / Math.max(0.08, kerapatan)
  }
  return x
}

// ── Resep ────────────────────────────────────────────────────

const RESEP = {
  // Layar
  tap: () => rapikan(tambah(kosong(0.06), kayu(1700, 0.05, 0.3)), 0.35),

  stempel: () => {
    const x = kosong(0.4)
    tambah(x, dentum(130, 50, 0.22), 0, 1)
    tambah(x, biquad(desir(0.05, 2500, 0.8, 0.05), 'hp', 900), 0, 0.9)
    tambah(x, kayu(420, 0.1), 0.002, 0.45)
    return rapikan(gema(x, 0.12, 0.3), 0.85)
  },

  'stempel-emas': () => {
    const x = kosong(1.8)
    tambah(x, dentum(130, 50, 0.22), 0, 1)
    tambah(x, biquad(desir(0.05, 2500, 0.8, 0.05), 'hp', 900), 0, 0.8)
    ;[0, 2, 4, 5].forEach((k, i) => tambah(x, logam(slendro(k, 784), 1.2, 0.8), 0.12 + i * 0.07, 0.35))
    return rapikan(gema(x, 0.3, 1.2), 0.85)
  },

  // Layar hasil (semua game): menang disoraki, kalah/seri tetap diberi tepuk tangan sportif.
  sorak: () => {
    const x = kosong(3.2)
    tambah(x, tepuk(3, 140, 0.2), 0, 1)
    ;[0, 2, 3, 5, 7].forEach((k, i) => tambah(x, logam(slendro(k, 523), 1, 1), 0.05 + i * 0.09, 0.55))
    tambah(x, gong(98, 2), 0.5, 0.25)
    return rapikan(gema(x, 0.25, 0.8), 0.7)
  },

  tepuk: () => rapikan(gema(tepuk(2.4, 70, 0.3), 0.2, 0.6), 0.7),

  // Intro
  bel: () => {
    // Bel listrik sekolah: palu memukul mangkuk logam ±22 kali per detik selama ±1 detik.
    const x = kosong(1.5)
    const pukul = () => {
      const p = kosong(0.3)
      for (let i = 0; i < p.length; i++) {
        const t = i / SR
        p[i] =
          Math.exp(-t * 9) * Math.sin(2 * Math.PI * 1850 * t) +
          0.6 * Math.exp(-t * 12) * Math.sin(2 * Math.PI * 1850 * 2.32 * t) +
          0.3 * Math.exp(-t * 18) * Math.sin(2 * Math.PI * 1850 * 4.25 * t) +
          (t < 0.002 ? derau() * 0.5 : 0)
      }
      return p
    }
    for (let t = 0; t < 1.05; t += 1 / 22) tambah(x, pukul(), t, 0.5 + 0.2 * acak())
    return rapikan(gema(x, 0.15, 0.4), 0.55)
  },

  pintu: () => {
    const x = kosong(1)
    tambah(x, derit(0.7, 45, 110, [620, 940, 1500]), 0, 1)
    tambah(x, biquad(desir(0.9, 500, 0.5, 0.6), 'lp', 1200), 0.1, 0.15)
    return rapikan(gema(x, 0.18, 0.4), 0.6)
  },

  tuk: () => {
    // Egrang bambu menabrak kusen pintu.
    const x = kosong(0.35)
    tambah(x, kayu(540, 0.14, 1.4), 0, 1)
    tambah(x, kayu(310, 0.18, 1), 0.004, 0.6)
    tambah(x, dentum(160, 90, 0.08), 0, 0.4)
    return rapikan(gema(x, 0.12, 0.3), 0.75)
  },

  'kotak-buka': () => {
    const x = kosong(1.4)
    tambah(x, derit(0.32, 70, 150, [900, 1350, 2100]), 0, 1.3)
    tambah(x, kayu(380, 0.12, 1.2), 0.36, 1)
    tambah(x, dentum(110, 60, 0.12), 0.36, 0.5)
    tambah(x, logam(slendro(5, 784), 0.9, 0.6), 0.45, 0.25)
    return rapikan(gema(x, 0.25, 0.8), 0.7)
  },

  cahaya: () => {
    // Kilau: arpeggio slendro naik di bilah logam tinggi + desir terang.
    const x = kosong(2.2)
    ;[0, 1, 2, 3, 4, 5, 6, 7].forEach((k, i) => tambah(x, logam(slendro(k, 1046), 1.1, 0.7), i * 0.065, 0.3 - i * 0.015))
    tambah(x, biquad(desir(1.2, 6500, 0.7, 0.3), 'hp', 3500), 0, 0.12)
    return rapikan(gema(x, 0.4, 1.4), 0.55)
  },

  pudar: () => {
    // Warna memudar: nada slendro turun yang makin redup dan teredam.
    const x = kosong(2.4)
    ;[5, 4, 3, 2, 1, 0].forEach((k, i) => tambah(x, logam(slendro(k, 523), 1.2, 0.5), i * 0.16, 0.45 * (1 - i * 0.12)))
    const y = gema(x, 0.35, 1)
    // Redaman makin tertutup (filter low-pass dari terang ke gelap).
    const z = new Float32Array(y.length)
    let lp = 0
    for (let i = 0; i < y.length; i++) {
      const r = Math.min(1, i / (1.6 * SR))
      const fc = 5000 * (1 - r) + 500 * r
      const a = 1 - Math.exp((-2 * Math.PI * fc) / SR)
      lp += a * (y[i] - lp)
      z[i] = lp
    }
    return rapikan(z, 0.5)
  },

  // Ular Tangga
  langkah: () => rapikan(tambah(kosong(0.07), kayu(950, 0.06, 0.8)), 0.6),

  dadu: () => {
    // Dadu kayu berguling di papan: ketukan rapat lalu makin jarang, dua ketukan berhenti.
    const x = kosong(0.85)
    let t = 0
    let jarak = 0.035
    while (t < 0.62) {
      tambah(x, kayu(1900 + acak() * 900, 0.03, 0.5), t, 0.5 + acak() * 0.4)
      t += jarak * (0.7 + acak() * 0.6)
      jarak *= 1.16
    }
    tambah(x, kayu(1500, 0.05, 0.8), 0.66, 0.8)
    tambah(x, kayu(1400, 0.05, 0.8), 0.74, 0.5)
    return rapikan(gema(x, 0.1, 0.2), 0.6)
  },

  pantul: () => {
    // Memantul mundur: bunyi per "boing".
    const x = kosong(0.6)
    tambah(x, kayu(700, 0.06), 0, 0.6)
    tambah(x, geser(520, 200, 0.5, 0.06, 18), 0.02, 0.8)
    return rapikan(x, 0.3)
  },

  tangga: () => {
    // Naik tangga: angklung naik lima anak tangga.
    const x = kosong(1.3)
    ;[0, 1, 2, 3, 5].forEach((k, i) => tambah(x, angklung(slendro(k, 523), 0.16), i * 0.15, 0.8))
    return rapikan(gema(x, 0.2, 0.5), 0.6)
  },

  ular: () => {
    // Meluncur turun lewat ular: siulan turun bergelombang.
    const x = kosong(1.1)
    tambah(x, geser(1100, 220, 1, 0.045, 7), 0, 1)
    tambah(x, biquad(desir(1, 1800, 0.6, 0.2), 'lp', 3000), 0, 0.12)
    return rapikan(x, 0.28)
  },

  kartu: () => {
    // Kartu "Tahukah kamu?" muncul: kibasan kertas + denting kecil.
    const x = kosong(1.2)
    tambah(x, biquad(desir(0.22, 3000, 0.7, 0.35), 'hp', 1200), 0, 0.7)
    tambah(x, logam(slendro(3, 1046), 0.8, 0.6), 0.16, 0.5)
    return rapikan(gema(x, 0.25, 0.6), 0.5)
  },

  menang: () => {
    // Sampai di kotak 100: lagu saron pendek lalu gong.
    const x = kosong(3.4)
    const lagu = [0, 2, 3, 5, 3, 5, 7]
    lagu.forEach((k, i) => tambah(x, logam(slendro(k, 523), 1, 1), i * 0.13, i === lagu.length - 1 ? 0.6 : 0.45))
    tambah(x, gong(82, 2.6), lagu.length * 0.13 - 0.13, 0.9)
    return rapikan(gema(x, 0.25, 1), 0.85)
  },
}

// ── WAV ──────────────────────────────────────────────────────

function wav(x) {
  const b = Buffer.alloc(44 + x.length * 2)
  b.write('RIFF', 0)
  b.writeUInt32LE(36 + x.length * 2, 4)
  b.write('WAVEfmt ', 8)
  b.writeUInt32LE(16, 16)
  b.writeUInt16LE(1, 20)
  b.writeUInt16LE(1, 22)
  b.writeUInt32LE(SR, 24)
  b.writeUInt32LE(SR * 2, 28)
  b.writeUInt16LE(2, 32)
  b.writeUInt16LE(16, 34)
  b.write('data', 36)
  b.writeUInt32LE(x.length * 2, 40)
  x.forEach((v, i) => b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), 44 + i * 2))
  return b
}

mkdirSync(TUJUAN, { recursive: true })
const saring = process.argv.slice(2)
for (const [nama, buat] of Object.entries(RESEP)) {
  if (saring.length && !saring.includes(nama)) continue
  benih = [...nama].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
  const x = buat()
  writeFileSync(join(TUJUAN, `${nama}.wav`), wav(x))
  console.log(`${nama.padEnd(13)} ${(x.length / SR).toFixed(2)} dtk`)
}
console.log(`\nSelesai di ${TUJUAN}/. Dengarkan dulu, lalu jalankan: npm run audio`)
