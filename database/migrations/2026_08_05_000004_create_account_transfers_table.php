<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('account_transfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('from_budget_id')->constrained('budgets')->cascadeOnDelete();
            $table->foreignId('to_budget_id')->constrained('budgets')->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->string('comment')->nullable();
            $table->dateTime('date');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_transfers');
    }
};
