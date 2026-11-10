<?php

namespace App\Services;

use App\Models\Photo;
use Illuminate\Support\Str;

class PhotoSlugGenerator
{
    /**
     * Karakter yang digunakan untuk generate slug.
     * Menghindari karakter ambigu: 0/O, I/l/1
     */
    private const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

    /**
     * Generate slug unik yang belum ada di database.
     */
    public function generate(): string
    {
        $length = config('photobooth.slug_length', 8);

        do {
            $slug = $this->randomString($length);
        } while (Photo::where('slug', $slug)->exists());

        return $slug;
    }

    /**
     * Generate random string dari charset yang aman.
     */
    private function randomString(int $length): string
    {
        $chars = self::CHARSET;
        $max = strlen($chars) - 1;
        $result = '';

        for ($i = 0; $i < $length; $i++) {
            $result .= $chars[random_int(0, $max)];
        }

        return $result;
    }
}
