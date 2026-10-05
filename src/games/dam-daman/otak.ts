/**
 * Penghubung ke AI di Web Worker. Jika Worker tidak tersedia (atau gagal
 * dimuat), langkah dihitung di utas utama setelah jeda singkat.
 */
import type { Kesulitan } from '../../shared/types'
import { pilihLangkah } from './ai'
import type { AturanMain, Keadaan, Langkah, Meja, VarianDam } from './aturan'

export interface PermintaanAi {
  id: number
  varian: VarianDam
  aturan: AturanMain
  keadaan: Keadaan
  kesulitan: Kesulitan
}

export interface JawabanAi {
  id: number
  langkah: Langkah | null
}

export class OtakKomputer {
  private worker: Worker | null = null
  private nomor = 0
  private menunggu = new Map<number, { keadaan: Keadaan; selesai: (l: Langkah | null) => void }>()

  private varian: VarianDam
  private meja: Meja
  private kesulitan: Kesulitan

  constructor(varian: VarianDam, meja: Meja, kesulitan: Kesulitan) {
    this.varian = varian
    this.meja = meja
    this.kesulitan = kesulitan
    try {
      this.worker = new Worker(new URL('./ai.worker.ts', import.meta.url), { type: 'module' })
      this.worker.addEventListener('message', (e: MessageEvent<JawabanAi>) => this.selesai(e.data.id, e.data.langkah))
      this.worker.addEventListener('error', () => this.alihkanKeUtasUtama())
    } catch {
      this.worker = null
    }
  }

  /** Minta langkah komputer untuk keadaan `k`. */
  minta(keadaan: Keadaan): Promise<Langkah | null> {
    const id = ++this.nomor
    return new Promise((resolve) => {
      this.menunggu.set(id, { keadaan, selesai: resolve })
      if (this.worker) {
        const pesan: PermintaanAi = { id, varian: this.varian, aturan: this.meja.aturan, keadaan, kesulitan: this.kesulitan }
        this.worker.postMessage(pesan)
      } else {
        this.hitungLangsung(id, keadaan)
      }
    })
  }

  /** Abaikan jawaban yang belum datang (mis. setelah Batalkan langkah). */
  lupakan() {
    this.menunggu.clear()
  }

  hentikan() {
    this.menunggu.clear()
    this.worker?.terminate()
    this.worker = null
  }

  private selesai(id: number, langkah: Langkah | null) {
    const r = this.menunggu.get(id)
    this.menunggu.delete(id)
    r?.selesai(langkah)
  }

  private hitungLangsung(id: number, keadaan: Keadaan) {
    setTimeout(() => {
      if (this.menunggu.has(id)) this.selesai(id, pilihLangkah(this.meja, keadaan, this.kesulitan))
    }, 30)
  }

  /** Worker gagal dimuat: hitung permintaan yang tertunda di utas utama. */
  private alihkanKeUtasUtama() {
    this.worker?.terminate()
    this.worker = null
    for (const [id, { keadaan }] of this.menunggu) this.hitungLangsung(id, keadaan)
  }
}
