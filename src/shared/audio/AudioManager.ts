/**
 * AudioManager: efek suara, musik latar, dan VO opsional.
 *
 * - Suara baru aktif setelah buka() dipanggil dari tap pertama (syarat browser iPhone).
 * - File diambil dari public/audio/{sfx,musik,vo}/<nama>.mp3. File yang belum
 *   ada dilewati tanpa error (daftar dari virtual:audio-manifest). URL membawa ?v=<sidik isi>
 *   supaya cache offline (service worker) ikut berganti saat rekamannya diganti.
 * - Mengikuti pengaturan di store: suara (mute semua), musik, VO.
 * - levelVO() memberi volume VO 0..1 untuk lip-sync karakter.
 */
import { Howl, Howler } from 'howler'
import daftarFile from 'virtual:audio-manifest'
import { useKotak } from '../../app/store'

const cari = (folder: string, nama: string) =>
  ['mp3', 'ogg', 'm4a', 'wav'].map((ext) => `${folder}/${nama}.${ext}`).find((f) => f in daftarFile)
const url = (file: string) => `${import.meta.env.BASE_URL}audio/${file}?v=${daftarFile[file]}`

/** URL semua file audio, untuk diunduh sekaligus ("Simpan untuk offline" di Pengaturan). */
export const semuaUrlAudio = () => Object.keys(daftarFile).map(url)

const VOLUME_MUSIK = 0.45
const FADE_MUSIK = 800
/** Batas tunggu tambahan setelah durasi VO, kalau event 'ended' tidak pernah datang. */
const CADANGAN_VO_MS = 2500

// Howler menangguhkan AudioContext 30 detik setelah tidak ada Howl yang berbunyi. VO (lewat
// analyser lip-sync) dan bunyi sintesis game juga memakai konteks ini, jadi VO akan membeku dan
// bunyi game hilang. Konteks dibiarkan tetap jalan.
Howler.autoSuspend = false

class AudioManager {
  private terbuka = false
  private sfxCache = new Map<string, Howl>()
  private musikNama: string | null = null
  private musikHowl: Howl | null = null
  private voEl: HTMLAudioElement | null = null
  private voSelesai: (() => void) | null = null
  private analyser: AnalyserNode | null = null
  private dataLevel: Uint8Array<ArrayBuffer> | null = null

  constructor() {
    this.terapkanPengaturan()
    useKotak.subscribe((s, lama) => {
      if (s.pengaturan !== lama.pengaturan) this.terapkanPengaturan()
    })
  }

  private get pengaturan() {
    return useKotak.getState().pengaturan
  }

  private terapkanPengaturan() {
    const p = this.pengaturan
    Howler.mute(!p.suara)
    if (!p.vo || !p.suara) this.hentikanVO()
    if (this.musikHowl) {
      if (p.musik && p.suara) {
        if (!this.musikHowl.playing()) this.musikHowl.play()
        this.musikHowl.fade(this.musikHowl.volume(), VOLUME_MUSIK, 300)
      } else {
        this.musikHowl.pause()
      }
    }
  }

  /** Panggil dari tap pertama pemain (tombol Mulai). Aman dipanggil berkali-kali. */
  buka() {
    if (this.terbuka) return
    this.terbuka = true
    Howler.volume(Howler.volume()) // memastikan AudioContext Howler sudah dibuat
    void Howler.ctx?.resume()
    const tertunda = this.musikNama
    this.musikNama = null
    if (tertunda) this.musik(tertunda)
  }

  get sudahTerbuka() {
    return this.terbuka
  }

  /** Lanjutkan AudioContext yang terhenti (mis. "interrupted" di iPhone setelah telepon masuk). */
  pastikanJalan() {
    const ctx = Howler.ctx
    if (this.terbuka && ctx && ctx.state !== 'running' && ctx.state !== 'closed') void ctx.resume().catch(() => {})
  }

  // ── Efek suara ───────────────────────────────────────────

  sfx(nama: string, volume = 1) {
    if (!this.terbuka || !this.pengaturan.suara) return
    const file = cari('sfx', nama)
    if (!file) return
    let h = this.sfxCache.get(file)
    if (!h) {
      h = new Howl({ src: [url(file)], preload: true })
      this.sfxCache.set(file, h)
    }
    const id = h.play()
    h.volume(volume, id)
  }

