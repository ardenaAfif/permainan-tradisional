/**
 * AudioManager: efek suara, musik latar, dan VO opsional.
 *
 * - Suara baru aktif setelah buka() dipanggil dari tap pertama (syarat browser iPhone).
 * - File diambil dari public/audio/{sfx,musik,vo}/<nama>.mp3. File yang belum
 *   ada dilewati tanpa error (daftar dari virtual:audio-manifest). URL membawa ?v=<sidik isi>
 *   supaya cache offline (service worker) ikut berganti saat rekamannya diganti.
 * - Mengikuti pengaturan di store: suara (mute semua), musik, VO.
 * - Musik latar: <audio> yang di-stream (tidak di-decode utuh ke memori, penting untuk HP
 *   kelas bawah), lewat GainNode ke Howler.masterGain supaya volumenya bisa diatur juga di
 *   iPhone dan ikut tombol mute. Dijeda saat tab tersembunyi; diredam selama VO berbicara.
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
/** Volume musik selama VO berbicara, relatif terhadap VOLUME_MUSIK. */
const REDAM_VO = 0.25
// Lama fade musik (detik).
const FADE_MASUK = 1.2
const FADE_KELUAR = 0.5
const FADE_REDAM = 0.25
const FADE_PULIH = 0.9
/** Jeda sebelum musik naik lagi setelah VO, supaya tidak naik-turun di antara baris dialog. */
const TUNDA_PULIH = 0.6
/** Batas tunggu tambahan setelah durasi VO, kalau event 'ended' tidak pernah datang. */
const CADANGAN_VO_MS = 2500

interface Musik {
  file: string
  el: HTMLAudioElement
  /** null jika Web Audio tidak tersedia: volume diatur lewat el.volume. */
  gain: GainNode | null
}

function buatMusik(file: string): Musik {
  const el = new Audio(url(file))
  el.loop = true
  el.preload = 'auto'
  const ctx = Howler.ctx
  if (ctx && Howler.masterGain) {
    try {
      const gain = ctx.createGain()
      gain.gain.value = 0
      ctx.createMediaElementSource(el).connect(gain).connect(Howler.masterGain)
      return { file, el, gain }
    } catch {
      // Browser tertentu menolak; musik tetap diputar langsung.
    }
  }
  el.volume = 0
  return { file, el, gain: null }
}

// Howler menangguhkan AudioContext 30 detik setelah tidak ada Howl yang berbunyi. VO (lewat
// analyser lip-sync) dan bunyi sintesis game juga memakai konteks ini, jadi VO akan membeku dan
// bunyi game hilang. Konteks dibiarkan tetap jalan.
Howler.autoSuspend = false

class AudioManager {
  private terbuka = false
  private sfxCache = new Map<string, Howl>()
  /** Musik yang diminta layar sekarang (null = tidak ada). */
  private musikNama: string | null = null
  /** true selama game dimainkan: musik ditahan, posisinya disimpan. */
  private musikJeda = false
  private musikM: Musik | null = null
  private musikTimer = 0
  private voEl: HTMLAudioElement | null = null
  private voSelesai: (() => void) | null = null
  private analyser: AnalyserNode | null = null
  private dataLevel: Uint8Array<ArrayBuffer> | null = null

