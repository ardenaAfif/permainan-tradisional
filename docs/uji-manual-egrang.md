# Uji manual Egrang (HP, tablet, dan PID)

Hal-hal ini tidak bisa dipastikan di browser komputer: sensor miring sungguhan, multi-touch beberapa siswa, latensi layar sentuh, dan performa HP kelas bawah. Jalankan `npm run uji-hp`, lalu buka alamat jaringan yang muncul (port 8001) di perangkat yang satu Wi-Fi.

Catat untuk setiap perangkat: merek/model, browser, ukuran layar, dan hasil tiap langkah (✔ / ✘ + catatan).

## A. HP Android kelas bawah (Lawan Komputer)

| # | Langkah | Hasil yang diharapkan |
|---|---------|-----------------------|
| A1 | Egrang → Kenalan Dulu → Lawan Komputer, Sedang → Main, HP **tegak**. | Hanya ajakan "Putar HP-mu". |
| A2 | Miringkan HP. | Kartu "Siap lomba egrang?" dengan pilihan **Tombol saja** / **+ Miring HP**. Tidak ada petunjuk huruf keyboard. Teks terbaca. |
| A3 | Pilih Tombol saja → Mulai!, lalu tekan KIRI–KANAN bergantian kira-kira 2× per detik dengan dua jempol. | Hitungan 3-2-1-JALAN!, bunyi "tok" tiap langkah, siswa melangkah mulus. Jarum meter tetap di hijau. Penanda irama di bawah meter bergerak dan langkah terasa pas saat penanda di zona hijau. |
| A4 | Tekan KIRI–KANAN secepat mungkin. | "TERBURU-BURU!", jarum makin ke pinggir, lalu jatuh lucu ("GUBRAK!", bintang pusing), panel "JATUH!", lalu "Balik ke start" dan siswa muncul di garis start. |
| A5 | Tekan KIRI dua kali berturut-turut. | "KAKI SAMA!", badan condong ke kanan, tidak maju. |
| A6 | Setelah badan miring, tahan TAHAN 1 detik. | TAHAN menyala, badan perlahan tegak, siswa tidak maju. Setelah dilepas bisa lanjut melangkah. |
| A7 | Lewati tanah bergelombang dan genangan. | Di genangan ada percikan dan langkah lebih pendek; di kedua rintangan badan lebih goyah. |
| A8 | Selesaikan lomba. | Medali urutan di ujung lintasan, papan "Urutan finis", lalu layar hasil dengan waktu/jarak, jumlah jatuh, dan stempel. |
| A9 | Kelancaran sepanjang lomba (4 pelari + percikan). | Tidak patah-patah; tombol langsung merespons. |
| A10 | Jeda di tengah lomba (sambil menahan TAHAN), tunggu 5 detik, Lanjut. | Lomba berhenti total, TAHAN terlepas, lanjut dari posisi yang sama. |
| A11 | Main lagi dengan tingkat **Mudah**, jatuhkan siswa setelah melewati 10 m. | Papan "POS 10 m"/"POS 20 m" dan bendera hijau; setelah jatuh muncul "Ke pos 10 m". |
| A12 | Aktifkan "Hapus animasi" di HP, main lagi. | Tanpa ayunan langkah/percikan/pantulan jatuh; miring badan tetap terlihat; tetap bisa dimainkan. |

## B. Kendali miring HP (Android dan iPhone/iPad)

| # | Langkah | Hasil yang diharapkan |
|---|---------|-----------------------|
| B1 | Di kartu siap, tap **+ Miring HP**. | Android: langsung terpilih. iOS: muncul permintaan izin gerak & orientasi; jika ditolak muncul "Izin sensor miring ditolak. Pakai tombol saja." |
| B2 | Mulai, pegang HP biasa saat JALAN!, lalu putar HP seperti setir **searah jarum jam** tanpa melangkah setelah satu langkah. | Jarum dan badan bergeser ke **kanan**. Berlawanan jarum jam → ke kiri. Jika arahnya terbalik, catat (tanda di `kemudiDariSelisih`, `src/games/egrang/miring.ts`). |
| B3 | Saat badan condong ke kanan, putar HP berlawanan jarum jam. | Badan tegak kembali. Tombol KIRI/KANAN/TAHAN tetap berfungsi. |
| B4 | Taruh HP rata di meja. | Sensor tidak membuat badan oleng (diabaikan). |
| B5 | Jeda, ubah cara memegang HP, Lanjut. | Posisi baru dianggap tegak. |

## C. Duel Satu Layar di PID / laptop

| # | Langkah | Hasil yang diharapkan |
|---|---------|-----------------------|
| C1 | Duel Satu Layar → 4 pemain → isi nama → Main. | Panel bawah dibagi 4 kolom; kepala & warna di tiap kolom sama dengan tanda di kiri lintasan. Pemain 1 = lintasan paling bawah. |
| C2 | Empat siswa menekan tombolnya bersamaan, termasuk ada yang menahan TAHAN. | Semua tekanan terbaca; tekanan satu siswa tidak membatalkan siswa lain. |
| C3 | Duel 2 pemain di laptop dengan keyboard A/S (tahan W) dan K/L (tahan O). | Keduanya bisa main bersamaan; dua lintasan lain diisi komputer. |
| C4 | Duel 3 pemain. | Kolom ke-3 ←/→ (tahan ↑) di keyboard; satu lintasan diisi komputer. |
| C5 | Jari bergeser keluar dari tombol TAHAN. | TAHAN terlepas (tidak macet menyala). |
