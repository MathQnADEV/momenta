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

## Cetak Fisik & Pembayaran

Setelah foto tersimpan, tombol **Cetak Foto Fisik** membuka pilihan paket:

| Paket | Isi | Harga |
|---|---|---|
| A | 2 photocard 54 × 86 mm (2 pose berbeda / 1 pose rangkap) | Rp10.000 |
| B | 1 photocard + gantungan kunci akrilik 2 sisi | Rp20.000 |
| C | Gantungan kunci akrilik 2 sisi | Rp15.000 |

Semua item dicetak pada satu lembar 4R (100 × 148 mm, 300 DPI) dengan garis potong, untuk Canon SELPHY CP1500. Ukuran, harga, dan isi paket diatur di `config/photobooth.php` bagian `print`.

Pembayaran masih **mode simulasi** (`PHOTOBOOTH_PAYMENT_DRIVER=simulation`): operator menekan tombol konfirmasi setelah menerima uang. Pesanan tersimpan di tabel `print_orders` sehingga nantinya dapat diganti integrasi DOKU.

Saat mencetak pilih printer SELPHY, kertas 4R, skala 100%, tanpa margin. Di Chrome/Edge Windows, dialog print dapat dilewati dengan menjalankan browser memakai opsi `--kiosk-printing`.
