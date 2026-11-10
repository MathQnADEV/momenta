<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\PhotoBackground;
use App\Models\PhotoTemplate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\View\View;

class TemplateSettingsController extends Controller
{
    public function index(): View
    {
        $templates = PhotoTemplate::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $settingsTemplates = $templates->map(fn (PhotoTemplate $template): array => [
            'id' => $template->id,
            'name' => $template->name,
            'description' => $template->description,
            'imageUrl' => asset($template->public_path),
            'canvasWidth' => $template->canvas_width,
            'canvasHeight' => $template->canvas_height,
            'gridColumns' => $template->grid_columns,
            'gridRows' => $template->grid_rows,
            'slots' => $template->photo_slots,
            'textSlots' => $template->text_slots ?? [],
            'isActive' => $template->is_active,
            'sortOrder' => $template->sort_order,
            'updateUrl' => route('settings.templates.update', $template),
        ])->values();

        $backgrounds = Schema::hasTable('photo_backgrounds')
            ? PhotoBackground::query()->orderBy('sort_order')->orderBy('name')->get()
            : collect();

        $settingsBackgrounds = $backgrounds->map(fn (PhotoBackground $background): array => [
            'id' => $background->id,
            'name' => $background->name,
            'description' => $background->description,
            'imageUrl' => asset($background->public_path),
            'isActive' => $background->is_active,
            'sortOrder' => $background->sort_order,
            'updateUrl' => route('settings.backgrounds.update', $background),
        ])->values();

        return view('settings.index', compact(
            'templates',
            'settingsTemplates',
            'backgrounds',
            'settingsBackgrounds',
        ));
    }

    public function store(Request $request): RedirectResponse
    {
        [$validated, $slots, $textSlots] = $this->validatePayload($request, true);
        $image = $request->file('template_image');
        [$imagePath, $canvasWidth, $canvasHeight] = $this->storeImage($image);

        PhotoTemplate::create([
            'slug' => $this->uniqueSlug($validated['name']),
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'image_path' => $imagePath,
            'image_source' => 'storage',
            'canvas_width' => $canvasWidth,
            'canvas_height' => $canvasHeight,
            'grid_columns' => $validated['grid_columns'],
            'grid_rows' => $validated['grid_rows'],
            'photo_slots' => $this->normalizeSlotsForCanvas($slots, $validated, $canvasWidth, $canvasHeight),
            'text_slots' => $this->normalizeTextSlotsForCanvas($textSlots, $validated, $canvasWidth, $canvasHeight),
            'is_active' => $request->boolean('is_active'),
            'sort_order' => $validated['sort_order'],
        ]);

        return redirect()
            ->route('settings.index')
            ->with('success', 'Template berhasil ditambahkan.');
    }

