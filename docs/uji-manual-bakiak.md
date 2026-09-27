# Uji manual Bakiak (HP dan PID)

Hal-hal ini tidak bisa dipastikan di browser komputer: multi-touch sungguhan, latensi layar sentuh dan audio, serta performa HP kelas bawah. Jalankan `npm run uji-hp`, lalu buka alamat jaringan yang muncul (port 8001) di perangkat yang satu Wi-Fi.

Catat untuk setiap perangkat: merek/model, browser, ukuran layar, dan hasil tiap langkah (✔ / ✘ + catatan).

## A. HP Android kelas bawah (mode Lawan Komputer)

| # | Langkah | Hasil yang diharapkan |
|---|---------|-----------------------|
| A1 | Buka Bakiak dari menu → Kenalan Dulu → Lawan Komputer, Sedang → Main, dengan HP **tegak**. | Muncul ajakan "Putar HP-mu". Tidak ada lomba yang berjalan di belakangnya. |
| A2 | Miringkan HP. | Lintasan dan kartu "Siap lomba bakiak?" tampil penuh. Teks terbaca tanpa memicingkan mata. |
| A3 | Tap **Mulai!** | Hitungan 3, 2, 1, JALAN! terdengar sebagai ketukan kentongan dan tampil di langit. |
| A4 | Ikuti aba-aba dengan dua jempol sampai finis. | Ketukan terdengar **pas** dengan catatan yang masuk ke lingkaran (tidak terasa telat). Tulisan PAS!/OKE muncul sesuai rasa. Kalau selalu terasa telat/cepat, catat kira-kira berapa. |
| A5 | Perhatikan kelancaran selama lomba, terutama saat tempo sudah 110–120. | Catatan aba-aba bergerak mulus, tidak patah-patah. Tombol langsung merespons. HP tidak terasa panas berlebihan. |
| A6 | Sengaja tekan tombol yang salah beberapa kali. | Tulisan "SALAH KAKI!", meter goyang naik, tim jatuh ke depan dengan bintang pusing, panel berubah jadi "Ketuk cepat 6×!". |
| A7 | Ketuk 5 kali lalu diam 2 detik. | Muncul "Kurang cepat! Lagi!", titik kembali kosong. |
| A8 | Ketuk 6 kali dengan cepat. | Tim berdiri bertahap tiap ketukan, lalu lanjut berjalan. |
| A9 | Tap tombol jeda di tengah lomba, tunggu 5 detik, lalu Lanjut. | Lomba berhenti total (aba-aba, komputer, catatan) dan melanjutkan dari posisi yang sama tanpa loncatan. |
| A10 | Di tengah lomba, putar HP ke tegak lalu mendatar lagi. | Saat tegak hanya ajakan "Putar HP-mu". Saat mendatar muncul menu Jeda; setelah Lanjut, tombol tetap tepat di bawah jari (sentuhan tidak meleset). |
| A11 | Tekan tombol mute di pojok kanan atas. | Semua bunyi berhenti, termasuk ketukan kentongan. Aba-aba tetap tampil di layar. |
| A12 | Selesaikan lomba. | Tulisan FINIS! lalu layar hasil dengan jarak, jumlah Pas, jumlah jatuh, dan stempel. |
| A13 | Pengaturan HP: aktifkan "Hapus animasi" / kurangi gerak, lalu main lagi. | Tim tidak bergoyang/melompat, jatuh langsung tanpa animasi, permainan tetap bisa dimainkan. |

## B. Duel Satu Layar di HP atau tablet (dua pemain, mode Biasa)