  // ── Musik ────────────────────────────────────────────────

  /** Putar musik latar berulang. Jika belum terbuka, diputar setelah buka(). */
  musik(nama: string) {
    if (nama === this.musikNama && this.musikHowl) return
    this.lepasMusik()
    this.musikNama = nama
    if (!this.terbuka) return
    const file = cari('musik', nama)
    if (!file) return
    const h = new Howl({ src: [url(file)], loop: true, volume: 0 })
    this.musikHowl = h
    if (this.pengaturan.musik && this.pengaturan.suara) {
      h.play()
      h.fade(0, VOLUME_MUSIK, FADE_MUSIK)
    }
  }

  hentikanMusik() {
    this.musikNama = null
    this.lepasMusik()
  }

  private lepasMusik() {
    const h = this.musikHowl
    this.musikHowl = null
    if (!h) return
    if (h.playing()) {
      h.fade(h.volume(), 0, 400)
      h.once('fade', () => h.unload())
    } else h.unload()
  }

  // ── VO ───────────────────────────────────────────────────

  /** true jika rekaman VO untuk baris ini ada di public/audio/vo/. */
  adaVO(lineId: string): boolean {
    return !!cari('vo', lineId)
  }

  /**
   * Putar VO. Selesai (resolve) saat rekaman habis, dihentikan, atau langsung
   * jika file tidak ada / VO dimatikan / audio belum dibuka.
   */
  vo(lineId: string): Promise<void> {
    this.hentikanVO()
    const file = cari('vo', lineId)
    const p = this.pengaturan
    if (!file || !this.terbuka || !p.suara || !p.vo) return Promise.resolve()
    this.pastikanJalan()
    return new Promise<void>((resolve) => {
      const el = new Audio()
      this.voEl = el
      let blobUrl = ''
      let cadangan = 0
      const selesai = () => {
        window.clearTimeout(cadangan)
        if (this.voEl === el) {
          this.voEl = null
          el.pause()
        }
        this.voSelesai = null
        if (blobUrl) URL.revokeObjectURL(blobUrl)
        resolve()
      }
      this.voSelesai = selesai
      el.addEventListener('ended', selesai, { once: true })
      el.addEventListener('error', selesai, { once: true })
      // Pemutaran yang macet tidak boleh menahan intro/layar selamanya.
      el.addEventListener(
        'loadedmetadata',
        () => {
          if (Number.isFinite(el.duration)) cadangan = window.setTimeout(selesai, el.duration * 1000 + CADANGAN_VO_MS)
        },
        { once: true },
      )
      // Diunduh utuh lewat fetch (bukan streaming <audio> dengan Range) supaya service worker
      // bisa menyimpannya untuk dimainkan offline.
      fetch(url(file))
        .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
        .then((b) => {
          if (this.voEl !== el) return selesai()
          blobUrl = URL.createObjectURL(b)
          el.src = blobUrl
          this.sambungAnalyser(el)
          return el.play()
        })
        .catch(selesai)
    })
  }

  hentikanVO() {
    if (this.voEl) {
      this.voEl.pause()
      this.voEl = null
    }
    this.voSelesai?.()
  }

  /** Volume VO yang sedang diputar, 0..1. Berikan ke <Karakter lipSync={audio.levelVO} />. */
  levelVO = (): number => {
    if (!this.voEl || !this.analyser || !this.dataLevel) return 0
    this.analyser.getByteTimeDomainData(this.dataLevel)
    let jumlah = 0
    for (const v of this.dataLevel) {
      const s = (v - 128) / 128
      jumlah += s * s
    }
    return Math.min(1, Math.sqrt(jumlah / this.dataLevel.length) * 3)
  }

  private sambungAnalyser(el: HTMLAudioElement) {
    const ctx = Howler.ctx
    if (!ctx || !Howler.masterGain) return // tanpa Web Audio: VO tetap bunyi, lip-sync diam
    if (!this.analyser) {
      this.analyser = ctx.createAnalyser()
      this.analyser.fftSize = 512
      this.analyser.connect(Howler.masterGain)
      this.dataLevel = new Uint8Array(this.analyser.fftSize)
    }
    try {
      ctx.createMediaElementSource(el).connect(this.analyser)
    } catch {
      // Browser tertentu menolak; VO tetap diputar langsung.
    }
  }
}

export const audio = new AudioManager()
