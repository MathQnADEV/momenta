<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PsdUnit extends Model
{
    /**
     * Tabel ini menggunakan string sebagai primary key (bukan auto-increment).
     */
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'name',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * Relasi: satu unit Momenta punya banyak foto.
     */
    public function photos(): HasMany
    {
        return $this->hasMany(Photo::class);
    }
}
