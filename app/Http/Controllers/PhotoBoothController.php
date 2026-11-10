<?php

namespace App\Http\Controllers;

use App\Models\PhotoBackground;
use App\Models\PhotoTemplate;
use Illuminate\Support\Facades\Schema;

class PhotoBoothController extends Controller
{
    public function index()
    {
        return view('photobooth.index');
    }

    public function session()
    {
        $layouts = collect(config('photobooth.layouts', []))
            ->reject(fn (array $layout) => isset($layout['default_frame']))
            ->all();
        $frames = [];

        if (Schema::hasTable('photo_templates')) {
            PhotoTemplate::query()
                ->active()
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
                ->each(function (PhotoTemplate $template) use (&$layouts, &$frames): void {
                    $key = $template->layout_key;
                    $publicPath = $template->public_path;
                    $slots = array_values($template->photo_slots ?? []);

                    if (count($slots) < 1) {
                        return;
                    }

                    $layouts[$key] = [
                        'name' => $template->name,
                        'desc' => $template->description ?: count($slots).' foto template',
                        'poses' => count($slots),
                        'default_frame' => $key,
                        'css_grid' => sprintf(
                            'grid-template-columns: repeat(%d, 1fr); grid-template-rows: repeat(%d, 1fr);',
                            max(1, $template->grid_columns),
                            max(1, $template->grid_rows),
                        ),
                        'preview_style' => 'width: 76px; height: 96px;',
                    ];

                    $frames[$key] = [
                        'name' => $template->name,
                        'overlay' => $publicPath,
                        'thumbnail' => $publicPath,
                        'type' => 'template',
                        'layout' => $key,
                        'canvas' => [
                            'w' => $template->canvas_width,
                            'h' => $template->canvas_height,
                        ],
                        'photos' => $slots,
                    ];
                });
        }

        $photoBackgrounds = [];
        if (Schema::hasTable('photo_backgrounds')) {
            $photoBackgrounds = PhotoBackground::query()
                ->active()
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
                ->map(fn (PhotoBackground $background): array => [
                    'id' => $background->id,
                    'name' => $background->name,
                    'description' => $background->description,
                    'url' => asset($background->public_path),
                ])
                ->values()
                ->all();
        }

        $stickerColors = config('photobooth.sticker_colors', []);
        $stickerCategories = config('photobooth.sticker_categories', []);
        $stickerEmojis = config('photobooth.sticker_emojis', []);
        $stickerLayouts = config('photobooth.sticker_layouts', []);
        $stickerAutoThemes = config('photobooth.sticker_auto_themes', []);
        $captureTimers = config('photobooth.capture_timers', [3, 5, 10]);
        $psdUnitId = config('photobooth.default_unit_id');

        return view('photobooth.session', compact(
            'layouts',
            'frames',
            'stickerColors',
            'stickerCategories',
            'stickerEmojis',
            'stickerLayouts',
            'stickerAutoThemes',
            'captureTimers',
            'photoBackgrounds',
            'psdUnitId',
        ));
    }
}
