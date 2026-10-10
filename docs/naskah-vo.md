# Naskah VO Kotak Dolanan

Naskah rekaman suara untuk dibuat dengan **RD Voice**. Satu baris = satu file.
Simpan semua file di `public/audio/vo/` dengan nama persis seperti kolom **File** (huruf kecil, pakai tanda hubung).

| Bagian | Jumlah | Status kode |
| --- | --- | --- |
| A. Intro | 8 | Selesai: file sudah terpasang dan diputar dengan lip-sync. |
| B. Kenalan Dulu | 9 | Sudah tersambung. Kalimat pembuka perlu ditambahkan ke balon kata (lihat catatan B). |
| C. Komentar layar hasil | 24 | Belum tersambung. Disambungkan setelah file lengkap. |
| D. Aba-aba di dalam game | 16 | Belum tersambung. Disambungkan setelah file lengkap. |
| E. Monolog pesan moral | 45 | Sudah tersambung (Kenalan Dulu, tombol Lanjut). |
| **Total** | **102** | |

---

## Cara membuat

1. Tempel **Teks** ke *Text Input* persis seperti di tabel. Jangan menambah kata, karena subtitle di layar memakai kalimat yang sama.
2. Pilih **Voice Character** sesuai tabel Pemeran. Satu tokoh selalu memakai suara yang sama.
3. Pilih **Speaking Style** sesuai kolom **Gaya** di tiap baris. Kolom **Cadangan** dipakai kalau hasil gaya pertama kurang pas.
4. Unduh, ganti nama sesuai kolom **File**, lalu kecilkan ukurannya (lihat di bawah).
5. Kalau ada kata yang salah ucap, lihat kolom **Catatan**: di situ ada ejaan alternatif untuk diketik di *Text Input*. Ejaan ini hanya untuk rekaman; subtitle di layar tetap memakai ejaan biasa.

Tips sebelum mulai: generate dulu satu baris per tokoh (misalnya `intro-2-guru`, `hasil-bima-menang-1`, `hasil-sekar-menang-1`, `hasil-dimas-kalah-1`) dengan suara utama dan suara cadangan, dengarkan di HP, baru tentukan pemerannya.

### Kecilkan ukuran file dan potong jeda kosong

Siswa kebanyakan memakai HP Android kelas bawah dan aplikasi menyimpan audio untuk offline, jadi file harus kecil. Proyek ini sudah punya skripnya:

1. Taruh hasil unduhan RD Voice (`.wav` atau `.mp3`, sudah diberi nama) di `audio-mentah/vo/`. Folder ini tidak ikut di-commit.
2. Jalankan `npm run audio`. Hasilnya MP3 mono 64 kbps di `public/audio/vo/`, jeda kosong di awal dan akhir dipotong, dan kerasnya suara disamakan.
3. Cek dengan `npm run audio -- --cek`.

Jangan menaruh `.wav` langsung di `public/audio/vo/`: file itu ikut terunduh ke HP siswa.

Pemotongan jeda paling penting untuk bagian D: hitungan "Tiga, Dua, Satu" hanya punya waktu 0,7 detik per angka.

---

## Pemeran

| Tokoh | Sifat | Suara utama | Cadangan |
| --- | --- | --- | --- |
| **Pak Ahsan** (guru muda) | Hangat, suka bercerita, sedikit jenaka | **James** (Ramah & Santai) | David (Sabar & Mengayomi) |
| **Bu Pavi** (guru) | Ramah, tenang, murah senyum | Suara wanita dewasa yang hangat, **bukan Sophia** (dipakai Sekar) | Amelia (Antusias & Menggebu) bila tidak ada suara wanita dewasa lain |
| **Bima** (siswa) | Kompetitif, semangat, suka bercanda | **Alexander** (Lucu & Ekspresif) | Matthew (Muda & Gaul) |
| **Sekar** (siswi) | Ceria, penasaran, suka bertanya | **Sophia** (Ceria & Energik) | Amelia (Antusias & Menggebu) |
| **Dimas** (siswa) | Pemalu, lembut, tapi berani di saat penting | **Matthew** (Muda & Gaul) | David (Sabar & Mengayomi) |
| **Wasit** (aba-aba bagian D) | Lantang, jelas | **James** (suara Pak Ahsan) | Andrew (Heroik & Lantang) |

Catatan pemeran:
- Bima dan Dimas harus terdengar berbeda. Kalau Matthew lebih cocok untuk Bima, pindahkan Matthew ke Bima dan pakai David untuk Dimas dengan gaya yang lembut (Menenangkan atau Santai / Kasual).
- Dimas tidak punya suara "pemalu" pria di daftar. Sifat pemalunya dibawa lewat gaya: hampir semua baris Dimas memakai Santai / Kasual atau Menenangkan, bukan Ceria.
- Aba-aba di bagian D tidak menampilkan wajah Pak Ahsan, jadi boleh memakai Andrew kalau James kurang lantang.

---

## A. Intro

Adegan intro (`src/intro/script.json`). Durasi adegan otomatis menunggu VO selesai, jadi tidak perlu dipaskan detik per detik.

