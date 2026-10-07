# Naskah VO Kotak Dolanan

Naskah rekaman suara untuk dibuat dengan TTS Gemini. Satu baris = satu file.
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

1. Buka Google AI Studio → **Generate speech** (mode satu pembicara / *single-speaker*). Pakai model TTS Gemini terbaru yang tersedia (Pro untuk hasil terbaik, Flash kalau mau cepat).
2. Pilih **suara** sesuai tabel Pemeran di bawah. Pakai suara yang sama untuk satu tokoh dari awal sampai akhir.
3. Tempel **Gaya tokoh** ke kolom *Style instructions*. Kalau tidak ada kolomnya, tulis di depan teks lalu akhiri dengan titik dua, contoh: `Ucapkan dengan hangat seperti guru muda yang suka bercerita: Dulu kami main di lapangan…`
4. Tambahkan **Arahan baris** (kolom terakhir tiap tabel) di belakang gaya tokoh.
5. Tempel **Teks** persis seperti di tabel. Jangan menambah kata, karena subtitle di layar memakai kalimat yang sama.
6. Unduh (biasanya `.wav`), ganti nama sesuai kolom **File**, lalu ubah ke `.mp3` (perintah di bawah).
7. Kalau satu baris terdengar aneh, ulangi generate 2–3 kali dan pilih yang paling natural.

Tips sebelum mulai: coba dulu satu baris tiap tokoh dengan 2–3 suara alternatif, dengarkan di HP, baru tentukan pemerannya.

### Ubah ke MP3 dan potong jeda kosong

Siswa kebanyakan memakai HP Android kelas bawah dan aplikasi menyimpan audio untuk offline, jadi file harus kecil. Target: mono, 48 kbps, tanpa jeda kosong di awal dan akhir.

