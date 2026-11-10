<?php

namespace Tests\Feature;

use App\Models\PrintOrder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PrintOrderTest extends TestCase
{
    use RefreshDatabase;

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
}
