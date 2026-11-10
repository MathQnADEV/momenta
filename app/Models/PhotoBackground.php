<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class PhotoBackground extends Model
{
    protected $fillable = [
        'slug',
        'name',
        'description',
        'image_path',
        'image_source',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function getPublicPathAttribute(): string
    {
        return $this->image_source === 'storage'
            ? 'storage/'.ltrim($this->image_path, '/')
            : ltrim($this->image_path, '/');
    }
}
