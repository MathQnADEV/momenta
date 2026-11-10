<?php

namespace Database\Seeders;

use App\Models\PsdUnit;
use Illuminate\Database\Seeder;

class PsdUnitSeeder extends Seeder
{
    /**
     * Ensure the configured kiosk unit exists before uploads are accepted.
     */
    public function run(): void
    {
        PsdUnit::updateOrCreate(
            ['id' => config('photobooth.default_unit_id')],
            [
                'name' => config('photobooth.default_unit_name'),
                'is_active' => true,
            ],
        );
    }
}
