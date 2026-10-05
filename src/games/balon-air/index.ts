import { hexKeAngka } from '../../app/tokens'
import { buatModulPhaser } from '../../shared/phaser/modul'
import { AdeganBalonAir, KUNCI, rautBawa, rautBayangan, type DataTim } from './AdeganBalonAir'
import { URUTAN_CARA } from './config'
import { KUNCI_BALON, KUNCI_BALON_MERAH } from './PelariView'
import { TINGGI_SOSOK, zoomMode } from './tata'
import { gambarAnggota, gambarBalon, gambarBatu, gambarKeranjang, gambarPotongan, JUMLAH_POTONGAN, LEBAR_POTONGAN, susunTim, type Raut } from './tekstur'

/**
 * Raut yang dibutuhkan setiap anggota tim (tim yang tampil berwarna), atau
 * siluet saja untuk tim komputer yang tampil sebagai bayangan pelari.
 */
function kebutuhanRaut(nAnggota: number, bayangan: boolean): Set<Raut>[] {
  const perlu = Array.from({ length: nAnggota }, () => new Set<Raut>(bayangan ? [] : ['diam', 'kaget', 'senang', 'kepala']))
  if (bayangan) perlu[0]!.add('kepala')
  URUTAN_CARA.forEach((c, a) => {
    const raut = bayangan ? rautBayangan(c.id) : rautBawa(c.id)
    perlu[a % nAnggota]!.add(raut)
    if (c.berpasangan) perlu[(a + 1) % nAnggota]!.add(raut)
  })
  return perlu
}

/** Pecah Balon Air (Bonus) — estafet membawa balon air, tampak atas-miring (Phaser 3). */
export default buatModulPhaser({
  id: 'pecah-balon-air',
  modes: ['cpu', 'split'],
  orientation: 'landscape',
  // Tim, waktu, dan tekanan balon tampil di papan info di atas lintasan.
  hud: 'tombol',

  async siapkan(opts, env) {
    const [a, b] = opts.players
    if (!a || !b) throw new Error('Pecah balon air butuh dua tim')
    const split = opts.mode === 'split'
    const anggota = susunTim(a, b)
    const tim: [DataTim, DataTim] = [
      { pemain: a, anggota: anggota[0], manusia: a.avatar !== 'cpu', warna: hexKeAngka(a.warna) },
      { pemain: b, anggota: anggota[1], manusia: split && b.avatar !== 'cpu', warna: hexKeAngka(b.warna) },
    ]
    const r = env.resolusi
    // Tekstur dunia setajam pembesaran kamera (Lawan Komputer lebih dekat dari Duel).
    const skala = r * zoomMode(split)
    const kanvas = new Map<string, HTMLCanvasElement>([
      [KUNCI.keranjang, gambarKeranjang(skala)],
      [KUNCI.batu(0), gambarBatu(skala, 0)],
      [KUNCI.batu(1), gambarBatu(skala, 1)],
      [KUNCI_BALON, gambarBalon(skala, false)],
      [KUNCI_BALON_MERAH, gambarBalon(skala, true)],
    ])
    for (let i = 0; i < JUMLAH_POTONGAN; i++) kanvas.set(KUNCI.potongan(i), gambarPotongan(skala, i * LEBAR_POTONGAN))
    const tugas: Promise<void>[] = []
    tim.forEach((t, i) => {
      const bayangan = i === 1 && !split
      kebutuhanRaut(t.anggota.length, bayangan).forEach((daftar, j) => {
        for (const raut of daftar) {
          const tinggi = raut === 'kepala' ? 64 * r : TINGGI_SOSOK * skala
          tugas.push(gambarAnggota(t.anggota[j]!, raut, tinggi).then((c) => void kanvas.set(KUNCI.raut(i, j, raut), c)))
        }
      })
    })
    await Promise.all(tugas)
    return new AdeganBalonAir({
      mode: split ? 'split' : 'cpu',
      tim,
      kesulitan: opts.difficulty,
      env,
      skala,
      kanvas,
      onFinish: opts.onFinish,
    })
  },
})
