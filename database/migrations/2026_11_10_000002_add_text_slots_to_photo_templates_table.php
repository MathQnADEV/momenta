<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('photo_templates', function (Blueprint $table) {
            $table->json('text_slots')->nullable()->after('photo_slots');
        });
    }

    public function down(): void
    {
        Schema::table('photo_templates', function (Blueprint $table) {
            $table->dropColumn('text_slots');
        });
    }
};
