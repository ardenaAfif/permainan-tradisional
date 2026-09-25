import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Jam } from './jam'

describe('Jam', () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] }))
  afterEach(() => vi.useRealTimers())

  it('tunggu selesai setelah waktunya', async () => {
    const jam = new Jam()
    const cb = vi.fn()
    void jam.tunggu(1000).then(cb)
    await vi.advanceTimersByTimeAsync(999)
    expect(cb).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(cb).toHaveBeenCalled()
  })

  it('waktu tidak berjalan saat jeda', async () => {
    const jam = new Jam()
    const cb = vi.fn()
    void jam.tunggu(1000).then(cb)
    await vi.advanceTimersByTimeAsync(400)
    jam.jeda()
    await vi.advanceTimersByTimeAsync(5000)
    expect(cb).not.toHaveBeenCalled()
    jam.lanjut()
    await vi.advanceTimersByTimeAsync(599)
    expect(cb).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(cb).toHaveBeenCalled()
  })

  it('setelah dihentikan, tunggu tidak pernah selesai', async () => {
    const jam = new Jam()
    const cb = vi.fn()
    void jam.tunggu(100).then(cb)
    jam.hentikan()
    void jam.tunggu(10).then(cb)
    await vi.advanceTimersByTimeAsync(1000)
    expect(cb).not.toHaveBeenCalled()
  })
})
