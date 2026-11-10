<?php

namespace App\Services;

use App\Models\Photo;
use Illuminate\Support\Facades\Storage;

class ExpiredPhotoCleaner
{
    /**
     * Delete expired photo files and mark their database records as expired.
     */
    public function clean(?string $psdUnitId = null): int
    {
        $cleaned = 0;

        Photo::expired()
            ->when($psdUnitId, fn ($query) => $query->where('psd_unit_id', $psdUnitId))
            ->orderBy('id')
            ->chunkById(100, function ($photos) use (&$cleaned): void {
                foreach ($photos as $photo) {
                    if (Storage::disk('public')->exists($photo->file_path)) {
                        Storage::disk('public')->delete($photo->file_path);
                    }

                    $photo->update(['status' => 'expired']);
                    $cleaned++;
                }
            });

        return $cleaned;
    }
}
