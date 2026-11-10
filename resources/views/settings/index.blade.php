@extends('settings.layout')

@section('title', 'Pengaturan Photo Booth')

@section('content')
@php $activeSettingsTab = request('tab', 'templates') === 'backgrounds' ? 'backgrounds' : 'templates'; @endphp
<div class="settings-app-shell">
    <header class="settings-topbar">
        <div>
            <p class="settings-kicker">PHOTO BOOTH ADMIN</p>
            <h1>Pengaturan Photo Booth</h1>
            <p>Kelola layout template dan gambar background tanpa mengubah kode.</p>
        </div>
        <div class="settings-topbar-actions">
            <a class="settings-secondary-button" href="{{ route('photobooth.session') }}">Buka Photo Booth</a>
            <form method="POST" action="{{ route('settings.logout') }}">
                @csrf
                <button class="settings-danger-link" type="submit">Keluar</button>
            </form>
        </div>
    </header>

    <nav class="settings-section-tabs" aria-label="Jenis pengaturan">
        <button class="settings-section-tab {{ $activeSettingsTab === 'templates' ? 'is-active' : '' }}"
                type="button"
                data-settings-tab="templates">
            Template Layout
        </button>
        <button class="settings-section-tab {{ $activeSettingsTab === 'backgrounds' ? 'is-active' : '' }}"
                type="button"
                data-settings-tab="backgrounds">
            Background
        </button>
    </nav>

    @if (session('success'))
        <div class="settings-alert settings-alert--success">{{ session('success') }}</div>
    @endif

    @if ($errors->any())
        <div class="settings-alert settings-alert--error">
            <strong>Data belum dapat disimpan.</strong>
            <ul>
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    <section class="settings-tab-panel {{ $activeSettingsTab === 'templates' ? 'is-active' : '' }}" data-settings-panel="templates">
        <main class="settings-workspace">
            <aside class="template-library">
                <div class="template-library-head">
                    <div>
                        <h2>Daftar Template</h2>
                        <p>{{ $templates->count() }} template tersimpan</p>
                    </div>
                    <button class="settings-primary-button settings-primary-button--compact" id="btn-new-template" type="button">
                        Template Baru
                    </button>
                </div>

                <div class="template-list" id="template-list">
                    @forelse ($templates as $template)
                        <article class="template-list-card" data-template-card="{{ $template->id }}">
                            <button class="template-list-main" type="button" data-edit-template="{{ $template->id }}">
                                <span class="template-list-thumb">
                                    <img src="{{ asset($template->public_path) }}" alt="Preview {{ $template->name }}">
                                </span>
                                <span class="template-list-copy">
                                    <strong>{{ $template->name }}</strong>
                                    <span>{{ count($template->photo_slots ?? []) }} area foto • {{ $template->grid_columns }}×{{ $template->grid_rows }}</span>
                                    <em class="template-status {{ $template->is_active ? 'is-active' : 'is-inactive' }}">
                                        {{ $template->is_active ? 'Aktif di kiosk' : 'Disembunyikan' }}
                                    </em>
                                </span>
                            </button>
                            <form method="POST"
                                  action="{{ route('settings.templates.destroy', $template) }}"
                                  onsubmit="return confirm('Hapus template ini?');">
                                @csrf
                                @method('DELETE')
                                <button class="template-delete-button" type="submit">Hapus</button>
                            </form>
                        </article>
                    @empty
                        <div class="template-empty-state">
                            <strong>Belum ada template</strong>
                            <p>Buat template pertama dari editor di sebelah kanan.</p>
                        </div>
                    @endforelse
                </div>
            </aside>

            <section class="template-editor-panel">
                <div class="template-editor-head">
                    <div>
                        <p class="settings-kicker" id="editor-mode-label">TEMPLATE BARU</p>
                        <h2 id="editor-title">Buat Template</h2>
                    </div>
                    <button class="settings-secondary-button settings-secondary-button--compact" id="btn-reset-editor" type="button">
                        Reset Editor
                    </button>
                </div>

                <form id="template-form"
                      method="POST"
                      action="{{ route('settings.templates.store') }}"
                      enctype="multipart/form-data">
                    @csrf
                    <input type="hidden" name="_method" id="template-method" value="POST">
                    <input type="hidden" name="photo_slots" id="photo-slots-input" value="[]">
                    <input type="hidden" name="editor_canvas_width" id="editor-canvas-width" value="1200">
                    <input type="hidden" name="editor_canvas_height" id="editor-canvas-height" value="1800">

                    <div class="editor-form-grid">
                        <label class="settings-field">
                            <span>Nama template</span>
                            <input type="text" name="name" id="template-name" maxlength="120" required placeholder="Contoh: Lebaran 2026">
                        </label>
                        <label class="settings-field">
                            <span>Deskripsi</span>
                            <input type="text" name="description" id="template-description" maxlength="180" placeholder="Contoh: 4 foto portrait">
                        </label>
                        <label class="settings-field settings-field--wide">
                            <span>Gambar template</span>
                            <input type="file" name="template_image" id="template-image" accept="image/png,image/jpeg,image/webp">
                            <small>PNG transparan paling disarankan. Maksimum 20 MB.</small>
                        </label>
                        <label class="settings-field">
                            <span>Urutan tampil</span>
                            <input type="number" name="sort_order" id="template-sort-order" min="0" max="9999" value="100" required>
                        </label>
                        <label class="settings-check-field">
                            <input type="hidden" name="is_active" value="0">
                            <input type="checkbox" name="is_active" id="template-is-active" value="1" checked>
                            <span>
                                <strong>Aktifkan template</strong>
                                <small>Tampilkan pada pilihan Template di kiosk.</small>
                            </span>
                        </label>
                    </div>

                    <div class="grid-builder-card">
                        <div class="grid-builder-copy">
                            <h3>Pembuat Grid</h3>
                            <p>Grid membuat posisi awal. Setiap kotak kemudian dapat digeser dan diubah ukurannya.</p>
                        </div>
                        <label class="settings-field settings-field--small">
                            <span>Kolom</span>
                            <input type="number" name="grid_columns" id="grid-columns" min="1" max="6" value="2" required>
                        </label>
                        <label class="settings-field settings-field--small">
                            <span>Baris</span>
                            <input type="number" name="grid_rows" id="grid-rows" min="1" max="8" value="2" required>
                        </label>
                        <button class="settings-secondary-button settings-secondary-button--compact" id="btn-generate-grid" type="button">Buat Grid</button>
                        <button class="settings-secondary-button settings-secondary-button--compact" id="btn-add-slot" type="button">Tambah Area</button>
                    </div>

                    <div class="editor-stage-layout">
                        <div class="template-stage-column">
                            <div class="template-stage-toolbar">
                                <span id="canvas-dimension-label">Canvas 1200 × 1800 px</span>
                                <span><strong id="slot-count-label">0</strong> area foto</span>
                            </div>
                            <div class="template-stage-shell">
                                <div class="template-stage" id="template-stage" style="aspect-ratio: 1200 / 1800;">
                                    <div class="template-stage-placeholder" id="template-stage-placeholder">
                                        Pilih gambar template untuk mulai mengatur area foto.
                                    </div>
                                    <img id="template-stage-image" alt="Preview template" hidden>
                                    <div class="template-slot-layer" id="template-slot-layer"></div>
                                </div>
                            </div>
                        </div>

                        <aside class="slot-inspector">
                            <div class="slot-inspector-head">
                                <h3>Area Terpilih</h3>
                                <span id="selected-slot-label">Belum ada</span>
                            </div>
                            <div class="slot-coordinate-grid">
                                <label class="settings-field settings-field--small"><span>X</span><input type="number" id="slot-x" min="0" step="1" disabled></label>
                                <label class="settings-field settings-field--small"><span>Y</span><input type="number" id="slot-y" min="0" step="1" disabled></label>
                                <label class="settings-field settings-field--small"><span>Lebar</span><input type="number" id="slot-w" min="1" step="1" disabled></label>
                                <label class="settings-field settings-field--small"><span>Tinggi</span><input type="number" id="slot-h" min="1" step="1" disabled></label>
                            </div>
                            <p class="slot-inspector-help">Sentuh bagian tengah kotak untuk menggeser. Sentuh sudut kanan bawah untuk mengubah ukuran.</p>
                            <button class="settings-danger-button" id="btn-remove-slot" type="button" disabled>Hapus Area Terpilih</button>
                        </aside>
                    </div>

                    <div class="template-form-actions">
                        <button class="settings-primary-button" type="submit" id="btn-save-template">Simpan Template</button>
                        <p>Perubahan tampil setelah halaman sesi foto dimuat ulang.</p>
                    </div>
                </form>
            </section>
        </main>
    </section>

    <section class="settings-tab-panel {{ $activeSettingsTab === 'backgrounds' ? 'is-active' : '' }}" data-settings-panel="backgrounds">
        <main class="settings-workspace settings-workspace--backgrounds">
            <aside class="template-library">
                <div class="template-library-head">
                    <div>
                        <h2>Daftar Background</h2>
                        <p>{{ $backgrounds->count() }} background tersimpan</p>
                    </div>
                    <button class="settings-primary-button settings-primary-button--compact" id="btn-new-background" type="button">Background Baru</button>
                </div>

                <div class="template-list" id="background-list">
                    @forelse ($backgrounds as $background)
                        <article class="template-list-card background-list-card" data-background-card="{{ $background->id }}">
                            <button class="template-list-main" type="button" data-edit-background="{{ $background->id }}">
                                <span class="template-list-thumb background-list-thumb">
                                    <img src="{{ asset($background->public_path) }}" alt="Preview {{ $background->name }}">
                                </span>
                                <span class="template-list-copy">
                                    <strong>{{ $background->name }}</strong>
                                    <span>{{ $background->description ?: 'Gambar background foto' }}</span>
                                    <em class="template-status {{ $background->is_active ? 'is-active' : 'is-inactive' }}">
                                        {{ $background->is_active ? 'Aktif di kiosk' : 'Disembunyikan' }}
                                    </em>
                                </span>
                            </button>
                            <form method="POST" action="{{ route('settings.backgrounds.destroy', $background) }}" onsubmit="return confirm('Hapus background ini?');">
                                @csrf
                                @method('DELETE')
                                <button class="template-delete-button" type="submit">Hapus</button>
                            </form>
                        </article>
                    @empty
                        <div class="template-empty-state">
                            <strong>Belum ada background gambar</strong>
                            <p>Warna tetap tersedia di kiosk. Tambahkan gambar dari editor.</p>
                        </div>
                    @endforelse
                </div>
            </aside>

            <section class="template-editor-panel background-editor-panel">
                <div class="template-editor-head">
                    <div>
                        <p class="settings-kicker" id="background-editor-mode">BACKGROUND BARU</p>
                        <h2 id="background-editor-title">Tambah Background</h2>
                    </div>
                    <button class="settings-secondary-button settings-secondary-button--compact" id="btn-reset-background" type="button">Reset Editor</button>
                </div>

                <form id="background-form" method="POST" action="{{ route('settings.backgrounds.store') }}" enctype="multipart/form-data">
                    @csrf
                    <input type="hidden" name="_method" id="background-method" value="POST">

                    <div class="editor-form-grid">
                        <label class="settings-field">
                            <span>Nama background</span>
                            <input type="text" name="name" id="background-name" maxlength="120" required placeholder="Contoh: Bunga Pastel">
                        </label>
                        <label class="settings-field">
                            <span>Deskripsi</span>
                            <input type="text" name="description" id="background-description" maxlength="180" placeholder="Contoh: Cocok untuk foto keluarga">
                        </label>
                        <label class="settings-field settings-field--wide">
                            <span>Gambar background</span>
                            <input type="file" name="background_image" id="background-image" accept="image/png,image/jpeg,image/webp">
                            <small>PNG, JPG, atau WebP. Maksimum 20 MB.</small>
                        </label>
                        <label class="settings-field">
                            <span>Urutan tampil</span>
                            <input type="number" name="sort_order" id="background-sort-order" min="0" max="9999" value="100" required>
                        </label>
                        <label class="settings-check-field">
                            <input type="hidden" name="is_active" value="0">
                            <input type="checkbox" name="is_active" id="background-is-active" value="1" checked>
                            <span>
                                <strong>Aktifkan background</strong>
                                <small>Tampilkan pada halaman Hias Foto.</small>
                            </span>
                        </label>
                    </div>

                    <div class="background-admin-preview">
                        <div class="background-admin-preview-frame">
                            <img id="background-preview-image" alt="Preview background" hidden>
                            <div id="background-preview-placeholder">Pilih gambar untuk melihat preview.</div>
                        </div>
                        <div>
                            <h3>Fungsi background</h3>
                            <p>Pengguna dapat menerapkan background berbeda pada setiap foto. Foto akan dibuat sedikit lebih kecil agar gambar atau warna background terlihat sebagai lapisan di belakangnya.</p>
                        </div>
                    </div>

                    <div class="template-form-actions">
                        <button class="settings-primary-button" type="submit" id="btn-save-background">Simpan Background</button>
                        <p>Background aktif langsung muncul setelah sesi kiosk dimuat ulang.</p>
                    </div>
                </form>
            </section>
        </main>
    </section>
</div>
@endsection

@push('scripts')
<script>
window.PHOTOBOOTH_SETTINGS = {
    activeTab: @json($activeSettingsTab),
    csrfTokenUrl: @json(route('settings.csrf-token', absolute: false)),
    storeUrl: @json(route('settings.templates.store')),
    templates: @json($settingsTemplates),
    backgroundStoreUrl: @json(route('settings.backgrounds.store')),
    backgrounds: @json($settingsBackgrounds),
};
</script>
@vite([
    'resources/js/settings/template-editor.js',
    'resources/js/settings/background-editor.js',
])
@endpush
