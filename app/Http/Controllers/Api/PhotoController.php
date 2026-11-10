<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePhotoRequest;
use App\Models\Photo;
use App\Models\PsdUnit;
use App\Services\ExpiredPhotoCleaner;
use App\Services\PhotoSlugGenerator;
use App\Services\QrPayloadBuilder;
use Illuminate\Http\JsonResponse;

class PhotoController extends Controller
{
    public function __construct(
        private PhotoSlugGenerator $slugGenerator,
        private QrPayloadBuilder $qrBuilder,
        private ExpiredPhotoCleaner $expiredPhotoCleaner,
    ) {}

    /**
     * POST /api/photos — Upload foto dari kiosk.
     */
    public function store(StorePhotoRequest $request): JsonResponse
    {
        $file = $request->file('photo');
        $slug = $this->slugGenerator->generate();

        // Untuk kiosk single-unit, identitas unit harus berasal dari konfigurasi
        // server, bukan dari browser. Unit dibuat otomatis agar upload tidak gagal
        // hanya karena seeder belum pernah dijalankan.
        $psdUnitId = (string) config('photobooth.default_unit_id', 'PSD-DEFAULT-01');
        $psdUnitName = (string) config('photobooth.default_unit_name', 'PSD Default Unit');

        PsdUnit::updateOrCreate(
            ['id' => $psdUnitId],
            [
                'name' => $psdUnitName,
                'is_active' => true,
            ],
        );

        $this->expiredPhotoCleaner->clean($psdUnitId);

        $path = $file->store("photos/{$psdUnitId}", 'public');

        $photo = Photo::create([
            'slug' => $slug,
            'psd_unit_id' => $psdUnitId,
            'file_path' => $path,
            'frame_id' => $request->input('frame_id') ?? 'default',
            'status' => 'active',
            'file_size' => $file->getSize(),
            'expires_at' => now()->addMinutes((int) config('photobooth.retention_minutes', 10)),
        ]);

        return response()->json($this->qrBuilder->buildPayload($photo), 201);
    }
}
