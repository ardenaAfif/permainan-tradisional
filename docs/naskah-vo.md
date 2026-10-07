# Naskah VO Kotak Dolanan

Naskah rekaman suara untuk dibuat dengan **RD Voice**. Satu baris = satu file.
Simpan semua file di `public/audio/vo/` dengan nama persis seperti kolom **File** (huruf kecil, pakai tanda hubung).

| Bagian | Jumlah | Status kode |
| --- | --- | --- |
| A. Intro | 8 | Sudah tersambung. Begitu file ada, langsung diputar dengan lip-sync. |
| B. Kenalan Dulu | 9 | Sudah tersambung. Kalimat pembuka perlu ditambahkan ke balon kata (lihat catatan B). |
| C. Komentar layar hasil | 24 | Belum tersambung. Disambungkan setelah file lengkap. |
| D. Aba-aba di dalam game | 16 | Belum tersambung. Disambungkan setelah file lengkap. |
| **Total** | **57** | |

---

## Cara membuat

1. Tempel **Teks** ke *Text Input* persis seperti di tabel. Jangan menambah kata, karena subtitle di layar memakai kalimat yang sama.
2. Pilih **Voice Character** sesuai tabel Pemeran. Satu tokoh selalu memakai suara yang sama.
3. Pilih **Speaking Style** sesuai kolom **Gaya** di tiap baris. Kolom **Cadangan** dipakai kalau hasil gaya pertama kurang pas.
4. Unduh, ganti nama sesuai kolom **File**, lalu kecilkan ukurannya (perintah di bawah).
5. Kalau ada kata yang salah ucap, lihat kolom **Catatan**: di situ ada ejaan alternatif untuk diketik di *Text Input*. Ejaan ini hanya untuk rekaman; subtitle di layar tetap memakai ejaan biasa.

Tips sebelum mulai: generate dulu satu baris per tokoh (misalnya `intro-2-guru`, `hasil-bima-menang-1`, `hasil-sekar-menang-1`, `hasil-dimas-kalah-1`) dengan suara utama dan suara cadangan, dengarkan di HP, baru tentukan pemerannya.

### Kecilkan ukuran file dan potong jeda kosong

Siswa kebanyakan memakai HP Android kelas bawah dan aplikasi menyimpan audio untuk offline, jadi file harus kecil. Target: MP3 mono 48 kbps, tanpa jeda kosong di awal dan akhir.

