# Update PhotoBooth — Revisi Background & Filter

## Instalasi setelah overwrite

Jalankan:

```bash
php artisan optimize:clear
php artisan migrate --force
php artisan storage:link
```

Folder `public/build` di dalam ZIP sudah berisi hasil build Vite terbaru. Jalankan `npm run build` lagi hanya jika source CSS/JavaScript diubah setelah ZIP dipasang.

Pada Windows, perintah tersebut tersedia melalui:

```text
SETELAH_PASTE_JALANKAN.bat
```

## Perubahan terbaru

- Kartu Template tidak lagi ditarik memanjang mengikuti tinggi area kosong.
- Settings memiliki dua bagian: **Template Layout** dan **Background**.
- Admin dapat menambah, mengubah, mengaktifkan, menonaktifkan, dan menghapus background gambar.
- Halaman Hias memiliki mode **Background**, **Filter**, **Stiker**, dan **Coret-coret**.
- Background warna dipilih melalui color picker berbentuk lingkaran.
- Background warna/gambar dan filter diterapkan per foto, sehingga Foto 1 dan Foto 2 dapat memakai efek berbeda.
- Filter tersedia: Normal, Black & White, Warm, Cold, Vintage, Vivid, Soft, dan Sepia.
- Stiker mode Auto dipindahkan ke area tepi agar tidak menutup bagian utama foto.
- Layout Template tetap menonaktifkan stiker Auto dan menggunakan mode Manual.
- Login Settings diperkuat dengan cookie autentikasi terproteksi agar tidak kembali berulang ke halaman login.
- Setelah tombol Simpan ditekan, halaman QR hanya menyediakan tombol **Kembali ke Home**.
- Foto dan link QR kedaluwarsa setelah 10 menit secara default.

## Konfigurasi

```env
PHOTOBOOTH_RETENTION_MINUTES=10
PHOTOBOOTH_IDLE_TIMEOUT_SECONDS=300
PHOTOBOOTH_IDLE_REDIRECT_URL=/photobooth
```

Laravel Scheduler harus tetap berjalan agar file yang kedaluwarsa benar-benar dihapus:

```bash
php artisan schedule:work
```

Tanpa scheduler, link tetap menjadi tidak valid setelah 10 menit, tetapi file fisik baru dibersihkan saat cleanup berikutnya berjalan.

## Revisi 6 — Background Removal dan Palette Baru

- Background warna/gambar sekarang mengganti latar belakang foto dengan segmentasi orang, bukan sekadar membuat bingkai di belakang foto yang diperkecil.
- Model penghapus background dan file WASM disimpan lokal di `public/vendor/selfie-segmentation`, sehingga kiosk tidak bergantung pada internet saat digunakan.
- Pilihan background dibagi menjadi tiga tab: Tanpa Background, Foto, dan Color.
- Warna bawaan dibatasi menjadi putih, merah, biru, dan hijau muda.
- Color picker langsung menerapkan warna tanpa tombol konfirmasi.
- Daftar gambar background dibuat berupa thumbnail ringkas tanpa label nama di bawah gambar.
- Teks "Gambar dari Admin" dan keterangan Settings dihapus dari halaman Hias Foto.


## Revisi 7 - Library stiker manual

- Menambahkan lebih dari 120 stiker manual untuk photobooth modern.
- Menambahkan kategori Semua, Aksesori, Cute, Party, Love, Ekspresi, Snack, dan Teks.
- Menambahkan stiker kacamata hitam, kacamata, topi, mahkota, headphone, kamera, disco, confetti, reaction, snack, serta teks populer.
- Daftar stiker dibuat scrollable di dalam panel agar halaman tidak memanjang.
- Ukuran awal stiker teks menyesuaikan panjang tulisan supaya lebih mudah diposisikan.
