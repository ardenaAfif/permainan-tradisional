import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { WARNA_PEMAIN } from './tokens'

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8')

describe('tokens.ts sama dengan tokens.css', () => {
  it('warna pemain', () => {
    WARNA_PEMAIN.forEach((hex, i) => {
      expect(css).toContain(`--pemain-${i + 1}: ${hex};`)
    })
  })
})
