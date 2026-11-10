<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('print_orders', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number', 40)->unique();
            $table->foreignId('photo_id')->nullable()->constrained('photos')->nullOnDelete();
            $table->string('package_code', 10);
            $table->string('package_name');
            $table->unsignedInteger('amount');
            $table->enum('status', ['pending', 'paid', 'failed', 'expired'])->default('pending')->index();
            $table->string('payment_driver', 30);
            $table->string('payment_reference')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('print_orders');
    }
};