| # | Langkah | Hasil yang diharapkan |
|---|---------|-----------------------|
| B1 | Pilih Duel Satu Layar → Main → pilih **Biasa** → Mulai. Dua pemain memegang sisi masing-masing. | Sisi kiri = tim kiri (warna kunyit), sisi kanan = tim kanan (merah bata), sesuai papan skor di atas. |
| B2 | Kedua pemain menekan tombol **bersamaan** di setiap ketukan. | Kedua tim maju. Tekanan satu pemain tidak pernah membatalkan atau "mencuri" tekanan pemain lain. |
| B3 | Satu pemain menahan jempol di tombolnya, pemain lain terus bermain. | Pemain lain tetap bisa menekan dan dinilai normal. |

## C. Tim Kompak di Papan Interaktif Digital (PID)

Butuh 6 siswa (3 per tim). Tes ini yang paling penting untuk multi-touch.

| # | Langkah | Hasil yang diharapkan |
|---|---------|-----------------------|
| C1 | Buka di PID, Duel Satu Layar → Main → pilih **Tim Kompak** → Mulai. | Tiap sisi punya 3 tombol besar bergambar wajah siswa. Tulisan terbaca dari barisan belakang kelas. |
| C2 | Keenam siswa menekan tombolnya **bersamaan** di satu ketukan. | Keenam tombol tampak turun sekaligus. Kedua tim maju (PAS!/OKE). |
| C3 | Satu tim menekan bertiga dengan serempak; tim lain sengaja satu siswa telat ±½ detik. | Tim serempak maju. Tim yang tidak serempak mendapat "BELUM KOMPAK!" dan tidak maju. |
| C4 | Satu siswa di tiap tim tidak ikut menekan selama beberapa ketukan. | Tim tidak maju, meter goyang naik, lalu jatuh. |
| C5 | Saat jatuh, ketiga siswa tim itu mengetuk bergantian. | Semua ketukan dari ketiga tombol dihitung untuk bangkit (6 ketukan). |
| C6 | Coba 7–10 jari sekaligus (siswa lain ikut menyentuh papan). | Catat berapa sentuhan yang masih terbaca. Game dirancang untuk 9 sentuhan; sentuhan ke-10 dst. bisa tidak terbaca. Beberapa PID membatasi jumlah sentuhan sendiri (mis. 10 atau 20 titik). |
| C7 | Siswa menekan dengan telapak tangan/jari lebar, atau menggeser jari keluar tombol. | Tombol tidak "macet" dalam keadaan tertekan setelah jari diangkat. |
| C8 | Periksa jeda antara jari menyentuh dan tombol bereaksi. | Terasa langsung. Kalau terasa telat (lebih dari ±0,1 detik), catat model PID-nya; mungkin jendela Pas/Oke perlu dilonggarkan di `config.ts`. |

## D. Laptop (keyboard dan mouse)

| # | Langkah | Hasil yang diharapkan |
|---|---------|-----------------------|
| D1 | Lawan Komputer: main dengan A/S, lalu dengan ←/→, lalu dengan klik mouse. | Ketiganya bekerja. Huruf petunjuk tampil di pojok tombol dan di catatan aba-aba yang berjalan (A/S; duel K/L; Tim Kompak ASD/JKL). |
| D2 | Duel Biasa: satu orang A/S, satu orang K/L, ditekan bersamaan. | Kedua tim maju. |
| D3 | Duel Tim Kompak: A/S/D dan J/K/L ditekan bersamaan. | Kedua tim maju. (Beberapa keyboard murah tidak bisa membaca 6 tombol sekaligus; catat jika ada.) |
| D4 | Tekan Esc di tengah lomba. | Menu Jeda muncul, lomba berhenti. |
| D5 | Enter atau Spasi di kartu "Siap lomba bakiak?". | Lomba dimulai. |

## Yang perlu dilaporkan balik

- Perangkat yang terasa telat pada ketukan (A4, C8): butuh penyetelan jendela nilai.
- Jumlah sentuhan maksimum yang terbaca di PID (C6).
- HP yang patah-patah saat tempo tinggi (A5).
- Tingkat kesulitan komputer: apakah Mudah terlalu mudah / Sulit terlalu sulit untuk siswa SMP.
