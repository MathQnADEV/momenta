@extends('layouts.photobooth')

@section('title', 'Photo Booth — Foto Kenangan')
@section('meta_description', 'Ambil foto kenangan bersama di Momenta. Pilih bingkai, tambah stiker, dan simpan momen spesialmu!')

@section('content')
<div class="menu-screen">
    <!-- Background particles -->
    <div class="particles" id="particles"></div>

    <!-- Logo / Header -->
    <div class="menu-header">
        <div class="logo-glow">
            <img class="menu-logo" src="{{ asset('logos/LogoNoBg.webp') }}" alt="Momenta">
        </div>
        <h1 class="menu-title">
            <span class="title-gradient">Foto Kenangan</span>
        </h1>
        <p class="menu-subtitle">Abadikan momen spesialmu di sini!</p>
    </div>

    <!-- Menu Buttons -->
    <div class="menu-actions">
        <a href="{{ route('photobooth.session') }}" class="btn-primary btn-glow" id="btn-start-photo">
            <span class="btn-content">
                <span class="btn-label">Mulai Foto</span>
            </span>
        </a>
    </div>

</div>
@endsection

@push('scripts')
<script>
// Animasi partikel sederhana di background
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('particles');
    const count = 30;

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.animationDuration = (4 + Math.random() * 6) + 's';
        particle.style.width = particle.style.height = (2 + Math.random() * 4) + 'px';
        container.appendChild(particle);
    }
});
</script>
@endpush
