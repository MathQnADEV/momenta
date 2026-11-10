<?php

namespace Tests\Feature;

use App\Models\PhotoTemplate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TemplateTextSlotTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $textSlots): array
    {
        return [
            '_method' => 'PUT',
            'name' => 'Template Yudisium',
            'description' => '1 foto',
            'grid_columns' => 1,
            'grid_rows' => 1,
            'editor_canvas_width' => 735,
            'editor_canvas_height' => 919,
            'photo_slots' => json_encode([['x' => 10, 'y' => 10, 'w' => 300, 'h' => 300]]),
            'text_slots' => json_encode($textSlots),
            'sort_order' => 10,
            'is_active' => 1,
        ];
    }

    public function test_text_slots_are_saved_and_sanitized(): void
    {
        $template = PhotoTemplate::where('slug', 'hijau')->firstOrFail();

        $this->withSession(['settings_authenticated' => true])
            ->post(route('settings.templates.update', $template), $this->payload([[
                'x' => 100, 'y' => 700, 'w' => 300, 'h' => 60,
                'label' => 'Nama', 'placeholder' => "Nama Ta'",
                'font' => 'handwriting', 'color' => '#AA3344', 'align' => 'left',
                'rotation' => -6.5, 'max_length' => 999,
            ], [
                'x' => 50, 'y' => 50, 'w' => 100, 'h' => 40,
                'font' => 'comic-sans', 'color' => 'red', 'align' => 'justify', 'rotation' => 900,
            ]]))
            ->assertRedirect(route('settings.index'));

        $slots = $template->fresh()->text_slots;

        $this->assertCount(2, $slots);
        $this->assertSame(['x' => 100, 'y' => 700, 'w' => 300, 'h' => 60], array_intersect_key($slots[0], array_flip(['x', 'y', 'w', 'h'])));
        $this->assertSame('handwriting', $slots[0]['font']);
        $this->assertSame('#aa3344', $slots[0]['color']);
        $this->assertSame('left', $slots[0]['align']);
        $this->assertEquals(-6.5, $slots[0]['rotation']);
        $this->assertSame(120, $slots[0]['max_length']);

        // Nilai yang tidak dikenal diganti nilai aman.
        $this->assertSame('handwriting', $slots[1]['font']);
        $this->assertSame('#2b2725', $slots[1]['color']);
        $this->assertSame('center', $slots[1]['align']);
        $this->assertEquals(180, $slots[1]['rotation']);
        $this->assertSame('Teks', $slots[1]['label']);
    }

    public function test_kiosk_receives_template_text_slots(): void
    {
        $template = PhotoTemplate::where('slug', 'hijau')->firstOrFail();
        $template->update(['text_slots' => [[
            'x' => 100, 'y' => 700, 'w' => 300, 'h' => 60, 'label' => 'Nama', 'placeholder' => '',
            'max_length' => 30, 'font' => 'script', 'color' => '#2b2725', 'align' => 'center', 'rotation' => 0,
        ]]]);

        $this->withoutVite()
            ->get(route('photobooth.session'))
            ->assertOk()
            ->assertSee('"texts":[{"x":100', false)
            ->assertSee('"family":"Dancing Script"', false);
    }
}
