import { buatModulPhaser } from '../../shared/phaser/modul'
import { AdeganBolaBekel, KUNCI } from './AdeganBolaBekel'
import { SISI } from './config'
import { buatTata } from './tata'
import { gambarBayang, gambarBiji, gambarBola, gambarKepala, gambarLatar, RAPAT_BIJI, SEMUA_RAUT } from './tekstur'

/** Bola Bekel — tampak atas: swipe untuk melempar, tap biji sesuai tahap, tangkap bola (Phaser 3). */
export default buatModulPhaser({
  id: 'bola-bekel',
  modes: ['cpu', 'hotseat'],
  // Bisa dimainkan tegak maupun mendatar: panggung ikut berputar.
  orientation: 'any',
  // Pemain, tahap, dan giliran tampil di panggung.
  hud: 'tombol',

  async siapkan(opts, env) {
    const r = env.resolusi
    const n = opts.players.length
    const kanvas = new Map<string, HTMLCanvasElement>([
      [KUNCI.latar(false), gambarLatar(buatTata(false, n), r)],
      [KUNCI.latar(true), gambarLatar(buatTata(true, n), r)],
      [KUNCI.bola, gambarBola(r)],
      [KUNCI.bayang, gambarBayang(r)],
    ])
    SISI.forEach((_, s) => kanvas.set(KUNCI.biji(s), gambarBiji(s, r * RAPAT_BIJI)))
    const tugas: Promise<void>[] = []
    opts.players.forEach((p, i) => {
      for (const raut of SEMUA_RAUT) {
        tugas.push(gambarKepala(p, raut, 96 * r).then((c) => void kanvas.set(KUNCI.kepala(i, raut), c)))
      }
    })
    await Promise.all(tugas)
    return new AdeganBolaBekel({ pemain: opts.players, kesulitan: opts.difficulty, env, kanvas, onFinish: opts.onFinish })
  },
})
