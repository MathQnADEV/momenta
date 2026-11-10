<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Photo extends Model
{
    protected $fillable = [
        'slug',
        'psd_unit_id',
        'file_path',
        'frame_id',
        'status',
        'file_size',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'file_size'  => 'integer',
        ];
    }

    /**
     * Relasi: foto milik satu unit Momenta.
     */
    public function psdUnit(): BelongsTo
    {
        return $this->belongsTo(PsdUnit::class);
    }

    /**
     * Scope: hanya foto aktif (belum expired/deleted).
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active')
                     ->where(function ($query) {
                         $query->whereNull('expires_at')
                               ->orWhere('expires_at', '>', now());
                     });
    }

    /**
     * Scope: foto yang sudah expired tapi belum di-cleanup.
     */
    public function scopeExpired($query)
    {
        return $query->where('status', 'active')
                     ->where('expires_at', '<=', now());
    }

    /**
     * URL publik foto (untuk QR code).
     */
    public function getPublicUrlAttribute(): string
    {
        return url("/foto/{$this->slug}");
    }

    /**
     * URL download file foto.
     */
    public function getDownloadUrlAttribute(): string
    {
        return url("/foto/{$this->slug}/download");
    }
}
