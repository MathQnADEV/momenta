<?php

namespace App\Services;

use App\Models\Photo;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class QrPayloadBuilder
{
    /**
     * Build QR code SVG string untuk foto tertentu.
     */
    public function buildSvg(Photo $photo): string
    {
        $url = $photo->public_url;

        return QrCode::format('svg')
            ->size(250)
            ->margin(1)
            ->errorCorrection('M')
            ->generate($url)
            ->toHtml();
    }

    /**
     * Build payload response lengkap untuk API (slug, URL, QR SVG).
     */
    public function buildPayload(Photo $photo): array
    {
        return [
            'slug'         => $photo->slug,
            'download_url' => $photo->public_url,
            'qr_svg'       => $this->buildSvg($photo),
        ];
    }
}
