<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Photo Retention (minutes)
    |--------------------------------------------------------------------------
    |
    | Foto hanya tersedia sementara untuk menjaga privasi pengguna kiosk.
    | Nilai default 10 berarti foto dan akses QR kedaluwarsa setelah 10 menit.
    |
    */
    'retention_minutes' => max(1, (int) env('PHOTOBOOTH_RETENTION_MINUTES', 10)),

    /*
    |--------------------------------------------------------------------------
    | Kiosk Idle Redirect
    |--------------------------------------------------------------------------
    |
    | Bila tidak ada interaksi selama lima menit, kiosk kembali ke halaman Momenta.
    |
    */
    'idle_timeout_seconds' => max(60, (int) env('PHOTOBOOTH_IDLE_TIMEOUT_SECONDS', 300)),
    'idle_redirect_url' => env('PHOTOBOOTH_IDLE_REDIRECT_URL', '/photobooth'),

    /*
    |--------------------------------------------------------------------------
    | Default Momenta Unit
    |--------------------------------------------------------------------------
    |
    | Identitas unit Momenta default untuk v1 (single unit).
    | Untuk multi-unit, gunakan mekanisme registrasi unit.
    |
    */
    'default_unit_id' => env('PSD_UNIT_ID', 'PSD-DEFAULT-01'),
    'default_unit_name' => env('PSD_UNIT_NAME', 'PSD Default Unit'),

    /*
    |--------------------------------------------------------------------------
    | Photo Upload
    |--------------------------------------------------------------------------
    */
    'max_upload_size' => 8192, // KB (8MB)
    'allowed_mimes' => ['image/png', 'image/jpeg'],
    'slug_length' => 8,

    /*
    |--------------------------------------------------------------------------
    | Layouts
    |--------------------------------------------------------------------------
    */
    'layouts' => [
        'single' => [
            'name' => '1 Foto Besar',
            'desc' => '1 foto portrait',
            'poses' => 1,
            'css_grid' => 'grid-template-columns: 1fr; grid-template-rows: 1fr;',
            'preview_style' => 'width: 60px; height: 90px; border: 4px solid #0f172a; border-bottom-width: 12px; background: #0f172a; gap: 0; padding: 0;',
        ],
        'split-2-h' => [
            'name' => '2 Foto Samping',
            'desc' => '2 foto horizontal',
            'poses' => 2,
            'css_grid' => 'grid-template-columns: repeat(2, 1fr); grid-template-rows: 1fr;',
            'preview_style' => 'width: 84px; height: 64px; border: 6px solid #0f172a; border-bottom-width: 14px; background: #0f172a; gap: 4px; padding: 0;',
        ],
        'split-2-v' => [
            'name' => '2 Foto Susun',
            'desc' => '2 foto vertikal',
            'poses' => 2,
            'css_grid' => 'grid-template-columns: 1fr; grid-template-rows: repeat(2, 1fr);',
            'preview_style' => 'width: 34px; height: 92px; border: 4px solid #0f172a; border-bottom-width: 12px; background: #0f172a; gap: 4px; padding: 0;',
        ],
        'strip-3' => [
            'name' => 'Strip 3 Pose',
            'desc' => '3 foto memanjang',
            'poses' => 3,
            'css_grid' => 'grid-template-columns: 1fr; grid-template-rows: repeat(3, 1fr);',
            'preview_style' => 'width: 32px; height: 92px; border: 4px solid #0f172a; border-bottom-width: 12px; background: #0f172a; gap: 4px; padding: 0;',
        ],
        'strip-3-h' => [
            'name' => '3 Foto Samping',
            'desc' => '3 foto horizontal',
            'poses' => 3,
            'css_grid' => 'grid-template-columns: repeat(3, 1fr); grid-template-rows: 1fr;',
            'preview_style' => 'width: 84px; height: 50px; border: 4px solid #0f172a; border-bottom-width: 10px; background: #0f172a; gap: 3px; padding: 0;',
        ],
        'strip-4' => [
            'name' => 'Strip 4 Pose',
            'desc' => '4 foto memanjang',
            'poses' => 4,
            'css_grid' => 'grid-template-columns: 1fr; grid-template-rows: repeat(4, 1fr);',
            'preview_style' => 'width: 30px; height: 92px; border: 4px solid #0f172a; border-bottom-width: 12px; background: #0f172a; gap: 3px; padding: 0;',
        ],
        'strip-4-h' => [
            'name' => '4 Foto Samping',
            'desc' => '4 foto horizontal',
            'poses' => 4,
            'css_grid' => 'grid-template-columns: repeat(4, 1fr); grid-template-rows: 1fr;',
            'preview_style' => 'width: 84px; height: 46px; border: 4px solid #0f172a; border-bottom-width: 8px; background: #0f172a; gap: 2px; padding: 0;',
        ],
        'grid-4' => [
            'name' => 'Grid 2x2',
            'desc' => '4 foto kotak',
            'poses' => 4,
            'css_grid' => 'grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr);',
            'preview_style' => 'width: 68px; height: 86px; border: 5px solid #0f172a; border-bottom-width: 14px; background: #0f172a; gap: 4px; padding: 0;',
        ],
        'grid-4-tight' => [
            'name' => 'Grid 2x2 Rapat',
            'desc' => '4 foto rapat',
            'poses' => 4,
            'css_grid' => 'grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr);',
            'preview_style' => 'width: 68px; height: 86px; border: 1.5px solid #cbd5e1; background: #cbd5e1; gap: 2px; padding: 0;',
        ],
        'grid-6' => [
            'name' => 'Grid 2x3',
            'desc' => '6 foto kotak',
            'poses' => 6,
            'css_grid' => 'grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(2, 1fr);',
            'preview_style' => 'width: 68px; height: 86px; border: 4px solid #0f172a; border-bottom-width: 10px; background: #0f172a; gap: 3px; padding: 0;',
        ],
        'grid-6-tight' => [
            'name' => 'Grid 2x3 Rapat',
            'desc' => '6 foto rapat',
            'poses' => 6,
            'css_grid' => 'grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(2, 1fr);',
            'preview_style' => 'width: 68px; height: 86px; border: 1.5px solid #cbd5e1; background: #cbd5e1; gap: 2px; padding: 0;',
        ],
        'grid-9' => [
            'name' => 'Grid 3x3',
            'desc' => '9 foto kotak',
            'poses' => 9,
            'css_grid' => 'grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr);',
            'preview_style' => 'width: 68px; height: 86px; border: 2px solid #64748b; background: #64748b; gap: 3px; padding: 0;',
        ],
        'grid-9-tight' => [
            'name' => 'Grid 3x3 Rapat',
            'desc' => '9 foto rapat',
            'poses' => 9,
            'css_grid' => 'grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr);',
            'preview_style' => 'width: 68px; height: 86px; border: 1px solid #cbd5e1; background: #cbd5e1; gap: 2px; padding: 0;',
        ],
        'frame-green-7' => [
            'name' => 'Template Hijau',
            'desc' => '7 foto template',
            'poses' => 7,
            'default_frame' => 'frame-green-7',
            'css_grid' => 'grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(4, 1fr);',
            'preview_style' => 'width: 76px; height: 96px; border: 4px solid #86c58e; border-bottom-width: 10px; background: #86c58e; gap: 3px; padding: 0;',
        ],
        'frame-memories-4' => [
            'name' => 'Template Memories',
            'desc' => '4 foto strip',
            'poses' => 4,
            'default_frame' => 'frame-memories-4',
            'css_grid' => 'grid-template-columns: 1fr; grid-template-rows: repeat(4, 1fr);',
            'preview_style' => 'width: 36px; height: 104px; border: 5px solid #f8fafc; border-bottom-width: 14px; background: #f8fafc; gap: 3px; padding: 0;',
        ],
        'frame-red-3' => [
            'name' => 'Template Merah',
            'desc' => '3 foto strip',
            'poses' => 3,
            'default_frame' => 'frame-red-3',
            'css_grid' => 'grid-template-columns: 1fr; grid-template-rows: repeat(3, 1fr);',
            'preview_style' => 'width: 36px; height: 104px; border: 5px solid #981b2b; border-bottom-width: 14px; background: #981b2b; gap: 4px; padding: 0;',
        ],
        'frame-red2-3' => [
            'name' => 'Template Merah V2',
            'desc' => '3 foto strip',
            'poses' => 3,
            'default_frame' => 'frame-red2-3',
            'css_grid' => 'grid-template-columns: 1fr; grid-template-rows: repeat(4, 1fr);',
            'preview_style' => 'width: 36px; height: 104px; border: 5px solid #f8fafc; border-bottom-width: 14px; background: #f8fafc; gap: 3px; padding: 0;',
        ],
        'frame-song-4' => [
            'name' => 'Template Song Spotify',
            'desc' => '4 foto strip',
            'poses' => 4,
            'default_frame' => 'frame-song-4',
            'css_grid' => 'grid-template-columns: 1fr; grid-template-rows: repeat(4, 1fr);',
            'preview_style' => 'width: 36px; height: 104px; border: 5px solid #f8fafc; border-bottom-width: 14px; background: #f8fafc; gap: 3px; padding: 0;',
        ],
    ],
    'capture_timers' => [3, 5, 10],


    /*
    |--------------------------------------------------------------------------
    | Frames
    |--------------------------------------------------------------------------
    |
    | Daftar bingkai yang tersedia. Key = frame_id, value = metadata.
    |
    */
    'frames' => [
        'frame-green-7' => [
            'name'      => 'Template Hijau',
            'overlay'   => 'frames/1.png',
            'thumbnail' => 'frames/1.png',
            'type'      => 'template',
            'layout'    => 'frame-green-7',
            'canvas'    => ['w' => 735, 'h' => 919],
            'photos'    => [
                ['x' => 167, 'y' => 143, 'w' => 179, 'h' => 140],
                ['x' => 389, 'y' => 143, 'w' => 179, 'h' => 139],
                ['x' => 167, 'y' => 294, 'w' => 179, 'h' => 139],
                ['x' => 389, 'y' => 294, 'w' => 178, 'h' => 141],
                ['x' => 167, 'y' => 445, 'w' => 179, 'h' => 291],
                ['x' => 389, 'y' => 445, 'w' => 179, 'h' => 140],
                ['x' => 389, 'y' => 595, 'w' => 179, 'h' => 141],
            ],
        ],
        'frame-memories-4' => [
            'name'      => 'Template Memories',
            'overlay'   => 'frames/2.png',
            'thumbnail' => 'frames/2.png',
            'type'      => 'template',
            'layout'    => 'frame-memories-4',
            'canvas'    => ['w' => 736, 'h' => 1308],
            'photos'    => [
                ['x' => 206, 'y' => 60, 'w' => 357, 'h' => 246],
                ['x' => 207, 'y' => 319, 'w' => 356, 'h' => 246],
                ['x' => 207, 'y' => 578, 'w' => 356, 'h' => 260],
                ['x' => 207, 'y' => 852, 'w' => 357, 'h' => 237],
            ],
        ],
        'frame-red-3' => [
            'name'      => 'Template Merah',
            'overlay'   => 'frames/3.png',
            'thumbnail' => 'frames/3.png',
            'type'      => 'template',
            'layout'    => 'frame-red-3',
            'canvas'    => ['w' => 450, 'h' => 1176],
            'photos'    => [
                ['x' => 32, 'y' => 23, 'w' => 386, 'h' => 300],
                ['x' => 32, 'y' => 350, 'w' => 386, 'h' => 300],
                ['x' => 32, 'y' => 679, 'w' => 386, 'h' => 301],
            ],
        ],
        'frame-red2-3' => [
            'name'      => 'Template Merah V2',
            'overlay'   => 'frames/4.png',
            'thumbnail' => 'frames/4.png',
            'type'      => 'template',
            'layout'    => 'frame-red2-3',
            'canvas'    => ['w' => 510, 'h' => 1093],
            'photos'    => [
                ['x' => 93, 'y' => 92, 'w' => 324, 'h' => 250],
                ['x' => 93, 'y' => 365, 'w' => 325, 'h' => 252],
                ['x' => 92, 'y' => 641, 'w' => 326, 'h' => 253],
            ],
        ],
        'frame-song-4' => [
            'name'      => 'Template Song',
            'overlay'   => 'frames/5.png',
            'thumbnail' => 'frames/5.png',
            'type'      => 'template',
            'layout'    => 'frame-song-4',
            'canvas'    => ['w' => 1200, 'h' => 3600],
            'photos'    => [
                ['x' => 49, 'y' => 115, 'w' => 1095, 'h' => 709],
                ['x' => 49, 'y' => 863, 'w' => 1095, 'h' => 709],
                ['x' => 49, 'y' => 1610, 'w' => 1095, 'h' => 709],
                ['x' => 49, 'y' => 2356, 'w' => 1095, 'h' => 709],
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Sticker / Emoji Presets
    |--------------------------------------------------------------------------
    */
    'sticker_colors' => [
        ['id' => 'none', 'name' => 'No Border', 'value' => 'transparent'],
        ['id' => 'rose', 'name' => 'Rose', 'value' => '#ff6b9a'],
        ['id' => 'pink', 'name' => 'Pink', 'value' => '#f9a8d4'],
        ['id' => 'lavender', 'name' => 'Lavender', 'value' => '#c4b5fd'],
        ['id' => 'violet', 'name' => 'Violet', 'value' => '#a78bfa'],
        ['id' => 'sky', 'name' => 'Sky', 'value' => '#93c5fd'],
        ['id' => 'blue', 'name' => 'Blue', 'value' => '#60a5fa'],
        ['id' => 'mint', 'name' => 'Mint', 'value' => '#86efac'],
        ['id' => 'emerald', 'name' => 'Emerald', 'value' => '#34d399'],
        ['id' => 'sun', 'name' => 'Sun', 'value' => '#fde68a'],
        ['id' => 'amber', 'name' => 'Amber', 'value' => '#fbbf24'],
        ['id' => 'peach', 'name' => 'Peach', 'value' => '#fdba74'],
        ['id' => 'coral', 'name' => 'Coral', 'value' => '#fb7185'],
        ['id' => 'cream', 'name' => 'Cream', 'value' => '#fff1d6'],
        ['id' => 'gray', 'name' => 'Gray', 'value' => '#cbd5e1'],
        ['id' => 'ink', 'name' => 'Ink', 'value' => '#0f172a'],
        ['id' => 'berry', 'name' => 'Berry', 'value' => '#be123c'],
    ],

    'sticker_categories' => [
        ['id' => 'all', 'name' => 'Semua'],
        ['id' => 'accessory', 'name' => 'Aksesori'],
        ['id' => 'cute', 'name' => 'Cute'],
        ['id' => 'party', 'name' => 'Party'],
        ['id' => 'love', 'name' => 'Love'],
        ['id' => 'expression', 'name' => 'Ekspresi'],
        ['id' => 'snack', 'name' => 'Snack'],
        ['id' => 'text', 'name' => 'Teks'],
    ],

    'sticker_emojis' => [
        ['id' => 'sunglasses', 'name' => 'Kacamata Hitam', 'emoji' => '🕶️', 'category' => 'accessory'],
        ['id' => 'glasses', 'name' => 'Kacamata', 'emoji' => '👓', 'category' => 'accessory'],
        ['id' => 'cool', 'name' => 'Cool', 'emoji' => '😎', 'category' => 'accessory'],
        ['id' => 'disguise', 'name' => 'Penyamaran', 'emoji' => '🥸', 'category' => 'accessory'],
        ['id' => 'crown', 'name' => 'Mahkota', 'emoji' => '👑', 'category' => 'accessory'],
        ['id' => 'cap', 'name' => 'Topi', 'emoji' => '🧢', 'category' => 'accessory'],
        ['id' => 'top-hat', 'name' => 'Top Hat', 'emoji' => '🎩', 'category' => 'accessory'],
        ['id' => 'cowboy', 'name' => 'Cowboy', 'emoji' => '🤠', 'category' => 'accessory'],
        ['id' => 'bow', 'name' => 'Pita', 'emoji' => '🎀', 'category' => 'accessory'],
        ['id' => 'lipstick', 'name' => 'Lipstik', 'emoji' => '💄', 'category' => 'accessory'],
        ['id' => 'nail-polish', 'name' => 'Nail Art', 'emoji' => '💅', 'category' => 'accessory'],
        ['id' => 'headphones', 'name' => 'Headphone', 'emoji' => '🎧', 'category' => 'accessory'],
        ['id' => 'microphone', 'name' => 'Mic', 'emoji' => '🎤', 'category' => 'accessory'],
        ['id' => 'camera', 'name' => 'Kamera', 'emoji' => '📸', 'category' => 'accessory'],
        ['id' => 'phone', 'name' => 'Ponsel', 'emoji' => '📱', 'category' => 'accessory'],
        ['id' => 'gem', 'name' => 'Berlian', 'emoji' => '💎', 'category' => 'accessory'],
        ['id' => 'sparkle', 'name' => 'Sparkle', 'emoji' => '✨', 'category' => 'cute'],
        ['id' => 'glowing-star', 'name' => 'Glow Star', 'emoji' => '🌟', 'category' => 'cute'],
        ['id' => 'star', 'name' => 'Bintang', 'emoji' => '⭐', 'category' => 'cute'],
        ['id' => 'magic-wand', 'name' => 'Magic Wand', 'emoji' => '🪄', 'category' => 'cute'],
        ['id' => 'rainbow', 'name' => 'Pelangi', 'emoji' => '🌈', 'category' => 'cute'],
        ['id' => 'cloud', 'name' => 'Awan', 'emoji' => '☁️', 'category' => 'cute'],
        ['id' => 'moon', 'name' => 'Bulan', 'emoji' => '🌙', 'category' => 'cute'],
        ['id' => 'sun', 'name' => 'Matahari', 'emoji' => '☀️', 'category' => 'cute'],
        ['id' => 'flower', 'name' => 'Sakura', 'emoji' => '🌸', 'category' => 'cute'],
        ['id' => 'hibiscus', 'name' => 'Bunga', 'emoji' => '🌺', 'category' => 'cute'],
        ['id' => 'sunflower', 'name' => 'Sunflower', 'emoji' => '🌻', 'category' => 'cute'],
        ['id' => 'butterfly', 'name' => 'Kupu-kupu', 'emoji' => '🦋', 'category' => 'cute'],
        ['id' => 'cherry', 'name' => 'Cherry', 'emoji' => '🍒', 'category' => 'cute'],
        ['id' => 'strawberry', 'name' => 'Strawberry', 'emoji' => '🍓', 'category' => 'cute'],
        ['id' => 'bunny', 'name' => 'Kelinci', 'emoji' => '🐰', 'category' => 'cute'],
        ['id' => 'cat', 'name' => 'Kucing', 'emoji' => '🐱', 'category' => 'cute'],
        ['id' => 'dog', 'name' => 'Anjing', 'emoji' => '🐶', 'category' => 'cute'],
        ['id' => 'bear', 'name' => 'Beruang', 'emoji' => '🐻', 'category' => 'cute'],
        ['id' => 'panda', 'name' => 'Panda', 'emoji' => '🐼', 'category' => 'cute'],
        ['id' => 'frog', 'name' => 'Katak', 'emoji' => '🐸', 'category' => 'cute'],
        ['id' => 'unicorn', 'name' => 'Unicorn', 'emoji' => '🦄', 'category' => 'cute'],
        ['id' => 'duck', 'name' => 'Bebek', 'emoji' => '🐥', 'category' => 'cute'],
        ['id' => 'angel', 'name' => 'Angel', 'emoji' => '😇', 'category' => 'cute'],
        ['id' => 'devil', 'name' => 'Devil', 'emoji' => '😈', 'category' => 'cute'],
        ['id' => 'party', 'name' => 'Party', 'emoji' => '🎉', 'category' => 'party'],
        ['id' => 'confetti', 'name' => 'Confetti', 'emoji' => '🎊', 'category' => 'party'],
        ['id' => 'balloon', 'name' => 'Balon', 'emoji' => '🎈', 'category' => 'party'],
        ['id' => 'disco', 'name' => 'Disco', 'emoji' => '🪩', 'category' => 'party'],
        ['id' => 'music', 'name' => 'Musik', 'emoji' => '🎵', 'category' => 'party'],
        ['id' => 'music-notes', 'name' => 'Music Notes', 'emoji' => '🎶', 'category' => 'party'],
        ['id' => 'fire', 'name' => 'Fire', 'emoji' => '🔥', 'category' => 'party'],
        ['id' => 'lightning', 'name' => 'Lightning', 'emoji' => '⚡', 'category' => 'party'],
        ['id' => 'boom', 'name' => 'Boom', 'emoji' => '💥', 'category' => 'party'],
        ['id' => 'gift', 'name' => 'Kado', 'emoji' => '🎁', 'category' => 'party'],
        ['id' => 'cake', 'name' => 'Kue', 'emoji' => '🎂', 'category' => 'party'],
        ['id' => 'cupcake', 'name' => 'Cupcake', 'emoji' => '🧁', 'category' => 'party'],
        ['id' => 'dance-girl', 'name' => 'Dance', 'emoji' => '💃', 'category' => 'party'],
        ['id' => 'dance-boy', 'name' => 'Groove', 'emoji' => '🕺', 'category' => 'party'],
        ['id' => 'clap', 'name' => 'Tepuk Tangan', 'emoji' => '👏', 'category' => 'party'],
        ['id' => 'peace', 'name' => 'Peace', 'emoji' => '✌️', 'category' => 'party'],
        ['id' => 'rock', 'name' => 'Rock', 'emoji' => '🤘', 'category' => 'party'],
        ['id' => 'celebrate', 'name' => 'Celebrate', 'emoji' => '🥳', 'category' => 'party'],
        ['id' => 'heart', 'name' => 'Heart', 'emoji' => '💖', 'category' => 'love'],
        ['id' => 'pink-heart', 'name' => 'Pink Heart', 'emoji' => '💗', 'category' => 'love'],
        ['id' => 'two-hearts', 'name' => 'Two Hearts', 'emoji' => '💕', 'category' => 'love'],
        ['id' => 'revolving-hearts', 'name' => 'Love Spin', 'emoji' => '💞', 'category' => 'love'],
        ['id' => 'heart-arrow', 'name' => 'Cupid', 'emoji' => '💘', 'category' => 'love'],
        ['id' => 'heart-gift', 'name' => 'Heart Gift', 'emoji' => '💝', 'category' => 'love'],
        ['id' => 'love-letter', 'name' => 'Love Letter', 'emoji' => '💌', 'category' => 'love'],
        ['id' => 'red-heart', 'name' => 'Red Heart', 'emoji' => '❤️', 'category' => 'love'],
        ['id' => 'broken-heart', 'name' => 'Broken Heart', 'emoji' => '💔', 'category' => 'love'],
        ['id' => 'kiss', 'name' => 'Kiss', 'emoji' => '💋', 'category' => 'love'],
        ['id' => 'rose', 'name' => 'Rose', 'emoji' => '🌹', 'category' => 'love'],
        ['id' => 'teddy', 'name' => 'Teddy', 'emoji' => '🧸', 'category' => 'love'],
        ['id' => 'hand-heart', 'name' => 'Hand Heart', 'emoji' => '🫶', 'category' => 'love'],
        ['id' => 'pink-bow-heart', 'name' => 'Sweet Love', 'emoji' => '💓', 'category' => 'love'],
        ['id' => 'smile', 'name' => 'Smile', 'emoji' => '😊', 'category' => 'expression'],
        ['id' => 'wink', 'name' => 'Wink', 'emoji' => '😉', 'category' => 'expression'],
        ['id' => 'laugh', 'name' => 'Laugh', 'emoji' => '😂', 'category' => 'expression'],
        ['id' => 'tongue', 'name' => 'Playful', 'emoji' => '😜', 'category' => 'expression'],
        ['id' => 'star-eyes', 'name' => 'Star Eyes', 'emoji' => '🤩', 'category' => 'expression'],
        ['id' => 'kiss-face', 'name' => 'Kiss Face', 'emoji' => '😘', 'category' => 'expression'],
        ['id' => 'shy', 'name' => 'Shy', 'emoji' => '☺️', 'category' => 'expression'],
        ['id' => 'wow', 'name' => 'Wow', 'emoji' => '😮', 'category' => 'expression'],
        ['id' => 'hush', 'name' => 'Shhh', 'emoji' => '🤫', 'category' => 'expression'],
        ['id' => 'salute', 'name' => 'Salute', 'emoji' => '🫡', 'category' => 'expression'],
        ['id' => 'eyes', 'name' => 'Eyes', 'emoji' => '👀', 'category' => 'expression'],
        ['id' => 'thumbs-up', 'name' => 'Mantap', 'emoji' => '👍', 'category' => 'expression'],
        ['id' => 'okay', 'name' => 'Okay', 'emoji' => '👌', 'category' => 'expression'],
        ['id' => 'hundred', 'name' => '100', 'emoji' => '💯', 'category' => 'expression'],
        ['id' => 'check', 'name' => 'Check', 'emoji' => '✅', 'category' => 'expression'],
        ['id' => 'cross', 'name' => 'Nope', 'emoji' => '❌', 'category' => 'expression'],
        ['id' => 'question', 'name' => 'Hah?', 'emoji' => '❓', 'category' => 'expression'],
        ['id' => 'exclamation', 'name' => 'Wow!', 'emoji' => '❗', 'category' => 'expression'],
        ['id' => 'speech', 'name' => 'Chat', 'emoji' => '💬', 'category' => 'expression'],
        ['id' => 'thought', 'name' => 'Thought', 'emoji' => '💭', 'category' => 'expression'],
        ['id' => 'boba', 'name' => 'Boba', 'emoji' => '🧋', 'category' => 'snack'],
        ['id' => 'coffee', 'name' => 'Coffee', 'emoji' => '☕', 'category' => 'snack'],
        ['id' => 'donut', 'name' => 'Donut', 'emoji' => '🍩', 'category' => 'snack'],
        ['id' => 'lollipop', 'name' => 'Lollipop', 'emoji' => '🍭', 'category' => 'snack'],
        ['id' => 'ice-cream', 'name' => 'Ice Cream', 'emoji' => '🍦', 'category' => 'snack'],
        ['id' => 'pizza', 'name' => 'Pizza', 'emoji' => '🍕', 'category' => 'snack'],
        ['id' => 'avocado', 'name' => 'Avocado', 'emoji' => '🥑', 'category' => 'snack'],
        ['id' => 'peach', 'name' => 'Peach', 'emoji' => '🍑', 'category' => 'snack'],
        ['id' => 'watermelon', 'name' => 'Watermelon', 'emoji' => '🍉', 'category' => 'snack'],
        ['id' => 'cookie', 'name' => 'Cookie', 'emoji' => '🍪', 'category' => 'snack'],
        ['id' => 'candy', 'name' => 'Candy', 'emoji' => '🍬', 'category' => 'snack'],
        ['id' => 'fries', 'name' => 'Fries', 'emoji' => '🍟', 'category' => 'snack'],
        ['id' => 'love-text', 'name' => 'LOVE', 'text' => 'LOVE', 'category' => 'text'],
        ['id' => 'xoxo', 'name' => 'XOXO', 'text' => 'XOXO', 'category' => 'text'],
        ['id' => 'selfie', 'name' => 'SELFIE', 'text' => 'SELFIE', 'category' => 'text'],
        ['id' => 'cute', 'name' => 'CUTIE', 'text' => 'CUTIE', 'category' => 'text'],
        ['id' => 'smile-text', 'name' => 'SMILE', 'text' => 'SMILE', 'category' => 'text'],
        ['id' => 'pose', 'name' => 'POSE', 'text' => 'POSE', 'category' => 'text'],
        ['id' => 'photo', 'name' => 'PHOTOBOOTH', 'text' => 'PHOTOBOOTH', 'category' => 'text'],
        ['id' => 'pretty', 'name' => 'PRETTY', 'text' => 'PRETTY', 'category' => 'text'],
        ['id' => 'bestie', 'name' => 'BESTIE', 'text' => 'BESTIE', 'category' => 'text'],
        ['id' => 'slay', 'name' => 'SLAY', 'text' => 'SLAY', 'category' => 'text'],
        ['id' => 'iconic', 'name' => 'ICONIC', 'text' => 'ICONIC', 'category' => 'text'],
        ['id' => 'bff', 'name' => 'BFF', 'text' => 'BFF', 'category' => 'text'],
        ['id' => 'squad', 'name' => 'SQUAD', 'text' => 'SQUAD', 'category' => 'text'],
        ['id' => 'cheese', 'name' => 'CHEESE!', 'text' => 'CHEESE!', 'category' => 'text'],
        ['id' => 'good-vibes', 'name' => 'GOOD VIBES', 'text' => 'GOOD VIBES', 'category' => 'text'],
        ['id' => 'omg', 'name' => 'OMG!', 'text' => 'OMG!', 'category' => 'text'],
        ['id' => 'lol', 'name' => 'LOL', 'text' => 'LOL', 'category' => 'text'],
        ['id' => 'main-character', 'name' => 'MAIN CHARACTER', 'text' => 'MAIN CHARACTER', 'category' => 'text'],
        ['id' => 'no-bad-days', 'name' => 'NO BAD DAYS', 'text' => 'NO BAD DAYS', 'category' => 'text'],
        ['id' => 'ten-ten', 'name' => '10/10', 'text' => '10/10', 'category' => 'text'],
        ['id' => 'so-cute', 'name' => 'SO CUTE', 'text' => 'SO CUTE', 'category' => 'text'],
        ['id' => 'this-is-us', 'name' => 'THIS IS US', 'text' => 'THIS IS US', 'category' => 'text'],
        ['id' => 'memories', 'name' => 'MEMORIES', 'text' => 'MEMORIES', 'category' => 'text'],
        ['id' => 'happy-day', 'name' => 'HAPPY DAY', 'text' => 'HAPPY DAY', 'category' => 'text'],
        ['id' => 'birthday', 'name' => 'BIRTHDAY', 'text' => 'BIRTHDAY', 'category' => 'text'],
        ['id' => 'graduation', 'name' => 'GRAD', 'text' => 'GRAD', 'category' => 'text'],
    ],

    'sticker_auto_themes' => [
        [
            'id'    => 'none',
            'name'  => 'No Sticker',
            'desc'  => 'Tanpa stiker, foto bersih',
            'items' => [],
        ],
        [
            'id' => 'beauty',
            'name' => 'Beauty',
            'desc' => 'Soft cute stickers seperti beauty app',
            'items' => [
                ['kind' => 'emoji', 'value' => '✨', 'x' => 0.10, 'y' => 0.08, 'size' => 0.10, 'rotation' => -18],
                ['kind' => 'emoji', 'value' => '💖', 'x' => 0.78, 'y' => 0.10, 'size' => 0.11, 'rotation' => 12],
                ['kind' => 'emoji', 'value' => '🌈', 'x' => 0.12, 'y' => 0.72, 'size' => 0.12, 'rotation' => -8],
                ['kind' => 'text', 'value' => 'CUTE', 'x' => 0.58, 'y' => 0.74, 'size' => 0.16, 'rotation' => 8],
                ['kind' => 'emoji', 'value' => '⭐', 'x' => 0.46, 'y' => 0.05, 'size' => 0.08, 'rotation' => 0],
            ],
        ],

        [
            'id' => 'party',
            'name' => 'Party',
            'desc' => 'Rame dan playful seperti photo booth party',
            'items' => [
                ['kind' => 'emoji', 'value' => '🎉', 'x' => 0.08, 'y' => 0.12, 'size' => 0.12, 'rotation' => -20],
                ['kind' => 'emoji', 'value' => '🎀', 'x' => 0.76, 'y' => 0.08, 'size' => 0.10, 'rotation' => 18],
                ['kind' => 'text', 'value' => 'PARTY', 'x' => 0.54, 'y' => 0.06, 'size' => 0.18, 'rotation' => -6],
                ['kind' => 'emoji', 'value' => '🎵', 'x' => 0.18, 'y' => 0.76, 'size' => 0.11, 'rotation' => 14],
                ['kind' => 'emoji', 'value' => '⭐', 'x' => 0.72, 'y' => 0.72, 'size' => 0.09, 'rotation' => -10],
            ],
        ],
        [
            'id' => 'love',
            'name' => 'Love',
            'desc' => 'Tema romantis dan manis',
            'items' => [
                ['kind' => 'emoji', 'value' => '💖', 'x' => 0.08, 'y' => 0.12, 'size' => 0.12, 'rotation' => -12],
                ['kind' => 'emoji', 'value' => '💞', 'x' => 0.82, 'y' => 0.16, 'size' => 0.10, 'rotation' => 10],
                ['kind' => 'text', 'value' => 'LOVE', 'x' => 0.46, 'y' => 0.10, 'size' => 0.18, 'rotation' => 0],
                ['kind' => 'emoji', 'value' => '🌸', 'x' => 0.12, 'y' => 0.72, 'size' => 0.10, 'rotation' => -8],
                ['kind' => 'emoji', 'value' => '🎀', 'x' => 0.70, 'y' => 0.72, 'size' => 0.11, 'rotation' => 12],
            ],
        ],
        [
            'id' => 'sweet',
            'name' => 'Sweet',
            'desc' => 'Lembut, pastel, dan girly',
            'items' => [
                ['kind' => 'emoji', 'value' => '🦋', 'x' => 0.08, 'y' => 0.10, 'size' => 0.11, 'rotation' => -20],
                ['kind' => 'emoji', 'value' => '🌸', 'x' => 0.80, 'y' => 0.12, 'size' => 0.10, 'rotation' => 16],
                ['kind' => 'text', 'value' => 'CUTIE', 'x' => 0.46, 'y' => 0.08, 'size' => 0.16, 'rotation' => -3],
                ['kind' => 'emoji', 'value' => '✨', 'x' => 0.14, 'y' => 0.74, 'size' => 0.09, 'rotation' => 8],
                ['kind' => 'emoji', 'value' => '💗', 'x' => 0.76, 'y' => 0.72, 'size' => 0.11, 'rotation' => -14],
            ],
        ],
        [
            'id' => 'butterfly-bloom',
            'name' => 'Butterfly Bloom',
            'desc' => 'Kupu-kupu dan bunga di pinggir frame',
            'items' => [
                ['kind' => 'emoji', 'value' => '🦋', 'x' => 0.08, 'y' => 0.10, 'size' => 0.11, 'rotation' => -28],
                ['kind' => 'emoji', 'value' => '🌸', 'x' => 0.92, 'y' => 0.13, 'size' => 0.09, 'rotation' => 18],
                ['kind' => 'emoji', 'value' => '🌺', 'x' => 0.08, 'y' => 0.86, 'size' => 0.13, 'rotation' => -16],
                ['kind' => 'emoji', 'value' => '🦋', 'x' => 0.88, 'y' => 0.70, 'size' => 0.10, 'rotation' => 24],
                ['kind' => 'emoji', 'value' => '🌸', 'x' => 0.15, 'y' => 0.48, 'size' => 0.08, 'rotation' => 8],
                ['kind' => 'emoji', 'value' => '🌼', 'x' => 0.86, 'y' => 0.92, 'size' => 0.11, 'rotation' => 12],
            ],
        ],
        [
            'id' => 'pink-stars',
            'name' => 'Pink Stars',
            'desc' => 'Bintang pink ala cute booth',
            'items' => [
                ['kind' => 'emoji', 'value' => '⭐', 'x' => 0.12, 'y' => 0.12, 'size' => 0.09, 'rotation' => -14],
                ['kind' => 'emoji', 'value' => '💗', 'x' => 0.88, 'y' => 0.18, 'size' => 0.11, 'rotation' => 12],
                ['kind' => 'emoji', 'value' => '✨', 'x' => 0.16, 'y' => 0.58, 'size' => 0.08, 'rotation' => 0],
                ['kind' => 'emoji', 'value' => '⭐', 'x' => 0.82, 'y' => 0.72, 'size' => 0.10, 'rotation' => 20],
                ['kind' => 'text', 'value' => 'CUTE', 'x' => 0.50, 'y' => 0.94, 'size' => 0.13, 'rotation' => 0],
            ],
        ],
        [
            'id' => 'ribbon-kiss',
            'name' => 'Ribbon Kiss',
            'desc' => 'Pita, kiss, dan hati glossy',
            'items' => [
                ['kind' => 'emoji', 'value' => '🎀', 'x' => 0.12, 'y' => 0.12, 'size' => 0.12, 'rotation' => -12],
                ['kind' => 'emoji', 'value' => '💋', 'x' => 0.88, 'y' => 0.20, 'size' => 0.12, 'rotation' => 16],
                ['kind' => 'emoji', 'value' => '💖', 'x' => 0.12, 'y' => 0.78, 'size' => 0.11, 'rotation' => 18],
                ['kind' => 'emoji', 'value' => '🎀', 'x' => 0.80, 'y' => 0.86, 'size' => 0.10, 'rotation' => 12],
                ['kind' => 'text', 'value' => 'XOXO', 'x' => 0.54, 'y' => 0.08, 'size' => 0.13, 'rotation' => -3],
            ],
        ],
        [
            'id' => 'blue-butterfly',
            'name' => 'Blue Butterfly',
            'desc' => 'Kupu-kupu biru dan sparkle',
            'items' => [
                ['kind' => 'emoji', 'value' => '🦋', 'x' => 0.10, 'y' => 0.18, 'size' => 0.12, 'rotation' => -24],
                ['kind' => 'emoji', 'value' => '🦋', 'x' => 0.88, 'y' => 0.28, 'size' => 0.09, 'rotation' => 22],
                ['kind' => 'emoji', 'value' => '✨', 'x' => 0.12, 'y' => 0.62, 'size' => 0.08, 'rotation' => 0],
                ['kind' => 'emoji', 'value' => '💙', 'x' => 0.84, 'y' => 0.78, 'size' => 0.12, 'rotation' => -10],
                ['kind' => 'emoji', 'value' => '🦋', 'x' => 0.22, 'y' => 0.90, 'size' => 0.09, 'rotation' => 18],
            ],
        ],
        [
            'id' => 'flower-corner',
            'name' => 'Flower Corner',
            'desc' => 'Bunga besar di sudut frame',
            'items' => [
                ['kind' => 'emoji', 'value' => '🌺', 'x' => 0.08, 'y' => 0.08, 'size' => 0.14, 'rotation' => -18],
                ['kind' => 'emoji', 'value' => '🌼', 'x' => 0.90, 'y' => 0.10, 'size' => 0.12, 'rotation' => 18],
                ['kind' => 'emoji', 'value' => '🌸', 'x' => 0.08, 'y' => 0.92, 'size' => 0.12, 'rotation' => -8],
                ['kind' => 'emoji', 'value' => '🌺', 'x' => 0.90, 'y' => 0.88, 'size' => 0.15, 'rotation' => 16],
                ['kind' => 'emoji', 'value' => '✨', 'x' => 0.18, 'y' => 0.48, 'size' => 0.08, 'rotation' => 0],
            ],
        ],
        [
            'id' => 'retro-pop',
            'name' => 'Retro Pop',
            'desc' => 'Bintang, musik, dan warna party',
            'items' => [
                ['kind' => 'emoji', 'value' => '🎵', 'x' => 0.12, 'y' => 0.16, 'size' => 0.10, 'rotation' => -16],
                ['kind' => 'emoji', 'value' => '🌈', 'x' => 0.86, 'y' => 0.18, 'size' => 0.12, 'rotation' => 10],
                ['kind' => 'emoji', 'value' => '⭐', 'x' => 0.14, 'y' => 0.74, 'size' => 0.11, 'rotation' => 20],
                ['kind' => 'emoji', 'value' => '🎉', 'x' => 0.84, 'y' => 0.78, 'size' => 0.12, 'rotation' => -14],
                ['kind' => 'text', 'value' => 'POP', 'x' => 0.50, 'y' => 0.08, 'size' => 0.14, 'rotation' => -5],
            ],
        ],
        [
            'id' => 'soft-minimal',
            'name' => 'Soft Minimal',
            'desc' => 'Sedikit aksen, tetap clean',
            'items' => [
                ['kind' => 'emoji', 'value' => '✨', 'x' => 0.12, 'y' => 0.12, 'size' => 0.08, 'rotation' => 0],
                ['kind' => 'emoji', 'value' => '♡', 'x' => 0.88, 'y' => 0.16, 'size' => 0.09, 'rotation' => 12],
                ['kind' => 'emoji', 'value' => '✦', 'x' => 0.14, 'y' => 0.84, 'size' => 0.08, 'rotation' => -8],
                ['kind' => 'text', 'value' => 'PHOTO', 'x' => 0.54, 'y' => 0.93, 'size' => 0.11, 'rotation' => 0],
            ],
        ],
        [
            'id' => 'paris-dream',
            'name' => 'Paris Dream',
            'desc' => 'Menara, bow, dan sparkle soft',
            'items' => [
                ['kind' => 'emoji', 'value' => '🗼', 'x' => 0.12, 'y' => 0.12, 'size' => 0.12, 'rotation' => -8],
                ['kind' => 'emoji', 'value' => '🎀', 'x' => 0.86, 'y' => 0.14, 'size' => 0.11, 'rotation' => 14],
                ['kind' => 'emoji', 'value' => '✨', 'x' => 0.16, 'y' => 0.58, 'size' => 0.08, 'rotation' => 0],
                ['kind' => 'emoji', 'value' => '🌸', 'x' => 0.84, 'y' => 0.78, 'size' => 0.10, 'rotation' => -12],
                ['kind' => 'text', 'value' => 'BONJOUR', 'x' => 0.50, 'y' => 0.93, 'size' => 0.10, 'rotation' => 0],
            ],
        ],
        [
            'id' => 'goldfish-cute',
            'name' => 'Goldfish',
            'desc' => 'Ikan kecil dan gelembung lucu',
            'items' => [
                ['kind' => 'emoji', 'value' => '🐠', 'x' => 0.12, 'y' => 0.20, 'size' => 0.11, 'rotation' => -8],
                ['kind' => 'emoji', 'value' => '🫧', 'x' => 0.86, 'y' => 0.18, 'size' => 0.09, 'rotation' => 0],
                ['kind' => 'emoji', 'value' => '🐟', 'x' => 0.82, 'y' => 0.76, 'size' => 0.11, 'rotation' => 12],
                ['kind' => 'emoji', 'value' => '🫧', 'x' => 0.16, 'y' => 0.84, 'size' => 0.09, 'rotation' => 0],
                ['kind' => 'emoji', 'value' => '✨', 'x' => 0.50, 'y' => 0.08, 'size' => 0.07, 'rotation' => 0],
            ],
        ],
        [
            'id' => 'heart-doodle',
            'name' => 'Heart Doodle',
            'desc' => 'Coretan hati pink seperti sticker pack',
            'items' => [
                ['kind' => 'emoji', 'value' => '♡', 'x' => 0.14, 'y' => 0.14, 'size' => 0.10, 'rotation' => -14, 'color' => '#fb7185'],
                ['kind' => 'emoji', 'value' => '♥', 'x' => 0.86, 'y' => 0.18, 'size' => 0.10, 'rotation' => 10, 'color' => '#f472b6'],
                ['kind' => 'emoji', 'value' => '♡', 'x' => 0.12, 'y' => 0.78, 'size' => 0.12, 'rotation' => 18, 'color' => '#fb7185'],
                ['kind' => 'emoji', 'value' => '♥', 'x' => 0.82, 'y' => 0.84, 'size' => 0.09, 'rotation' => -12, 'color' => '#f9a8d4'],
                ['kind' => 'text', 'value' => 'LOVE', 'x' => 0.52, 'y' => 0.08, 'size' => 0.12, 'rotation' => -3, 'color' => '#be185d'],
            ],
        ],
        [
            'id' => 'black-sparkles',
            'name' => 'Black Sparkles',
            'desc' => 'Doodle hitam minimal di sudut',
            'items' => [
                ['kind' => 'emoji', 'value' => '✦', 'x' => 0.12, 'y' => 0.12, 'size' => 0.10, 'rotation' => -12, 'color' => '#111827'],
                ['kind' => 'emoji', 'value' => '✧', 'x' => 0.88, 'y' => 0.16, 'size' => 0.09, 'rotation' => 18, 'color' => '#111827'],
                ['kind' => 'emoji', 'value' => '✦', 'x' => 0.14, 'y' => 0.78, 'size' => 0.09, 'rotation' => 14, 'color' => '#111827'],
                ['kind' => 'emoji', 'value' => '✧', 'x' => 0.84, 'y' => 0.86, 'size' => 0.10, 'rotation' => -10, 'color' => '#111827'],
            ],
        ],
        [
            'id' => 'blue-star-tile',
            'name' => 'Blue Stars',
            'desc' => 'Bintang biru pastel tersebar',
            'items' => [
                ['kind' => 'emoji', 'value' => '★', 'x' => 0.10, 'y' => 0.12, 'size' => 0.10, 'rotation' => -10, 'color' => '#60a5fa'],
                ['kind' => 'emoji', 'value' => '☆', 'x' => 0.88, 'y' => 0.22, 'size' => 0.12, 'rotation' => 12, 'color' => '#93c5fd'],
                ['kind' => 'emoji', 'value' => '★', 'x' => 0.16, 'y' => 0.70, 'size' => 0.11, 'rotation' => 18, 'color' => '#38bdf8'],
                ['kind' => 'emoji', 'value' => '☆', 'x' => 0.84, 'y' => 0.84, 'size' => 0.10, 'rotation' => -16, 'color' => '#60a5fa'],
                ['kind' => 'emoji', 'value' => '🦋', 'x' => 0.52, 'y' => 0.92, 'size' => 0.09, 'rotation' => 0],
            ],
        ],
        [
            'id' => 'pink-star-pop',
            'name' => 'Pink Star',
            'desc' => 'Star pink besar seperti sticker glossy',
            'items' => [
                ['kind' => 'emoji', 'value' => '★', 'x' => 0.14, 'y' => 0.16, 'size' => 0.13, 'rotation' => -12, 'color' => '#f472b6'],
                ['kind' => 'emoji', 'value' => '☆', 'x' => 0.84, 'y' => 0.14, 'size' => 0.10, 'rotation' => 16, 'color' => '#fb7185'],
                ['kind' => 'emoji', 'value' => '★', 'x' => 0.82, 'y' => 0.78, 'size' => 0.12, 'rotation' => 12, 'color' => '#f9a8d4'],
                ['kind' => 'emoji', 'value' => '♡', 'x' => 0.14, 'y' => 0.84, 'size' => 0.10, 'rotation' => -10, 'color' => '#fb7185'],
            ],
        ],
        [
            'id' => 'plaid-heart',
            'name' => 'Plaid Heart',
            'desc' => 'Hati, pita, dan warna warm',
            'items' => [
                ['kind' => 'emoji', 'value' => '🤎', 'x' => 0.12, 'y' => 0.15, 'size' => 0.11, 'rotation' => -10],
                ['kind' => 'emoji', 'value' => '🎀', 'x' => 0.86, 'y' => 0.18, 'size' => 0.11, 'rotation' => 15],
                ['kind' => 'emoji', 'value' => '♡', 'x' => 0.14, 'y' => 0.82, 'size' => 0.12, 'rotation' => 8, 'color' => '#92400e'],
                ['kind' => 'emoji', 'value' => '🤍', 'x' => 0.84, 'y' => 0.82, 'size' => 0.10, 'rotation' => -12],
                ['kind' => 'text', 'value' => 'SWEET', 'x' => 0.52, 'y' => 0.08, 'size' => 0.11, 'rotation' => 0, 'color' => '#92400e'],
            ],
        ],
        [
            'id' => 'clover-luck',
            'name' => 'Lucky Clover',
            'desc' => 'Clover dan sparkle hijau',
            'items' => [
                ['kind' => 'emoji', 'value' => '🍀', 'x' => 0.12, 'y' => 0.14, 'size' => 0.12, 'rotation' => -12],
                ['kind' => 'emoji', 'value' => '✨', 'x' => 0.86, 'y' => 0.18, 'size' => 0.08, 'rotation' => 0],
                ['kind' => 'emoji', 'value' => '🍀', 'x' => 0.16, 'y' => 0.78, 'size' => 0.10, 'rotation' => 16],
                ['kind' => 'emoji', 'value' => '💚', 'x' => 0.82, 'y' => 0.84, 'size' => 0.11, 'rotation' => -8],
                ['kind' => 'text', 'value' => 'LUCKY', 'x' => 0.52, 'y' => 0.93, 'size' => 0.11, 'rotation' => 0, 'color' => '#047857'],
            ],
        ],
        [
            'id' => 'leopard-cute',
            'name' => 'Leopard Cute',
            'desc' => 'Animal print dan hati bold',
            'items' => [
                ['kind' => 'emoji', 'value' => '🐆', 'x' => 0.12, 'y' => 0.14, 'size' => 0.12, 'rotation' => -14],
                ['kind' => 'emoji', 'value' => '🖤', 'x' => 0.86, 'y' => 0.18, 'size' => 0.11, 'rotation' => 8],
                ['kind' => 'emoji', 'value' => '🤎', 'x' => 0.16, 'y' => 0.78, 'size' => 0.11, 'rotation' => 12],
                ['kind' => 'text', 'value' => 'WILD', 'x' => 0.80, 'y' => 0.86, 'size' => 0.11, 'rotation' => -8, 'color' => '#1f2937'],
            ],
        ],
        [
            'id' => 'pixel-love',
            'name' => 'Pixel Love',
            'desc' => 'Hati pixel dan game cute',
            'items' => [
                ['kind' => 'emoji', 'value' => '❤️', 'x' => 0.12, 'y' => 0.16, 'size' => 0.11, 'rotation' => -8],
                ['kind' => 'emoji', 'value' => '💟', 'x' => 0.86, 'y' => 0.18, 'size' => 0.10, 'rotation' => 12],
                ['kind' => 'emoji', 'value' => '♡', 'x' => 0.14, 'y' => 0.82, 'size' => 0.11, 'rotation' => 14, 'color' => '#ef4444'],
                ['kind' => 'emoji', 'value' => '❤️', 'x' => 0.84, 'y' => 0.82, 'size' => 0.10, 'rotation' => -12],
                ['kind' => 'text', 'value' => '8BIT', 'x' => 0.52, 'y' => 0.08, 'size' => 0.10, 'rotation' => 0, 'color' => '#dc2626'],
            ],
        ],
        [
            'id' => 'kitty-face',
            'name' => 'Kitty Face',
            'desc' => 'Cat doodle dan hati kecil',
            'items' => [
                ['kind' => 'emoji', 'value' => '🐱', 'x' => 0.12, 'y' => 0.14, 'size' => 0.12, 'rotation' => -8],
                ['kind' => 'emoji', 'value' => '♡', 'x' => 0.86, 'y' => 0.16, 'size' => 0.10, 'rotation' => 12, 'color' => '#111827'],
                ['kind' => 'emoji', 'value' => '✧', 'x' => 0.14, 'y' => 0.78, 'size' => 0.09, 'rotation' => -14, 'color' => '#111827'],
                ['kind' => 'emoji', 'value' => '🐾', 'x' => 0.84, 'y' => 0.84, 'size' => 0.10, 'rotation' => 10],
            ],
        ],
        [
            'id' => 'blue-heart-clean',
            'name' => 'Blue Heart',
            'desc' => 'Satu hati biru dan aksen clean',
            'items' => [
                ['kind' => 'emoji', 'value' => '💙', 'x' => 0.86, 'y' => 0.16, 'size' => 0.14, 'rotation' => 12],
                ['kind' => 'emoji', 'value' => '✦', 'x' => 0.12, 'y' => 0.16, 'size' => 0.08, 'rotation' => 0, 'color' => '#38bdf8'],
                ['kind' => 'emoji', 'value' => '🫧', 'x' => 0.16, 'y' => 0.84, 'size' => 0.09, 'rotation' => 0],
                ['kind' => 'text', 'value' => 'BLUE', 'x' => 0.52, 'y' => 0.93, 'size' => 0.10, 'rotation' => 0, 'color' => '#2563eb'],
            ],
        ],
        [
            'id'    => 'bunny-bow',
            'name'  => 'Bunny Bow',
            'desc'  => 'Bunny, pita biru, dan hati putih',
            'items' => [
                ['kind' => 'emoji', 'value' => '🐰', 'x' => 0.12, 'y' => 0.15, 'size' => 0.12, 'rotation' => -8],
                ['kind' => 'emoji', 'value' => '🎀', 'x' => 0.86, 'y' => 0.18, 'size' => 0.10, 'rotation' => 14],
                ['kind' => 'emoji', 'value' => '🤍', 'x' => 0.14, 'y' => 0.80, 'size' => 0.11, 'rotation' => 8],
                ['kind' => 'emoji', 'value' => '🩵', 'x' => 0.82, 'y' => 0.84, 'size' => 0.10, 'rotation' => -12],
            ],
        ],

        // ── Tema Teknik / Engineering ──────────────────────────────────────
        [
            'id'    => 'engineering',
            'name'  => 'Engineering',
            'desc'  => 'Gear, tools, dan aksen teknik mesin',
            'items' => [
                ['kind' => 'emoji', 'value' => '⚙️', 'x' => 0.10, 'y' => 0.10, 'size' => 0.13, 'rotation' => -20],
                ['kind' => 'emoji', 'value' => '🔧', 'x' => 0.88, 'y' => 0.14, 'size' => 0.11, 'rotation' => 25],
                ['kind' => 'emoji', 'value' => '🔩', 'x' => 0.12, 'y' => 0.80, 'size' => 0.10, 'rotation' => -10],
                ['kind' => 'emoji', 'value' => '⚙️', 'x' => 0.84, 'y' => 0.78, 'size' => 0.12, 'rotation' => 15],
                ['kind' => 'text',  'value' => 'ENGINEER', 'x' => 0.50, 'y' => 0.93, 'size' => 0.10, 'rotation' => 0],
            ],
        ],
        [
            'id'    => 'developer',
            'name'  => 'Developer',
            'desc'  => 'Code, terminal, dan aksen programmer',
            'items' => [
                ['kind' => 'emoji', 'value' => '💻', 'x' => 0.10, 'y' => 0.12, 'size' => 0.13, 'rotation' => -10],
                ['kind' => 'emoji', 'value' => '🖥️', 'x' => 0.86, 'y' => 0.14, 'size' => 0.12, 'rotation' => 8],
                ['kind' => 'emoji', 'value' => '⌨️', 'x' => 0.12, 'y' => 0.82, 'size' => 0.11, 'rotation' => -6],
                ['kind' => 'emoji', 'value' => '🖱️', 'x' => 0.84, 'y' => 0.80, 'size' => 0.10, 'rotation' => 14],
                ['kind' => 'text',  'value' => '<CODE/>', 'x' => 0.50, 'y' => 0.07, 'size' => 0.11, 'rotation' => 0],
            ],
        ],
        [
            'id'    => 'science-lab',
            'name'  => 'Science Lab',
            'desc'  => 'Atom, labu, dan aksen sains kimia',
            'items' => [
                ['kind' => 'emoji', 'value' => '⚗️', 'x' => 0.10, 'y' => 0.12, 'size' => 0.12, 'rotation' => -14],
                ['kind' => 'emoji', 'value' => '🔬', 'x' => 0.86, 'y' => 0.16, 'size' => 0.11, 'rotation' => 12],
                ['kind' => 'emoji', 'value' => '⚛️', 'x' => 0.14, 'y' => 0.78, 'size' => 0.13, 'rotation' => 0],
                ['kind' => 'emoji', 'value' => '🧪', 'x' => 0.82, 'y' => 0.80, 'size' => 0.11, 'rotation' => -16],
                ['kind' => 'text',  'value' => 'SCIENCE', 'x' => 0.50, 'y' => 0.93, 'size' => 0.10, 'rotation' => 0],
            ],
        ],
        [
            'id'    => 'space-tech',
            'name'  => 'Space Tech',
            'desc'  => 'Roket, planet, dan eksplorasi luar angkasa',
            'items' => [
                ['kind' => 'emoji', 'value' => '🚀', 'x' => 0.12, 'y' => 0.14, 'size' => 0.13, 'rotation' => -30],
                ['kind' => 'emoji', 'value' => '🌌', 'x' => 0.86, 'y' => 0.12, 'size' => 0.12, 'rotation' => 10],
                ['kind' => 'emoji', 'value' => '🛸', 'x' => 0.14, 'y' => 0.80, 'size' => 0.12, 'rotation' => 12],
                ['kind' => 'emoji', 'value' => '⭐', 'x' => 0.84, 'y' => 0.82, 'size' => 0.10, 'rotation' => -8],
                ['kind' => 'text',  'value' => 'EXPLORE', 'x' => 0.50, 'y' => 0.07, 'size' => 0.10, 'rotation' => 0],
            ],
        ],
    ],

    'sticker_layouts' => [
        'compact' => [
            'name' => 'Compact',
            'cols' => 6,
        ],
        'spread' => [
            'name' => 'Spread',
            'cols' => 8,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Cetak Fisik (Canon SELPHY CP1500)
    |--------------------------------------------------------------------------
    |
    | Semua paket dicetak pada satu lembar kertas 4R (100 x 148 mm) beresolusi
    | 300 DPI. Ukuran kartu dan sisipan gantungan kunci dalam milimeter.
    |
    */
    'print' => [
        'dpi' => 300,
        'paper' => ['name' => '4R', 'width_mm' => 100, 'height_mm' => 148],
        'photocard' => ['width_mm' => 54, 'height_mm' => 86],
        'keychain' => ['width_mm' => 28, 'height_mm' => 40],
        'packages' => [
            'A' => [
                'name' => 'Hanya Kartu Foto',
                'price' => 10000,
                'items' => ['photocard', 'photocard'],
                'features' => ['2 lembar photocard mini', '2 pose berbeda atau 1 pose rangkap', 'Termasuk soft file QR'],
            ],
            'B' => [
                'name' => 'Paket Bundel Hemat',
                'price' => 20000,
                'items' => ['photocard', 'keychain'],
                'features' => ['1 lembar photocard momen', '1 gantungan kunci akrilik 2 sisi', 'Termasuk soft file QR'],
            ],
            'C' => [
                'name' => 'Hanya Gantungan Kunci Akrilik',
                'price' => 15000,
                'items' => ['keychain'],
                'features' => ['1 gantungan kunci akrilik 2 sisi', 'Termasuk soft file QR'],
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Pembayaran
    |--------------------------------------------------------------------------
    |
    | Driver "simulation" menampilkan tombol konfirmasi bayar untuk operator.
    | Nantinya driver ini diganti dengan integrasi DOKU tanpa mengubah alur kiosk.
    |
    */
    'payment' => [
        'driver' => env('PHOTOBOOTH_PAYMENT_DRIVER', 'simulation'),
        'currency' => 'IDR',
    ],

    /*
    |--------------------------------------------------------------------------
    | Rate Limiting
    |--------------------------------------------------------------------------
    */
    'upload_rate_limit' => 10, // requests per minute per IP
];
