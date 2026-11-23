# PhotoBooth — Laravel + Vite

Aplikasi kiosk PhotoBooth portrait 1080 × 1920 berbasis Laravel, Blade, Vite, dan JavaScript.

## Fitur utama

- Layout Basic dan Template yang dikelola dari database.
- Editor template di `/photobooth/settings` dengan area foto yang dapat digeser dan diubah ukurannya.
- Background gambar yang dapat ditambah admin dari halaman Settings.
- Background warna/gambar dan filter yang dapat berbeda untuk setiap foto.
- Pengambilan ulang satu foto atau seluruh foto.
- Stiker manual, tema stiker otomatis di tepi foto, dan fitur coret-coret.
- Unduh melalui QR code dengan masa berlaku default 10 menit.
- Kembali otomatis ke menu `/photobooth` setelah 5 menit tanpa interaksi.

## Settings

URL:

```text
http://localhost:8000/photobooth/settings/
```

Password awal:

```text
testing123
```

Password disimpan dalam bentuk hash bcrypt di database.

## Paket, Pembayaran & Cetak

Setelah Preview, pelanggan menekan **Simpan & Pilih Paket**. Foto langsung diunggah, tetapi **QR soft file baru muncul setelah pembayaran lunas** (halaman `/foto/{slug}` menolak foto yang belum dibayar). Bila pelanggan memilih **Selesai Tanpa Membeli**, foto tetap tersimpan tanpa QR.

| Pilihan | Isi | Harga |
|---|---|---|
| Soft File | Foto + soft file (QR) | Rp8.000 |
| Paket A | Foto + soft file + cetak strip | Rp13.000 |
| Paket B | Foto + soft file + ganci akrilik 2 sisi | Rp15.000 |
| Paket C | Foto + soft file + strip + ganci akrilik | Rp20.000 |

- **Strip**: hasil template pelanggan dicetak di kertas foto **A4** (Epson L120), diulang sebanyak yang muat dengan garis potong. Sisi terpanjang tiap salinan 150 mm (ubah lewat `PHOTOBOOTH_STRIP_LONG_SIDE_MM`). L120 tidak bisa cetak tanpa margin, jadi lembar diberi tepi putih 5 mm.
- **Ganci**: depan dan belakang (foto atau kutipan) dicetak di kertas **4R** untuk Canon SELPHY. Ukuran akrilik diatur lewat `PHOTOBOOTH_KEYCHAIN_WIDTH_MM` dan `PHOTOBOOTH_KEYCHAIN_HEIGHT_MM` (default 28 × 40 mm).
- Saat mencetak pilih printer yang sesuai, ukuran kertas sesuai lembar (A4 atau 4R), dan skala 100%.

Harga dan isi paket diatur di `config/photobooth.php` bagian `print`.

Pembayaran memakai **QRIS statis + PIN operator** (`PHOTOBOOTH_PAYMENT_DRIVER=qris_static`):

- Booth menampilkan gambar QRIS dari `public/images/qris/qrisMas.jpeg` (bisa diganti lewat `PHOTOBOOTH_QRIS_IMAGE`).
- Aplikasi tidak bisa mendeteksi uang masuk dari QRIS statis, jadi operator mengecek notifikasi di HP lalu mengetik **PIN operator** di booth.
- PIN (4–6 angka) diatur di **Pengaturan → Pembayaran**. Selama PIN belum diatur, pembayaran tidak bisa dikonfirmasi.
- Untuk uji coba tanpa bayar, pakai `PHOTOBOOTH_PAYMENT_DRIVER=simulation`.

Pesanan tersimpan di tabel `print_orders` sehingga nantinya dapat diganti integrasi DOKU yang mendeteksi pembayaran otomatis.

### Tampilan tablet landscape

Jika layar lebih lebar daripada tingginya (Xiaomi Pad 8 Pro landscape, laptop), kiosk memakai kanvas landscape setinggi 1080 px. Di langkah Foto, kamera tampil besar di kiri dan template di kanan; kamera live muncul langsung di slot yang sedang diisi, dan foto yang sudah diambil bisa diulang dengan menekan slotnya. Layar portrait tetap memakai tampilan 1080 × 1920.

Di Chrome/Edge Windows, dialog print dapat dilewati dengan menjalankan browser memakai opsi `--kiosk-printing` (printer bawaan yang dipakai).
