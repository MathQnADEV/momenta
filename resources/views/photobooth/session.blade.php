@extends('layouts.photobooth')

@section('title', 'Sesi Foto — Photo Booth')

@section('content')
<div class="session-container">

    <nav class="session-top-nav" aria-label="Navigasi Momenta">
        @include('photobooth.partials.psd-home-link')
    </nav>

    {{-- ── Progress Bar ────────────────────────────────────────────────────── --}}
    <div class="progress-bar">
        <div class="progress-steps">
            <div class="step active" data-step="layout">
                <span class="step-num">1</span>
                <span class="step-label">Layout</span>
            </div>
            <div class="step-line"></div>
            <div class="step" data-step="capture">
                <span class="step-num">2</span>
                <span class="step-label">Foto</span>
            </div>
            <div class="step-line"></div>
            <div class="step" data-step="style">
                <span class="step-num">3</span>
                <span class="step-label">Gaya</span>
            </div>
            <div class="step-line"></div>
            <div class="step" data-step="stickers">
                <span class="step-num">4</span>
                <span class="step-label">Hias</span>
            </div>
            <div class="step-line"></div>
            <div class="step" data-step="preview">
                <span class="step-num">5</span>
                <span class="step-label">Preview</span>
            </div>
        </div>
    </div>

    {{-- ── STEP 1: Layout ──────────────────────────────────────────────────── --}}
    <section class="session-step active" id="step-layout">
        <h2 class="step-title">Pilih Layout</h2>
        <p class="step-desc">Tentukan susunan dan jumlah foto</p>

        <div class="layout-category-switch" role="tablist" aria-label="Jenis layout">
            <button class="layout-category-button selected"
                    type="button"
                    role="tab"
                    aria-selected="true"
                    data-layout-category="basic">
                Basic
            </button>
            <button class="layout-category-button"
                    type="button"
                    role="tab"
                    aria-selected="false"
                    data-layout-category="template">
                Template
            </button>
        </div>

        <div class="layout-grid" id="layout-grid">
            @foreach ($layouts as $layoutId => $layout)
            @php $layoutCategory = isset($layout['default_frame']) ? 'template' : 'basic'; @endphp
            <button class="layout-card"
                    type="button"
                    data-layout-id="{{ $layoutId }}"
                    data-layout-category-card="{{ $layoutCategory }}"
                    data-is-template="{{ $layoutCategory === 'template' ? 'true' : 'false' }}"
                    data-default-frame="{{ $layout['default_frame'] ?? 'none' }}"
                    @if($layoutCategory === 'template') hidden @endif
                    id="layout-{{ $layoutId }}">
                <div class="layout-icon-box">
                    @if(isset($layout['default_frame'], $frames[$layout['default_frame']]))
                    @php $layoutFrame = $frames[$layout['default_frame']]; @endphp
                    <div class="layout-template-preview">
                        <img src="{{ asset($layoutFrame['thumbnail']) }}"
                             alt="{{ $layoutFrame['name'] }}"
                             class="layout-template-img">
                    </div>
                    @else
                    <div class="layout-icon" style="display:grid; {{ $layout['preview_style'] ?? '' }} {{ $layout['css_grid'] }}">
                        @for($i = 0; $i < $layout['poses']; $i++)
                            <div class="layout-icon-item"></div>
                        @endfor
                    </div>
                    @endif
                </div>
                <div class="layout-info">
                    <span class="layout-name">{{ $layout['name'] }}</span>
                    <span class="layout-desc">{{ $layout['desc'] }}</span>
                </div>
            </button>
            @endforeach
        </div>

        <div class="step-actions">
            <a href="{{ route('photobooth.index') }}" class="btn-back">Kembali ke Menu</a>
        </div>
    </section>

    {{-- ── STEP 2: Capture ─────────────────────────────────────────────────── --}}
    <section class="session-step" id="step-capture">
        <h2 class="step-title">Ambil Foto</h2>
        <p class="step-desc" id="capture-desc">Ambil semua foto, lalu tekan “Ulang” pada foto yang ingin diganti.</p>

        <div class="timer-palette" id="timer-palette">
            <span class="palette-title" style="margin-bottom: 0;">Timer Capture</span>
            <div class="timer-grid">
                @foreach($captureTimers as $index => $timer)
                <button class="timer-chip {{ $index === 0 ? 'selected' : '' }}"
                        data-capture-seconds="{{ $timer }}"
                        type="button">
                    <span class="timer-chip-value">{{ $timer }}s</span>
                </button>
                @endforeach
            </div>
        </div>
        <div class="step-actions capture-main-actions">
            <button class="btn-primary btn-glow" id="btn-start-capture" disabled>
                Mulai Foto
            </button>
        </div>
        <div class="capture-area">
            <div class="camera-viewport">
                <video id="camera-video" autoplay playsinline muted></video>
                <div class="countdown-overlay" id="countdown-overlay">
                    <span class="countdown-number" id="countdown-number">3</span>
                </div>
                <div class="flash-overlay" id="flash-overlay"></div>
                <div class="camera-error" id="camera-error" style="display:none;">
                    <p>📷 Kamera tidak tersedia</p>
                    <p class="error-sub">Pastikan kamera diizinkan oleh browser</p>
                    <button class="btn-retry-camera" id="btn-retry-camera">Coba Lagi</button>
                </div>
            </div>

            {{-- Pose indicators - rendered dynamically by JS based on layout --}}
            <div class="pose-indicators" id="pose-indicators">
                {{-- JS will populate this --}}
            </div>

        </div>

        <div class="capture-retake-actions">
            <button class="btn-secondary" id="btn-retake-all" type="button" hidden>
                Ulang Semua Foto
            </button>
        </div>

        <div class="step-actions">
            <button class="btn-back" id="btn-back-layout">Ganti Layout</button>
        </div>
    </section>

    {{-- ── STEP 3: Background Style ─────────────────────────────────────────── --}}
    <section class="session-step" id="step-style">
        <h2 class="step-title">Pilih Bingkai & Gaya</h2>
        <p class="step-desc">Atur warna bingkai, latar, dan nuansa foto sesuai selera</p>

        <div class="style-workspace">
            {{-- Live mini-preview --}}
            <div class="style-preview-box">
                <canvas id="style-preview-canvas"></canvas>
            </div>

            {{-- Swatch palette --}}
            <div class="style-palette">
                <p class="palette-title">Warna Latar</p>
                <div class="swatch-grid">
                    @php
                    $bgStyles = [
                        // ── Solid Neutrals ────────────────────────────────────────────────────
                        ['label'=>'Putih Bersih',   'preview'=>'#ffffff',                   'data'=>['type'=>'solid','color'=>'#ffffff','borderColor'=>'rgba(200,200,200,0.8)','textColor'=>'#475569','rounded'=>false]],
                        ['label'=>'Krem Lembut',    'preview'=>'#fdf6ec',                   'data'=>['type'=>'solid','color'=>'#fdf6ec','borderColor'=>'rgba(215,190,140,0.7)','textColor'=>'#7c5c3a','rounded'=>false]],
                        ['label'=>'Hitam Elegan',   'preview'=>'#0f0f0f',                   'data'=>['type'=>'solid','color'=>'#0f0f0f','borderColor'=>'rgba(255,255,255,0.2)','textColor'=>'#f1f5f9','rounded'=>false]],
                        ['label'=>'Abu-abu',         'preview'=>'#f1f5f9',                   'data'=>['type'=>'solid','color'=>'#f1f5f9','borderColor'=>'rgba(148,163,184,0.7)','textColor'=>'#334155','rounded'=>false]],
                        ['label'=>'Pink Muda',       'preview'=>'#fff0f5',                   'data'=>['type'=>'solid','color'=>'#fff0f5','borderColor'=>'rgba(255,180,200,0.7)','textColor'=>'#be185d','rounded'=>false]],
                        ['label'=>'Ungu Pastel',     'preview'=>'#f5f0ff',                   'data'=>['type'=>'solid','color'=>'#f5f0ff','borderColor'=>'rgba(167,139,250,0.7)','textColor'=>'#6d28d9','rounded'=>false]],
                        ['label'=>'Biru Muda',       'preview'=>'#eff6ff',                   'data'=>['type'=>'solid','color'=>'#eff6ff','borderColor'=>'rgba(147,197,253,0.7)','textColor'=>'#1d4ed8','rounded'=>false]],
                        ['label'=>'Hijau Mint',      'preview'=>'#f0fdf4',                   'data'=>['type'=>'solid','color'=>'#f0fdf4','borderColor'=>'rgba(134,239,172,0.7)','textColor'=>'#15803d','rounded'=>false]],
                        ['label'=>'Peach',           'preview'=>'#fff1e8',                   'data'=>['type'=>'solid','color'=>'#fff1e8','borderColor'=>'rgba(251,146,60,0.45)','textColor'=>'#9a3412','rounded'=>false]],
                        ['label'=>'Cherry',          'preview'=>'#fff1f2',                   'data'=>['type'=>'solid','color'=>'#fff1f2','borderColor'=>'rgba(244,63,94,0.45)','textColor'=>'#9f1239','rounded'=>false]],
                        ['label'=>'Cream Soda',      'preview'=>'#fffbeb',                   'data'=>['type'=>'solid','color'=>'#fffbeb','borderColor'=>'rgba(250,204,21,0.4)','textColor'=>'#92400e','rounded'=>false]],
                        ['label'=>'Foto Bulat',      'preview'=>'#ffffff',                   'data'=>['type'=>'solid','color'=>'#ffffff','borderColor'=>'rgba(200,200,200,0.8)','textColor'=>'#475569','rounded'=>true]],

                        // ── Gradient ──────────────────────────────────────────────────────────
                        ['label'=>'Gradien Sunset',  'preview'=>'linear-gradient(135deg,#ff9a9e,#fad0c4)', 'data'=>['type'=>'gradient','from'=>'#ff9a9e','to'=>'#fad0c4','horizontal'=>false,'borderColor'=>'rgba(255,255,255,0.8)','textColor'=>'#7f1d1d','rounded'=>false]],
                        ['label'=>'Gradien Ocean',   'preview'=>'linear-gradient(135deg,#a8edea,#fed6e3)', 'data'=>['type'=>'gradient','from'=>'#a8edea','to'=>'#fed6e3','horizontal'=>false,'borderColor'=>'rgba(255,255,255,0.8)','textColor'=>'#155e75','rounded'=>false]],
                        ['label'=>'Gradien Ungu',    'preview'=>'linear-gradient(135deg,#c3cfe2,#f5f7fa)', 'data'=>['type'=>'gradient','from'=>'#c3cfe2','to'=>'#f5f7fa','horizontal'=>false,'borderColor'=>'rgba(255,255,255,0.9)','textColor'=>'#374151','rounded'=>false]],
                        ['label'=>'Gradien Hijau',   'preview'=>'linear-gradient(135deg,#d4fc79,#96e6a1)', 'data'=>['type'=>'gradient','from'=>'#d4fc79','to'=>'#96e6a1','horizontal'=>false,'borderColor'=>'rgba(255,255,255,0.8)','textColor'=>'#14532d','rounded'=>false]],
                        ['label'=>'Gradien Pink',    'preview'=>'linear-gradient(135deg,#ffdde1,#ee9ca7)', 'data'=>['type'=>'gradient','from'=>'#ffdde1','to'=>'#ee9ca7','horizontal'=>false,'borderColor'=>'rgba(255,255,255,0.8)','textColor'=>'#9d174d','rounded'=>false]],
                        ['label'=>'Gradien Sky',     'preview'=>'linear-gradient(135deg,#e0c3fc,#8ec5fc)', 'data'=>['type'=>'gradient','from'=>'#e0c3fc','to'=>'#8ec5fc','horizontal'=>false,'borderColor'=>'rgba(255,255,255,0.8)','textColor'=>'#1e3a8a','rounded'=>false]],
                        ['label'=>'Gradien Senja',   'preview'=>'linear-gradient(135deg,#f6d365,#fda085)', 'data'=>['type'=>'gradient','from'=>'#f6d365','to'=>'#fda085','horizontal'=>false,'borderColor'=>'rgba(255,255,255,0.8)','textColor'=>'#7c2d12','rounded'=>false]],
                        ['label'=>'Gradien Aurora',  'preview'=>'linear-gradient(135deg,#a18cd1,#fbc2eb)', 'data'=>['type'=>'gradient','from'=>'#a18cd1','to'=>'#fbc2eb','horizontal'=>false,'borderColor'=>'rgba(255,255,255,0.8)','textColor'=>'#4c1d95','rounded'=>false]],
                        ['label'=>'Gradien Forest',  'preview'=>'linear-gradient(135deg,#134e5e,#71b280)', 'data'=>['type'=>'gradient','from'=>'#134e5e','to'=>'#71b280','horizontal'=>false,'borderColor'=>'rgba(255,255,255,0.7)','textColor'=>'#f0fdf4','rounded'=>false]],
                        ['label'=>'Gradien Coklat',  'preview'=>'linear-gradient(135deg,#c9a96e,#f5e6c8)', 'data'=>['type'=>'gradient','from'=>'#c9a96e','to'=>'#f5e6c8','horizontal'=>false,'borderColor'=>'rgba(255,255,255,0.8)','textColor'=>'#78350f','rounded'=>false]],
                        ['label'=>'Gradien Malam',   'preview'=>'linear-gradient(135deg,#1a1a2e,#16213e)', 'data'=>['type'=>'gradient','from'=>'#1a1a2e','to'=>'#16213e','horizontal'=>false,'borderColor'=>'rgba(255,255,255,0.25)','textColor'=>'#e2e8f0','rounded'=>false]],

                        // ── Pola Cantik (Tanpa Stiker) ────────────────────────────────────────
                        ['label'=>'Honeycomb',       'preview'=>'#fffbf0',                   'data'=>['type'=>'pattern','pattern'=>'honeycomb','base'=>'#fffbf0','color'=>'#f59e0b','borderColor'=>'rgba(255,255,255,0.9)','textColor'=>'#78350f','rounded'=>false]],
                        ['label'=>'Herringbone',     'preview'=>'#f0f9ff',                   'data'=>['type'=>'pattern','pattern'=>'herringbone','base'=>'#f0f9ff','color'=>'#0ea5e9','borderColor'=>'rgba(255,255,255,0.9)','textColor'=>'#0369a1','rounded'=>false]],
                        ['label'=>'Chevron Abu',     'preview'=>'#f8fafc',                   'data'=>['type'=>'pattern','pattern'=>'chevron','base'=>'#f8fafc','color'=>'#94a3b8','borderColor'=>'rgba(255,255,255,0.9)','textColor'=>'#334155','rounded'=>false]],
                        ['label'=>'Chevron Teal',    'preview'=>'#f0fdfa',                   'data'=>['type'=>'pattern','pattern'=>'chevron','base'=>'#f0fdfa','color'=>'#0d9488','borderColor'=>'rgba(255,255,255,0.9)','textColor'=>'#134e4a','rounded'=>false]],
                        ['label'=>'Gelombang Biru',  'preview'=>'#eff6ff',                   'data'=>['type'=>'pattern','pattern'=>'wave','base'=>'#eff6ff','color'=>'#3b82f6','borderColor'=>'rgba(255,255,255,0.9)','textColor'=>'#1d4ed8','rounded'=>false]],
                        ['label'=>'Gelombang Ungu',  'preview'=>'#faf5ff',                   'data'=>['type'=>'pattern','pattern'=>'wave','base'=>'#faf5ff','color'=>'#8b5cf6','borderColor'=>'rgba(255,255,255,0.9)','textColor'=>'#5b21b6','rounded'=>false]],
                        ['label'=>'Confetti Krem',   'preview'=>'#fdf6ec',                   'data'=>['type'=>'pattern','pattern'=>'confetti','base'=>'#fdf6ec','color'=>'#f59e0b','borderColor'=>'rgba(255,255,255,0.9)','textColor'=>'#78350f','rounded'=>false]],
                        ['label'=>'Confetti Pink',   'preview'=>'#fff0f6',                   'data'=>['type'=>'pattern','pattern'=>'confetti','base'=>'#fff0f6','color'=>'#ec4899','borderColor'=>'rgba(255,255,255,0.9)','textColor'=>'#9d174d','rounded'=>false]],
                        ['label'=>'Bokeh Peach',     'preview'=>'#fff8f3',                   'data'=>['type'=>'pattern','pattern'=>'bokeh','base'=>'#fff8f3','color'=>'#fb923c','borderColor'=>'rgba(255,255,255,0.9)','textColor'=>'#7c2d12','rounded'=>false]],
                        ['label'=>'Bokeh Ungu',      'preview'=>'#f5f0ff',                   'data'=>['type'=>'pattern','pattern'=>'bokeh','base'=>'#f5f0ff','color'=>'#a855f7','borderColor'=>'rgba(255,255,255,0.9)','textColor'=>'#5b21b6','rounded'=>false]],
                        ['label'=>'Crosshatch',      'preview'=>'#f8f8f8',                   'data'=>['type'=>'pattern','pattern'=>'crosshatch','base'=>'#f8f8f8','color'=>'#6b7280','borderColor'=>'rgba(255,255,255,0.9)','textColor'=>'#374151','rounded'=>false]],
                        ['label'=>'Bintang Emas',    'preview'=>'#fffdf0',                   'data'=>['type'=>'pattern','pattern'=>'stars','base'=>'#fffdf0','color'=>'#d97706','borderColor'=>'rgba(255,255,255,0.9)','textColor'=>'#78350f','rounded'=>false]],
                        ['label'=>'Bintang Biru',    'preview'=>'#f0f4ff',                   'data'=>['type'=>'pattern','pattern'=>'stars','base'=>'#f0f4ff','color'=>'#4f46e5','borderColor'=>'rgba(255,255,255,0.9)','textColor'=>'#3730a3','rounded'=>false]],
                        ['label'=>'Plaid Navy',      'preview'=>'#f0f4ff',                   'data'=>['type'=>'pattern','pattern'=>'plaid','base'=>'#f0f4ff','color'=>'#1e40af','borderColor'=>'rgba(255,255,255,0.9)','textColor'=>'#1e3a8a','rounded'=>false]],
                        ['label'=>'Plaid Forest',    'preview'=>'#f0fdf4',                   'data'=>['type'=>'pattern','pattern'=>'plaid','base'=>'#f0fdf4','color'=>'#15803d','borderColor'=>'rgba(255,255,255,0.9)','textColor'=>'#14532d','rounded'=>false]],
                        ['label'=>'Titik-titik',     'preview'=>'#fff9f0',                   'data'=>['type'=>'pattern','pattern'=>'dots','base'=>'#fff9f0','color'=>'#f59e0b','borderColor'=>'rgba(255,255,255,0.9)','textColor'=>'#78350f','rounded'=>false]],
                        ['label'=>'Grid',            'preview'=>'#f0f9ff',                   'data'=>['type'=>'pattern','pattern'=>'grid','base'=>'#f0f9ff','color'=>'#0ea5e9','borderColor'=>'rgba(255,255,255,0.9)','textColor'=>'#0369a1','rounded'=>false]],
                        ['label'=>'Diagonal',        'preview'=>'#fdf4ff',                   'data'=>['type'=>'pattern','pattern'=>'diagonal','base'=>'#fdf4ff','color'=>'#d946ef','borderColor'=>'rgba(255,255,255,0.9)','textColor'=>'#86198f','rounded'=>false]],
                    ];
                    @endphp

                    @foreach($bgStyles as $idx => $style)
                    <button class="bg-swatch {{ $idx === 0 ? 'selected' : '' }}"
                            data-bg='@json($style['data'])'
                            title="{{ $style['label'] }}">
                        <span class="swatch-dot" style="background: {{ $style['preview'] }}"></span>
                        <span class="swatch-label">{{ $style['label'] }}</span>
                    </button>
                    @endforeach
                </div>

                <p class="palette-title" style="margin-top: 18px; margin-bottom: 8px;">Warna Bingkai</p>
                <div class="color-grid" id="frame-color-grid">
                    @foreach($stickerColors as $idx => $color)
                    <button class="color-swatch {{ $idx === 0 ? 'selected' : '' }}"
                            data-frame-color="{{ $color['value'] }}"
                            title="{{ $color['name'] }}">
                        @if($color['value'] === 'transparent')
                            <span class="color-swatch-dot color-swatch-dot--none"></span>
                        @else
                            <span class="color-swatch-dot" style="background: {{ $color['value'] }}"></span>
                        @endif
                        <span class="swatch-label">{{ $color['name'] }}</span>
                    </button>
                    @endforeach
                </div>
            </div>
        </div>

        <div class="step-actions">
            <button class="btn-primary btn-glow" id="btn-finish-style">
                Lanjut ke Hias Foto
            </button>
            <button class="btn-secondary btn-retake-photos" type="button">Jepret Ulang</button>
        </div>
    </section>

    {{-- ── STEP 4: Hias Foto ──────────────────────────────────────────────── --}}
    <section class="session-step" id="step-stickers">
        <h2 class="step-title">Hias Foto</h2>
        <p class="step-desc">Pilih foto, lalu atur background, filter, stiker, atau coretan.</p>
        <div class="template-manual-notice" id="template-manual-notice" hidden>
            Mode Auto tidak tersedia untuk layout Template. Gunakan mode Manual, Background, Filter, atau Coret-coret.
        </div>

        <div class="decorate-mode-toggle decorate-mode-toggle--four" id="decorate-mode-toggle">
            <button class="decorate-mode-button selected" type="button" data-decorate-mode="background">Background</button>
            <button class="decorate-mode-button" type="button" data-decorate-mode="filter">Filter</button>
            <button class="decorate-mode-button" type="button" data-decorate-mode="stickers">Stiker</button>
            <button class="decorate-mode-button" type="button" data-decorate-mode="draw">Coret-coret</button>
        </div>

        <div class="sticker-workspace">
            <div class="canvas-wrapper" id="canvas-wrapper">
                <canvas id="composite-canvas"></canvas>
                <div class="sticker-layer" id="sticker-layer"></div>
                <canvas id="drawing-canvas" aria-label="Kanvas coret-coret"></canvas>
            </div>

            <div class="photo-edit-selector" id="photo-edit-selector">
                <div class="palette-head">
                    <h3 class="palette-title">Pilih Foto yang Diedit</h3>
                    <span class="palette-subtitle" id="selected-photo-edit-label">Foto 1 dipilih</span>
                </div>
                <div class="photo-edit-target-grid" id="photo-edit-target-grid"></div>
            </div>

            <div class="decorate-panels">
                <div class="photo-background-palette decorate-panel" id="decorate-background-panel">
                    <div class="background-source-tabs" role="tablist" aria-label="Jenis background">
                        <button class="background-source-tab selected" type="button" role="tab" data-background-source-tab="none">
                            Tanpa Background
                        </button>
                        <button class="background-source-tab" type="button" role="tab" data-background-source-tab="photo">
                            Foto
                        </button>
                        <button class="background-source-tab" type="button" role="tab" data-background-source-tab="color">
                            Color
                        </button>
                    </div>

                    <div class="background-source-pane" data-background-source-pane="none">
                        <button class="background-none-card selected" id="btn-clear-photo-background" type="button">
                            <span class="background-none-icon" aria-hidden="true">⊘</span>
                            <strong>Gunakan foto asli</strong>
                        </button>
                    </div>

                    <div class="background-source-pane" data-background-source-pane="photo" hidden>
                        <p class="background-choice-label">Pilih gambar background yang diinginkan</p>
                        <div class="photo-background-grid" id="photo-background-grid">
                            @forelse ($photoBackgrounds as $background)
                                <button class="photo-background-card" type="button"
                                        data-photo-background-url="{{ $background['url'] }}"
                                        data-photo-background-name="{{ $background['name'] }}"
                                        aria-label="{{ $background['name'] }}"
                                        title="{{ $background['name'] }}">
                                    <img src="{{ $background['url'] }}" alt="">
                                </button>
                            @empty
                                <div class="photo-background-empty">Belum ada pilihan gambar background.</div>
                            @endforelse
                        </div>
                    </div>

                    <div class="background-source-pane" data-background-source-pane="color" hidden>
                        <p class="background-choice-label">Pilih warna background yang diinginkan</p>
                        <div class="photo-background-color-grid">
                            @foreach ([
                                ['name' => 'Putih', 'value' => '#ffffff'],
                                ['name' => 'Merah', 'value' => '#ef4444'],
                                ['name' => 'Biru', 'value' => '#3b82f6'],
                                ['name' => 'Hijau muda', 'value' => '#86efac'],
                            ] as $backgroundColor)
                                <button class="photo-background-color-card" type="button"
                                        data-photo-background-color="{{ $backgroundColor['value'] }}"
                                        aria-label="{{ $backgroundColor['name'] }}"
                                        title="{{ $backgroundColor['name'] }}"
                                        style="--background-color: {{ $backgroundColor['value'] }};"></button>
                            @endforeach

                            <label class="photo-background-color-card photo-background-color-card--picker"
                                   for="photo-background-color"
                                   aria-label="Pilih warna lain"
                                   title="Pilih warna lain">
                                <input type="color" id="photo-background-color" value="#ffffff">
                                <span class="color-wheel-icon" aria-hidden="true"></span>
                                <span class="selected-color-preview" id="photo-background-color-preview" style="--picked-color:#ffffff;"></span>
                            </label>
                        </div>
                    </div>

                    <div class="background-processing-status" id="background-processing-status" role="status" aria-live="polite" hidden>
                        Menghapus background foto...
                    </div>
                </div>

                <div class="photo-filter-palette decorate-panel" id="decorate-filter-panel" style="display:none;">
                    <div class="palette-head">
                        <h3 class="palette-title">Filter Foto</h3>
                        <span class="palette-subtitle">Setiap foto dapat memakai filter berbeda.</span>
                    </div>
                    <div class="photo-filter-grid">
                        @foreach ([
                            ['id' => 'none', 'name' => 'Normal', 'css' => 'none'],
                            ['id' => 'bw', 'name' => 'Black & White', 'css' => 'grayscale(1) contrast(1.06)'],
                            ['id' => 'warm', 'name' => 'Warm', 'css' => 'sepia(.18) saturate(1.22) hue-rotate(-8deg) brightness(1.04)'],
                            ['id' => 'cold', 'name' => 'Cold', 'css' => 'saturate(.92) hue-rotate(12deg) contrast(1.04)'],
                            ['id' => 'vintage', 'name' => 'Vintage', 'css' => 'sepia(.42) contrast(.94) saturate(.82) brightness(1.04)'],
                            ['id' => 'vivid', 'name' => 'Vivid', 'css' => 'saturate(1.45) contrast(1.08)'],
                            ['id' => 'soft', 'name' => 'Soft', 'css' => 'brightness(1.08) contrast(.88) saturate(.92)'],
                            ['id' => 'sepia', 'name' => 'Sepia', 'css' => 'sepia(.78) contrast(1.02)'],
                        ] as $filter)
                            <button class="photo-filter-card {{ $filter['id'] === 'none' ? 'selected' : '' }}"
                                    type="button"
                                    data-photo-filter="{{ $filter['id'] }}"
                                    data-photo-filter-css="{{ $filter['css'] }}">
                                <span class="photo-filter-preview" style="filter: {{ $filter['css'] }};"></span>
                                <strong>{{ $filter['name'] }}</strong>
                            </button>
                        @endforeach
                    </div>
                </div>

                <div class="sticker-palette decorate-panel" id="decorate-sticker-panel" style="display:none;">
                    <div class="sticker-mode-toggle" id="sticker-mode-toggle">
                        <button class="mode-chip selected" type="button" data-sticker-mode="auto">Auto</button>
                        <button class="mode-chip" type="button" data-sticker-mode="manual">Manual</button>
                    </div>

                    <div class="sticker-mode-panel sticker-mode-panel--auto" id="sticker-auto-panel">
                        <div class="palette-head">
                            <h3 class="palette-title">Auto Theme</h3>
                            <span class="palette-subtitle">Stiker otomatis dijaga di tepi foto agar tidak menutup wajah.</span>
                        </div>
                        <div class="sticker-theme-grid" id="sticker-theme-grid">
                            @foreach ($stickerAutoThemes as $theme)
                            <button class="sticker-theme-card {{ $loop->first ? 'selected' : '' }}"
                                    type="button"
                                    data-auto-theme="{{ $theme['id'] }}">
                                <span class="sticker-theme-preview" aria-hidden="true">
                                    @forelse (array_slice($theme['items'], 0, 5) as $item)
                                        <span class="sticker-theme-preview-item {{ ($item['kind'] ?? 'emoji') === 'text' ? 'sticker-theme-preview-item--text' : '' }}"
                                              style="{{ isset($item['color']) ? '--sticker-color: '.$item['color'].';' : '' }}">
                                            {{ $item['value'] }}
                                        </span>
                                    @empty
                                        <span class="sticker-theme-preview-empty">∅</span>
                                    @endforelse
                                </span>
                                <span class="sticker-theme-name">{{ $theme['name'] }}</span>
                                <span class="sticker-theme-desc">{{ $theme['desc'] }}</span>
                            </button>
                            @endforeach
                        </div>
                    </div>

                    <div class="sticker-mode-panel sticker-mode-panel--manual" id="sticker-manual-panel" style="display:none;">
                        <div class="palette-head">
                            <h3 class="palette-title">Pilih Stiker</h3>
                            <span class="palette-subtitle">Sentuh stiker, lalu geser, putar, dan ubah ukurannya di foto.</span>
                        </div>
                        <div class="manual-sticker-categories" id="manual-sticker-categories" aria-label="Kategori stiker">
                            @foreach ($stickerCategories as $category)
                            <button class="sticker-category-chip {{ $loop->first ? 'selected' : '' }}"
                                    type="button"
                                    data-sticker-category-filter="{{ $category['id'] }}">
                                {{ $category['name'] }}
                            </button>
                            @endforeach
                        </div>
                        <div class="sticker-grid sticker-grid--emoji" id="sticker-grid">
                            @foreach ($stickerEmojis as $emoji)
                            @php $stickerKind = isset($emoji['text']) ? 'text' : 'emoji'; @endphp
                            <button class="sticker-item"
                                    type="button"
                                    data-sticker-id="{{ $emoji['id'] }}"
                                    data-sticker-kind="{{ $stickerKind }}"
                                    data-sticker-category="{{ $emoji['category'] ?? 'cute' }}"
                                    data-sticker-value="{{ $emoji['text'] ?? $emoji['emoji'] }}"
                                    title="{{ $emoji['name'] }}">
                                <span class="sticker-emoji {{ $stickerKind === 'text' ? 'sticker-emoji--text' : '' }}">{{ $emoji['text'] ?? $emoji['emoji'] }}</span>
                                <span class="sticker-name">{{ $emoji['name'] }}</span>
                            </button>
                            @endforeach
                        </div>
                    </div>
                </div>

                <div class="drawing-palette decorate-panel" id="decorate-draw-panel" style="display:none;">
                    <div class="palette-head">
                        <h3 class="palette-title">Coret-coret</h3>
                        <span class="palette-subtitle">Gambar dengan jari. Gunakan penghapus untuk memperbaiki.</span>
                    </div>

                    <div class="draw-color-grid" aria-label="Pilihan warna kuas">
                        @foreach (['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff', '#111827'] as $drawColor)
                        <button class="draw-color-button {{ $loop->first ? 'selected' : '' }}"
                                type="button"
                                data-draw-color="{{ $drawColor }}"
                                aria-label="Pilih warna {{ $drawColor }}">
                            <span style="background: {{ $drawColor }}"></span>
                        </button>
                        @endforeach
                    </div>

                    <label class="draw-size-control" for="draw-brush-size">
                        <span>Ukuran kuas</span>
                        <strong id="draw-brush-size-value">12px</strong>
                        <input id="draw-brush-size" type="range" min="4" max="36" value="12" step="1">
                    </label>

                    <div class="draw-tool-grid">
                        <button class="draw-tool-button" type="button" id="btn-draw-eraser">Penghapus</button>
                        <button class="draw-tool-button" type="button" id="btn-draw-undo">Urungkan</button>
                        <button class="draw-tool-button draw-tool-button--danger" type="button" id="btn-draw-clear">Hapus Coretan</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="step-actions">
            <button class="btn-primary btn-glow" id="btn-finish-stickers">Lanjut ke Preview</button>
            <button class="btn-secondary btn-retake-photos" type="button">Jepret Ulang</button>
            <button class="btn-secondary-sm" id="btn-clear-stickers" style="display:none;">Hapus Semua Stiker</button>
            <button class="btn-back" id="btn-back-style">Ganti Gaya</button>
        </div>
    </section>

    {{-- ── STEP 5: Preview ─────────────────────────────────────────────────── --}}
    <section class="session-step" id="step-preview">
        <h2 class="step-title">Preview Hasil</h2>
        <p class="step-desc">Pastikan hasilnya sesuai sebelum disimpan</p>

        <div class="preview-area">
            <div class="preview-frame">
                <canvas id="final-canvas"></canvas>
            </div>
        </div>

        <div class="step-actions">
            <button class="btn-primary btn-glow" id="btn-save-photo">
                Simpan & Dapatkan QR Code
            </button>
            <button class="btn-secondary btn-retake-photos" type="button">Jepret Ulang</button>
            <button class="btn-back" id="btn-back-stickers">Edit Hiasan</button>
        </div>
    </section>

    {{-- ── STEP 6: QR & Selesai ────────────────────────────────────────────── --}}
    <section class="session-step" id="step-qr">
        <h2 class="step-title">Foto Tersimpan! 🎉</h2>
        <p class="step-desc">Scan QR code untuk mengunduh foto ke HP kamu</p>

        <div class="qr-area">
            <div class="qr-card">
                <div class="qr-code" id="qr-code"></div>
                <a class="qr-url" id="qr-url" href="#" target="_blank" rel="noopener"></a>
            </div>
        </div>

        <div class="upload-status" id="upload-status">
            <div class="upload-progress" id="upload-progress">
                <div class="spinner"></div>
                <span>Mengunggah foto...</span>
            </div>
            <div class="upload-error" id="upload-error" style="display:none;">
                <span>⚠️ Gagal mengunggah. </span>
                <button class="btn-retry" id="btn-retry-upload">Coba Lagi</button>
            </div>
        </div>

        <p class="qr-expiry-note">Foto dan link tersedia selama 10 menit. Scan dan unduh sekarang.</p>
        <div class="step-actions">
            <button class="btn-primary btn-glow" id="btn-open-print" type="button">
                Cetak Foto Fisik
            </button>
            <a href="{{ route('photobooth.index') }}" class="btn-secondary" id="btn-new-session">
                Kembali ke Home
            </a>
        </div>
    </section>

    {{-- ── STEP 7: Cetak Fisik ─────────────────────────────────────────────── --}}
    <section class="session-step" id="step-print">
        <div class="print-panel" data-print-stage="package">
            <h2 class="step-title">Pilih Format Cetak</h2>
            <p class="step-desc">Dicetak di kertas foto 4R, siap dipotong dan dibawa pulang</p>
            <div class="print-package-list" id="print-package-list"></div>
            <div class="step-actions">
                <button class="btn-back" id="btn-print-exit" type="button">Kembali ke QR</button>
            </div>
        </div>

        <div class="print-panel" data-print-stage="design" hidden>
            <h2 class="step-title">Atur Cetakan</h2>
            <p class="step-desc" id="print-design-title"></p>
            <div class="print-workspace">
                <div class="print-controls" id="print-controls"></div>
                <div class="print-preview">
                    <canvas id="print-sheet-preview" aria-label="Pratinjau lembar 4R"></canvas>
                    <span class="print-preview-status" id="print-preview-status" hidden>Menyiapkan pratinjau...</span>
                    <span class="print-preview-caption">Pratinjau kertas 4R · garis sudut = garis potong</span>
                </div>
            </div>
            <div class="step-actions">
                <button class="btn-primary btn-glow" id="btn-print-to-payment" type="button">Lanjut ke Pembayaran</button>
                <button class="btn-back" id="btn-print-back-package" type="button">Ganti Paket</button>
            </div>
        </div>

        <div class="print-panel" data-print-stage="payment" hidden>
            <h2 class="step-title">Pembayaran</h2>
            <p class="step-desc" id="print-package-summary"></p>
            <div class="print-payment-card">
                <span class="print-payment-label">Total</span>
                <strong class="print-payment-amount" id="print-amount"></strong>
                <span class="print-payment-invoice">No. Invoice <b id="print-invoice"></b></span>
                <span class="print-payment-status" id="print-payment-status"></span>
                <p class="print-simulation-note" id="print-simulation-note" hidden>
                    Mode simulasi: belum terhubung ke DOKU. Operator menekan tombol di bawah setelah menerima pembayaran.
                </p>
            </div>
            <div class="step-actions">
                <button class="btn-primary btn-glow" id="btn-simulate-payment" type="button" hidden>Konfirmasi Pembayaran (Simulasi)</button>
                <button class="btn-back" id="btn-payment-back" type="button">Ubah Cetakan</button>
            </div>
        </div>

        <div class="print-panel" data-print-stage="done" hidden>
            <h2 class="step-title">Siap Dicetak! 🖨️</h2>
            <p class="step-desc">Pilih printer Canon SELPHY CP1500, kertas 4R (100 × 148 mm), skala 100%, tanpa margin.</p>
            <div class="print-preview print-preview--final">
                <canvas id="print-final-preview" aria-label="Lembar 4R siap cetak"></canvas>
            </div>
            <div class="step-actions">
                <button class="btn-primary btn-glow" id="btn-print-sheet" type="button">Cetak Sekarang</button>
                <button class="btn-secondary" id="btn-download-sheet" type="button">Unduh Lembar Cetak</button>
                <a href="{{ route('photobooth.index') }}" class="btn-back">Selesai — Kembali ke Home</a>
            </div>
        </div>
    </section>
