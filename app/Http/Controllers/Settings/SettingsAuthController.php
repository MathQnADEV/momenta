<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\SettingsCredential;
use App\Services\SettingsAuthToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\View\View;

class SettingsAuthController extends Controller
{
    public function __construct(private SettingsAuthToken $authToken) {}

    public function showLogin(Request $request): View|RedirectResponse
    {
        if ($this->isAuthenticated($request)) {
            return redirect()->route('settings.index');
        }

        return view('settings.login');
    }

    public function login(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'password' => ['required', 'string', 'max:255'],
        ]);

        $credential = SettingsCredential::query()->first();

        if (! $credential || ! Hash::check($validated['password'], $credential->password_hash)) {
            return back()
                ->withInput()
                ->withErrors(['password' => 'Password salah.']);
        }

        $request->session()->regenerate();
        $request->session()->put('settings_authenticated', true);

        return redirect()
            ->route('settings.index')
            ->withCookie(cookie(
                SettingsAuthToken::COOKIE_NAME,
                $this->authToken->make($credential),
                480,
                '/photobooth/settings',
                null,
                $request->isSecure(),
                true,
                false,
                'lax',
            ));
    }

    public function logout(Request $request): RedirectResponse
    {
        $request->session()->forget('settings_authenticated');
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()
            ->route('settings.login')
            ->withoutCookie(SettingsAuthToken::COOKIE_NAME, '/photobooth/settings');
    }

    public function csrfToken(Request $request): JsonResponse
    {
        return response()->json(['token' => $request->session()->token()]);
    }

    private function isAuthenticated(Request $request): bool
    {
        return (bool) $request->session()->get('settings_authenticated', false)
            || $this->authToken->isValid($request->cookie(SettingsAuthToken::COOKIE_NAME));
    }
}
