/// <reference lib="webworker" />
/** Web Worker AI Dam-daman: menghitung langkah komputer tanpa membuat UI macet. */
import { pilihLangkah } from './ai'
import { siapkanMeja, type Meja } from './aturan'
import type { PermintaanAi, JawabanAi } from './otak'

const ws = self as unknown as DedicatedWorkerGlobalScope
let meja: Meja | null = null
let kunciMeja = ''

ws.addEventListener('message', (e: MessageEvent<PermintaanAi>) => {
  const { id, varian, aturan, keadaan, kesulitan } = e.data
  const kunci = JSON.stringify([varian, aturan])
  if (!meja || kunci !== kunciMeja) {
    meja = siapkanMeja(varian, aturan).meja
    kunciMeja = kunci
  }
  const jawaban: JawabanAi = { id, langkah: pilihLangkah(meja, keadaan, kesulitan) }
  ws.postMessage(jawaban)
})
