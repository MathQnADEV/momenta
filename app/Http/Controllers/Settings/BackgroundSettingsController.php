<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\PhotoBackground;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BackgroundSettingsController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validatePayload($request, true);
        $path = $this->storeImage($request->file('background_image'));

        PhotoBackground::create([
            'slug' => $this->uniqueSlug($validated['name']),
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'image_path' => $path,
            'image_source' => 'storage',
            'is_active' => $request->boolean('is_active'),
            'sort_order' => $validated['sort_order'],
        ]);

        return redirect()
            ->route('settings.index', ['tab' => 'backgrounds'])
            ->with('success', 'Background berhasil ditambahkan.');
    }

    public function update(Request $request, PhotoBackground $background): RedirectResponse
    {
        $validated = $this->validatePayload($request, false);
        $imagePath = $background->image_path;
        $imageSource = $background->image_source;

        if ($request->hasFile('background_image')) {
            $newPath = $this->storeImage($request->file('background_image'));
            $this->deleteStoredImage($background);
            $imagePath = $newPath;
            $imageSource = 'storage';
        }

        $background->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'image_path' => $imagePath,
            'image_source' => $imageSource,
            'is_active' => $request->boolean('is_active'),
            'sort_order' => $validated['sort_order'],
        ]);

        return redirect()
            ->route('settings.index', ['tab' => 'backgrounds'])
            ->with('success', 'Background berhasil diperbarui.');
    }

    public function destroy(PhotoBackground $background): RedirectResponse
    {
        $this->deleteStoredImage($background);
        $background->delete();

        return redirect()
            ->route('settings.index', ['tab' => 'backgrounds'])
            ->with('success', 'Background berhasil dihapus.');
    }

    private function validatePayload(Request $request, bool $imageRequired): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:180'],
            'background_image' => [
                $imageRequired ? 'required' : 'nullable',
                'file',
                'image',
                'mimes:png,jpg,jpeg,webp',
                'max:20480',
            ],
            'sort_order' => ['required', 'integer', 'min:0', 'max:9999'],
            'is_active' => ['nullable', 'boolean'],
        ]);
    }

    private function storeImage(?UploadedFile $image): string
    {
        abort_if(! $image, 422, 'Gambar background wajib dipilih.');

        return $image->store('photobooth/backgrounds', 'public');
    }

    private function deleteStoredImage(PhotoBackground $background): void
    {
        if ($background->image_source === 'storage' && $background->image_path !== '') {
            Storage::disk('public')->delete($background->image_path);
        }
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'background';
        $slug = $base;
        $counter = 2;

        while (PhotoBackground::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$counter;
            $counter++;
        }

        return $slug;
    }
}