  constructor() {
    this.terapkanPengaturan()
    useKotak.subscribe((s, lama) => {
      if (s.pengaturan !== lama.pengaturan) this.terapkanPengaturan()
    })
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => this.segarkanMusik())
  }

  private get pengaturan() {
    return useKotak.getState().pengaturan
  }

  private terapkanPengaturan() {
    const p = this.pengaturan
    Howler.mute(!p.suara)
    if (!p.vo || !p.suara) this.hentikanVO()
    this.segarkanMusik()
  }

  /** Panggil dari tap pertama pemain (tombol Mulai). Aman dipanggil berkali-kali. */
  buka() {
    if (this.terbuka) return
    this.terbuka = true
    Howler.volume(Howler.volume()) // memastikan AudioContext Howler sudah dibuat
    void Howler.ctx?.resume()
    // Masih di dalam tap: play() musik di sini diizinkan browser iPhone.
    this.segarkanMusik()
    // Efek suara kecil-kecil (±300 KB): dimuat sekarang supaya bunyi pertama tidak telat.
    for (const file of Object.keys(daftarFile)) if (file.startsWith('sfx/')) this.howlSfx(file)
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
    const h = this.howlSfx(file)
    const id = h.play()
    h.volume(volume, id)
  }

  private howlSfx(file: string) {
    let h = this.sfxCache.get(file)
    if (!h) {
      h = new Howl({ src: [url(file)], preload: true })
      this.sfxCache.set(file, h)
    }
    return h
  }

  // ── Musik ────────────────────────────────────────────────

  /** true jika file musik ini ada di public/audio/musik/. */
  adaMusik(nama: string): boolean {
    return !!cari('musik', nama)
  }

  /** Putar musik latar berulang (lanjut dari posisinya jika sama). Jika belum terbuka, diputar setelah buka(). */
  musik(nama: string) {
    this.musikNama = nama
    this.musikJeda = false
    this.segarkanMusik()
  }

  /** Tahan musik (mis. selama game) dengan fade; musik(nama) melanjutkannya dari posisi yang sama. */
  jedaMusik() {
    this.musikJeda = true
    this.segarkanMusik()
  }

  hentikanMusik() {
    this.musikNama = null
    this.segarkanMusik()
  }

  private get musikBoleh() {
    const p = this.pengaturan
    return this.terbuka && !!this.musikNama && !this.musikJeda && p.suara && p.musik && !document.hidden
  }

  /** Samakan keadaan musik dengan permintaan layar, pengaturan, VO, dan visibilitas tab. */
  private segarkanMusik() {
    const file = this.musikNama ? cari('musik', this.musikNama) : undefined
    if (!this.musikBoleh || !file) {
      const m = this.musikM
      if (!m || m.el.paused) return
      if (!file) this.lepasMusik()
      else {
        this.rampMusik(m, 0, FADE_KELUAR)
        window.clearTimeout(this.musikTimer)
        this.musikTimer = window.setTimeout(() => !this.musikBoleh && m.el.pause(), FADE_KELUAR * 1000 + 50)
      }
      return
    }
    if (this.musikM?.file !== file) {
      this.lepasMusik()
      this.musikM = buatMusik(file)
    }
    const m = this.musikM!
    window.clearTimeout(this.musikTimer)
    this.pastikanJalan()
    if (m.el.paused) {
      m.el.play().catch(() => {
        // Diblokir aturan autoplay: coba lagi pada tap berikutnya.
        window.addEventListener('pointerdown', () => this.segarkanMusik(), { once: true, capture: true })
      })
    }
    this.rampMusik(m, this.targetMusik(), FADE_MASUK)
  }

  private targetMusik() {
    return VOLUME_MUSIK * (this.voEl ? REDAM_VO : 1)
  }

  /** Naik-turunkan volume musik dengan halus. */
  private rampMusik(m: Musik, target: number, detik: number, tunda = 0) {
    if (!m.gain) {
      m.el.volume = target
      return
    }
    const g = m.gain.gain
    const t = m.gain.context.currentTime
    g.cancelScheduledValues(t)
    g.setValueAtTime(g.value, t + tunda)
    g.linearRampToValueAtTime(target, t + tunda + detik)
  }

  /** Dipanggil saat VO mulai/selesai: redam atau pulihkan musik. */
  private redamMusik() {
    const m = this.musikM
    if (!m || !this.musikBoleh) return
    if (this.voEl) this.rampMusik(m, this.targetMusik(), FADE_REDAM)
    else this.rampMusik(m, this.targetMusik(), FADE_PULIH, TUNDA_PULIH)
  }

  private lepasMusik() {
    const m = this.musikM
    this.musikM = null
    window.clearTimeout(this.musikTimer)
    if (!m) return
    this.rampMusik(m, 0, FADE_KELUAR)
    window.setTimeout(() => {
      m.el.pause()
      m.el.removeAttribute('src')
      m.el.load()
      m.gain?.disconnect()
    }, FADE_KELUAR * 1000 + 50)
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
      this.redamMusik()
      let blobUrl = ''
      let cadangan = 0
      const selesai = () => {
        window.clearTimeout(cadangan)
        if (this.voEl === el) {
          this.voEl = null
          el.pause()
          this.redamMusik()
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
      this.redamMusik()
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
