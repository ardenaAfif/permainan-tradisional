import { BENDA_SVG, type JenisBenda } from './benda'

interface Props {
  jenis: JenisBenda
  className?: string
}

/** Ilustrasi benda permainan (tanpa latar). Status abu-abu diatur lewat CSS pemakai. */
export function BendaGambar({ jenis, className }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 160"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: BENDA_SVG[jenis] }}
    />
  )
}
