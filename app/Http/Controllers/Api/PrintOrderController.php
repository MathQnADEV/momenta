<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Photo;
use App\Models\PrintOrder;
use App\Models\SettingsCredential;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PrintOrderController extends Controller
{
    /**
     * POST /api/print-orders — Buat pesanan cetak berstatus pending.
     *
     * Harga selalu diambil dari konfigurasi server, bukan dari browser.
     */
    public function store(Request $request): JsonResponse
    {
        $packages = config('photobooth.print.packages', []);

        $validated = $request->validate([
            'package_code' => ['required', 'string', Rule::in(array_keys($packages))],
            // Setiap paket termasuk soft file, jadi pesanan selalu terhubung ke satu foto.
            'photo_slug' => ['required', 'string', 'max:32', Rule::exists('photos', 'slug')],
        ]);

        $package = $packages[$validated['package_code']];
        $photoId = Photo::where('slug', $validated['photo_slug'])->value('id');

        $order = PrintOrder::create([
            'invoice_number' => $this->generateInvoiceNumber(),
            'photo_id' => $photoId,
            'package_code' => $validated['package_code'],
            'package_name' => $package['name'],
            'amount' => (int) $package['price'],
            'status' => 'pending',
            'payment_driver' => (string) config('photobooth.payment.driver', 'simulation'),
        ]);

        return response()->json($order->toPayload(), 201);
    }

    /**
     * GET /api/print-orders/{invoice} — Cek status pembayaran.
     */
    public function show(string $invoice): JsonResponse
    {
        $order = PrintOrder::where('invoice_number', $invoice)->firstOrFail();

        return response()->json($order->toPayload());
    }

    /**
     * POST /api/print-orders/{invoice}/simulate-payment — Tandai lunas (mode simulasi).
     *
     * Hanya tersedia selama driver pembayaran masih "simulation".
     */
    public function simulatePayment(string $invoice): JsonResponse
    {
        abort_unless(config('photobooth.payment.driver') === 'simulation', 404);

        $order = PrintOrder::where('invoice_number', $invoice)->firstOrFail();

        if ($order->status === 'pending') {
            $this->markPaid($order, 'SIM-'.Str::upper(Str::random(10)));
        }

        return response()->json($order->toPayload());
    }

    /**
     * POST /api/print-orders/{invoice}/confirm-payment — Operator menandai lunas dengan PIN.
     *
     * Untuk QRIS statis: aplikasi tidak tahu uang sudah masuk, jadi operator
     * mengecek notifikasi di HP-nya lalu memasukkan PIN di booth.
     */
    public function confirmPayment(Request $request, string $invoice): JsonResponse
    {
        abort_unless(config('photobooth.payment.driver') === 'qris_static', 404);

        $validated = $request->validate([
            'pin' => ['required', 'string', 'max:12'],
        ]);

        $pinHash = SettingsCredential::query()->value('operator_pin_hash');

        if (! $pinHash) {
            throw ValidationException::withMessages([
                'pin' => 'PIN operator belum diatur. Atur dulu di halaman Pengaturan.',
            ]);
        }

        if (! Hash::check($validated['pin'], $pinHash)) {
            throw ValidationException::withMessages(['pin' => 'PIN salah.']);
        }

        $order = PrintOrder::where('invoice_number', $invoice)->firstOrFail();

        if ($order->status === 'pending') {
            $this->markPaid($order, 'QRIS-OP-'.now()->format('His').'-'.Str::upper(Str::random(4)));
        }

        return response()->json($order->toPayload());
    }

    /**
     * Tandai lunas, lalu buka soft file: masa berlaku link dihitung ulang dari
     * saat bayar agar pelanggan tetap punya waktu penuh untuk mengunduh.
     */
    private function markPaid(PrintOrder $order, string $reference): void
    {
        $order->update([
            'status' => 'paid',
            'payment_reference' => $reference,
            'paid_at' => now(),
        ]);

        $order->photo?->update([
            'expires_at' => now()->addMinutes((int) config('photobooth.retention_minutes', 10)),
        ]);
    }

    private function generateInvoiceNumber(): string
    {
        do {
            $invoice = 'MMT-'.now()->format('ymd').'-'.Str::upper(Str::random(6));
        } while (PrintOrder::where('invoice_number', $invoice)->exists());

        return $invoice;
    }
}
