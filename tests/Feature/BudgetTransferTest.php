<?php

namespace Tests\Feature;

use App\Models\Budget;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BudgetTransferTest extends TestCase
{
    use RefreshDatabase;

    public function test_transfer_between_gasto_budgets_updates_initial_amounts(): void
    {
        $user = User::factory()->create();

        $from = Budget::create([
            'user_id' => $user->id,
            'month' => '2026-08',
            'name' => 'GASTO A',
            'type' => 'gasto',
            'initial_amount' => 100,
            'available_amount' => 100,
            'income' => 0,
        ]);

        $to = Budget::create([
            'user_id' => $user->id,
            'month' => '2026-08',
            'name' => 'GASTO B',
            'type' => 'gasto',
            'initial_amount' => 50,
            'available_amount' => 50,
            'income' => 0,
        ]);

        $response = $this->actingAs($user)->post(route('account-transfers.store'), [
            'from_budget_id' => $from->id,
            'to_budget_id' => $to->id,
            'amount' => 20,
            'comment' => 'Transferencia de prueba',
            'date' => now()->toDateTimeString(),
        ]);

        $response->assertRedirect();

        $from->refresh();
        $to->refresh();

        $this->assertSame(80.0, (float) $from->initial_amount);
        $this->assertSame(70.0, (float) $to->initial_amount);
        $this->assertSame(80.0, (float) $from->available_amount);
        $this->assertSame(70.0, (float) $to->available_amount);
    }
}
