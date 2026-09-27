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
- **Bakiak — angka lomba** (semua di `src/games/bakiak/config.ts`): jarak 25 m, langkah Pas 0,4 m (Oke 0,2 m), jadi lomba sempurna = 63 ketukan ≈ 40 detik. Tempo mulai 80 BPM, naik 5 BPM setiap 8 ketukan sampai 120. Jendela nilai: Pas ±100 ms, Oke ±200 ms, di luar itu Meleset. Meter goyang: Pas −12, Meleset +18, salah tombol +25, menekan di luar ketukan ("terburu-buru") +8; setelah bangkit meter kembali ke 35.
- **Bakiak — bangkit:** batas 2 detik untuk 6 ketukan dihitung **sejak ketukan pertama**, bukan sejak tim jatuh, supaya tidak ada hukuman waktu reaksi. Gagal = hitungan diulang.
- **Bakiak — Tim Kompak** dipilih di kartu "Siap lomba bakiak?" di dalam game (hanya di Duel Satu Layar), bukan di Kenalan Dulu, supaya `Sesi` dan layar Kenalan Dulu tetap umum untuk semua game. Pilihan terakhir diingat saat "Ulang dari awal". Tiga tombol yang tidak ditekan bersamaan dalam 150 ms dinilai seperti salah tombol ("Belum kompak!").
- **Bakiak — isi tim:** tim pemain utama = avatar pemain + Sekar + Dimas. Tim komputer = Bima + dua teman dari kit avatar (tanpa nama). Di duel, tim kanan = avatar pemain 2 + Bima + satu teman kit avatar.
- **Bakiak — suara:** ketukan kentongan dan efek (jatuh, bangkit, finis) disintesis dengan Web Audio karena aba-aba harus dijadwalkan tepat waktu dan `public/audio/` belum berisi file. Tetap ikut tombol mute dan baru berbunyi setelah tap pertama.
