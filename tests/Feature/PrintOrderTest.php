<?php

namespace Tests\Feature;

use App\Models\Photo;
use App\Models\PrintOrder;
use App\Models\PsdUnit;
use App\Models\SettingsCredential;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PrintOrderTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['photobooth.payment.driver' => 'simulation']);
        PsdUnit::create(['id' => 'PSD-DEFAULT-01', 'name' => 'PSD Default Unit', 'is_active' => true]);
    }

    private function makePhoto(string $slug = 'FOTO0001'): Photo
    {
        return Photo::create([
            'slug' => $slug,
            'psd_unit_id' => 'PSD-DEFAULT-01',
            'file_path' => "photos/PSD-DEFAULT-01/{$slug}.jpg",
            'frame_id' => 'none',
            'status' => 'active',
            'file_size' => 1024,
            'expires_at' => now()->addMinutes(10),
        ]);
    }

    private function createOrder(string $package = 'S', ?Photo $photo = null): string
    {
        $photo ??= $this->makePhoto();

        return $this->postJson('/api/print-orders', [
            'package_code' => $package,
            'photo_slug' => $photo->slug,
        ])->json('invoice_number');
    }

    public function test_packages_use_server_side_prices(): void
    {
        $expected = ['S' => 8000, 'A' => 13000, 'B' => 15000, 'C' => 20000];

        foreach ($expected as $code => $price) {
            $photo = $this->makePhoto("FOTO000{$code}");
            $response = $this->postJson('/api/print-orders', [
                'package_code' => $code,
                'photo_slug' => $photo->slug,
                'amount' => 1,
            ]);

            $response->assertStatus(201)->assertJson([
                'package_code' => $code,
                'amount' => $price,
                'status' => 'pending',
            ]);
            $this->assertMatchesRegularExpression('/^MMT-\d{6}-[A-Z0-9]{6}$/', $response->json('invoice_number'));
        }
    }

    public function test_order_requires_existing_photo(): void
    {
        $this->postJson('/api/print-orders', ['package_code' => 'S'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('photo_slug');

        $this->postJson('/api/print-orders', ['package_code' => 'S', 'photo_slug' => 'TIDAKADA'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('photo_slug');
    }

    public function test_unknown_package_is_rejected(): void
    {
        $this->postJson('/api/print-orders', ['package_code' => 'Z', 'photo_slug' => $this->makePhoto()->slug])
            ->assertStatus(422)
            ->assertJsonValidationErrors('package_code');
    }

    public function test_soft_file_unlocks_only_after_payment(): void
    {
        $photo = $this->makePhoto();
        $invoice = $this->createOrder('S', $photo);

        $this->get("/foto/{$photo->slug}")->assertNotFound();
        $this->get("/foto/{$photo->slug}/download")->assertNotFound();

        $this->postJson("/api/print-orders/{$invoice}/simulate-payment")
            ->assertOk()
            ->assertJson(['status' => 'paid', 'amount' => 8000]);

        $this->get("/foto/{$photo->slug}")->assertOk();
        $this->assertNotNull(PrintOrder::where('invoice_number', $invoice)->value('payment_reference'));
    }

    public function test_payment_restarts_download_window(): void
    {
        $photo = $this->makePhoto();
        $photo->update(['expires_at' => now()->addMinute()]);
        $invoice = $this->createOrder('A', $photo);

        $this->postJson("/api/print-orders/{$invoice}/simulate-payment")->assertOk();

        $this->assertTrue($photo->fresh()->expires_at->greaterThan(now()->addMinutes(9)));
    }

    public function test_simulated_payment_is_unavailable_for_other_drivers(): void
    {
        $invoice = $this->createOrder('C');

        config(['photobooth.payment.driver' => 'doku']);

        $this->postJson("/api/print-orders/{$invoice}/simulate-payment")->assertNotFound();
        $this->assertSame('pending', PrintOrder::where('invoice_number', $invoice)->value('status'));
    }

    public function test_operator_pin_confirms_qris_payment(): void
    {
        config(['photobooth.payment.driver' => 'qris_static']);
        SettingsCredential::query()->first()->update(['operator_pin_hash' => Hash::make('2468')]);
        $invoice = $this->createOrder('B');

        $this->postJson("/api/print-orders/{$invoice}/confirm-payment", ['pin' => '1111'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('pin');
        $this->assertSame('pending', PrintOrder::where('invoice_number', $invoice)->value('status'));

        $this->postJson("/api/print-orders/{$invoice}/confirm-payment", ['pin' => '2468'])
            ->assertOk()
            ->assertJson(['status' => 'paid', 'payment_driver' => 'qris_static', 'amount' => 15000]);
    }

    public function test_qris_payment_needs_pin_to_be_configured(): void
    {
        config(['photobooth.payment.driver' => 'qris_static']);
        $invoice = $this->createOrder();

        $this->postJson("/api/print-orders/{$invoice}/confirm-payment", ['pin' => '2468'])
            ->assertStatus(422)
            ->assertJsonPath('errors.pin.0', 'PIN operator belum diatur. Atur dulu di halaman Pengaturan.');
    }

    public function test_pin_confirmation_is_unavailable_in_simulation(): void
    {
        $invoice = $this->createOrder();

        $this->postJson("/api/print-orders/{$invoice}/confirm-payment", ['pin' => '2468'])->assertNotFound();
    }
}
