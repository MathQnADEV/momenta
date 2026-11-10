<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class PhotoTemplate extends Model
{
    protected $fillable = [
        'slug',
        'name',
        'description',
        'image_path',
        'image_source',
        'canvas_width',
        'canvas_height',
        'grid_columns',
        'grid_rows',
        'photo_slots',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'photo_slots' => 'array',
            'is_active' => 'boolean',
            'canvas_width' => 'integer',
            'canvas_height' => 'integer',
            'grid_columns' => 'integer',
            'grid_rows' => 'integer',
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

    public function getLayoutKeyAttribute(): string
    {
        return 'template-'.$this->slug;
    }
}