| File | Suara | Teks | Gaya | Cadangan | Catatan |
| --- | --- | --- | --- | --- | --- |
| `intro-1-bima.mp3` | Bima | Istirahat kok gini-gini aja sih… | Mengantuk | Santai / Kasual | Bosan sambil menguap. |
| `intro-1-sekar.mp3` | Sekar | Yaah… lowbat lagi. | Sedih / Melankolis | Santai / Kasual | Kecewa melihat HP-nya mati. Kalau "lowbat" dibaca aneh, ketik: Yaah… lobet lagi. |
| `intro-2-guru.mp3` | Pak Ahsan | Hmm… dulu waktu Bapak seumuran kalian, jam istirahat nggak pernah sepi. | Mendongeng | Santai / Kasual | Mengenang sambil tersenyum. |
| `intro-3-sekar.mp3` | Sekar | Ini semua apa, Pak? | Terkejut | Ceria / Semangat | Kagum melihat kotak bercahaya. |
| `intro-4-guru.mp3` | Pak Ahsan | Dulu kami main di lapangan tiap hari. Dari situ kami belajar sportif, kompak, dan sabar. | Mendongeng | Menenangkan | Narasi kilas balik, tenang. |
| `intro-5-guru.mp3` | Pak Ahsan | Tapi lihat. Kalau nggak ada yang mainin lagi, permainan ini bisa hilang. | Sedih / Melankolis | Menenangkan | Pelan dan serius. |
| `intro-6-dimas.mp3` | Dimas | Eh… kalau gitu, kita mainin lagi aja, Pak? | Kebingungan | Santai / Kasual | Ragu di awal, lalu memberanikan diri. |
| `intro-6-guru.mp3` | Pak Ahsan | Nah! Itu proyek kokurikuler kita. Siapa mau ikut? | Motivasi | Ceria / Semangat | Bangga dan mengajak. |

---

## B. Kenalan Dulu

Diputar saat layar Kenalan Dulu terbuka. Guru (Pak Ahsan atau Bu Pavi) memperkenalkan permainan. Kalimat pertama adalah pembuka baru; sisanya sama dengan deskripsi di `src/data/games.json`.

Catatan B: saat VO disambungkan, kalimat pembuka ini akan ditambahkan ke `games.json` (kolom baru `sapaanGuru`) supaya ikut tampil di balon kata. Kalau file sudah dipasang sebelum itu, VO tetap jalan, hanya kalimat pembukanya belum tampil di subtitle.

Suara mengikuti guru yang tampil di layar (kolom `guru` di `src/data/games.json`):
- **Bu Pavi**: Dam-daman, Ular Tangga, Bola Bekel, Egrang, Pecah Balon Air.
- **Pak Ahsan**: Sunda Manda (Engklek), Gobak Sodor, Bakiak, Kelereng.

Urutannya selang-seling mengikuti urutan kartu di menu.

| File | Teks | Gaya | Cadangan | Catatan |
| --- | --- | --- | --- | --- |
| `kenalan-dam-daman.mp3` | Yang ini Dam-daman. Cocok buat kalian yang suka mikir dua langkah ke depan. Permainan papan tradisional yang dimainkan oleh dua orang menggunakan bidak. Pemain berusaha memindahkan dan menangkap bidak lawan dengan strategi tertentu. | Santai / Kasual | Mendongeng | Suara Bu Pavi. |
| `kenalan-engklek.mp3` | Ini Sunda Manda, atau yang lebih sering kita sebut engklek. Siapkan satu kaki kalian! Permainan melompat pada kotak-kotak yang digambar di tanah menggunakan satu kaki. Pemain harus melewati semua kotak tanpa menginjak garis. | Santai / Kasual | Ceria / Semangat | Suara Pak Ahsan. Kalau "engklek" salah ucap, ketik: éngklék |
| `kenalan-ular-tangga.mp3` | Ular Tangga! Siapa di sini yang belum pernah main? Hayo, ngaku. Permainan papan yang menggunakan dadu dan pion. Pemain bergerak dari angka kecil menuju angka terbesar dengan bantuan tangga dan hambatan ular. | Santai / Kasual | Ceria / Semangat | Suara Bu Pavi. |
| `kenalan-gobak-sodor.mp3` | Gobak Sodor. Dulu Bapak paling suka jadi penjaga. Permainan kelompok yang menggabungkan kecepatan, strategi, dan kerja sama. Satu tim berusaha melewati garis penjagaan tim lawan dan kembali tanpa tersentuh. | Santai / Kasual | Mendongeng | Suara Pak Ahsan. |
| `kenalan-bola-bekel.mp3` | Bola Bekel. Yang ini butuh tangan cepat dan mata yang jeli. Permainan menggunakan bola kecil dan beberapa biji bekel. Pemain melempar bola ke atas, mengambil atau mengatur biji bekel, kemudian menangkap kembali bola. | Santai / Kasual | Mendongeng | Suara Bu Pavi. Kalau "bekel" salah ucap, ketik: békel |
| `kenalan-bakiak.mp3` | Bakiak! Di permainan ini, kompak itu nomor satu. Permainan kelompok menggunakan papan kayu panjang dengan tali untuk tempat kaki. Pemain harus berjalan bersama-sama dengan menjaga keseimbangan dan kekompakan. | Santai / Kasual | Motivasi | Suara Pak Ahsan. |
| `kenalan-egrang.mp3` | Egrang. Katanya tadi ada yang nyangkut di pintu, ya? Permainan menggunakan dua batang bambu atau kayu yang memiliki pijakan kaki. Pemain berdiri di atas pijakan dan berjalan menggunakan keseimbangan tubuh. | Santai / Kasual | Mendongeng | Suara Bu Pavi. Kalau "egrang" salah ucap, ketik: égrang |
| `kenalan-kelereng.mp3` | Kelereng. Bapak dulu punya satu toples penuh, lho. Permainan menggunakan kelereng yang dimainkan dengan cara menyentil kelereng menggunakan jari. Permainan dapat dilakukan dengan target lubang atau kelereng milik pemain lain. | Santai / Kasual | Mendongeng | Suara Pak Ahsan. |
| `kenalan-pecah-balon-air.mp3` | Pecah Balon Air! Tenang, di layar kalian nggak bakal basah. Permainan kelompok yang menggunakan balon berisi air. Pemain bekerja sama untuk memecahkan atau memindahkan balon air sesuai tantangan yang diberikan. Permainan ini melatih kerja sama, koordinasi, dan ketangkasan. Ingat, balon air itu dibawa, bukan dilempar. Jangan pernah melempar balon ke arah wajah teman. Main yang sportif, ya! | Santai / Kasual | Motivasi | Suara Bu Pavi. Pesan keselamatan di akhir harus terdengar jelas. |

