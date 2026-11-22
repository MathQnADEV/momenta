<?php

namespace Tests\Feature;

use App\Models\SettingsCredential;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class OperatorPinSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_set_operator_pin(): void
    {
        $this->withSession(['settings_authenticated' => true])
            ->put(route('settings.operator-pin.update'), [
                'operator_pin' => '97531',
                'operator_pin_confirmation' => '97531',
            ])
            ->assertRedirect(route('settings.index', ['tab' => 'payment']));

        $this->assertTrue(Hash::check('97531', SettingsCredential::query()->value('operator_pin_hash')));
    }

    public function test_operator_pin_must_be_4_to_6_digits(): void
    {
        $this->withSession(['settings_authenticated' => true])
            ->put(route('settings.operator-pin.update'), [
                'operator_pin' => '12a',
                'operator_pin_confirmation' => '12a',
            ])
            ->assertSessionHasErrors('operator_pin');

        $this->assertNull(SettingsCredential::query()->value('operator_pin_hash'));
    }

    public function test_guest_cannot_set_operator_pin(): void
    {
        $this->put(route('settings.operator-pin.update'), [
            'operator_pin' => '1234',
            'operator_pin_confirmation' => '1234',
        ])->assertRedirect();

        $this->assertNull(SettingsCredential::query()->value('operator_pin_hash'));
    }
}
