import { GELAP_PEMAIN, WARNA, WARNA_PEMAIN, type NamaWarna } from '../../app/tokens'
import { buatModulPhaser } from '../../shared/phaser/modul'
import { AdeganKelereng, KUNCI, type JenisKelereng } from './AdeganKelereng'
import { JUMLAH_TARUHAN, R_GACOAN, R_LUBANG, R_TARUHAN } from './config'
import { gambarBayangan, gambarKelereng, gambarLatar, gambarLubang } from './tekstur'

/** Nama token untuk warna pemain (Player.warna berisi hex dari WARNA_PEMAIN). */
const namaWarna = (hex: string): NamaWarna =>
  (Object.keys(WARNA) as NamaWarna[]).find((n) => WARNA[n] === hex) ?? 'kunyit'

/** Kelereng taruhan: kaca bening dengan urat warna-warni. */
const URAT_TARUHAN: NamaWarna[] = ['kunyit', 'merah-bata', 'daun-pisang', 'biru-nila', 'kayu-muda']

/** Kelereng — tampak atas, tarik-lepas untuk menyentil (Phaser 3 + Matter). */
export default buatModulPhaser({
  id: 'kelereng',
  modes: ['cpu', 'hotseat'],
  orientation: 'landscape',
  // Pemain, giliran, dan poin tampil di panggung.
  hud: 'tombol',
  physics: { default: 'matter', matter: { gravity: { x: 0, y: 0 }, autoUpdate: false } },

  async siapkan(opts, env) {
    const jenis: JenisKelereng = opts.opsi.jenis === 'tembak' ? 'tembak' : 'lubang'
    const jumlahGiliran = Math.max(1, Math.min(10, Number(opts.opsi.giliran) || 5))
    const r = env.resolusi
    const kanvas = new Map<string, HTMLCanvasElement>([
      [KUNCI.latar, gambarLatar(jenis, r)],
      [KUNCI.lubang, gambarLubang(R_LUBANG, r)],
      [KUNCI.bayangGacoan, gambarBayangan(R_GACOAN, r)],
      [KUNCI.bayangTaruhan, gambarBayangan(R_TARUHAN, r)],
    ])
    opts.players.forEach((p, i) => {
      const dasar = namaWarna(p.warna ?? WARNA_PEMAIN[i % WARNA_PEMAIN.length]!)
      kanvas.set(KUNCI.gacoan(i), gambarKelereng(R_GACOAN, dasar, GELAP_PEMAIN[WARNA[dasar]] ?? 'kayu-gelap', 'kertas-terang', r))
    })
    for (let i = 0; i < JUMLAH_TARUHAN; i++) {
      kanvas.set(KUNCI.taruhan(i), gambarKelereng(R_TARUHAN, 'langit-jendela', 'biru-nila', URAT_TARUHAN[i % URAT_TARUHAN.length]!, r))
    }
    return new AdeganKelereng({
      jenis,
      jumlahGiliran,
      pemain: opts.players,
      kesulitan: opts.difficulty,
      env,
      kanvas,
      onFinish: opts.onFinish,
    })
  },
})
