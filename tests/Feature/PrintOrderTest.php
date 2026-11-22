<?php

namespace Tests\Feature;

use App\Models\PrintOrder;
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
    }

    public function test_order_uses_server_side_package_price(): void
    {
        $response = $this->postJson('/api/print-orders', [
            'package_code' => 'B',
            'amount' => 1,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'package_code' => 'B',
                'amount' => 20000,
                'status' => 'pending',
                'payment_driver' => 'simulation',
            ]);

        $this->assertMatchesRegularExpression('/^MMT-\d{6}-[A-Z0-9]{6}$/', $response->json('invoice_number'));
    }

    public function test_unknown_package_is_rejected(): void
    {
        $this->postJson('/api/print-orders', ['package_code' => 'Z'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('package_code');
    }

    public function test_simulated_payment_marks_order_paid(): void
    {
        $invoice = $this->postJson('/api/print-orders', ['package_code' => 'A'])->json('invoice_number');

        $this->postJson("/api/print-orders/{$invoice}/simulate-payment")
            ->assertOk()
            ->assertJson(['status' => 'paid']);

        $this->getJson("/api/print-orders/{$invoice}")
            ->assertOk()
            ->assertJson(['status' => 'paid', 'amount' => 10000]);

        $this->assertNotNull(PrintOrder::where('invoice_number', $invoice)->value('payment_reference'));
    }

    public function test_simulated_payment_is_unavailable_for_other_drivers(): void
    {
        $invoice = $this->postJson('/api/print-orders', ['package_code' => 'C'])->json('invoice_number');

        config(['photobooth.payment.driver' => 'doku']);

        $this->postJson("/api/print-orders/{$invoice}/simulate-payment")->assertNotFound();
        $this->assertSame('pending', PrintOrder::where('invoice_number', $invoice)->value('status'));
    }

    public function test_operator_pin_confirms_qris_payment(): void
    {
        config(['photobooth.payment.driver' => 'qris_static']);
        SettingsCredential::query()->first()->update(['operator_pin_hash' => Hash::make('2468')]);
        $invoice = $this->postJson('/api/print-orders', ['package_code' => 'A'])->json('invoice_number');

        $this->postJson("/api/print-orders/{$invoice}/confirm-payment", ['pin' => '1111'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('pin');
        $this->assertSame('pending', PrintOrder::where('invoice_number', $invoice)->value('status'));

        $this->postJson("/api/print-orders/{$invoice}/confirm-payment", ['pin' => '2468'])
            ->assertOk()
            ->assertJson(['status' => 'paid', 'payment_driver' => 'qris_static']);
    }

    public function test_qris_payment_needs_pin_to_be_configured(): void
    {
        config(['photobooth.payment.driver' => 'qris_static']);
        $invoice = $this->postJson('/api/print-orders', ['package_code' => 'A'])->json('invoice_number');

        $this->postJson("/api/print-orders/{$invoice}/confirm-payment", ['pin' => '2468'])
            ->assertStatus(422)
            ->assertJsonPath('errors.pin.0', 'PIN operator belum diatur. Atur dulu di halaman Pengaturan.');
    }

    public function test_pin_confirmation_is_unavailable_in_simulation(): void
    {
        $invoice = $this->postJson('/api/print-orders', ['package_code' => 'A'])->json('invoice_number');

        $this->postJson("/api/print-orders/{$invoice}/confirm-payment", ['pin' => '2468'])->assertNotFound();
    }
}
