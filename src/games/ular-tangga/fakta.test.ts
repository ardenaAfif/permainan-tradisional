import { describe, expect, it } from 'vitest'
import { GAMES } from '../../data/games'
import { semuaFakta, TumpukanFakta } from './fakta'

describe('fakta "Tahukah kamu?"', () => {
  const fakta = semuaFakta('ular-tangga')

  it('tidak memuat ular tangga sendiri', () => {
    expect(fakta.some((f) => f.gameId === 'ular-tangga')).toBe(false)
  })

  it('setiap teks berasal persis dari games.json', () => {
    for (const f of fakta) {
      const g = GAMES.find((x) => x.id === f.gameId)!
      const sumber = [g.deskripsi, ...g.aturanAsli, g.caraMainWeb].join('\n')
      expect(sumber).toContain(f.teks)
    }
  })

  it('tumpukan tidak mengulang permainan yang sama berturut-turut', () => {
    const t = new TumpukanFakta('ular-tangga')
    let lalu = ''
    for (let i = 0; i < 40; i++) {
      const f = t.ambil()
      expect(f.gameId).not.toBe(lalu)
      lalu = f.gameId
    }
  })
})
