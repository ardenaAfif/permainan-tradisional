# Keputusan proyek

Catatan keputusan yang tidak tertulis di brief atau daftar permainan. Tambahkan tanggal setiap kali ada keputusan baru.

## 24 September 2026

- **Bola bekel:** bola ditangkap **setelah memantul sekali** di lantai (bukan sebelum menyentuh lantai seperti tertulis di `daftar-permainan.docx`). Mekanik web mengikuti keputusan ini. Kolom `aturanAsli` di `games.json` tetap salinan persis docx sampai daftar resminya direvisi.
- **Egrang:** pemain yang jatuh **kembali ke garis start**, tidak gugur.
- **Jumlah pemain asli** di kartu menu mengikuti `daftar-permainan.docx`, bukan angka di mockup Menu.
- **Bintang kesulitan** sementara diambil dari mockup Menu (dam-daman 3, gobak sodor 3, ular tangga 1, lainnya 2). Perlu dicek guru.
- **Paket di luar stack awal:** react-router (routing), @fontsource Baloo 2 + Nunito (font lokal untuk PWA), @playwright/test (cek tampilan otomatis di 3 viewport), vitest (uji logika aturan dan AI).

## 25 September 2026

- **Pak Guru → Pak Ahsan:** tokoh guru bernama **Pak Ahsan**, guru muda (±25 tahun) berbadan berisi. Tampilan: rompi nila SNT dengan bendera dan badge SNT, kemeja cokelat lengan pendek, kacamata hitam tebal, kumis sangat tipis, jam tangan. Menggantikan desain "Pak Guru" berkemeja batik di `design/characters.js` dan `docs/brief.md`; sumber bentuknya sekarang `src/characters/kit.ts`. Id tokoh di kode tetap `guru`.

## 27 September 2026

- **Ular tangga — dapat 6, lempar lagi:** pemain yang dapat angka 6 melempar dadu lagi, dan terus melempar selama dapat 6 berturut-turut. Berlaku juga untuk komputer. Kalau lemparan 6 membuat pemain menang, permainan langsung selesai. Aturan web ini tertulis di `catatanWeb`; `aturanAsli` tetap salinan docx.
- **Dadu acak:** lemparan dadu memakai `crypto.getRandomValues`, bukan `Math.random`, setelah ada laporan urutan angka dadu berulang antarpermainan.
