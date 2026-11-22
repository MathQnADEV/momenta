<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SettingsCredential extends Model
{
    protected $fillable = ['password_hash', 'operator_pin_hash'];

    protected $hidden = ['password_hash', 'operator_pin_hash'];
}
