<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\SettingsCredential;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class PaymentSettingsController extends Controller
{
    /**
     * Simpan PIN operator (4–6 angka) untuk konfirmasi pembayaran QRIS di booth.
     */
    public function updatePin(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'operator_pin' => ['required', 'digits_between:4,6', 'confirmed'],
        ], [
            'operator_pin.required' => 'PIN operator wajib diisi.',
            'operator_pin.digits_between' => 'PIN operator harus 4 sampai 6 angka.',
            'operator_pin.confirmed' => 'Ulangi PIN tidak sama.',
        ]);

        $credential = SettingsCredential::query()->firstOrFail();
        $credential->update(['operator_pin_hash' => Hash::make($validated['operator_pin'])]);

        return redirect()
            ->route('settings.index', ['tab' => 'payment'])
            ->with('success', 'PIN operator berhasil disimpan.');
    }
}
