import { buatModulPhaser } from '../../shared/phaser/modul'
import { AdeganBakiak, kunciTekstur, type DataTim } from './AdeganBakiak'
import { gambarAnggota, susunTim, type Raut } from './tekstur'
import { LAJUR } from './tata'

/** Pilihan Tim Kompak terakhir, supaya "Ulang dari awal" tidak perlu memilih lagi. */
let kompakTerakhir = false

async function siapkanTekstur(tim: DataTim[], resolusi: number, kepala: boolean) {
  const tinggi = Math.max(LAJUR[0].tinggiKarakter, LAJUR[1].tinggiKarakter) * resolusi
  const tugas: Promise<[string, HTMLCanvasElement]>[] = []
  tim.forEach((t, i) =>
    t.anggota.forEach((a, j) => {
      const raut: Raut[] = kepala ? ['jalan', 'kaget', 'senang', 'kepala'] : ['jalan', 'kaget', 'senang']
      for (const r of raut) {
        const h = r === 'kepala' ? 104 * resolusi : tinggi
        tugas.push(gambarAnggota(a, r, h).then((c) => [kunciTekstur(i, j, r), c]))
      }
    }),
  )
  return new Map(await Promise.all(tugas))
}

/** Bakiak — game ritme (Phaser 3): dua tim berlomba 25 meter mengikuti aba-aba. */
export default buatModulPhaser({
  id: 'bakiak',
  modes: ['cpu', 'split'],
  orientation: 'landscape',
  // Nama tim dan jarak sudah tampil di panggung.
  hud: 'tombol',

  async siapkan(opts, env) {
    const [a, b] = opts.players
    if (!a || !b) throw new Error('Bakiak butuh dua tim')
    const tim: [DataTim, DataTim] = [
      { pemain: a, anggota: susunTim(a), manusia: a.avatar !== 'cpu' },
      { pemain: b, anggota: susunTim(b), manusia: opts.mode !== 'cpu' && b.avatar !== 'cpu' },
    ]
    const kanvas = await siapkanTekstur(tim, env.resolusi, opts.mode === 'split')
    return new AdeganBakiak({
      mode: opts.mode === 'split' ? 'split' : 'cpu',
      tim,
      kesulitan: opts.difficulty,
      resolusi: env.resolusi,
      gerak: env.gerak,
      petunjukKeyboard: env.keyboard,
      kompakAwal: kompakTerakhir,
      simpanKompak: (v) => {
        kompakTerakhir = v
      },
      kanvas,
      onFinish: opts.onFinish,
    })
  },
})
