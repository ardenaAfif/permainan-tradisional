/** Data HUD yang dikirim game ke GameShell. Kirim hanya bagian yang berubah. */
export interface HudData {
  /** id pemain yang sedang giliran (diberi cincin kunyit). */
  giliran?: string | null
  /** Skor per id pemain; boleh angka atau teks singkat ("Kotak 47"). */
  skor?: Record<string, number | string>
  /** Pesan singkat di tengah HUD, mis. "Lempar dadu!". */
  pesan?: string | null
}

export const HUD_EVENT = 'kd-hud'

/** Dipanggil game: perbarui HUD GameShell lewat elemen yang diterima di mount(). */
export function kirimHud(el: HTMLElement, data: HudData) {
  el.dispatchEvent(new CustomEvent<HudData>(HUD_EVENT, { detail: data, bubbles: true }))
}
