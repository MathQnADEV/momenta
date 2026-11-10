@extends('layouts.photobooth')

@section('title', 'Galeri Foto — Photo Booth')

@section('content')
<div class="gallery-screen">
    <!-- Header -->
    <div class="gallery-header">
        <h1 class="gallery-title">Galeri Foto</h1>
        <p class="gallery-subtitle">Hanya menampilkan foto yang dibuat dalam 10 menit terakhir</p>
    </div>

    <!-- Grid Container -->
    <div class="gallery-container">
        <div class="gallery-grid" id="gallery-grid">
            <!-- Loading state -->
            <div class="gallery-loading" id="gallery-loading">
                <div class="spinner"></div>
                <p>Memuat foto...</p>
            </div>
            <!-- Empty state -->
            <div class="gallery-empty" id="gallery-empty" style="display: none;">
                <span class="empty-icon">🖼️</span>
                <p>Belum ada foto dalam 10 menit terakhir</p>
            </div>
        </div>

        <!-- Pagination -->
        <div class="gallery-pagination" id="gallery-pagination" style="display: none;">
            <button class="btn-pagination btn-pag-arrow" id="btn-prev" disabled>&#8249;</button>
            <div class="pagination-pages" id="pagination-pages"></div>
            <button class="btn-pagination btn-pag-arrow" id="btn-next" disabled>&#8250;</button>
        </div>
    </div>

    <!-- Actions -->
    <div class="gallery-actions">
        <a href="{{ route('photobooth.index') }}" class="btn-back-menu">
            ← Kembali ke Menu
        </a>
    </div>
</div>

<!-- Modal Detail -->
<div class="gallery-modal" id="gallery-modal" style="display: none;">
    <div class="modal-overlay" id="modal-overlay"></div>
    <div class="modal-content">
        <button class="modal-close" id="modal-close">×</button>
        <div class="modal-body">
            <img src="" alt="Detail Foto" class="modal-img" id="modal-img">
            <div class="modal-qr-container">
                <div class="modal-qr" id="modal-qr"></div>
                <p class="modal-qr-desc">Scan untuk download ke HP</p>
            </div>
        </div>
    </div>
</div>

<script>
    window.PHOTOBOOTH_CONFIG = {
        psdUnitId: @json($psdUnitId),
        csrfToken: '{{ csrf_token() }}',
        apiUploadUrl: '/api/photos',
    };
</script>
@endsection

@push('scripts')
@vite(['resources/js/photobooth/gallery.js'])
@endpush