Jalankan di folder berisi file `.wav` yang sudah diberi nama (butuh [ffmpeg](https://ffmpeg.org)):

```sh
for f in *.wav; do
  ffmpeg -y -i "$f" -ac 1 -ar 24000 -b:a 48k \
    -af "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,loudnorm=I=-16:TP=-1.5" \
    "${f%.wav}.mp3"
done
```

Lalu salin semua `.mp3` ke `public/audio/vo/`. File `.wav` tidak perlu ikut.

Pemotongan jeda paling penting untuk bagian D: hitungan "Tiga, Dua, Satu" hanya punya waktu 0,7 detik per angka.

---

## Pemeran

| Tokoh | Suara Gemini | Cadangan | Gaya tokoh (tempel ke *Style instructions*) |
| --- | --- | --- | --- |
| **Pak Ahsan** (guru muda) | Achird | Sadaltager, Iapetus | Guru laki-laki muda umur 28-an. Suara hangat, ramah, sedikit jenaka, seperti sedang bercerita ke murid SMP. Bahasa Indonesia sehari-hari yang santai dan natural, bukan gaya penyiar berita. Tempo sedang. |
| **Bima** | Puck | Fenrir | Siswa laki-laki SMP umur 13 tahun. Penuh semangat, kompetitif, suka bercanda, bicara agak cepat. Bahasa Indonesia gaul yang sopan. Suara remaja, tidak berat. |
| **Sekar** | Leda | Laomedeia | Siswi SMP umur 13 tahun. Ceria, penasaran, suka bertanya, nada naik di akhir pertanyaan. Bahasa Indonesia sehari-hari. Suara remaja yang jernih. |
| **Dimas** | Enceladus | Umbriel | Siswa laki-laki SMP umur 13 tahun. Pemalu dan lembut, bicara pelan dengan jeda kecil, tapi tulus. Bahasa Indonesia sehari-hari. Suara remaja, agak lirih. |

Suara Gemini cenderung terdengar dewasa. Kata "umur 13 tahun" dan "suara remaja" di gaya tokoh membantu, tapi tetap pilih suara yang paling muda setelah dicoba.

---

## A. Intro

Adegan intro (`src/intro/script.json`). Durasi adegan otomatis menunggu VO selesai, jadi tidak perlu dipaskan detik per detik.

| File | Tokoh | Teks | Arahan baris |
| --- | --- | --- | --- |
| `intro-1-bima.mp3` | Bima | Istirahat kok gini-gini aja sih… | Bosan, sambil menguap di awal kalimat, malas. |
| `intro-1-sekar.mp3` | Sekar | Yaah… lowbat lagi. | Kecewa melihat HP-nya mati. "Yaah" panjang dan turun. "Lowbat" dibaca seperti orang Indonesia biasa: "lobet". |
| `intro-2-guru.mp3` | Pak Ahsan | Hmm… dulu waktu Bapak seumuran kalian, jam istirahat nggak pernah sepi. | Mengenang, pelan, tersenyum. "Hmm" seperti sedang berpikir. |
| `intro-3-sekar.mp3` | Sekar | Ini semua apa, Pak? | Kaget dan kagum melihat kotak bercahaya, penasaran. |
| `intro-4-guru.mp3` | Pak Ahsan | Dulu kami main di lapangan tiap hari. Dari situ kami belajar sportif, kompak, dan sabar. | Narasi tenang dan hangat, seperti mendongeng. Beri jeda kecil di antara "sportif, kompak, dan sabar". |
| `intro-5-guru.mp3` | Pak Ahsan | Tapi lihat. Kalau nggak ada yang mainin lagi, permainan ini bisa hilang. | Pelan, sedikit sedih, serius. Jeda setelah "Tapi lihat." |
| `intro-6-dimas.mp3` | Dimas | Eh… kalau gitu, kita mainin lagi aja, Pak? | Ragu-ragu di awal ("Eh…"), lalu memberanikan diri. Nada bertanya yang penuh harap. |
| `intro-6-guru.mp3` | Pak Ahsan | Nah! Itu proyek kokurikuler kita. Siapa mau ikut? | Bersemangat dan bangga. "Nah!" tegas dan gembira. Mengajak di kalimat terakhir. |

---

## B. Kenalan Dulu

Diputar saat layar Kenalan Dulu terbuka. Pak Ahsan memperkenalkan permainan. Kalimat pertama adalah pembuka baru; sisanya sama persis dengan deskripsi di `src/data/games.json`.

Catatan B: saat VO disambungkan, kalimat pembuka ini akan ditambahkan ke `games.json` (kolom baru `sapaanGuru`) supaya ikut tampil di balon kata. Kalau file sudah dipasang sebelum itu, VO tetap jalan, hanya kalimat pembukanya belum tampil di subtitle.

Gaya tokoh: Pak Ahsan. Arahan umum untuk semua baris: *kalimat pertama santai dan jenaka, kalimat berikutnya menjelaskan dengan jelas dan ramah, tidak terburu-buru.*

| File | Teks | Arahan baris |
| --- | --- | --- |
| `kenalan-dam-daman.mp3` | Yang ini Dam-daman. Cocok buat kalian yang suka mikir dua langkah ke depan. Permainan papan tradisional yang dimainkan oleh dua orang menggunakan bidak. Pemain berusaha memindahkan dan menangkap bidak lawan dengan strategi tertentu. | Agak misterius di pembuka, seperti menantang. |
| `kenalan-engklek.mp3` | Ini Sunda Manda, atau yang lebih sering kita sebut engklek. Siapkan satu kaki kalian! Permainan melompat pada kotak-kotak yang digambar di tanah menggunakan satu kaki. Pemain harus melewati semua kotak tanpa menginjak garis. | "Engklek" dibaca "éngklék". Ceria di "Siapkan satu kaki kalian!" |
| `kenalan-ular-tangga.mp3` | Ular Tangga! Siapa di sini yang belum pernah main? Hayo, ngaku. Permainan papan yang menggunakan dadu dan pion. Pemain bergerak dari angka kecil menuju angka terbesar dengan bantuan tangga dan hambatan ular. | Menggoda murid di "Hayo, ngaku." sambil tertawa kecil. |
| `kenalan-gobak-sodor.mp3` | Gobak Sodor. Dulu Bapak paling suka jadi penjaga. Permainan kelompok yang menggabungkan kecepatan, strategi, dan kerja sama. Satu tim berusaha melewati garis penjagaan tim lawan dan kembali tanpa tersentuh. | Bangga dan bernostalgia di pembuka. |
| `kenalan-bola-bekel.mp3` | Bola Bekel. Yang ini butuh tangan cepat dan mata yang jeli. Permainan menggunakan bola kecil dan beberapa biji bekel. Pemain melempar bola ke atas, mengambil atau mengatur biji bekel, kemudian menangkap kembali bola. | "Bekel" dibaca "békel". |
| `kenalan-bakiak.mp3` | Bakiak! Di permainan ini, kompak itu nomor satu. Permainan kelompok menggunakan papan kayu panjang dengan tali untuk tempat kaki. Pemain harus berjalan bersama-sama dengan menjaga keseimbangan dan kekompakan. | Semangat seperti pelatih tim. |
| `kenalan-egrang.mp3` | Egrang. Iya, yang tadi nyangkut di pintu itu. Permainan menggunakan dua batang bambu atau kayu yang memiliki pijakan kaki. Pemain berdiri di atas pijakan dan berjalan menggunakan keseimbangan tubuh. | Malu-malu lucu di "Iya, yang tadi nyangkut di pintu itu." "Egrang" dibaca "égrang". |
| `kenalan-kelereng.mp3` | Kelereng. Bapak dulu punya satu toples penuh, lho. Permainan menggunakan kelereng yang dimainkan dengan cara menyentil kelereng menggunakan jari. Permainan dapat dilakukan dengan target lubang atau kelereng milik pemain lain. | Bangga sambil pamer kecil di pembuka. |
| `kenalan-pecah-balon-air.mp3` | Pecah Balon Air! Tenang, di layar kalian nggak bakal basah. Permainan kelompok yang menggunakan balon berisi air. Pemain bekerja sama untuk memecahkan atau memindahkan balon air sesuai tantangan yang diberikan. Permainan ini melatih kerja sama, koordinasi, dan ketangkasan. Ingat, balon air itu dibawa, bukan dilempar. Jangan pernah melempar balon ke arah wajah teman. Main yang sportif, ya! | Jenaka di pembuka. Bagian "Ingat, balon air itu dibawa…" lebih tegas dan serius, lalu hangat lagi di "Main yang sportif, ya!" |

Satu-satunya perbedaan teks dengan `games.json`: deskripsi Egrang tertulis "bambu/kayu", di sini ditulis "bambu atau kayu" supaya tidak dibaca "bambu garis miring kayu".

---

## C. Komentar layar hasil

Satu tokoh (acak) berkomentar di layar hasil. Di layar, sebagian kalimat menyebut nama pemenang (`{pemenang}`). TTS tidak bisa menyebut nama yang diketik pemain, jadi VO-nya memakai versi tanpa nama. Saat disambungkan, subtitle akan disesuaikan supaya sama dengan VO.

- **menang**: pemain utama menang (atau mode main bergantian/duel, komentar ditujukan ke pemenang).
- **kalah**: pemain kalah melawan komputer.
- **seri**: hasil imbang.

Nada semua komentar: teman sebaya yang sportif, tidak mengejek.

### Bima (gaya tokoh: Bima)

| File | Teks | Arahan baris |
| --- | --- | --- |
| `hasil-bima-menang-1.mp3` | Mantap! Ronde depan giliranku yang menang, ya. | Kagum, lalu menantang sambil nyengir. |
| `hasil-bima-menang-2.mp3` | Wah, cepat banget! Aku tantang lagi, deh. | Kaget kagum, lalu bersemangat. |
| `hasil-bima-menang-3.mp3` | Keren! Tapi jangan senang dulu, aku lagi pemanasan. | Memuji, lalu bercanda sok percaya diri. |
| `hasil-bima-kalah-1.mp3` | Hampir! Satu ronde lagi, pasti bisa. | Menyemangati, penuh energi. |
| `hasil-bima-kalah-2.mp3` | Selamat buat yang menang. Aku juga pernah kalah tiga kali berturut-turut, kok. | Sportif, lalu menghibur sambil tertawa kecil. |
| `hasil-bima-kalah-3.mp3` | Belum rezeki. Ayo balas dendam secara sportif! | Santai, lalu berapi-api di "Ayo". |
| `hasil-bima-seri-1.mp3` | Seri? Berarti harus ada ronde penentuan! | Tidak percaya, lalu sangat bersemangat. |
| `hasil-bima-seri-2.mp3` | Sama kuat! Seru banget tadi. | Puas dan gembira. |

### Sekar (gaya tokoh: Sekar)

| File | Teks | Arahan baris |
| --- | --- | --- |
| `hasil-sekar-menang-1.mp3` | Selamat! Strategimu apa? Aku mau catat. | Ceria, lalu penasaran sungguhan. |
| `hasil-sekar-menang-2.mp3` | Hebat! Di lapangan aslinya pasti lebih seru lagi. | Kagum, membayangkan. |
| `hasil-sekar-menang-3.mp3` | Wah, jago juga. Boleh ajari aku? | Kagum, lalu meminta dengan ramah. |
| `hasil-sekar-kalah-1.mp3` | Tidak apa-apa. Kata Pak Ahsan, yang penting sportif. | Menenangkan, lembut. |
| `hasil-sekar-kalah-2.mp3` | Tadi sudah bagus. Coba lagi dengan cara berbeda? | Mendukung, mengusulkan. |
| `hasil-sekar-kalah-3.mp3` | Lawanmu menang kali ini. Kamu pasti bisa menyusul! | Jujur, lalu menyemangati. |
| `hasil-sekar-seri-1.mp3` | Seri! Kalian sama-sama jago. | Senang dan kagum. |
| `hasil-sekar-seri-2.mp3` | Menarik, hasilnya imbang. Coba lagi yuk! | Berpikir sejenak, lalu mengajak. |

### Dimas (gaya tokoh: Dimas)

| File | Teks | Arahan baris |
| --- | --- | --- |
| `hasil-dimas-menang-1.mp3` | …Keren. Aku juga mau coba. | Diam sebentar sebelum "Keren", kagum pelan. |
| `hasil-dimas-menang-2.mp3` | Selamat. Itu tadi rapi sekali. | Tulus, tenang. |
| `hasil-dimas-menang-3.mp3` | Wah. Aku sampai lupa napas lihatnya. | Takjub, sedikit tertawa malu. |
| `hasil-dimas-kalah-1.mp3` | Aku juga sering kalah… tapi jadi makin paham caranya. | Pelan, menghibur, jeda di "kalah…". |
| `hasil-dimas-kalah-2.mp3` | Tadi sudah dekat, kok. Sekali lagi? | Lembut, mengajak. |
| `hasil-dimas-kalah-3.mp3` | Selamat untuk yang menang. Kita main bareng lagi, ya. | Sportif, hangat. |
| `hasil-dimas-seri-1.mp3` | Seri… jarang-jarang, lho. | Heran pelan. |
| `hasil-dimas-seri-2.mp3` | Imbang. Berarti kalian sama-sama belajar. | Bijak, tenang. |

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

Pak Ahsan berperan sebagai wasit. Gaya tokoh tetap Pak Ahsan, tambahkan arahan: *seperti wasit di lapangan sekolah, lantang, jelas, dan bersemangat. Sangat singkat, tanpa jeda di awal dan akhir.*

Baris hitungan wajib dipotong jeda kosongnya (perintah ffmpeg di atas). Durasi tiap angka harus kurang dari 0,6 detik, karena jeda antarangka di game hanya 0,7 detik.

### Hitungan mulai (Egrang, Gobak Sodor, Pecah Balon Air)

| File | Teks | Dipakai di | Arahan baris |
| --- | --- | --- | --- |
| `aba-3.mp3` | Tiga! | Egrang, Gobak Sodor, Balon Air | Pendek dan tegas. |
| `aba-2.mp3` | Dua! | Egrang, Gobak Sodor, Balon Air | Pendek dan tegas, nada sedikit naik dari "Tiga". |
| `aba-1.mp3` | Satu! | Egrang, Gobak Sodor, Balon Air | Pendek dan tegas, nada naik lagi. |
| `aba-jalan.mp3` | Jalan! | Egrang (setelah hitungan) | Lantang dan bersemangat, seperti melepas pelari. |
| `aba-ayo.mp3` | Ayo! | Pecah Balon Air (setelah hitungan) | Lantang dan ceria. |

Gobak Sodor tidak butuh kata mulai: di game sudah ada bunyi peluit "PRIIT!".

### Kartu siap (sebelum tombol Mulai)

| File | Teks | Dipakai di | Arahan baris |
| --- | --- | --- | --- |
| `siap-egrang.mp3` | Siap lomba egrang? | Egrang | Menantang, ramah. "Egrang" dibaca "égrang". |
| `siap-bakiak.mp3` | Siap lomba bakiak? | Bakiak | Menantang, ramah. |
| `siap-gobak-sodor.mp3` | Siap main gobak sodor? | Gobak Sodor | Menantang, ramah. |
| `siap-pecah-balon-air.mp3` | Estafet balon air! | Pecah Balon Air | Mengumumkan dengan gembira. |

### Ganti ronde dan putaran

| File | Teks | Dipakai di | Arahan baris |
| --- | --- | --- | --- |
| `ronde-2.mp3` | Ronde dua dari empat. | Gobak Sodor | Mengumumkan, jelas. |
| `ronde-3.mp3` | Ronde tiga dari empat. | Gobak Sodor | Mengumumkan, jelas. |
| `ronde-4.mp3` | Ronde empat dari empat. | Gobak Sodor | Mengumumkan, lebih tegang karena ronde terakhir. |
| `putaran-2.mp3` | Putaran dua dari empat. | Pecah Balon Air | Mengumumkan, jelas. |
| `putaran-3.mp3` | Putaran tiga dari empat. | Pecah Balon Air | Mengumumkan, jelas. |
| `putaran-4.mp3` | Putaran empat dari empat. | Pecah Balon Air | Mengumumkan, lebih tegang karena putaran terakhir. |

### Finis

| File | Teks | Dipakai di | Arahan baris |
| --- | --- | --- | --- |
| `aba-finis.mp3` | Finis! | Bakiak, Egrang | Lantang dan gembira. |

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