Satu-satunya perbedaan teks dengan `games.json`: deskripsi Egrang tertulis "bambu/kayu", di sini ditulis "bambu atau kayu" supaya tidak dibaca "bambu garis miring kayu".

---

## C. Komentar layar hasil

Satu tokoh (acak) berkomentar di layar hasil. Di layar, sebagian kalimat menyebut nama pemenang (`{pemenang}`). TTS tidak bisa menyebut nama yang diketik pemain, jadi VO-nya memakai versi tanpa nama. Saat disambungkan, subtitle akan disesuaikan supaya sama dengan VO.

- **menang**: pemain utama menang (atau mode main bergantian/duel, komentar ditujukan ke pemenang).
- **kalah**: pemain kalah melawan komputer.
- **seri**: hasil imbang.

Nada semua komentar: teman sebaya yang sportif, tidak mengejek. Jangan pakai gaya Sarkastik atau Menggoda.

### Bima (suara: Alexander)

| File | Teks | Gaya | Cadangan |
| --- | --- | --- | --- |
| `hasil-bima-menang-1.mp3` | Mantap! Ronde depan giliranku yang menang, ya. | Ceria / Semangat | Santai / Kasual |
| `hasil-bima-menang-2.mp3` | Wah, cepat banget! Aku tantang lagi, deh. | Terkejut | Ceria / Semangat |
| `hasil-bima-menang-3.mp3` | Keren! Tapi jangan senang dulu, aku lagi pemanasan. | Ceria / Semangat | Santai / Kasual |
| `hasil-bima-kalah-1.mp3` | Hampir! Satu ronde lagi, pasti bisa. | Motivasi | Ceria / Semangat |
| `hasil-bima-kalah-2.mp3` | Selamat buat yang menang. Aku juga pernah kalah tiga kali berturut-turut, kok. | Santai / Kasual | Ceria / Semangat |
| `hasil-bima-kalah-3.mp3` | Belum rezeki. Ayo balas dendam secara sportif! | Motivasi | Ceria / Semangat |
| `hasil-bima-seri-1.mp3` | Seri? Berarti harus ada ronde penentuan! | Terkejut | Ceria / Semangat |
| `hasil-bima-seri-2.mp3` | Sama kuat! Seru banget tadi. | Ceria / Semangat | Santai / Kasual |

### Sekar (suara: Sophia)

| File | Teks | Gaya | Cadangan |
| --- | --- | --- | --- |
| `hasil-sekar-menang-1.mp3` | Selamat! Strategimu apa? Aku mau catat. | Ceria / Semangat | Santai / Kasual |
| `hasil-sekar-menang-2.mp3` | Hebat! Di lapangan aslinya pasti lebih seru lagi. | Ceria / Semangat | Santai / Kasual |
| `hasil-sekar-menang-3.mp3` | Wah, jago juga. Boleh ajari aku? | Ceria / Semangat | Santai / Kasual |
| `hasil-sekar-kalah-1.mp3` | Tidak apa-apa. Kata Pak Ahsan, yang penting sportif. | Menenangkan | Santai / Kasual |
| `hasil-sekar-kalah-2.mp3` | Tadi sudah bagus. Coba lagi dengan cara berbeda? | Menenangkan | Santai / Kasual |
| `hasil-sekar-kalah-3.mp3` | Lawanmu menang kali ini. Kamu pasti bisa menyusul! | Motivasi | Ceria / Semangat |
| `hasil-sekar-seri-1.mp3` | Seri! Kalian sama-sama jago. | Ceria / Semangat | Terkejut |
| `hasil-sekar-seri-2.mp3` | Menarik, hasilnya imbang. Coba lagi yuk! | Santai / Kasual | Ceria / Semangat |

