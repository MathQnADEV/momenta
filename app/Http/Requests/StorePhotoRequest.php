<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePhotoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Kiosk publik, tidak perlu auth.
    }

    public function rules(): array
    {
        $maxSize = config('photobooth.max_upload_size', 8192);

        return [
            'photo' => [
                'required',
                'file',
                'image',
                'mimes:png,jpeg,jpg',
                "max:{$maxSize}",
            ],
            'frame_id' => [
                'nullable',
                'string',
                'max:100',
            ],
            // Unit kiosk ditentukan server. Field ini hanya diterima untuk
            // kompatibilitas dengan frontend lama dan tidak dijadikan sumber kebenaran.
            'psd_unit_id' => [
                'nullable',
                'string',
                'max:100',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'photo.required' => 'File foto wajib diunggah.',
            'photo.image' => 'File harus berupa gambar.',
            'photo.mimes' => 'Format gambar harus PNG atau JPEG.',
            'photo.max' => 'Ukuran foto maksimum 8MB.',
        ];
    }
}
