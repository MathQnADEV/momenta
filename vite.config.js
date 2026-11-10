import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.js',
                'resources/css/photobooth.css',
                'resources/js/photobooth/state.js',
                'resources/js/photobooth/camera.js',
                'resources/js/photobooth/compose.js',
                'resources/js/photobooth/doodle.js',
                'resources/js/photobooth/stickers.js',
                'resources/js/photobooth/upload.js',
                'resources/js/photobooth/session.js',
                'resources/css/settings.css',
                'resources/js/settings/template-editor.js',
                'resources/js/settings/background-editor.js',
            ],
            refresh: true,
        }),
        tailwindcss(),
    ],
});
