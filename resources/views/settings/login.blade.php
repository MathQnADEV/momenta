@extends('settings.layout')

@section('title', 'Masuk Pengaturan Photo Booth')

@section('content')
<main class="settings-login-shell">
    <section class="settings-login-card">
        <div class="settings-brand-mark">
            <img src="{{ asset('logos/LogoNoBg.webp') }}" alt="Momenta">
        </div>
        <p class="settings-kicker">ADMIN PHOTO BOOTH</p>
        <h1>Masuk Pengaturan</h1>
        <p class="settings-login-copy">Masukkan password untuk mengatur template layout dan background foto.</p>

        @if (session('error'))
            <div class="settings-alert settings-alert--error">{{ session('error') }}</div>
        @endif

        <form method="POST" action="{{ route('settings.login.submit') }}" class="settings-login-form">
            @csrf
            <label class="settings-field">
                <span>Password</span>
                <input type="password"
                       name="password"
                       autocomplete="current-password"
                       autofocus
                       required
                       placeholder="Masukkan password">
                @error('password')
                    <small class="settings-error">{{ $message }}</small>
                @enderror
            </label>

            <button class="settings-primary-button" type="submit">Masuk</button>
        </form>

        <a class="settings-link" href="{{ route('photobooth.index') }}">Kembali ke Photo Booth</a>
    </section>
</main>
@endsection
