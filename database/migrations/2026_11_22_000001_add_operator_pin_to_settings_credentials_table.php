<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * PIN operator untuk mengonfirmasi pembayaran QRIS statis di booth.
     */
    public function up(): void
    {
        Schema::table('settings_credentials', function (Blueprint $table) {
            $table->string('operator_pin_hash')->nullable()->after('password_hash');
        });
    }

    public function down(): void
    {
        Schema::table('settings_credentials', function (Blueprint $table) {
            $table->dropColumn('operator_pin_hash');
        });
    }
};