</div>

{{-- JS Config --}}
<script>
    window.PHOTOBOOTH_CONFIG = {
        psdUnitId: @json($psdUnitId),
        layouts: @json($layouts),
        frames: @json($frames),
        stickerColors: @json($stickerColors),
        stickerEmojis: @json($stickerEmojis),
        stickerLayouts: @json($stickerLayouts),
        stickerAutoThemes: @json($stickerAutoThemes),
        photoBackgrounds: @json($photoBackgrounds),
        captureTimers: @json($captureTimers),
        csrfToken: '{{ csrf_token() }}',
        apiUploadUrl: '/api/photos',
        homeUrl: @json(route('photobooth.index')),
        retentionMinutes: @json(config('photobooth.retention_minutes', 10)),
        print: @json($printConfig),
        printOrdersUrl: '/api/print-orders',
        logoUrl: @json(asset('logos/LogoNoBg.webp')),
    };
</script>
@endsection

@push('scripts')
@vite([
    'resources/js/photobooth/state.js',
    'resources/js/photobooth/camera.js',
    'resources/js/photobooth/compose.js',
    'resources/js/photobooth/stickers.js',
    'resources/js/photobooth/upload.js',
    'resources/js/photobooth/print.js',
    'resources/js/photobooth/session.js',
])
@endpush
