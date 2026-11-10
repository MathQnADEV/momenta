<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrintOrder extends Model
{
    protected $fillable = [
        'invoice_number',
        'photo_id',
        'package_code',
        'package_name',
        'amount',
        'status',
        'payment_driver',
        'payment_reference',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'paid_at' => 'datetime',
        ];
    }

    /**
     * Relasi: pesanan cetak berasal dari satu foto sesi.
     */
    public function photo(): BelongsTo
    {
        return $this->belongsTo(Photo::class);
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    /**
     * Data yang dikirim ke kiosk, tanpa detail internal pembayaran.
     */
    public function toPayload(): array
    {
        return [
            'invoice_number' => $this->invoice_number,
            'package_code' => $this->package_code,
            'package_name' => $this->package_name,
            'amount' => $this->amount,
            'status' => $this->status,
            'payment_driver' => $this->payment_driver,
            'paid_at' => $this->paid_at?->toIso8601String(),
        ];
    }
}
