# Kotak Dolanan

Web game berisi 9 permainan tradisional Indonesia untuk kokurikuler SMP di SNT 2 Banyumas. Bisa dipasang di HP sebagai aplikasi (PWA) dan tetap jalan saat WiFi sekolah putus.

Dibuat dengan Vite, React, TypeScript, Phaser 3 (game aksi), React + SVG (game papan), GSAP (animasi), Zustand (simpanan progres), dan Howler.js (suara). Aturan proyek ada di `CLAUDE.md`, brief lengkap di `docs/brief.md`, catatan keputusan di `docs/keputusan.md`.

## Menjalankan

Butuh Node.js 20 atau lebih baru.

```bash
npm install
npm run dev        # mode pengembangan: http://localhost:5173
npm run build      # build produksi ke dist/ (cek tipe + bundel + service worker)
npm run preview    # coba hasil build: http://localhost:4173
npm run uji-hp     # build + buka di jaringan (port 8001) untuk dites di HP/PID satu WiFi
npm run lint       # cek gaya kode
npm test           # uji aturan dan AI permainan
```

Mode offline (service worker) hanya aktif di hasil build (`preview`/`uji-hp`/Vercel), tidak di `npm run dev`.

## Struktur singkat

```
src/app/          routing, Stage 1280x720, token warna, store, Pengaturan, Kredit, PWA
src/intro/        layar judul, intro bercerita, script.json
src/menu/         menu Kotak Dolanan
src/games/<id>/   satu folder per game (export default GameModule)
src/shared/       GameShell, Kenalan Dulu, layar hasil, audio, komponen UI
src/data/         games.json (data permainan) dan kredit.json (halaman Kredit)
public/audio/     sfx/, musik/, vo/ (opsional)
scripts/          buat-ikon.mjs (ikon PWA), kompres-audio.mjs (audio)
```

## Mengganti isi games.json

`src/data/games.json` adalah satu-satunya sumber data permainan: nama, kategori, aturan asli, cara main di web, mode, jumlah pemain, dan tantangan lapangan. Ubah teksnya langsung di file itu; tidak ada teks permainan yang ditulis di kode.

- `aturanAsli` disalin persis dari `docs/daftar-permainan.docx`. Aturan khusus versi web ditulis di `catatanWeb`.
- `asalDaerah`, `namaLain`, dan `sumberAsal` diisi dari riset siswa (jangan menebak). Isinya tampil di Kenalan Dulu dan halaman Kredit. Contoh:
  ```json
  "asalDaerah": "Jawa Tengah",
  "namaLain": ["Teklek", "Terompah panjang"],
  "sumberAsal": ["Wawancara Mbah Karto, Desa Pliken (12 Okt 2026)", "Buku Permainan Tradisional Jawa, hlm. 40"]
  ```
- `mode` hanya boleh berisi `cpu` (lawan komputer), `hotseat` (bergantian), dan `split` (duel satu layar).
- `pilihan` (opsional) menambah tombol pengaturan di Kenalan Dulu, misalnya jumlah giliran. Nilainya diterima game lewat `opts.opsi[id]`.

Setelah mengubah, jalankan `npm run build` untuk memastikan formatnya benar.

## Mengganti isi script.json (intro)

`src/intro/script.json` berisi dua bagian:

- `adegan`: enam adegan intro (durasi, transisi, efek suara `sfx` dengan waktu `t` dalam detik). Id adegan dipakai kode animasi, jadi jangan diganti atau dihapus.
- `baris`: dialog. Setiap baris punya `lineId`, `tokoh` (`guru`, `bima`, `sekar`, `dimas`), `mulai` (detik sejak awal adegan), `teks` (subtitle), `teksEn` (terjemahan Inggris), `teksVO` (opsional, naskah perekam bila beda dari subtitle), dan `balon` (posisi balon kata di panggung 1280x720).

Teks dialog boleh diubah bebas. Jika teks jauh lebih panjang, perbesar `balon.lebar` atau `durasi` adegan supaya tidak terpotong. Cek hasilnya di `npm run dev` lalu buka `/intro`.

## Menambah file VO dan suara

Suara bersifat opsional: file yang belum ada dilewati tanpa error, dan subtitle selalu tampil.

1. Rekam dialog, lalu beri nama file sesuai `lineId`:
   - intro: `lineId` di `script.json`, misalnya `intro-1-bima`
   - sapaan Pak Ahsan di Kenalan Dulu: `kenalan-<id game>`, misalnya `kenalan-egrang`
2. Taruh rekaman asli di `audio-mentah/vo/` (misalnya `audio-mentah/vo/intro-1-bima.wav`). Efek suara di `audio-mentah/sfx/`, musik di `audio-mentah/musik/`.
3. Jalankan `npm run audio`. Rekaman dikompres ke `public/audio/` sebagai MP3 mono (VO 64 kbps, sfx/musik 96 kbps) supaya ringan di HP. Butuh ffmpeg (`brew install ffmpeg` atau `winget install ffmpeg`). Cek hasilnya dengan `npm run audio -- --cek`.
4. Jalankan ulang `npm run dev`. Tokoh otomatis lip-sync mengikuti rekaman.

Nama efek suara yang sudah dipanggil kode: `bel`, `pintu`, `tuk`, `kotak-buka`, `cahaya`, `pudar` (intro), `tap`, `kartu`, `dadu`, `langkah`, `tangga`, `ular`, `pantul`, `menang`, `seri`, `stempel`, `stempel-emas`. Musik intro: `musik/intro`. Bunyi di dalam game Phaser dan dam-daman disintesis langsung di browser, jadi tidak butuh file.

