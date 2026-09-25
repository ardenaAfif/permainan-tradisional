/**
 * Komentar tokoh di layar hasil. {pemenang} diganti nama pemenang.
 * Nada: teman sebaya yang sportif, tidak mengejek.
 */
export type JenisHasil = 'menang' | 'kalah' | 'seri'
export type Komentator = 'bima' | 'sekar' | 'dimas'

export const KOMENTAR: Record<Komentator, Record<JenisHasil, string[]>> = {
  bima: {
    menang: ['Mantap, {pemenang}! Ronde depan giliranku yang menang, ya.', 'Wah, cepat banget! Aku tantang lagi, deh.', 'Keren! Tapi jangan senang dulu, aku lagi pemanasan.'],
    kalah: ['Hampir! Satu ronde lagi, pasti bisa.', 'Selamat buat {pemenang}. Aku juga pernah kalah tiga kali berturut-turut, kok.', 'Belum rezeki. Ayo balas dendam secara sportif!'],
    seri: ['Seri? Berarti harus ada ronde penentuan!', 'Sama kuat! Seru banget tadi.'],
  },
  sekar: {
    menang: ['Selamat, {pemenang}! Strategimu apa? Aku mau catat.', 'Hebat! Di lapangan aslinya pasti lebih seru lagi.', 'Wah, {pemenang} jago juga. Boleh ajari aku?'],
    kalah: ['Tidak apa-apa. Kata Pak Ahsan, yang penting sportif.', 'Tadi sudah bagus. Coba lagi dengan cara berbeda?', '{pemenang} menang kali ini. Kamu pasti bisa menyusul!'],
    seri: ['Seri! Kalian sama-sama jago.', 'Menarik, hasilnya imbang. Coba lagi yuk!'],
  },
  dimas: {
    menang: ['...Keren. Aku juga mau coba.', 'Selamat, {pemenang}. Itu tadi rapi sekali.', 'Wah. Aku sampai lupa napas lihatnya.'],
    kalah: ['Aku juga sering kalah... tapi jadi makin paham caranya.', 'Tadi sudah dekat, kok. Sekali lagi?', 'Selamat untuk {pemenang}. Kita main bareng lagi, ya.'],
    seri: ['Seri... jarang-jarang, lho.', 'Imbang. Berarti kalian sama-sama belajar.'],
  },
}

export function pilihKomentar(jenis: JenisHasil, namaPemenang: string): { tokoh: Komentator; teks: string } {
  const semua: Komentator[] = ['bima', 'sekar', 'dimas']
  const tokoh = semua[Math.floor(Math.random() * semua.length)]!
  const daftar = KOMENTAR[tokoh][jenis]
  const teks = daftar[Math.floor(Math.random() * daftar.length)]!.replaceAll('{pemenang}', namaPemenang)
  return { tokoh, teks }
}