    public function update(Request $request, PhotoTemplate $template): RedirectResponse
    {
        [$validated, $slots, $textSlots] = $this->validatePayload($request, false);

        $imagePath = $template->image_path;
        $imageSource = $template->image_source;
        $canvasWidth = $template->canvas_width;
        $canvasHeight = $template->canvas_height;

        if ($request->hasFile('template_image')) {
            [$newPath, $newWidth, $newHeight] = $this->storeImage($request->file('template_image'));
            $this->deleteStoredImage($template);
            $imagePath = $newPath;
            $imageSource = 'storage';
            $canvasWidth = $newWidth;
            $canvasHeight = $newHeight;
        }

        $template->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'image_path' => $imagePath,
            'image_source' => $imageSource,
            'canvas_width' => $canvasWidth,
            'canvas_height' => $canvasHeight,
            'grid_columns' => $validated['grid_columns'],
            'grid_rows' => $validated['grid_rows'],
            'photo_slots' => $this->normalizeSlotsForCanvas($slots, $validated, $canvasWidth, $canvasHeight),
            'text_slots' => $this->normalizeTextSlotsForCanvas($textSlots, $validated, $canvasWidth, $canvasHeight),
            'is_active' => $request->boolean('is_active'),
            'sort_order' => $validated['sort_order'],
        ]);

        return redirect()
            ->route('settings.index')
            ->with('success', 'Template berhasil diperbarui.');
    }

    public function destroy(PhotoTemplate $template): RedirectResponse
    {
        $this->deleteStoredImage($template);
        $template->delete();

        return redirect()
            ->route('settings.index')
            ->with('success', 'Template berhasil dihapus.');
    }

    private function validatePayload(Request $request, bool $imageRequired): array
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:180'],
            'template_image' => [
                $imageRequired ? 'required' : 'nullable',
                'file',
                'image',
                'mimes:png,jpg,jpeg,webp',
                'max:20480',
            ],
            'grid_columns' => ['required', 'integer', 'min:1', 'max:6'],
            'grid_rows' => ['required', 'integer', 'min:1', 'max:8'],
            'editor_canvas_width' => ['required', 'integer', 'min:1', 'max:10000'],
            'editor_canvas_height' => ['required', 'integer', 'min:1', 'max:10000'],
            'photo_slots' => ['required', 'string'],
            'text_slots' => ['nullable', 'string'],
            'sort_order' => ['required', 'integer', 'min:0', 'max:9999'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $slots = json_decode($validated['photo_slots'], true);
        if (! is_array($slots) || count($slots) < 1 || count($slots) > 48) {
            throw ValidationException::withMessages([
                'photo_slots' => 'Jumlah area foto harus antara 1 sampai 48.',
            ]);
        }

        foreach ($slots as $index => $slot) {
            foreach (['x', 'y', 'w', 'h'] as $key) {
                if (! isset($slot[$key]) || ! is_numeric($slot[$key])) {
                    throw ValidationException::withMessages([
                        'photo_slots' => 'Data area foto ke-'.($index + 1).' tidak valid.',
                    ]);
                }
            }

            if ((float) $slot['w'] <= 0 || (float) $slot['h'] <= 0) {
                throw ValidationException::withMessages([
                    'photo_slots' => 'Lebar dan tinggi area foto harus lebih dari nol.',
                ]);
            }
        }

        $textSlots = json_decode($validated['text_slots'] ?? '[]', true);
        if (! is_array($textSlots) || count($textSlots) > 12) {
            throw ValidationException::withMessages([
                'text_slots' => 'Jumlah area teks maksimum 12.',
            ]);
        }

        foreach ($textSlots as $index => $slot) {
            $geometryValid = is_array($slot) && collect(['x', 'y', 'w', 'h'])
                ->every(fn (string $key): bool => isset($slot[$key]) && is_numeric($slot[$key]));

            if (! $geometryValid || (float) $slot['w'] <= 0 || (float) $slot['h'] <= 0) {
                throw ValidationException::withMessages([
                    'text_slots' => 'Data area teks ke-'.($index + 1).' tidak valid.',
                ]);
            }
        }

        return [$validated, $slots, $textSlots];
    }

    private function normalizeSlotsForCanvas(
        array $slots,
        array $validated,
        int $targetWidth,
        int $targetHeight,
    ): array {
        $sourceWidth = max(1, (int) $validated['editor_canvas_width']);
        $sourceHeight = max(1, (int) $validated['editor_canvas_height']);
        $scaleX = $targetWidth / $sourceWidth;
        $scaleY = $targetHeight / $sourceHeight;

        return array_map(function (array $slot) use ($scaleX, $scaleY, $targetWidth, $targetHeight): array {
            $x = max(0, min($targetWidth - 1, (int) round((float) $slot['x'] * $scaleX)));
            $y = max(0, min($targetHeight - 1, (int) round((float) $slot['y'] * $scaleY)));
            $w = max(1, min($targetWidth - $x, (int) round((float) $slot['w'] * $scaleX)));
            $h = max(1, min($targetHeight - $y, (int) round((float) $slot['h'] * $scaleY)));

            return compact('x', 'y', 'w', 'h');
        }, $slots);
    }

    /**
     * Area teks memakai skala yang sama dengan area foto, ditambah gaya teks
     * yang dibersihkan agar hanya berisi nilai yang dikenal kiosk.
     */
    private function normalizeTextSlotsForCanvas(
        array $textSlots,
        array $validated,
        int $targetWidth,
        int $targetHeight,
    ): array {
        $geometry = $this->normalizeSlotsForCanvas($textSlots, $validated, $targetWidth, $targetHeight);
        $fonts = array_keys(config('photobooth.text_fonts', []));

        return array_values(array_map(function (array $slot, array $box) use ($fonts): array {
            $color = (string) ($slot['color'] ?? '');

            return [
                ...$box,
                'label' => Str::limit(trim((string) ($slot['label'] ?? '')), 40, '') ?: 'Teks',
                'placeholder' => Str::limit(trim((string) ($slot['placeholder'] ?? '')), 80, ''),
                'max_length' => max(1, min(120, (int) ($slot['max_length'] ?? 30))),
                'font' => in_array($slot['font'] ?? null, $fonts, true) ? $slot['font'] : ($fonts[0] ?? 'sans'),
                'color' => preg_match('/^#[0-9a-fA-F]{6}$/', $color) ? strtolower($color) : '#2b2725',
                'align' => in_array($slot['align'] ?? null, ['left', 'center', 'right'], true) ? $slot['align'] : 'center',
                'rotation' => max(-180, min(180, round((float) ($slot['rotation'] ?? 0), 1))),
            ];
        }, $textSlots, $geometry));
    }

    private function storeImage(UploadedFile $image): array
    {
        $size = @getimagesize($image->getRealPath());

        if (! $size || empty($size[0]) || empty($size[1])) {
            throw ValidationException::withMessages([
                'template_image' => 'Dimensi gambar template tidak dapat dibaca.',
            ]);
        }

        $path = $image->store('templates', 'public');

        return [$path, (int) $size[0], (int) $size[1]];
    }

    private function deleteStoredImage(PhotoTemplate $template): void
    {
        if ($template->image_source === 'storage' && $template->image_path) {
            Storage::disk('public')->delete($template->image_path);
        }
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'template';
        $slug = $base;
        $counter = 2;

        while (PhotoTemplate::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$counter;
            $counter += 1;
        }

        return $slug;
    }
}
