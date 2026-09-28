import { GELAP_PEMAIN, WARNA, WARNA_PEMAIN, type NamaWarna } from '../../app/tokens'
import { buatModulPhaser } from '../../shared/phaser/modul'
import { AdeganEngklek, KUNCI } from './AdeganEngklek'
import { POLA, TINGGI_KARAKTER } from './config'
import { TataPola } from './tata'
import { gambarGacuk, gambarLatar, gambarPemain, SEMUA_RAUT } from './tekstur'

/** Nama token untuk warna pemain (Player.warna berisi hex dari WARNA_PEMAIN). */
const namaWarna = (hex: string): NamaWarna =>
  (Object.keys(WARNA) as NamaWarna[]).find((n) => WARNA[n] === hex) ?? 'kunyit'

/** Sunda Manda / Engklek — tampak atas-miring: lempar gacuk, lompat berirama, ambil gacuk (Phaser 3). */
export default buatModulPhaser({
  id: 'engklek',
  modes: ['cpu', 'hotseat'],
  orientation: 'landscape',
  // Pemain, level, dan giliran tampil di panggung.
  hud: 'tombol',

  async siapkan(opts, env) {
    const r = env.resolusi
    const kanvas = new Map<string, HTMLCanvasElement>([[KUNCI.latar, gambarLatar(new TataPola(POLA), r)]])
    const tugas: Promise<void>[] = []
    opts.players.forEach((p, i) => {
      const hex = p.warna || WARNA_PEMAIN[i % WARNA_PEMAIN.length]!
      kanvas.set(KUNCI.gacuk(i), gambarGacuk(namaWarna(hex), GELAP_PEMAIN[hex] ?? 'kayu-gelap', r))
      for (const raut of SEMUA_RAUT) {
        const tinggi = (raut === 'kepala' ? 88 : TINGGI_KARAKTER) * r
        tugas.push(gambarPemain(p, raut, tinggi).then((c) => void kanvas.set(KUNCI.raut(i, raut), c)))
      }
    })
    await Promise.all(tugas)
    return new AdeganEngklek({ pemain: opts.players, kesulitan: opts.difficulty, env, kanvas, onFinish: opts.onFinish })
  },
})
