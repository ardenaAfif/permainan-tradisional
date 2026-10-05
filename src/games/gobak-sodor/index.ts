import { hexKeAngka } from '../../app/tokens'
import { buatModulPhaser } from '../../shared/phaser/modul'
import { AdeganGobakSodor, KUNCI, type DataTim } from './AdeganGobakSodor'
import { buatLapangan, TINGGI_SOSOK } from './tata'
import { gambarAnggota, gambarLatar, SEMUA_RAUT, susunTim } from './tekstur'

/** Gobak Sodor — lapangan tampak atas (Phaser 3): menyerang dan menjaga bergantian, dua tim berisi lima. */
export default buatModulPhaser({
  id: 'gobak-sodor',
  modes: ['cpu', 'split'],
  orientation: 'landscape',
  // Tim, peran, dan poin tampil di panel samping panggung.
  hud: 'tombol',

  async siapkan(opts, env) {
    const [a, b] = opts.players
    if (!a || !b) throw new Error('Gobak sodor butuh dua tim')
    const anggota = susunTim(a, b)
    const tim: [DataTim, DataTim] = [
      { pemain: a, anggota: anggota[0], manusia: a.avatar !== 'cpu', warna: hexKeAngka(a.warna) },
      { pemain: b, anggota: anggota[1], manusia: opts.mode === 'split' && b.avatar !== 'cpu', warna: hexKeAngka(b.warna) },
    ]
    const r = env.resolusi
    const lap = buatLapangan()
    const kanvas = new Map<string, HTMLCanvasElement>([[KUNCI.latar, gambarLatar(r, lap)]])
    const tugas: Promise<void>[] = []
    tim.forEach((t, i) =>
      t.anggota.forEach((ag, j) => {
        for (const raut of SEMUA_RAUT) {
          const tinggi = (raut === 'kepala' ? 64 : TINGGI_SOSOK) * r
          tugas.push(gambarAnggota(ag, raut, tinggi).then((c) => void kanvas.set(KUNCI.raut(i, j, raut), c)))
        }
      }),
    )
    await Promise.all(tugas)
    return new AdeganGobakSodor({
      mode: opts.mode === 'split' ? 'split' : 'cpu',
      tim,
      kesulitan: opts.difficulty,
      lap,
      env,
      kanvas,
      onFinish: opts.onFinish,
    })
  },
})
