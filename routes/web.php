<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\BudgetController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return auth()->check()
        ? redirect()->route('dashboard')
        : redirect()->route('login');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [BudgetController::class, 'index'])->name('dashboard');
    Route::post('/budgets', [BudgetController::class, 'storeBudget'])->name('budgets.store');
    Route::post('/sub-accounts', [BudgetController::class, 'storeSubAccount'])->name('sub-accounts.store');
    Route::post('/expenses', [BudgetController::class, 'storeExpense'])->name('expenses.store');
    Route::delete('/expenses/{id}', [BudgetController::class, 'destroyExpense'])->name('expenses.destroy');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/cover', [ProfileController::class, 'updateCover'])->name('profile.cover');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__ . '/auth.php';
