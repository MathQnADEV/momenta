<?php

namespace App\Http\Middleware;

use App\Services\SettingsAuthToken;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSettingsAuthenticated
{
    public function __construct(private SettingsAuthToken $authToken) {}

    public function handle(Request $request, Closure $next): Response
    {
        $authenticated = (bool) $request->session()->get('settings_authenticated', false)
            || $this->authToken->isValid($request->cookie(SettingsAuthToken::COOKIE_NAME));

        if (! $authenticated) {
            return redirect()
                ->route('settings.login')
                ->with('error', 'Masukkan password pengaturan terlebih dahulu.');
        }

        return $next($request);
    }
}
