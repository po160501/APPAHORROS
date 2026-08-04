<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MonthlyIncome extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'month', 'amount'];

    protected $casts = ['amount' => 'decimal:2'];
}
