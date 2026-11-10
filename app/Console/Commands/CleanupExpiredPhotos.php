<?php

namespace App\Console\Commands;

use App\Services\ExpiredPhotoCleaner;
use Illuminate\Console\Command;

class CleanupExpiredPhotos extends Command
{
    protected $signature = 'photos:cleanup';

    protected $description = 'Hapus file foto yang sudah melewati masa retensi.';

    public function handle(ExpiredPhotoCleaner $cleaner): int
    {
        $cleaned = $cleaner->clean();

        if ($cleaned === 0) {
            $this->info('Tidak ada foto kedaluwarsa yang perlu dibersihkan.');

            return self::SUCCESS;
        }

        $this->info("Cleanup selesai. {$cleaned} foto kedaluwarsa telah dihapus.");

        return self::SUCCESS;
    }
}
