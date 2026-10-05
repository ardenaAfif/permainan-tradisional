import { buatModulPhaser } from '../../shared/phaser/modul'
import { AdeganEgrang, KUNCI } from './AdeganEgrang'
import { POS_MUDAH, SUSUNAN_RINTANGAN } from './config'
import { TINGGI_KARAKTER } from './tata'
import { gambarLatar, gambarPemain, SEMUA_RAUT } from './tekstur'

/** Pilihan kendali miring HP terakhir, supaya "Ulang dari awal" tidak perlu memilih lagi. */
let miringTerakhir = false

/** Egrang — balap 4 lintasan tampak samping (Phaser 3): langkah berirama sambil menjaga keseimbangan. */
export default buatModulPhaser({
  id: 'egrang',
  modes: ['cpu', 'split'],
  orientation: 'landscape',
  // Pemain tampil di tanda lintasan dan panel kontrol.
  hud: 'tombol',

  async siapkan(opts, env) {
    const r = env.resolusi
    const pemain = opts.players.slice(0, 4)
    if (pemain.length < 2) throw new Error('Egrang butuh minimal dua pelari')
    const rintangan = SUSUNAN_RINTANGAN[Math.floor(Math.random() * SUSUNAN_RINTANGAN.length)]!
    const pos = opts.difficulty === 'mudah' ? POS_MUDAH : []
    const kanvas = new Map<string, HTMLCanvasElement>([[KUNCI.latar, gambarLatar(r, pemain.length, rintangan, pos)]])
    const tugas: Promise<void>[] = []
    pemain.forEach((p, i) => {
      for (const raut of SEMUA_RAUT) {
        const tinggi = (raut === 'kepala' ? 64 : TINGGI_KARAKTER) * r
        tugas.push(gambarPemain(p, raut, tinggi).then((c) => void kanvas.set(KUNCI.raut(i, raut), c)))
      }
    })
    await Promise.all(tugas)
    return new AdeganEgrang({
      mode: opts.mode === 'split' ? 'split' : 'cpu',
      pemain,
      kesulitan: opts.difficulty,
      rintangan,
      env,
      kanvas,
      miringAwal: miringTerakhir,
      simpanMiring: (v) => {
        miringTerakhir = v
      },
      onFinish: opts.onFinish,
    })
  },
})
