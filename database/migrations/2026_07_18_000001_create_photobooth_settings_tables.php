<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings_credentials', function (Blueprint $table) {
            $table->id();
            $table->string('password_hash');
            $table->timestamps();
        });

        Schema::create('photo_templates', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('description')->nullable();
            $table->string('image_path');
            $table->string('image_source', 20)->default('storage');
            $table->unsignedInteger('canvas_width');
            $table->unsignedInteger('canvas_height');
            $table->unsignedTinyInteger('grid_columns')->default(1);
            $table->unsignedTinyInteger('grid_rows')->default(1);
            $table->json('photo_slots');
            $table->boolean('is_active')->default(true)->index();
            $table->unsignedInteger('sort_order')->default(0)->index();
            $table->timestamps();
        });

        $now = now();

        DB::table('settings_credentials')->insert([
            'password_hash' => '$2y$12$XAzYMqQpVhh.qtdk9ESrLu4TdxYdmaTmjjq6EDNBX..ubxrtLUqHK',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('photo_templates')->insert([
            [
                'slug' => 'hijau',
                'name' => 'Template Hijau',
                'description' => '7 foto template',
                'image_path' => 'frames/1.png',
                'image_source' => 'public',
                'canvas_width' => 735,
                'canvas_height' => 919,
                'grid_columns' => 2,
                'grid_rows' => 4,
                'photo_slots' => json_encode([
                    ['x' => 167, 'y' => 143, 'w' => 179, 'h' => 140],
                    ['x' => 389, 'y' => 143, 'w' => 179, 'h' => 139],
                    ['x' => 167, 'y' => 294, 'w' => 179, 'h' => 139],
                    ['x' => 389, 'y' => 294, 'w' => 178, 'h' => 141],
                    ['x' => 167, 'y' => 445, 'w' => 179, 'h' => 291],
                    ['x' => 389, 'y' => 445, 'w' => 179, 'h' => 140],
                    ['x' => 389, 'y' => 595, 'w' => 179, 'h' => 141],
                ]),
                'is_active' => true,
                'sort_order' => 10,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'slug' => 'memories',
                'name' => 'Template Memories',
                'description' => '4 foto strip',
                'image_path' => 'frames/2.png',
                'image_source' => 'public',
                'canvas_width' => 736,
                'canvas_height' => 1308,
                'grid_columns' => 1,
                'grid_rows' => 4,
                'photo_slots' => json_encode([
                    ['x' => 206, 'y' => 60, 'w' => 357, 'h' => 246],
                    ['x' => 207, 'y' => 319, 'w' => 356, 'h' => 246],
                    ['x' => 207, 'y' => 578, 'w' => 356, 'h' => 260],
                    ['x' => 207, 'y' => 852, 'w' => 357, 'h' => 237],
                ]),
                'is_active' => true,
                'sort_order' => 20,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'slug' => 'merah',
                'name' => 'Template Merah',
                'description' => '3 foto strip',
                'image_path' => 'frames/3.png',
                'image_source' => 'public',
                'canvas_width' => 450,
                'canvas_height' => 1176,
                'grid_columns' => 1,
                'grid_rows' => 3,
                'photo_slots' => json_encode([
                    ['x' => 32, 'y' => 23, 'w' => 386, 'h' => 300],
                    ['x' => 32, 'y' => 350, 'w' => 386, 'h' => 300],
                    ['x' => 32, 'y' => 679, 'w' => 386, 'h' => 301],
                ]),
                'is_active' => true,
                'sort_order' => 30,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'slug' => 'merah-v2',
                'name' => 'Template Merah V2',
                'description' => '3 foto strip',
                'image_path' => 'frames/4.png',
                'image_source' => 'public',
                'canvas_width' => 510,
                'canvas_height' => 1093,
                'grid_columns' => 1,
                'grid_rows' => 3,
                'photo_slots' => json_encode([
                    ['x' => 93, 'y' => 92, 'w' => 324, 'h' => 250],
                    ['x' => 93, 'y' => 365, 'w' => 325, 'h' => 252],
                    ['x' => 92, 'y' => 641, 'w' => 326, 'h' => 253],
                ]),
                'is_active' => true,
                'sort_order' => 40,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'slug' => 'song',
                'name' => 'Template Song Spotify',
                'description' => '4 foto strip',
                'image_path' => 'frames/5.png',
                'image_source' => 'public',
                'canvas_width' => 1200,
                'canvas_height' => 3600,
                'grid_columns' => 1,
                'grid_rows' => 4,
                'photo_slots' => json_encode([
                    ['x' => 49, 'y' => 115, 'w' => 1095, 'h' => 709],
                    ['x' => 49, 'y' => 863, 'w' => 1095, 'h' => 709],
                    ['x' => 49, 'y' => 1610, 'w' => 1095, 'h' => 709],
                    ['x' => 49, 'y' => 2356, 'w' => 1095, 'h' => 709],
                ]),
                'is_active' => true,
                'sort_order' => 50,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('photo_templates');
        Schema::dropIfExists('settings_credentials');
    }
};
