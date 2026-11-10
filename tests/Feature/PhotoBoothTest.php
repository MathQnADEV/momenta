<?php

namespace Tests\Feature;

use App\Models\Photo;
use App\Models\PsdUnit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PhotoBoothTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed default unit so foreign key constraint passes
        PsdUnit::create([
            'id' => 'PSD-DEFAULT-01',
            'name' => 'PSD Default Unit',
            'is_active' => true,
        ]);
    }

    /**
     * Test kiosk views return success.
     */
    public function test_kiosk_pages_load_successfully(): void
    {
        $response = $this->get('/photobooth');
        $response.assertStatus(302); // Redirect to login or /photobooth directly? Wait, get('/') was redirect.
        
        $response = $this->get('/photobooth');
        $response->assertStatus(200);
        $response->assertSee('Foto Kenangan');

        $response = $this->get('/photobooth/session');
        $response->assertStatus(200);
        $response->assertSee('Pilih Bingkai');
        $response->assertSee(config('photobooth.idle_redirect_url'), false);
        $this->assertSame(1, substr_count($response->getContent(), 'class="psd-home-link"'));
        $response->assertSeeInOrder([
            '>Momenta</span>',
            'Pilih Layout',
            'Ambil Foto',
            'Pilih Bingkai & Gaya',
            'Hias Foto',
            'Preview Hasil',
        ], false);
    }

    /**
     * Test photo upload API.
     */
    public function test_photo_upload_endpoint(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->image('pose.jpg', 600, 800);

        $response = $this->postJson('/api/photos', [
            'photo' => $file,
            'frame_id' => 'classic-white',
            'psd_unit_id' => 'PSD-DEFAULT-01',
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'slug',
            'download_url',
            'qr_svg',
        ]);

        $slug = $response->json('slug');
        $this->assertDatabaseHas('photos', [
            'slug' => $slug,
            'frame_id' => 'classic-white',
            'status' => 'active',
        ]);

        // Verify file is stored
        $photo = Photo::where('slug', $slug)->first();
        Storage::disk('public')->assertExists($photo->file_path);
    }

    /**
     * Test public photo download and show pages.
     */
    public function test_public_photo_pages(): void
    {
        $photo = Photo::create([
            'slug' => 'ABCDEFGH',
            'psd_unit_id' => 'PSD-DEFAULT-01',
            'file_path' => 'photos/PSD-DEFAULT-01/test.jpg',
            'frame_id' => 'classic-white',
            'status' => 'active',
            'file_size' => 1024,
            'expires_at' => now()->addDays(7),
        ]);

        $response = $this->get("/foto/{$photo->slug}");
        $response->assertStatus(200);
        $response->assertSee('Foto Kenangan');

        // Test non-existent slug returns 404
        $response = $this->get('/foto/NONEXIST');
        $response->assertStatus(404);
    }

    /**
     * Test photos gallery API.
     */
    public function test_photos_gallery_endpoint(): void
    {
        Photo::create([
            'slug' => 'AAAAAAAB',
            'psd_unit_id' => 'PSD-DEFAULT-01',
            'file_path' => 'photos/PSD-DEFAULT-01/test1.jpg',
            'frame_id' => 'classic-white',
            'status' => 'active',
            'file_size' => 1024,
            'expires_at' => now()->addDays(7),
        ]);

        $response = $this->getJson('/api/photos?psd_unit_id=PSD-DEFAULT-01');
        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
    }
}
