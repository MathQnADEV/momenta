/*
 * Service worker Momenta: hanya agar Chrome mengenali situs ini sebagai aplikasi
 * yang bisa di-install. Tidak menyimpan cache; semua permintaan tetap ke server,
 * jadi tampilan selalu versi terbaru.
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {
    // Biarkan browser menangani permintaan seperti biasa.
});