### Dimas (suara: Matthew)

| File | Teks | Gaya | Cadangan |
| --- | --- | --- | --- |
| `hasil-dimas-menang-1.mp3` | …Keren. Aku juga mau coba. | Santai / Kasual | Menenangkan |
| `hasil-dimas-menang-2.mp3` | Selamat. Itu tadi rapi sekali. | Santai / Kasual | Menenangkan |
| `hasil-dimas-menang-3.mp3` | Wah. Aku sampai lupa napas lihatnya. | Terkejut | Santai / Kasual |
| `hasil-dimas-kalah-1.mp3` | Aku juga sering kalah… tapi jadi makin paham caranya. | Menenangkan | Santai / Kasual |
| `hasil-dimas-kalah-2.mp3` | Tadi sudah dekat, kok. Sekali lagi? | Menenangkan | Santai / Kasual |
| `hasil-dimas-kalah-3.mp3` | Selamat untuk yang menang. Kita main bareng lagi, ya. | Santai / Kasual | Menenangkan |
| `hasil-dimas-seri-1.mp3` | Seri… jarang-jarang, lho. | Santai / Kasual | Kebingungan |
| `hasil-dimas-seri-2.mp3` | Imbang. Berarti kalian sama-sama belajar. | Menenangkan | Santai / Kasual |

Kalimat yang berubah dari teks layar sekarang (di `src/shared/komentar.ts`):

| File | Teks layar sekarang | Teks VO |
| --- | --- | --- |
| `hasil-bima-menang-1` | Mantap, {pemenang}! Ronde depan… | Mantap! Ronde depan… |
| `hasil-bima-kalah-2` | Selamat buat {pemenang}. Aku juga… | Selamat buat yang menang. Aku juga… |
| `hasil-sekar-menang-1` | Selamat, {pemenang}! Strategimu apa? … | Selamat! Strategimu apa? … |
| `hasil-sekar-menang-3` | Wah, {pemenang} jago juga. … | Wah, jago juga. … |
| `hasil-sekar-kalah-3` | {pemenang} menang kali ini. … | Lawanmu menang kali ini. … |
| `hasil-dimas-menang-2` | Selamat, {pemenang}. Itu tadi… | Selamat. Itu tadi… |
| `hasil-dimas-kalah-3` | Selamat untuk {pemenang}. Kita… | Selamat untuk yang menang. Kita… |

---

## D. Aba-aba di dalam game

Suara: **Wasit** (James, atau Andrew kalau James kurang lantang). Pakai suara yang sama untuk semua baris di bagian ini.

Jeda kosong dipotong otomatis oleh `npm run audio`. Durasi tiap angka harus kurang dari 0,6 detik, karena jeda antarangka di game hanya 0,7 detik.

### Hitungan mulai (Egrang, Gobak Sodor, Pecah Balon Air)

| File | Teks | Dipakai di | Gaya | Cadangan |
| --- | --- | --- | --- | --- |
| `aba-3.mp3` | Tiga! | Egrang, Gobak Sodor, Balon Air | Ceria / Semangat | Marah / Tegas |
| `aba-2.mp3` | Dua! | Egrang, Gobak Sodor, Balon Air | Ceria / Semangat | Marah / Tegas |
| `aba-1.mp3` | Satu! | Egrang, Gobak Sodor, Balon Air | Ceria / Semangat | Marah / Tegas |
| `aba-jalan.mp3` | Jalan! | Egrang (setelah hitungan) | Ceria / Semangat | Epik / Megah |
| `aba-ayo.mp3` | Ayo! | Pecah Balon Air (setelah hitungan) | Ceria / Semangat | Epik / Megah |

Gobak Sodor tidak butuh kata mulai: di game sudah ada bunyi peluit "PRIIT!".

Tiga angka hitungan sebaiknya di-generate berurutan dengan suara dan gaya yang sama supaya nadanya seragam. Kalau "Marah / Tegas" dipakai, pastikan tidak terdengar membentak.

### Kartu siap (sebelum tombol Mulai)

| File | Teks | Dipakai di | Gaya | Cadangan |
| --- | --- | --- | --- | --- |
| `siap-egrang.mp3` | Siap lomba egrang? | Egrang | Ceria / Semangat | Motivasi |
| `siap-bakiak.mp3` | Siap lomba bakiak? | Bakiak | Ceria / Semangat | Motivasi |
| `siap-gobak-sodor.mp3` | Siap main gobak sodor? | Gobak Sodor | Ceria / Semangat | Motivasi |
| `siap-pecah-balon-air.mp3` | Estafet balon air! | Pecah Balon Air | Ceria / Semangat | Promosi / Iklan |

### Ganti ronde dan putaran

