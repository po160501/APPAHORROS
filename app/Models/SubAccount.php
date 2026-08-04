<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'budget_id',
        'name',
        'type',
        'initial_amount',
        'current_amount',
    ];

    public function budget(): BelongsTo
    {
        return $this->belongsTo(Budget::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class)->orderBy('date', 'desc');
    }
}
