/**
 * Mengompres rekaman audio ke public/audio: mono, MP3, 64 kbps untuk VO dan
 * 96 kbps untuk sfx/musik (batas performa HP kelas bawah).
 *
 *   npm run audio            # audio-mentah/** → public/audio/** (.mp3)
 *   npm run audio -- --cek   # periksa file di public/audio (kanal & bitrate)
 *
 * Taruh rekaman asli (wav/m4a/mp3/ogg, kualitas berapa pun) di audio-mentah/
 * dengan susunan folder yang sama: audio-mentah/vo/intro-1-bima.wav →
 * public/audio/vo/intro-1-bima.mp3. Butuh ffmpeg (macOS: brew install ffmpeg,
 * Windows: winget install ffmpeg).
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'

const MENTAH = 'audio-mentah'
const TUJUAN = join('public', 'audio')
const AUDIO = /\.(wav|mp3|m4a|ogg|flac|aac)$/i
const bitrate = (rel) => (rel.split(sep)[0] === 'vo' ? '64k' : '96k')
const sunyi = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05'
const POTONG_SUNYI = `${sunyi},areverse,${sunyi},areverse`

function berkas(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((f) => f.isFile() && AUDIO.test(f.name))
    .map((f) => join(f.parentPath, f.name))
}

function adaFfmpeg() {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

if (!adaFfmpeg()) {
  console.error('ffmpeg belum terpasang. macOS: brew install ffmpeg · Windows: winget install ffmpeg')
  process.exit(1)
}

if (process.argv.includes('--cek')) {
  let masalah = 0
  for (const f of berkas(TUJUAN)) {
    const info = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=channels,bit_rate', '-of', 'csv=p=0', f], { encoding: 'utf8' }).trim()
    const [kanal, bps] = info.split(',').map(Number)
    const kbps = Math.round(bps / 1000)
    const ok = kanal === 1 && kbps <= 96
    if (!ok) masalah++
    console.log(`${ok ? 'OK   ' : 'UBAH '} ${relative(TUJUAN, f)}  ${kanal === 1 ? 'mono' : `${kanal} kanal`}, ${kbps} kbps`)
  }
  console.log(masalah ? `\n${masalah} file perlu dikompres ulang (mono, ≤96 kbps).` : '\nSemua file audio sudah sesuai.')
  process.exit(masalah ? 1 : 0)
}

const daftar = berkas(MENTAH)
if (daftar.length === 0) {
  console.log(`Tidak ada rekaman di ${MENTAH}/. Contoh: ${MENTAH}/vo/intro-1-bima.wav`)
  process.exit(0)
}
for (const f of daftar) {
  const rel = relative(MENTAH, f)
  const keluar = join(TUJUAN, rel.replace(AUDIO, '.mp3'))
  mkdirSync(dirname(keluar), { recursive: true })
  // loudnorm menyamakan kerasnya suara antarrekaman; -ar 44100 aman untuk semua browser.
  // VO: jeda kosong di awal & akhir dipotong (sisa 50 ms) supaya lip-sync dan aba-aba tidak telat.
  const filter = [rel.split(sep)[0] === 'vo' && POTONG_SUNYI, 'loudnorm=I=-16:TP=-1.5:LRA=11'].filter(Boolean).join(',')
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', f, '-ac', '1', '-ar', '44100', '-af', filter, '-codec:a', 'libmp3lame', '-b:a', bitrate(rel), keluar])
  console.log(`${rel} → ${relative('.', keluar)} (${bitrate(rel)})`)
}
console.log(`\n${daftar.length} file selesai. Jalankan ulang "npm run dev" bila daftar audio belum terbaca.`)