| File | Teks | Dipakai di | Gaya | Cadangan |
| --- | --- | --- | --- | --- |
| `ronde-2.mp3` | Ronde dua dari empat. | Gobak Sodor | Ceria / Semangat | Formal / Berita |
| `ronde-3.mp3` | Ronde tiga dari empat. | Gobak Sodor | Ceria / Semangat | Formal / Berita |
| `ronde-4.mp3` | Ronde empat dari empat. | Gobak Sodor | Epik / Megah | Ceria / Semangat |
| `putaran-2.mp3` | Putaran dua dari empat. | Pecah Balon Air | Ceria / Semangat | Formal / Berita |
| `putaran-3.mp3` | Putaran tiga dari empat. | Pecah Balon Air | Ceria / Semangat | Formal / Berita |
| `putaran-4.mp3` | Putaran empat dari empat. | Pecah Balon Air | Epik / Megah | Ceria / Semangat |

Ronde dan putaran terakhir memakai Epik / Megah supaya terasa lebih tegang.

### Finis

| File | Teks | Dipakai di | Gaya | Cadangan |
| --- | --- | --- | --- | --- |
| `aba-finis.mp3` | Finis! | Bakiak, Egrang | Ceria / Semangat | Epik / Megah |

## E. Monolog pesan moral (Kenalan Dulu)

Lanjutan Kenalan Dulu: setelah memperkenalkan permainan (bagian B), guru bercerita tentang nilai budaya dan sisi STEAM, lalu menutup dengan pesan utama. Siswa pindah balon dengan tombol **Lanjut**; tiap balon memutar satu file. Teks diambil dari dokumen *Let the Games Teach: Culture & STEAM Discoveries* (kolom `pesanMoral` di `src/data/games.json`).

Yang direkam hanya teks bahasa Indonesia. Terjemahan Inggris tampil sebagai teks di bawahnya, tidak disuarakan. Pertanyaan refleksi tampil di layar hasil dan tidak direkam.

Ada kata Inggris di teks Indonesia (Science, engineering) dan pepatah Jawa (*alon-alon waton kelakon*). Kalau salah ucap, ketik ejaan alternatif hanya untuk rekaman, misalnya "sains" atau "enjiniring"; teks di layar tetap seperti tabel.

Kode sudah tersambung: begitu file ada, VO diputar dengan lip-sync. Selama belum ada, mulut guru bergerak sebentar dan teks tetap tampil.

### Dam-daman · suara Bu Pavi

| File | Teks | Gaya | Cadangan |
| --- | --- | --- | --- |
| `moral-dam-daman-1.mp3` | Pernahkah kamu merasa deg-degan karena satu langkah yang salah bisa membuat bidakmu “dimakan” lawan? Itulah serunya Dam-daman, permainan yang sudah dimainkan secara turun-temurun. | Mendongeng | Santai / Kasual |
| `moral-dam-daman-2.mp3` | Dam-daman mengajarkan tentang kesabaran dan sikap berpikir sebelum bertindak. Berkaca dari pepatah orang Jawa yang berbunyi ‘alon-alon waton kelakon’ atau ‘pelan-pelan asal tercapai’, maka pemain Dam-daman yang tergesa-gesa biasanya menyesal belakangan, sedangkan yang tenang justru bisa membaca arah permainan. | Mendongeng | Santai / Kasual |
| `moral-dam-daman-3.mp3` | Lalu di bagian mana Matematika bekerja? Setiap kali menggeser bidak, otakmu sedang menghitung, “Kalau aku jalan ke sini, lawan akan membalas ke mana?” Adanya pertanyaan tersebut, berarti kamu sedang berlatih berpikir logis dan memprediksi beberapa langkah ke depan. | Santai / Kasual | Ceria / Semangat |
| `moral-dam-daman-4.mp3` | Jadi, menang di Dam-daman bukan soal beruntung, tetapi soal siapa yang paling cermat menghitung dan paling sabar menunggu saat yang tepat. | Santai / Kasual | Ceria / Semangat |
| `moral-dam-daman-pesan.mp3` | Menang bukan soal cepat melangkah, tetapi soal sabar berpikir sebelum bertindak. | Motivasi | Menenangkan |

### Sunda Manda (Engklek) · suara Pak Ahsan

| File | Teks | Gaya | Cadangan |
| --- | --- | --- | --- |
| `moral-engklek-1.mp3` | Engklek dimainkan di pekarangan atau halaman sekolah, dan hampir tidak pernah ada wasit. Lalu, siapa yang menjaga aturan permainannya? Jawabannya adalah dirimu sendiri. | Mendongeng | Santai / Kasual |
| `moral-engklek-2.mp3` | Kalau kakimu menginjak garis, kamu sendiri yang harus jujur mengakuinya dan menyerahkan giliran. Hal tersebut merupakan nilai kejujuran yang menjadi jiwa permainan ini. | Mendongeng | Santai / Kasual |
| `moral-engklek-3.mp3` | Engklek juga mengajarkan bahwa untuk sampai ke petak teratas, kamu harus melewati petak demi petak. Tidak ada jalan pintas dalam mencapai tujuan. | Mendongeng | Santai / Kasual |
| `moral-engklek-4.mp3` | Apakah kamu pernah heran kenapa kamu bisa melompat dengan satu kaki tanpa jatuh? Nah, itulah Science di balik Engklek. | Santai / Kasual | Ceria / Semangat |
| `moral-engklek-5.mp3` | Tubuhmu terus mengatur keseimbangan dengan menjaga titik berat tetap berada di atas satu kaki yang menopang. Otot kaki, perut, dan bahkan lenganmu bekerja bersama tanpa kamu sadari. Tanpa disengaja, kamu sedang praktik fisika tubuh manusia. | Santai / Kasual | Ceria / Semangat |
| `moral-engklek-pesan.mp3` | Jujur pada aturan, bahkan saat tidak ada yang mengawasi, adalah kemenangan yang sesungguhnya. | Motivasi | Menenangkan |

