<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unduh Foto Kenangan — Photo Booth</title>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

    <style>
        :root {
            --bg-color: #f6f1e8;
            --card-bg: rgba(255, 255, 255, 0.8);
            --border-color: rgba(43, 39, 37, 0.1);
            --primary: #2b2725;
            --primary-glow: rgba(43, 39, 37, 0.25);
            --text-color: #2b2725;
            --text-muted: #6f645d;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Outfit', sans-serif;
            background: radial-gradient(circle at center, #fffdf9 0%, var(--bg-color) 100%);
            color: var(--text-color);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            overflow-x: hidden;
        }

        .show-container {
            width: 100%;
            max-width: 450px;
            text-align: center;
            animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .header {
            margin-bottom: 24px;
        }

        .brand-logo {
            display: block;
            width: 190px;
            height: auto;
            margin: 0 auto 8px;
        }

        .title {
            font-size: 28px;
            font-weight: 700;
            background: linear-gradient(135deg, #2b2725 0%, #b9636c 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 8px;
        }

        .subtitle {
            font-size: 14px;
            color: var(--text-muted);
        }

        .photo-card {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            padding: 16px;
            margin-bottom: 24px;
            box-shadow: 0 20px 40px rgba(43, 39, 37, 0.12);
            backdrop-filter: blur(10px);
            display: inline-block;
            max-width: 100%;
        }

        .photo-img {
            max-width: 100%;
            height: auto;
            max-height: 60vh;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            object-fit: contain;
        }

        .btn-download {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            width: 100%;
            padding: 16px 24px;
            background: linear-gradient(135deg, var(--primary) 0%, #4a403b 100%);
            color: white;
            border: none;
            border-radius: 14px;
            font-size: 16px;
            font-weight: 600;
            text-decoration: none;
            box-shadow: 0 10px 20px var(--primary-glow);
            transition: transform 0.2s, box-shadow 0.2s;
            cursor: pointer;
        }

        .btn-download:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 24px rgba(43, 39, 37, 0.35);
        }

        .btn-download:active {
            transform: translateY(0);
        }

        .footer {
            margin-top: 32px;
            font-size: 12px;
            color: var(--text-muted);
            opacity: 0.7;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    </style>
</head>
<body>
    <div class="show-container">
        <div class="header">
            <img class="brand-logo" src="{{ asset('logos/LogoNoBg.webp') }}" alt="Momenta">
            <h1 class="title">Foto Kenangan</h1>
            <p class="subtitle">Diambil pada {{ $photo->created_at->format('d M Y, H:i') }} • Tersedia sampai {{ $photo->expires_at?->format('H:i') }}</p>
        </div>

        <div class="photo-card">
            <img src="{{ $imageUrl }}" alt="Foto Kenangan" class="photo-img">
        </div>

        <a href="{{ route('photo.download', $photo->slug) }}" class="btn-download">
            Unduh Foto
        </a>

        <div class="footer">
            Momenta
        </div>
    </div>
</body>
</html>
