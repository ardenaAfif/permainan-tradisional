import { useSyncExternalStore } from 'react'
import { audio } from './AudioManager'

/** true setelah tap/tombol pertama membuka suara (aturan autoplay browser). */
export function useAudioTerbuka() {
  return useSyncExternalStore(audio.ikutiBuka, () => audio.sudahTerbuka)
}
