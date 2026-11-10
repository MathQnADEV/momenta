<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingsCsrfTokenTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_settings_user_can_refresh_csrf_token(): void
    {
        $response = $this
            ->withSession(['settings_authenticated' => true])
            ->getJson(route('settings.csrf-token'));

        $response
            ->assertOk()
            ->assertJsonStructure(['token']);

        $this->assertNotEmpty($response->json('token'));
    }

    public function test_guest_cannot_refresh_settings_csrf_token(): void
    {
        $this->get(route('settings.csrf-token'))
            ->assertRedirect(route('settings.login'));
    }
}
