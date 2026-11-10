<?php

namespace App\Services;

use App\Models\SettingsCredential;

class SettingsAuthToken
{
    public const COOKIE_NAME = 'photobooth_settings_auth';

    public function make(SettingsCredential $credential): string
    {
        return hash_hmac(
            'sha256',
            $credential->getKey().'|'.$credential->password_hash,
            (string) config('app.key'),
        );
    }

    public function isValid(?string $token): bool
    {
        if (! is_string($token) || $token === '') {
            return false;
        }

        $credential = SettingsCredential::query()->first();

        return $credential !== null && hash_equals($this->make($credential), $token);
    }
}
