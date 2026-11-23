<!DOCTYPE html>
<html lang="id" translate="no">
<head>
    <meta charset="utf-8">
    <meta name="google" content="notranslate">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Photo Booth') — Momenta</title>
    @include('partials.pwa')
    <meta name="description" content="@yield('meta_description', 'Photo Booth interaktif — ambil foto kenangan di Momenta')">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link href="{{ config('photobooth.text_fonts_url') }}" rel="stylesheet">

    <script>
        (() => {
            const root = document.documentElement;

            // Layar kiosk asli (9:16) tampil apa adanya. Layar portrait yang lebih lebar memakai
            // kanvas 1080 × 1920 yang diperkecil. Layar landscape (tablet/laptop) memakai kanvas
            // landscape setinggi 1080 dengan lebar mengikuti rasio layar (3:2 sampai 16:9).
            const fitKioskStage = () => {
                const { innerWidth: width, innerHeight: height } = window;
                const isLandscape = width > height;
                const isStage = width / height > 9 / 16;
                root.classList.toggle('kiosk-stage', isStage);
                root.classList.toggle('kiosk-landscape', isLandscape);

                if (!isStage) {
                    ['--kiosk-width', '--kiosk-height', '--kiosk-scale', '--vh', '--vw'].forEach((name) => root.style.removeProperty(name));
                    return;
                }

                const density = height > width && width >= 2000 ? 2 : 1;
                const stageWidth = isLandscape
                    ? Math.round(Math.min(1920, Math.max(1440, (1080 * width) / height)))
                    : 1080 * density;
                const stageHeight = isLandscape ? 1080 : 1920 * density;

                root.style.setProperty('--kiosk-width', `${stageWidth}px`);
                root.style.setProperty('--kiosk-height', `${stageHeight}px`);
                root.style.setProperty('--kiosk-scale', Math.min(1, width / stageWidth, height / stageHeight));
                root.style.setProperty('--vw', `${stageWidth / 100}px`);
                root.style.setProperty('--vh', `${stageHeight / 100}px`);
            };

            fitKioskStage();
            window.addEventListener('resize', fitKioskStage);
        })();
    </script>

    @vite(['resources/css/photobooth.css'])
    @stack('styles')
</head>
<body class="photobooth-body">
    <div id="app" class="app-container">
        @yield('content')
    </div>

    <script>
        (() => {
            const idleTimeoutMs = @json((int) config('photobooth.idle_timeout_seconds', 300) * 1000);
            const idleRedirectUrl = @json(config('photobooth.idle_redirect_url', '/photobooth'));
            let idleTimer = null;

            const restartIdleTimer = () => {
                window.clearTimeout(idleTimer);
                idleTimer = window.setTimeout(() => {
                    window.location.assign(idleRedirectUrl);
                }, idleTimeoutMs);
            };

            ['pointerdown', 'touchstart', 'keydown', 'wheel'].forEach((eventName) => {
                window.addEventListener(eventName, restartIdleTimer, { passive: true });
            });

            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) restartIdleTimer();
            });

            restartIdleTimer();
        })();
    </script>

    @stack('scripts')
</body>
</html>
