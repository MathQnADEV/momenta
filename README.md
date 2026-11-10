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
