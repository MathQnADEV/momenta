<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('photos', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 32)->unique();
            $table->string('psd_unit_id')->nullable();
            $table->string('file_path');
            $table->string('frame_id');
            $table->enum('status', ['active', 'expired', 'deleted'])->default('active');
            $table->unsignedInteger('file_size')->nullable();
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamps();

            $table->foreign('psd_unit_id')
                  ->references('id')
                  ->on('psd_units')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('photos');
    }
};
