/**
 * GAME DUMMY — hanya untuk menguji GameShell (HUD, jeda, hasil). Hapus folder
 * ini setelah game pilot ular tangga jadi.
 * Aturan: tekan tombol sampai 10. Lawan Komputer & Duel Satu Layar = balapan,
 * Main Bergantian = setiap tekanan menambah skor pemain yang sedang giliran.
 */
import { kirimHud } from '../../shared/hud'
import type { GameModule, MountOptions, Player } from '../../shared/types'
import s from './dummy.module.css'

const TARGET = 10
const JEDA_CPU = { mudah: 900, sedang: 620, sulit: 420 }

let akar: HTMLElement | null = null
let opsi: MountOptions | null = null
let skor: Record<string, number> = {}
let giliran = 0
let jeda = false
let selesai = false
let mulai = 0
let waktuJeda = 0
let timerCpu: number | undefined
let lepasKeyboard: (() => void) | null = null

function perbaruiTampilan() {
  if (!akar || !opsi) return
  for (const p of opsi.players) {
    const el = akar.querySelector<HTMLElement>(`[data-skor="${p.id}"]`)
    if (el) el.textContent = `${skor[p.id]} / ${TARGET}`
  }
  const aktif = opsi.players[giliran]
  const label = akar.querySelector<HTMLElement>('[data-giliran]')
  if (label && aktif) label.textContent = opsi.mode === 'hotseat' ? `Giliran ${aktif.nama}` : 'Tekan secepatnya!'
  kirimHud(akar, {
    skor,
    giliran: opsi.mode === 'hotseat' ? (aktif?.id ?? null) : null,
    pesan: jeda ? 'Jeda' : null,
  })
}

function tekan(p: Player) {
  if (!opsi || jeda || selesai) return
  if (opsi.mode === 'hotseat' && opsi.players[giliran]?.id !== p.id) return
  skor[p.id] = (skor[p.id] ?? 0) + 1
  if (skor[p.id]! >= TARGET) return tamat(p)
  if (opsi.mode === 'hotseat') giliran = (giliran + 1) % opsi.players.length
  perbaruiTampilan()
}

function tamat(pemenang: Player) {
  if (!opsi) return
  selesai = true
  window.clearTimeout(timerCpu)
  perbaruiTampilan()
  const o = opsi
  const durasiDetik = Math.round((performance.now() - mulai - waktuJeda) / 1000)
  window.setTimeout(() => o.onFinish({ pemenang, skor: { ...skor }, durasiDetik }), 500)
}

function jalankanCpu() {
  if (!opsi || jeda || selesai) return
  const cpu = opsi.players.filter((p) => p.avatar === 'cpu')
  if (!cpu.length) return
  timerCpu = window.setTimeout(() => {
    cpu.forEach((p) => Math.random() < 0.85 && tekan(p))
    jalankanCpu()
  }, JEDA_CPU[opsi.difficulty])
}

function tombol(p: Player, tuts: string) {
  const b = document.createElement('button')
  b.type = 'button'
  b.className = s.tombol!
  b.style.setProperty('--warna', p.warna)
  b.innerHTML = `<span class="${s.nama}"></span><span class="${s.skor}" data-skor="${p.id}"></span><span class="${s.tuts}">${tuts}</span>`
  b.querySelector(`.${s.nama}`)!.textContent = p.nama
  // pointerdown (bukan click) supaya beberapa jari bisa menekan bersamaan
  b.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    tekan(p)
  })
  return b
}

const dummy: GameModule = {
  id: 'dummy',
  modes: ['cpu', 'hotseat', 'split'],
  orientation: 'any',

  mount(el, o) {
    akar = el
    opsi = o
    skor = Object.fromEntries(o.players.map((p) => [p.id, 0]))
    giliran = 0
    jeda = false
    selesai = false
    mulai = performance.now()
    waktuJeda = 0

    el.innerHTML = `<div class="${s.arena}"><p class="${s.giliran}" data-giliran></p><div class="${s.barisan}"></div></div>`
    const barisan = el.querySelector(`.${s.barisan}`)!
    const manusia = o.players.filter((p) => p.avatar !== 'cpu')
    const tampil = o.mode === 'hotseat' ? o.players : o.mode === 'split' ? o.players.slice(0, 2) : manusia
    const tutsDuel = ['A', 'L']
    tampil.forEach((p, i) => barisan.appendChild(tombol(p, o.mode === 'split' ? `Tombol ${tutsDuel[i]}` : 'Spasi')))
    if (o.mode === 'cpu') {
      for (const p of o.players.filter((q) => q.avatar === 'cpu')) {
        const info = document.createElement('div')
        info.className = s.cpu!
        info.style.setProperty('--warna', p.warna)
        info.innerHTML = `<span class="${s.nama}"></span><span class="${s.skor}" data-skor="${p.id}"></span>`
        info.querySelector(`.${s.nama}`)!.textContent = `${p.nama} (komputer)`
        barisan.appendChild(info)
      }
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      const k = e.key.toLowerCase()
      if (o.mode === 'split' && (k === 'a' || k === 'l')) tekan(o.players[k === 'a' ? 0 : 1]!)
      else if (o.mode !== 'split' && k === ' ') {
        e.preventDefault()
        tekan(o.mode === 'hotseat' ? o.players[giliran]! : manusia[0]!)
      }
    }
    window.addEventListener('keydown', onKey)
    lepasKeyboard = () => window.removeEventListener('keydown', onKey)

    perbaruiTampilan()
    jalankanCpu()
  },

  unmount() {
    window.clearTimeout(timerCpu)
    lepasKeyboard?.()
    lepasKeyboard = null
    if (akar) akar.innerHTML = ''
    akar = null
    opsi = null
  },

  pause() {
    if (jeda) return
    jeda = true
    waktuJeda -= performance.now()
    window.clearTimeout(timerCpu)
    perbaruiTampilan()
  },

  resume() {
    if (!jeda) return
    jeda = false
    waktuJeda += performance.now()
    perbaruiTampilan()
    jalankanCpu()
  },
}

export default dummy
