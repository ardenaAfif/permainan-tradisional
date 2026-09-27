/**
 * Jam lagu (ms) yang bisa dijeda. Memakai performance.now() langsung, bukan
 * delta frame, supaya waktu tekan tombol dinilai tepat walau frame tersendat.
 */
export class JamLagu {
  private awal: number
  private kini: () => number
  private asal: number
  private jedaSejak: number | null = null

  /** @param awal waktu lagu saat jam dibuat (negatif = hitungan awal) */
  constructor(awal: number, kini: () => number = () => performance.now()) {
    this.awal = awal
    this.kini = kini
    this.asal = kini()
  }

  sekarang(): number {
    return (this.jedaSejak ?? this.kini()) - this.asal + this.awal
  }

  jeda() {
    if (this.jedaSejak === null) this.jedaSejak = this.kini()
  }

  lanjut() {
    if (this.jedaSejak === null) return
    this.asal += this.kini() - this.jedaSejak
    this.jedaSejak = null
  }
}
