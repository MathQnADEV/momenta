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
| Paket A | Foto + soft file + cetak foto (strip / card) | Rp13.000 |
| Paket B | Foto + soft file + ganci akrilik 2 sisi | Rp15.000 |
| Paket C | Foto + soft file + cetak foto + ganci akrilik | Rp20.000 |

- **Cetak foto** (photostrip / photo card): hasil frame pelanggan dicetak di kertas foto **A4** (Epson L120) dengan garis potong. Ukurannya mengikuti tabel `item_sizes` di `config/photobooth.php` berdasarkan **baris × kolom** layout (Grid 2x3 = 2 baris × 3 kolom, Template Hijau = 4 baris × 2 kolom); arah tegak/melebar mengikuti frame, dan frame dimuat utuh (sisa jadi tepi putih).

  | Baris × kolom | Ukuran | Jenis |
  |---|---|---|
  | 1×1, 2×2, 3×3, 3×2 | 10 × 10 cm | Photo card |
  | 1×2, 1×3, 2×3, 4×2 | 5 × 10 cm | Photostrip |
  | 2×1 | 10 × 5 cm | Photo card |
  | 3×1 | 10 × 4 cm | Photo card |
  | 4×1 | 10 × 3,5 cm | Photo card |
  | 1×4 | 5 × 15 cm | Photostrip |

- **Kertas dipakai berkali-kali**: setiap cetakan hanya mengisi satu bagian kertas. Aplikasi mengingat bagian yang sudah tercetak di perangkat itu (abu-abu di pratinjau) dan otomatis memilih tempat kosong berikutnya. Operator bisa mengetuk pratinjau untuk memindah posisi, dan menekan **Kertas Baru** saat mengganti kertas. Bagian kertas baru dianggap terpakai setelah tombol **Cetak** ditekan.
- **Ganci**: sisi depan memakai hasil frame (atau satu foto), sisi belakang berisi kutipan di dalam frame yang sama (atau foto). Dicetak di separuh kertas **4R** (atas atau bawah) untuk Canon SELPHY, jadi satu lembar cukup untuk dua pesanan ganci. Isi ganci mengikuti bentuk frame dan dimuatkan ke ukuran akrilik `PHOTOBOOTH_KEYCHAIN_WIDTH_MM` × `PHOTOBOOTH_KEYCHAIN_HEIGHT_MM` (default 28 × 40 mm).
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