### Ular Tangga · suara Bu Pavi

| File | Teks | Gaya | Cadangan |
| --- | --- | --- | --- |
| `moral-ular-tangga-1.mp3` | Ular Tangga mengajarkan sesuatu tentang hidup. Kadang kamu beruntung karena mendapat kesempatan untuk naik tangga dan melesat jauh, kadang kamu digigit ular dan terpaksa harus turun lagi. | Mendongeng | Santai / Kasual |
| `moral-ular-tangga-2.mp3` | Pesan yang dapat dipetik yakni hidup memang naik turun, namun yang terpenting adalah tetap melanjutkan permainan. Pemenang yang baik tidak merasa sombong saat menang, dan yang belum menang tidak berhenti bermain. Sikap tenang dalam menerima untung dan rugi adalah bekal berharga yang dibawa sampai dewasa. | Mendongeng | Santai / Kasual |
| `moral-ular-tangga-3.mp3` | Tidak hanya itu, ada Matematika yang menarik di balik permainan Ular Tangga ini, lho. Saat kamu melempar dadu berkali-kali, setiap angka punya peluang yang sama untuk muncul. Hal tersebut merupakan dasar probabilitas yang kamu pelajari lebih dalam di mata pelajaran Matematika. | Santai / Kasual | Ceria / Semangat |
| `moral-ular-tangga-pesan.mp3` | Hidup punya naik dan turun, dan yang terpenting adalah terus melangkah. | Motivasi | Menenangkan |

### Gobak Sodor · suara Pak Ahsan

| File | Teks | Gaya | Cadangan |
| --- | --- | --- | --- |
| `moral-gobak-sodor-1.mp3` | Gobak Sodor bukan permainan untuk jagoan tunggal, namun permainan kerja sama. Satu tim penjaga berdiri di garis-garis, dan tim lain berusaha melewati semuanya tanpa tersentuh. | Mendongeng | Santai / Kasual |
| `moral-gobak-sodor-2.mp3` | Rahasia kemenangan dari permainan Gobak Sodor ini adalah kerja sama dan gotong royong. Penjaga memiliki tugas untuk saling menutup celah sehingga lawan tidak bisa menerobos dengan mudah, sedangkan penyerang memiliki tugas untuk saling memberi isyarat dan mengelabui lawan bersama-sama. | Mendongeng | Santai / Kasual |
| `moral-gobak-sodor-3.mp3` | Nilai ini sejalan dengan semangat gotong royong yang sudah lama hidup di masyarakat Indonesia, bahwa beban yang dipikul bersama terasa lebih ringan. | Mendongeng | Santai / Kasual |
| `moral-gobak-sodor-4.mp3` | Maukah kamu tahu fakta menarik lainnya? Nah, lapangan Gobak Sodor sebenarnya adalah bangun datar yang dibagi dengan garis-garis berpola, seperti persegi panjang yang dipecah menjadi beberapa petak. | Santai / Kasual | Ceria / Semangat |
| `moral-gobak-sodor-5.mp3` | Penjaga yang cerdas menghitung jarak antarpetak dan menentukan posisi paling efektif untuk mengunci gerakan lawan. Jadi, di balik tawa dan teriakan seru, kamu sedang mempraktikkan geometri dan strategi ruang. Keren sekali permainan tradisional ini, bukan? | Santai / Kasual | Ceria / Semangat |
| `moral-gobak-sodor-pesan.mp3` | Satu orang bisa cepat, tetapi satu tim yang kompak bisa jauh lebih kuat. | Motivasi | Menenangkan |

### Bola Bekel · suara Bu Pavi

| File | Teks | Gaya | Cadangan |
| --- | --- | --- | --- |
| `moral-bola-bekel-1.mp3` | Bola bekel tampak memiliki aturan permainan yang sederhana, yakni pemain melempar bola, lalu mengambil biji, dan menangkap kembali sebelum jatuh. Namun, permainan ini diam-diam melatih sesuatu yang sangat berharga, yaitu fokus dan ketekunan. | Mendongeng | Santai / Kasual |
| `moral-bola-bekel-2.mp3` | Apa lagi pengetahuan yang dapat kalian peroleh? Nah, coba perhatikan juga gerak bolanya. Saat bola dilempar ke bawah, bola akan memantul naik karena gravitasi menariknya turun dan elastisitas bola mendorongnya kembali ke atas. | Santai / Kasual | Ceria / Semangat |
| `moral-bola-bekel-3.mp3` | Selain itu, kamu harus bisa memperkirakan kapan dan di mana bola akan kembali sehingga tanganmu bisa meraih bola tersebut. Kecepatan reaksi mata dan tanganmu inilah yang sedang diasah, sebuah kemampuan yang berguna di banyak bidang, dari olahraga sampai bermain alat musik. | Santai / Kasual | Ceria / Semangat |
| `moral-bola-bekel-pesan.mp3` | Kemampuan hebat lahir dari latihan kecil yang diulang dengan sabar. | Motivasi | Menenangkan |

