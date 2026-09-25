import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { GAME_IDS } from '../data/games'
import type { AvatarConfig, GameId } from '../shared/types'

export interface ProgresGame {
  sudahDimainkan: boolean
  jumlahMenang: number
  /** Stempel cap batik, didapat setelah selesai main. */
  stempel: boolean
  /** Stempel emas Tantangan Lapangan, diberikan guru lewat PIN. */
  stempelEmas: boolean
}

export interface Pengaturan {
  /** Sakelar utama: mati berarti semua suara diam (tombol mute). */
  suara: boolean
  musik: boolean
  vo: boolean
  pinGuru: string
}

interface KotakState {
  avatar: AvatarConfig | null
  progres: Record<GameId, ProgresGame>
  introSudahDilihat: boolean
  pengaturan: Pengaturan

  setAvatar: (avatar: AvatarConfig) => void
  tandaiIntroDilihat: () => void
  /** Catat selesai main; mengembalikan true jika stempel ini baru didapat. */
  catatHasil: (id: string, menang: boolean) => boolean
  beriStempelEmas: (id: string) => void
  setPengaturan: (ubah: Partial<Pengaturan>) => void
  resetProgres: () => void
}

export const PIN_GURU_BAWAAN = '1234'

const progresKosong = (): ProgresGame => ({
  sudahDimainkan: false,
  jumlahMenang: 0,
  stempel: false,
  stempelEmas: false,
})

const semuaProgresKosong = () =>
  Object.fromEntries(GAME_IDS.map((id) => [id, progresKosong()])) as Record<GameId, ProgresGame>

export const useKotak = create<KotakState>()(
  persist(
    (set, get) => ({
      avatar: null,
      progres: semuaProgresKosong(),
      introSudahDilihat: false,
      pengaturan: { suara: true, musik: true, vo: true, pinGuru: PIN_GURU_BAWAAN },

      setAvatar: (avatar) => set({ avatar }),
      tandaiIntroDilihat: () => set({ introSudahDilihat: true }),
      catatHasil: (id, menang) => {
        const lama = get().progres[id as GameId]
        if (!lama) return false // id di luar games.json tidak dicatat
        set((s) => ({
          progres: {
            ...s.progres,
            [id]: { ...lama, sudahDimainkan: true, stempel: true, jumlahMenang: lama.jumlahMenang + (menang ? 1 : 0) },
          },
        }))
        return !lama.stempel
      },
      beriStempelEmas: (id) => {
        const lama = get().progres[id as GameId]
        if (!lama) return
        set((s) => ({ progres: { ...s.progres, [id]: { ...lama, stempelEmas: true } } }))
      },
      setPengaturan: (ubah) => set((s) => ({ pengaturan: { ...s.pengaturan, ...ubah } })),
      resetProgres: () => set({ progres: semuaProgresKosong() }),
    }),
    {
      name: 'kotak-dolanan',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ avatar, progres, introSudahDilihat, pengaturan }) => ({
        avatar,
        progres,
        introSudahDilihat,
        pengaturan,
      }),
      // Game baru di games.json otomatis mendapat progres kosong.
      merge: (tersimpan, awal) => {
        const t = (tersimpan ?? {}) as Partial<KotakState>
        return {
          ...awal,
          ...t,
          progres: { ...awal.progres, ...t.progres },
          pengaturan: { ...awal.pengaturan, ...t.pengaturan },
        }
      },
    },
  ),
)

export const hitungStempel = (progres: Record<GameId, ProgresGame>) =>
  Object.values(progres).filter((p) => p.stempel).length
