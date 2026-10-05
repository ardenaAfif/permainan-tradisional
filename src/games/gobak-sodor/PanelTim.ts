/**
 * Kartu tim di panel samping: nama tim (warna tim), peran ronde ini, poin,
 * dan kepala lima anggota (yang sedang main bercincin, yang gugur dicoret).
 */
import * as Phaser from 'phaser'
import { warnaAngka as w } from '../../app/tokens'
import { teks } from '../../shared/phaser/teks'
import { KARTU_ATAS, KARTU_TINGGI, PANEL_LEBAR, panelX } from './tata'

export type StatusAnggota = 'biasa' | 'main' | 'tunggu' | 'gugur'

export class PanelTim {
  private peran: Phaser.GameObjects.Text
  private poin: Phaser.GameObjects.Text
  private cincin: Phaser.GameObjects.Arc[] = []
  private kepala: Phaser.GameObjects.Image[] = []
  private coret: Phaser.GameObjects.Text[] = []

  constructor(scene: Phaser.Scene, sisi: 0 | 1, nama: string, warna: number, kunciKepala: string[], res: number) {
    const x0 = panelX(sisi) + 16
    const lebar = PANEL_LEBAR - 32
    const y0 = KARTU_ATAS
    const g = scene.add.graphics().setDepth(1000)
    g.fillStyle(w('kayu-gelap')).fillRoundedRect(x0, y0 + 7, lebar, KARTU_TINGGI, 22)
    g.fillStyle(w('kertas-krem')).fillRoundedRect(x0, y0, lebar, KARTU_TINGGI, 22)
    g.fillStyle(warna).fillRoundedRect(x0, y0, lebar, 52, { tl: 22, tr: 22, bl: 0, br: 0 })
    // Kepala kartu: nama tim di kiri, poin di kanan.
    this.poin = teks(scene, x0 + lebar - 16, y0 + 27, '0 poin', { ukuran: 32, garis: 'tinta-gelap', tebalGaris: 5 }, res).setOrigin(1, 0.5).setDepth(1001)
    const judul = teks(scene, x0 + 16, y0 + 27, nama, { ukuran: 32, garis: 'tinta-gelap', tebalGaris: 5 }, res).setOrigin(0, 0.5).setDepth(1001)
    const muat = lebar - 32 - 120
    if (judul.width > muat) judul.setScale(muat / judul.width)
    this.peran = teks(scene, x0 + lebar / 2, y0 + 82, '', { ukuran: 30, warna: 'biru-nila' }, res).setDepth(1001)
    const n = kunciKepala.length
    const jarak = Math.min(56, (lebar - 20) / n)
    kunciKepala.forEach((kunci, i) => {
      const x = x0 + lebar / 2 + (i - (n - 1) / 2) * jarak
      const y = y0 + 150
      const c = scene.add.circle(x, y, 25, warna).setStrokeStyle(4, w('kertas-terang')).setDepth(1001)
      const k = scene.add.image(x, y + 2, kunci).setDepth(1001)
      k.setScale(44 / k.height)
      const x2 = teks(scene, x, y, '✕', { ukuran: 40, warna: 'merah-bata', garis: 'kertas-terang', tebalGaris: 5 }, res).setDepth(1002).setVisible(false)
      this.cincin.push(c)
      this.kepala.push(k)
      this.coret.push(x2)
    })
  }

  setPeran(isi: string) {
    this.peran.setText(isi)
  }

  setPoin(n: number) {
    this.poin.setText(`${n} poin`)
  }

  /** Ganti warna tulisan peran supaya menyerang/menjaga mudah dibedakan. */
  setWarnaPeran(warna: string) {
    this.peran.setColor(warna)
  }

  setAnggota(i: number, s: StatusAnggota) {
    const c = this.cincin[i]
    if (!c) return
    c.setStrokeStyle(s === 'main' ? 6 : 4, w(s === 'main' ? 'cahaya-kelir' : 'kertas-terang'))
    const redup = s === 'gugur' ? 0.35 : s === 'tunggu' ? 0.75 : 1
    c.setAlpha(redup)
    this.kepala[i]!.setAlpha(redup)
    this.coret[i]!.setVisible(s === 'gugur')
  }
}
