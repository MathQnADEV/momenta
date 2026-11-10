<?php

use App\Http\Controllers\Api\PhotoController;
use App\Http\Controllers\Api\PrintOrderController;
use App\Http\Controllers\PhotoBoothController;
use App\Http\Controllers\PublicPhotoController;
use App\Http\Controllers\Settings\BackgroundSettingsController;
use App\Http\Controllers\Settings\SettingsAuthController;
use App\Http\Controllers\Settings\TemplateSettingsController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes — Halaman Kiosk, Publik, dan Pengaturan
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return redirect('/photobooth');
});

Route::prefix('photobooth')->group(function () {
    Route::get('/', [PhotoBoothController::class, 'index'])->name('photobooth.index');
    Route::get('/session', [PhotoBoothController::class, 'session'])->name('photobooth.session');
});

Route::get('/foto/{slug}', [PublicPhotoController::class, 'show'])->name('photo.show');
Route::get('/foto/{slug}/download', [PublicPhotoController::class, 'download'])->name('photo.download');

Route::post('/api/photos', [PhotoController::class, 'store'])->name('api.photos.store');

Route::prefix('api/print-orders')->middleware('throttle:60,1')->group(function () {
    Route::post('/', [PrintOrderController::class, 'store'])->name('api.print-orders.store');
    Route::get('/{invoice}', [PrintOrderController::class, 'show'])->name('api.print-orders.show');
    Route::post('/{invoice}/simulate-payment', [PrintOrderController::class, 'simulatePayment'])
        ->name('api.print-orders.simulate-payment');
});

Route::prefix('photobooth/settings')->group(function () {
    Route::get('/login', [SettingsAuthController::class, 'showLogin'])->name('settings.login');
    Route::post('/login', [SettingsAuthController::class, 'login'])
        ->middleware('throttle:10,1')
        ->name('settings.login.submit');

    Route::middleware('settings.auth')->group(function () {
        Route::get('/', [TemplateSettingsController::class, 'index'])->name('settings.index');
        Route::get('/csrf-token', [SettingsAuthController::class, 'csrfToken'])->name('settings.csrf-token');
        Route::post('/logout', [SettingsAuthController::class, 'logout'])->name('settings.logout');
        Route::post('/templates', [TemplateSettingsController::class, 'store'])->name('settings.templates.store');
        Route::put('/templates/{template}', [TemplateSettingsController::class, 'update'])->name('settings.templates.update');
        Route::delete('/templates/{template}', [TemplateSettingsController::class, 'destroy'])->name('settings.templates.destroy');
        Route::post('/backgrounds', [BackgroundSettingsController::class, 'store'])->name('settings.backgrounds.store');
        Route::put('/backgrounds/{background}', [BackgroundSettingsController::class, 'update'])->name('settings.backgrounds.update');
        Route::delete('/backgrounds/{background}', [BackgroundSettingsController::class, 'destroy'])->name('settings.backgrounds.destroy');
    });
});

// URL lama diarahkan ke lokasi Settings yang berada di bawah /photobooth.
Route::get('/settings', fn () => redirect()->route('settings.index'));
Route::get('/settings/login', fn () => redirect()->route('settings.login'));
