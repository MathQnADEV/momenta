<?php

namespace App\Http\Controllers;

use App\Models\Photo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PublicPhotoController extends Controller
{
    /**
     * GET /foto/{slug} — Halaman publik foto (dari scan QR).
     */
    public function show(string $slug)
    {
        $photo = Photo::active()
            ->where('slug', $slug)
            ->firstOrFail();

        $imageUrl = asset('storage/' . $photo->file_path);
        $frameName = config("photobooth.frames.{$photo->frame_id}.name", $photo->frame_id);

        return view('public.photo-show', compact('photo', 'imageUrl', 'frameName'));
    }

    /**
     * GET /foto/{slug}/download — Download file foto.
     */
    public function download(string $slug)
    {
        $photo = Photo::active()
            ->where('slug', $slug)
            ->firstOrFail();

        $path = Storage::disk('public')->path($photo->file_path);

        return response()->download($path, "photobooth-{$photo->slug}.jpg");
    }
}
