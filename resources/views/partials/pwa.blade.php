{{-- Agar Momenta bisa di-install sebagai aplikasi (Chrome: menu ⋮ → Instal aplikasi). --}}
<link rel="manifest" href="{{ asset('manifest.webmanifest') }}">
<meta name="theme-color" content="#2b2725">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Momenta">
<link rel="apple-touch-icon" href="{{ asset('images/icons/apple-touch-icon.png') }}">
<link rel="icon" type="image/png" sizes="192x192" href="{{ asset('images/icons/icon-192.png') }}">
<script>
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('{{ asset('sw.js') }}', { scope: '/' }).catch(() => {});
        });
    }
</script>
