# Kotak Dolanan

Web game berisi 9 permainan tradisional Indonesia untuk kokurikuler SMP di SNT (Sekolah Nasional Terintegrasi).
Alur: layar judul → intro bercerita (Pak Ahsan, guru muda, + siswa SNT) → buat avatar → menu "Kotak Dolanan" → Kenalan Dulu → main → hasil + stempel → Tantangan Lapangan.
Sekolah: SNT 2 Banyumas. Pakai nama ini di teks UI, kredit, dan lockup.
Brief lengkap: `docs/brief.md`. Daftar resmi permainan (aturan asli, jumlah pemain): `docs/daftar-permainan.docx`.
Hasil Claude Design (design system, karakter, mockup, storyboard): `design/` (file `.dc.html` dibuka di Claude Design; `support.js` hanya runtime pratinjau, bukan kode aplikasi).

## Target perangkat
HP (tegak & mendatar), tablet, laptop, dan Papan Interaktif Digital (PID) kelas — layar sentuh besar, multi-touch, dipakai beberapa siswa sekaligus.
Siswa kebanyakan memakai HP Android kelas bawah. Performa di sana adalah prioritas.

## Stack (jangan ganti tanpa bertanya)
- Vite + React + TypeScript (strict)
- CSS Modules + design token di `src/app/tokens.css`
- GSAP untuk intro dan animasi UI
- React + SVG untuk game papan (ular tangga, dam-daman)
- Phaser 3 untuk game aksi (bakiak, kelereng, engklek, bola bekel, egrang, gobak sodor, balon air)
- Zustand (persist ke localStorage) untuk avatar, progres, stempel, pengaturan
- Howler.js untuk suara dan voice over
- vite-plugin-pwa untuk mode offline
- react-router untuk routing layar; font lokal lewat @fontsource (Baloo 2, Nunito) supaya jalan offline

## Struktur
```
src/
  app/          routing, Stage (panggung 1280x720 yang diskalakan), tokens.css, store
  intro/        adegan intro + script.json
  menu/         kartu game, filter kategori, stempel
  avatar/       pembuat avatar
  characters/   komponen karakter SVG + animasi (berkedip, bernapas, bicara)
  games/<id>/   satu folder per game, mengekspor GameModule
  shared/       GameShell, HUD, ModePicker, ResultScreen, KenalanDulu, AudioManager, types.ts
  data/games.json   satu-satunya sumber data permainan
public/audio/   sfx/, musik/latar.mp3, vo/<lineId>.mp3 (hasil `npm run audio` dari audio-mentah/)
```

## Aturan wajib
- Semua teks UI berbahasa Indonesia yang ramah untuk siswa SMP (12–15 tahun): terasa seperti game beneran, tidak kekanak-kanakan.
- Input selalu lewat Pointer Events (atau input Phaser). Tidak ada fungsi yang bergantung pada hover.
- Area tap minimal 48x48px. Teks minimal 16px di HP.
- Intro dan game berjalan di panggung 1280x720 yang diskalakan agar pas; area letterbox diisi pola kain, bukan hitam.
- Game yang butuh layar lebar menampilkan overlay "Putar HP-mu" saat tegak.
- Hormati `prefers-reduced-motion`.
- Warna dan font hanya dari token. Palet: kunyit #E8A33D, merah bata #B5462F, daun pisang #6E9F3D, biru nila #2E4C7A, kertas krem #F6EBD6, kayu #6B4226, cahaya kelir #FFD58A. Font: Baloo 2 (judul), Nunito (isi).
- Data permainan (nama, kategori, aturan asli, cara main web) hanya dari `src/data/games.json`.
- Setiap game mengikuti interface `GameModule` di `src/shared/types.ts` dan dimuat secara lazy.
- Game dimainkan lokal saja: mode `cpu` (lawan komputer), `hotseat` (bergantian di satu perangkat), `split` (duel satu layar). Tidak ada mode online.
- Karakter harus memakai aset dari `design/`. Jangan membuat karakter baru atau meniru tokoh kartun/wayang tertentu.
- Suara aktif setelah tap pertama. Selalu ada subtitle dan tombol mute.

## Definisi selesai (untuk setiap tugas)
1. `npm run build` dan `npm run lint` lolos tanpa error.
2. Dicek di viewport 390x844 (tegak dan mendatar), 1024x768, dan 1920x1080.
3. Bisa dimainkan dengan sentuhan dan dengan mouse/keyboard.
4. Commit dengan pesan yang jelas, lalu laporkan apa yang selesai, apa yang belum, dan apa yang perlu dites manual di HP atau PID.