Setiap file suara dari luar wajib dicatat sumber dan lisensinya di `src/data/kredit.json` (lihat bawah). Saat file diganti, URL-nya ikut berganti (`?v=<sidik isi>`), jadi HP yang sudah memasang aplikasi otomatis mengunduh versi baru.

## Mengisi kredit

`src/data/kredit.json` dibaca halaman Kredit (`/kredit`, dibuka dari layar judul atau Pengaturan):

```json
{
  "guru": [{ "nama": "Ibu Rina", "peran": "Guru pendamping" }],
  "siswa": [{ "nama": "Bagas", "peran": "Riset bakiak, 8A" }],
  "musikDanSuara": [
    { "judul": "Gamelan pembuka", "pembuat": "Nama pembuat", "sumber": "freesound.org/...", "lisensi": "CC0", "tautan": "https://..." }
  ],
  "pustaka": [{ "nama": "Phaser 3", "pembuat": "Phaser Studio", "lisensi": "MIT", "tautan": "https://phaser.io" }]
}
```

`peran` dan `tautan` boleh dikosongkan. Daftar yang kosong tampil sebagai "akan diisi".

## Menambah game baru

1. Tambahkan entri di `src/data/games.json` dengan `id` baru (huruf kecil, pakai tanda hubung), lalu tambahkan id itu ke tipe `GameId` di `src/shared/types.ts`.
2. Buat folder `src/games/<id>/` dengan `index.ts` yang `export default` sebuah `GameModule` (lihat `src/shared/types.ts`):
   - Game aksi (Phaser): pakai `buatModulPhaser({ id, modes, orientation, siapkan })` dari `src/shared/phaser/modul.ts`. Contoh paling ringkas: `src/games/kelereng/index.ts`.
   - Game papan (React + SVG): pasang root React sendiri di `mount()`. Contoh: `src/games/dam-daman/index.ts`.
3. Panggil `opts.onFinish({ pemenang, skor, durasiDetik })` saat permainan selesai; GameShell lanjut ke layar hasil dan stempel.
4. Selesai. Folder otomatis terdaftar dan dimuat lazy (`src/games/index.ts`), lalu berkasnya masuk `assets/game/` dan di-cache untuk offline saat pertama dibuka. Jika nama folder berbeda dari id, tambahkan pemetaannya di `ID_FOLDER`.

Aturan wajib untuk game baru: input lewat Pointer Events atau input Phaser (tanpa hover), area tap minimal 48x48 px, warna hanya dari token (`src/app/tokens.ts` untuk Phaser), karakter dari `src/characters/`, hormati `prefers-reduced-motion` (`env.gerak` di Phaser), dan bisa dimainkan dengan keyboard. Tes di 390x844 (tegak dan mendatar), 1024x768, dan 1920x1080.

## PWA dan offline

- Saat pertama dibuka, service worker menyimpan shell aplikasi, layar judul, intro, avatar, menu, Kenalan Dulu, layar hasil, Kredit, huruf, dan ikon (±1 MB).
- Setiap game (dan Phaser) disimpan saat pertama kali dibuka. Guru bisa menyimpan semua game sekaligus lewat Pengaturan → "Simpan semua game" sebelum kelas.
- Tombol "Pasang di HP" muncul di layar judul dan Pengaturan bila browser mendukung (Chrome/Edge/Samsung Internet). Di iPhone, Pengaturan menampilkan cara memasang lewat Safari.
- Saat ada versi baru, muncul pesan "Versi baru Kotak Dolanan sudah siap" dengan tombol Perbarui; aplikasi tidak memuat ulang sendiri di tengah permainan.
- Ikon aplikasi dibuat dari gambar kotak di `design/objects.js`. Jalankan `npm run ikon` jika gambarnya berubah.

## Deploy ke Vercel

Konfigurasi sudah ada di `vercel.json`: build `npm run build`, output `dist/`, semua rute diarahkan ke `index.html` (kecuali berkas statis), dan header cache:

| Berkas | Cache-Control |
| --- | --- |
| `/assets/*` (nama ber-hash) | `public, max-age=31536000, immutable` |
| `/audio/*` | `public, max-age=2592000` (URL di aplikasi membawa `?v=`) |
| `/icons/*` | `public, max-age=604800` |
| `index.html`, `sw.js`, `workbox-*.js`, `manifest.webmanifest`, `offline-game.json` | `max-age=0, must-revalidate` (selalu dicek ulang) |

Langkah menghubungkan repo GitHub:

1. Unggah repo ke GitHub (`git remote add origin https://github.com/<akun>/kotak-dolanan.git`, lalu `git push -u origin master`).
2. Masuk ke vercel.com dengan akun GitHub, pilih **Add New → Project**, lalu **Import** repo `kotak-dolanan`. Jika repo tidak muncul, klik **Adjust GitHub App Permissions** dan beri akses ke repo itu.
3. Vercel membaca `vercel.json`: Framework Preset **Vite**, Build Command `npm run build`, Output Directory `dist`. Tidak perlu environment variable. Klik **Deploy**.
4. Setiap `git push` ke `master` otomatis di-deploy ke produksi; push ke cabang lain atau pull request mendapat URL pratinjau sendiri.
5. Opsional: tambahkan domain sekolah di **Project → Settings → Domains**.

Setelah deploy, buka URL-nya di HP Android dengan Chrome, tunggu beberapa detik, lalu cek tombol "Pasang di HP" dan coba mode pesawat.
