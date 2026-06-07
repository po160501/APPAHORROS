<?php

namespace App\Http\Controllers;

use App\Models\Budget;
use App\Models\SubAccount;
use App\Models\Expense;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class BudgetController extends Controller
{
    /**
     * Display the budget and its details.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        
        // Month format: 'YYYY-MM', defaults to current month
        $month = $request->input('month', Carbon::now()->format('Y-m'));

        $budget = Budget::where('user_id', $user->id)
            ->where('month', $month)
            ->with(['subAccounts' => function ($query) {
                $query->with(['expenses' => function ($q) {
                    $q->orderBy('date', 'desc');
                }]);
            }])
            ->first();

        // Get list of months that have budgets for the history dropdown/navigator
        $budgetMonths = Budget::where('user_id', $user->id)
            ->orderBy('month', 'desc')
            ->pluck('month')
            ->toArray();

        // Add current month if not in list
        $currentMonth = Carbon::now()->format('Y-m');
        if (!in_array($currentMonth, $budgetMonths)) {
            $budgetMonths[] = $currentMonth;
            usort($budgetMonths, function ($a, $b) {
                return strcmp($b, $a); // Sort descending
            });
        }

        return Inertia::render('Dashboard', [
            'budget' => $budget,
            'selectedMonth' => $month,
            'budgetMonths' => $budgetMonths,
        ]);
    }

    /**
     * Store a new budget.
     */
    public function storeBudget(Request $request): RedirectResponse
    {
        $request->validate([
            'month' => 'required|date_format:Y-m',
            'amount' => 'required|numeric|min:0.01',
        ]);

        $user = $request->user();

        // Check if budget for this month already exists
        $exists = Budget::where('user_id', $user->id)
            ->where('month', $request->month)
            ->exists();

        if ($exists) {
            return back()->withErrors(['month' => 'Ya existe un presupuesto asignado a este mes.']);
        }

        Budget::create([
            'user_id' => $user->id,
            'month' => $request->month,
            'initial_amount' => $request->amount,
            'available_amount' => $request->amount,
        ]);

        return back()->with('success', 'Presupuesto inicial establecido con éxito.');
    }

    /**
     * Store a new sub-account.
     */
    public function storeSubAccount(Request $request): RedirectResponse
    {
        $request->validate([
            'budget_id' => 'required|exists:budgets,id',
            'name' => 'required|string|max:100',
            'amount' => 'required|numeric|min:0.01',
        ]);

        $budget = Budget::findOrFail($request->budget_id);

        // Ensure the budget belongs to the user
        if ($budget->user_id !== $request->user()->id) {
            abort(403);
        }

        // Validate that there is enough unallocated money in the budget
        $allocatedSum = $budget->subAccounts()->sum('initial_amount');
        $remainingToAllocate = $budget->initial_amount - $allocatedSum;

        if ($request->amount > $remainingToAllocate) {
            return back()->withErrors([
                'amount' => sprintf(
                    'No puedes asignar esta cantidad. El monto máximo disponible para asignar es $%s (Presupuesto total $%s - Ya asignado $%s).',
                    number_format($remainingToAllocate, 2),
                    number_format($budget->initial_amount, 2),
                    number_format($allocatedSum, 2)
                )
            ]);
        }

        SubAccount::create([
            'budget_id' => $budget->id,
            'name' => $request->name,
            'initial_amount' => $request->amount,
            'current_amount' => $request->amount,
        ]);

        return back()->with('success', 'Subcuenta creada correctamente.');
    }

    /**
     * Store a new expense.
     */
    public function storeExpense(Request $request): RedirectResponse
    {
        $request->validate([
            'sub_account_id' => 'required|exists:sub_accounts,id',
            'amount' => 'required|numeric|min:0.01',
            'comment' => 'nullable|string|max:255',
            'date' => 'required|date',
        ]);

        $subAccount = SubAccount::with('budget')->findOrFail($request->sub_account_id);

        // Ensure ownership
        if ($subAccount->budget->user_id !== $request->user()->id) {
            abort(403);
        }

        // Deduct from sub-account and budget available amount inside a transaction
        DB::transaction(function () use ($subAccount, $request) {
            // Create expense
            Expense::create([
                'sub_account_id' => $subAccount->id,
                'amount' => $request->amount,
                'comment' => $request->comment,
                'date' => $request->date,
            ]);

            // Deduct from sub-account
            $subAccount->current_amount -= $request->amount;
            $subAccount->save();

            // Deduct from budget
            $budget = $subAccount->budget;
            $budget->available_amount -= $request->amount;
            $budget->save();
        });

        return back()->with('success', 'Gasto agregado correctamente.');
    }

    /**
     * Delete an expense (to correct errors).
     */
    public function destroyExpense(Request $request, int $id): RedirectResponse
    {
        $expense = Expense::with('subAccount.budget')->findOrFail($id);

        // Ensure ownership
        if ($expense->subAccount->budget->user_id !== $request->user()->id) {
            abort(403);
        }

        DB::transaction(function () use ($expense) {
            // Restore funds to sub-account
            $subAccount = $expense->subAccount;
            $subAccount->current_amount += $expense->amount;
            $subAccount->save();

            // Restore funds to budget
            $budget = $subAccount->budget;
            $budget->available_amount += $expense->amount;
            $budget->save();

            // Delete expense
            $expense->delete();
        });

        return back()->with('success', 'Gasto eliminado y fondos restaurados.');
    }
}
