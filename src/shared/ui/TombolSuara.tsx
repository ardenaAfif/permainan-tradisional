import { useKotak } from '../../app/store'
import { IkonSuara } from './Ikon'
import { TombolIkon } from './Tombol'

/** Tombol matikan/nyalakan semua suara. Wajib ada di setiap layar. */
export function TombolSuara({ gaya = 'nila' }: { gaya?: 'kertas' | 'nila' | 'tabir' }) {
  const aktif = useKotak((s) => s.pengaturan.suara)
  const setPengaturan = useKotak((s) => s.setPengaturan)
  return (
    <TombolIkon
      gaya={gaya}
      aria-label={aktif ? 'Matikan suara' : 'Nyalakan suara'}
      aria-pressed={!aktif}
      onClick={() => setPengaturan({ suara: !aktif })}
    >
      <IkonSuara aktif={aktif} />
    </TombolIkon>
  )
}