### Bakiak · suara Pak Ahsan

| File | Teks | Gaya | Cadangan |
| --- | --- | --- | --- |
| `moral-bakiak-1.mp3` | Yuk, coba bayangkan tiga orang berdiri di atas satu papan panjang, lalu harus melangkah bersama. Kalau satu orang melangkah lebih cepat, semuanya pasti akan terjatuh, bukan? Hal tersebut merupakan pelajaran terbesar dari permainan tradisional bernama Bakiak, yakni kekompakan. | Mendongeng | Santai / Kasual |
| `moral-bakiak-2.mp3` | Kamu harus menyamakan langkah dengan teman satu tim, dan mengontrol emosi kalau ada yang tertinggal. Dalam permainan ini, juara sejati bukan yang paling cepat sendirian, tetapi tim yang paling selaras. | Mendongeng | Santai / Kasual |
| `moral-bakiak-3.mp3` | Selain itu, masih ada lagi hal lain yang perlu kamu ketahui, yakni rancangan Bakiak. Bakiak yang bagus tidak dibuat asal-asalan, lho. Panjang papan harus sesuai dengan jumlah pemain, kayunya harus cukup kuat menahan beban, dan tali pijakannya harus nyaman dan tidak mudah putus. | Santai / Kasual | Ceria / Semangat |
| `moral-bakiak-4.mp3` | Saat kamu membuat bakiak buatanmu sendiri, kamu akan berperan layaknya seorang insinyur andal yang memproduksi bakiak terbaik untuk tim. Kamu akan melalui proses merancang, melakukan uji coba, mengalami kegagalan, lalu memperbaiki kembali tanpa mudah menyerah. | Santai / Kasual | Ceria / Semangat |
| `moral-bakiak-pesan.mp3` | Kita hanya bisa melangkah jauh bila mau menyamakan irama dengan teman. | Motivasi | Menenangkan |

### Egrang · suara Bu Pavi

| File | Teks | Gaya | Cadangan |
| --- | --- | --- | --- |
| `moral-egrang-1.mp3` | Siapa yang tidak pernah jatuh waktu pertama kali naik egrang? Hampir semua orang pernah. Jangan merasa malu karena setiap jatuh bukan tanda kamu gagal, melainkan bagian dari belajar. | Mendongeng | Santai / Kasual |
| `moral-egrang-2.mp3` | Semua orang yang belajar egrang akan melalui proses yang sama, yaitu jatuh, bangun, coba lagi, sampai akhirnya bisa berjalan tegak di atas bambu. Rasa takut tidak hilang karena dinasihati, tetapi karena dihadapi sedikit demi sedikit. Melalui permainan egrang, kamu dilatih untuk memiliki keberanian dan pantang menyerah. | Mendongeng | Santai / Kasual |
| `moral-egrang-3.mp3` | Sekarang bayangkan kamu yang membuat egrangnya. Berapa tinggi pijakan yang aman untuk pemula? Di mana letak pijakan agar kaki terasa stabil? Bagaimana cara menyambung bambu agar tidak lepas? | Santai / Kasual | Ceria / Semangat |
| `moral-egrang-4.mp3` | Tanpa kamu sadari, melalui pertanyaan tersebut, kamu dapat belajar mengenai ilmu teknik (engineering). Semakin tinggi pijakan pada egrang, semakin menantang keseimbangannya. Kamu akan belajar bahwa merancang sesuatu berarti mempertimbangkan keselamatan, kekuatan, dan kenyamanan sekaligus. | Santai / Kasual | Ceria / Semangat |
| `moral-egrang-pesan.mp3` | Jatuh bukan tanda gagal, tetapi tanda bahwa kamu sedang belajar. | Motivasi | Menenangkan |

### Kelereng · suara Pak Ahsan

| File | Teks | Gaya | Cadangan |
| --- | --- | --- | --- |
| `moral-kelereng-1.mp3` | Saat bermain kelereng, kamu adalah pemeran utama yang menentukan jarak bidik, giliran, dan kapan sebuah kelereng dianggap “mati”, maka kejujuran dan sportivitas menjadi inti permainan ini. | Mendongeng | Santai / Kasual |
| `moral-kelereng-2.mp3` | Anak-anak yang curang biasanya tidak lama diajak bermain lagi, karena kepercayaan teman adalah hadiah terbesar. Saat kamu kalah, kamu belajar menerimanya dengan lapang dada, lalu mencoba lagi dengan bidikan yang lebih baik. | Mendongeng | Santai / Kasual |
| `moral-kelereng-3.mp3` | Tahukah kamu, saat bermain kelereng, kamu telah menerapkan ilmu Science, lho. Saat menjentikkan jari selama permainan, berarti kamu sedang melakukan percobaan. Kamu mencoba seberapa kuat jentikan jarimu menentukan seberapa cepat kelereng melaju. | Santai / Kasual | Ceria / Semangat |
| `moral-kelereng-4.mp3` | Lalu, ketika ia menabrak kelereng lain, sebagian geraknya berpindah ke kelereng yang tertabrak, itulah tumbukan dan momentum. Tanah yang kasar atau licin juga mengubah seberapa jauh kelerengmu menggelinding. Jadi, setiap bidikan adalah eksperimen kecil yang bisa kamu perbaiki. | Santai / Kasual | Ceria / Semangat |
| `moral-kelereng-pesan.mp3` | Sportivitas berarti jujur saat menang dan lapang dada saat kalah. | Motivasi | Menenangkan |

