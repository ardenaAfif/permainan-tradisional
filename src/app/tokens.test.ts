import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { FONT_ISI, FONT_JUDUL, WARNA, WARNA_PEMAIN } from './tokens'

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8')

describe('tokens.ts sama dengan tokens.css', () => {
  it('warna pemain', () => {
    WARNA_PEMAIN.forEach((hex, i) => {
      expect(css).toContain(`--pemain-${i + 1}: ${hex};`)
    })
  })

  it('warna untuk Phaser/canvas', () => {
    for (const [nama, hex] of Object.entries(WARNA)) {
      expect(css).toContain(`--${nama}: ${hex};`)
    }
  })

  it('font', () => {
    expect(css).toContain(`--font-judul: ${FONT_JUDUL};`)
    expect(css).toContain(`--font-isi: ${FONT_ISI};`)
  })
})