Jalankan di folder berisi hasil unduhan yang sudah diberi nama (butuh [ffmpeg](https://ffmpeg.org)). Perintah ini menerima `.wav` maupun `.mp3`, hasilnya masuk ke folder `siap/`:

```sh
mkdir -p siap
for f in *.wav *.mp3; do
  [ -e "$f" ] || continue
  ffmpeg -y -i "$f" -ac 1 -ar 24000 -b:a 48k \
    -af "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,loudnorm=I=-16:TP=-1.5" \
    "siap/${f%.*}.mp3"
done
```

Lalu salin isi folder `siap/` ke `public/audio/vo/`.

Pemotongan jeda paling penting untuk bagian D: hitungan "Tiga, Dua, Satu" hanya punya waktu 0,7 detik per angka.

---

## Pemeran

| Tokoh | Sifat | Suara utama | Cadangan |
| --- | --- | --- | --- |
| **Pak Ahsan** (guru muda) | Hangat, suka bercerita, sedikit jenaka | **James** (Ramah & Santai) | David (Sabar & Mengayomi) |
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

Diputar saat layar Kenalan Dulu terbuka. Pak Ahsan memperkenalkan permainan. Kalimat pertama adalah pembuka baru; sisanya sama dengan deskripsi di `src/data/games.json`.

Catatan B: saat VO disambungkan, kalimat pembuka ini akan ditambahkan ke `games.json` (kolom baru `sapaanGuru`) supaya ikut tampil di balon kata. Kalau file sudah dipasang sebelum itu, VO tetap jalan, hanya kalimat pembukanya belum tampil di subtitle.

Suara: **Pak Ahsan** untuk semua baris.

| File | Teks | Gaya | Cadangan | Catatan |
| --- | --- | --- | --- | --- |
| `kenalan-dam-daman.mp3` | Yang ini Dam-daman. Cocok buat kalian yang suka mikir dua langkah ke depan. Permainan papan tradisional yang dimainkan oleh dua orang menggunakan bidak. Pemain berusaha memindahkan dan menangkap bidak lawan dengan strategi tertentu. | Santai / Kasual | Mendongeng | |
| `kenalan-engklek.mp3` | Ini Sunda Manda, atau yang lebih sering kita sebut engklek. Siapkan satu kaki kalian! Permainan melompat pada kotak-kotak yang digambar di tanah menggunakan satu kaki. Pemain harus melewati semua kotak tanpa menginjak garis. | Santai / Kasual | Ceria / Semangat | Kalau "engklek" salah ucap, ketik: éngklék |
| `kenalan-ular-tangga.mp3` | Ular Tangga! Siapa di sini yang belum pernah main? Hayo, ngaku. Permainan papan yang menggunakan dadu dan pion. Pemain bergerak dari angka kecil menuju angka terbesar dengan bantuan tangga dan hambatan ular. | Santai / Kasual | Ceria / Semangat | |
| `kenalan-gobak-sodor.mp3` | Gobak Sodor. Dulu Bapak paling suka jadi penjaga. Permainan kelompok yang menggabungkan kecepatan, strategi, dan kerja sama. Satu tim berusaha melewati garis penjagaan tim lawan dan kembali tanpa tersentuh. | Santai / Kasual | Mendongeng | |
| `kenalan-bola-bekel.mp3` | Bola Bekel. Yang ini butuh tangan cepat dan mata yang jeli. Permainan menggunakan bola kecil dan beberapa biji bekel. Pemain melempar bola ke atas, mengambil atau mengatur biji bekel, kemudian menangkap kembali bola. | Santai / Kasual | Mendongeng | Kalau "bekel" salah ucap, ketik: békel |
| `kenalan-bakiak.mp3` | Bakiak! Di permainan ini, kompak itu nomor satu. Permainan kelompok menggunakan papan kayu panjang dengan tali untuk tempat kaki. Pemain harus berjalan bersama-sama dengan menjaga keseimbangan dan kekompakan. | Santai / Kasual | Motivasi | |
| `kenalan-egrang.mp3` | Egrang. Iya, yang tadi nyangkut di pintu itu. Permainan menggunakan dua batang bambu atau kayu yang memiliki pijakan kaki. Pemain berdiri di atas pijakan dan berjalan menggunakan keseimbangan tubuh. | Santai / Kasual | Mendongeng | Kalau "egrang" salah ucap, ketik: égrang |
| `kenalan-kelereng.mp3` | Kelereng. Bapak dulu punya satu toples penuh, lho. Permainan menggunakan kelereng yang dimainkan dengan cara menyentil kelereng menggunakan jari. Permainan dapat dilakukan dengan target lubang atau kelereng milik pemain lain. | Santai / Kasual | Mendongeng | |
| `kenalan-pecah-balon-air.mp3` | Pecah Balon Air! Tenang, di layar kalian nggak bakal basah. Permainan kelompok yang menggunakan balon berisi air. Pemain bekerja sama untuk memecahkan atau memindahkan balon air sesuai tantangan yang diberikan. Permainan ini melatih kerja sama, koordinasi, dan ketangkasan. Ingat, balon air itu dibawa, bukan dilempar. Jangan pernah melempar balon ke arah wajah teman. Main yang sportif, ya! | Santai / Kasual | Motivasi | Pesan keselamatan di akhir harus terdengar jelas. |

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

Baris hitungan wajib dipotong jeda kosongnya (perintah ffmpeg di atas). Durasi tiap angka harus kurang dari 0,6 detik, karena jeda antarangka di game hanya 0,7 detik.

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

---

## Daftar periksa

Centang setelah file ada di `public/audio/vo/`.

**A. Intro (8)**
- [ ] intro-1-bima
- [ ] intro-1-sekar
- [ ] intro-2-guru
- [ ] intro-3-sekar
- [ ] intro-4-guru
- [ ] intro-5-guru
- [ ] intro-6-dimas
- [ ] intro-6-guru

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

Total: 8 + 9 + 24 + 16 = **57 file**.