### Pecah Balon Air · suara Bu Pavi

| File | Teks | Gaya | Cadangan |
| --- | --- | --- | --- |
| `moral-pecah-balon-air-1.mp3` | Dalam lomba Agustusan di kampung atau di sekolah, permainan ini hampir selalu membuat suasana pecah oleh tawa. Pesan budayanya terasa hangat: kegembiraan yang dibagi bersama. | Mendongeng | Santai / Kasual |
| `moral-pecah-balon-air-2.mp3` | Anak-anak, orang tua, bahkan para guru ikut tertawa, basah kuyup, dan lupa pada sekat usia atau jabatan. Permainan pecah balon air mengajarkan bahwa kebersamaan tidak selalu butuh hal besar, terkadang cukup sebuah permainan sederhana yang membuat semua orang menjadi setara. | Mendongeng | Santai / Kasual |
| `moral-pecah-balon-air-3.mp3` | Namun, pernahkah kamu bertanya, kenapa balon bisa menampung air tanpa pecah, tetapi bisa tiba-tiba pecah saat ditekan sedikit lebih keras? Jawabannya ada di Science. | Santai / Kasual | Ceria / Semangat |
| `moral-pecah-balon-air-4.mp3` | Karet balon bersifat elastis, sehingga balon akan melar karena menahan tekanan air sampai batas tertentu. Begitu batasnya terlampaui, maka balon akan pecah. Dari permainan pecah balon air, kamu bisa memahami bagaimana tekanan dan bahan bekerja, hanya dari sebuah balon dan seember air. | Santai / Kasual | Ceria / Semangat |
| `moral-pecah-balon-air-pesan.mp3` | Kegembiraan yang dibagi bersama menyatukan semua orang, tua maupun muda. | Motivasi | Menenangkan |

---

## Daftar periksa

Centang setelah file ada di `public/audio/vo/`.

**A. Intro (8)**
- [x] intro-1-bima
- [x] intro-1-sekar
- [x] intro-2-guru
- [x] intro-3-sekar
- [x] intro-4-guru
- [x] intro-5-guru
- [x] intro-6-dimas
- [x] intro-6-guru

**B. Kenalan Dulu (9)**
- [ ] kenalan-dam-daman
- [ ] kenalan-engklek
- [ ] kenalan-ular-tangga
- [ ] kenalan-gobak-sodor
- [ ] kenalan-bola-bekel
- [ ] kenalan-bakiak
- [ ] kenalan-egrang
- [ ] kenalan-kelereng
- [ ] kenalan-pecah-balon-air

**C. Hasil (24)**
- [ ] hasil-bima-menang-1, -2, -3
- [ ] hasil-bima-kalah-1, -2, -3
- [ ] hasil-bima-seri-1, -2
- [ ] hasil-sekar-menang-1, -2, -3
- [ ] hasil-sekar-kalah-1, -2, -3
- [ ] hasil-sekar-seri-1, -2
- [ ] hasil-dimas-menang-1, -2, -3
- [ ] hasil-dimas-kalah-1, -2, -3
- [ ] hasil-dimas-seri-1, -2

**D. Aba-aba (16)**
- [ ] aba-3, aba-2, aba-1
- [ ] aba-jalan, aba-ayo
- [ ] siap-egrang, siap-bakiak, siap-gobak-sodor, siap-pecah-balon-air
- [ ] ronde-2, ronde-3, ronde-4
- [ ] putaran-2, putaran-3, putaran-4
- [ ] aba-finis
**E. Monolog pesan moral (45)**
- [ ] moral-dam-daman-1 … -4, moral-dam-daman-pesan
- [ ] moral-engklek-1 … -5, moral-engklek-pesan
- [ ] moral-ular-tangga-1 … -3, moral-ular-tangga-pesan
- [ ] moral-gobak-sodor-1 … -5, moral-gobak-sodor-pesan
- [ ] moral-bola-bekel-1 … -3, moral-bola-bekel-pesan
- [ ] moral-bakiak-1 … -4, moral-bakiak-pesan
- [ ] moral-egrang-1 … -4, moral-egrang-pesan
- [ ] moral-kelereng-1 … -4, moral-kelereng-pesan
- [ ] moral-pecah-balon-air-1 … -4, moral-pecah-balon-air-pesan

Total: 8 + 9 + 24 + 16 + 45 = **102 file**.
