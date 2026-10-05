/**
 * Kendali miring HP (opsional): sudut putar perangkat di bidang layar dibaca
 * dari DeviceOrientation, relatif terhadap posisi saat dikalibrasi. iOS meminta
 * izin lewat DeviceOrientationEvent.requestPermission() dari sentuhan pemain.
 */
import { SUDUT_KEMUDI, ZONA_MATI } from './config'

type DOEIos = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<'granted' | 'denied'> }

const RAD = Math.PI / 180

/** Sudut [-180, 180). */
const bungkus = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180

/**
 * Sudut arah "atas" dunia di bidang layar perangkat (derajat), dari β dan γ.
 * Vektor atas dalam koordinat perangkat = (−cosβ·sinγ, sinβ, cosβ·cosγ); null
 * jika HP hampir rata (proyeksi ke layar terlalu kecil untuk dibaca).
 */
export function sudutLayar(beta: number, gamma: number): number | null {
  const ux = -Math.cos(beta * RAD) * Math.sin(gamma * RAD)
  const uy = Math.sin(beta * RAD)
  if (Math.hypot(ux, uy) < 0.35) return null
  return Math.atan2(ux, uy) / RAD
}

/** Selisih sudut → kemudi −1…1. HP diputar searah jarum jam = positif (badan terdorong ke kanan). */
export function kemudiDariSelisih(selisih: number): number {
  const d = -bungkus(selisih)
  if (Math.abs(d) < ZONA_MATI) return 0
  const v = (Math.abs(d) - ZONA_MATI) / (SUDUT_KEMUDI - ZONA_MATI)
  return Math.sign(d) * Math.min(1, v)
}

export class SensorMiring {
  private sudut: number | null = null
  private nol: number | null = null
  private terbaca = false
  private dengar = (e: DeviceOrientationEvent) => {
    if (e.beta === null || e.gamma === null) return
    this.terbaca = true
    this.sudut = sudutLayar(e.beta, e.gamma)
  }

  /** Ada sensor dan layar sentuh (laptop/PID tidak menawarkan kendali miring). */
  static tersedia() {
    return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window && navigator.maxTouchPoints > 0
  }

  /** Minta izin (iOS) — harus dipanggil di dalam penangan sentuhan. */
  static async izinkan(): Promise<boolean> {
    const D = window.DeviceOrientationEvent as DOEIos | undefined
    if (!D) return false
    if (typeof D.requestPermission !== 'function') return true
    try {
      return (await D.requestPermission()) === 'granted'
    } catch {
      return false
    }
  }

  mulai() {
    window.addEventListener('deviceorientation', this.dengar)
  }

  berhenti() {
    window.removeEventListener('deviceorientation', this.dengar)
    this.sudut = null
    this.nol = null
  }

  /** Posisi HP sekarang dianggap tegak. */
  kalibrasi() {
    this.nol = this.sudut
  }

  /** Sudah ada data sensor yang masuk sejak mulai(). */
  get adaData() {
    return this.terbaca
  }

  /** Kemudi −1…1. */
  nilai(): number {
    if (this.sudut === null) return 0
    this.nol ??= this.sudut
    return kemudiDariSelisih(this.sudut - this.nol)
  }
}
