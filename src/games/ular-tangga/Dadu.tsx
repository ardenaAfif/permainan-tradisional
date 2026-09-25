const TITIK: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[26, 26], [50, 50], [74, 74]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 26], [72, 26], [28, 50], [72, 50], [28, 74], [72, 74]],
}

/** Muka dadu (gambar dadu merah bata seperti ikon kartu). */
export function MukaDadu({ angka, className }: { angka: number; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <rect x="4" y="4" width="92" height="92" rx="22" fill="var(--merah-bata)" />
      <rect x="4" y="74" width="92" height="22" rx="11" fill="var(--merah-bata-gelap)" />
      <rect x="4" y="4" width="92" height="80" rx="22" fill="var(--merah-bata)" />
      {TITIK[angka]!.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="9" fill="var(--kertas-terang)" />
      ))}
    </svg>
  )
}
