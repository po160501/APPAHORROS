<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AccountTransfer extends Model
{
    use HasFactory;

    protected $fillable = ['from_budget_id', 'to_budget_id', 'amount', 'comment', 'date'];

    protected $casts = ['amount' => 'decimal:2', 'date' => 'datetime'];
}
