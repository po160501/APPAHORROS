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
    public function index(Request $request): Response
    {
        $user = $request->user();

        $month = $request->input('month', Carbon::now()->format('Y-m'));

        $budgets = Budget::where('user_id', $user->id)
            ->where('month', $month)
            ->with(['subAccounts' => function ($query) {
                $query->with(['expenses' => function ($q) {
                    $q->orderBy('date', 'desc');
                }]);
            }])
            ->get();

        $budgetMonths = Budget::where('user_id', $user->id)
            ->orderBy('month', 'desc')
            ->pluck('month')
            ->unique()
            ->values()
            ->toArray();

        $currentMonth = Carbon::now()->format('Y-m');
        if (!in_array($currentMonth, $budgetMonths)) {
            $budgetMonths[] = $currentMonth;
            usort($budgetMonths, fn($a, $b) => strcmp($b, $a));
        }

        return Inertia::render('Dashboard', [
            'budgets' => $budgets,
            'selectedMonth' => $month,
            'budgetMonths' => $budgetMonths,
        ]);
    }

    public function storeBudget(Request $request): RedirectResponse
    {
        $request->validate([
            'month' => 'required|date_format:Y-m',
            'name' => 'required|string|max:100',
            'amount' => 'required|numeric|min:0.01',
        ]);

        Budget::create([
            'user_id' => $request->user()->id,
            'month' => $request->month,
            'name' => $request->name,
            'initial_amount' => $request->amount,
            'available_amount' => $request->amount,
        ]);

        return back()->with('success', 'Cuenta creada con éxito.');
    }

    public function storeSubAccount(Request $request): RedirectResponse
    {
        $request->validate([
            'budget_id' => 'required|exists:budgets,id',
            'name' => 'required|string|max:100',
            'amount' => 'required|numeric|min:0.01',
        ]);

        $budget = Budget::findOrFail($request->budget_id);

        if ($budget->user_id !== $request->user()->id) {
            abort(403);
        }

        $allocatedSum = $budget->subAccounts()->sum('initial_amount');
        $remainingToAllocate = $budget->initial_amount - $allocatedSum;

        if ($request->amount > $remainingToAllocate) {
            return back()->withErrors([
                'amount' => sprintf(
                    'No puedes asignar esta cantidad. El monto máximo disponible para asignar es $%s.',
                    number_format($remainingToAllocate, 2)
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

    public function storeExpense(Request $request): RedirectResponse
    {
        $request->validate([
            'sub_account_id' => 'required|exists:sub_accounts,id',
            'amount' => 'required|numeric|min:0.01',
            'comment' => 'nullable|string|max:255',
            'date' => 'required|date',
        ]);

        $subAccount = SubAccount::with('budget')->findOrFail($request->sub_account_id);

        if ($subAccount->budget->user_id !== $request->user()->id) {
            abort(403);
        }

        DB::transaction(function () use ($subAccount, $request) {
            Expense::create([
                'sub_account_id' => $subAccount->id,
                'amount' => $request->amount,
                'comment' => $request->comment,
                'date' => $request->date,
            ]);

            $subAccount->current_amount -= $request->amount;
            $subAccount->save();

            $budget = $subAccount->budget;
            $budget->available_amount -= $request->amount;
            $budget->save();
        });

        return back()->with('success', 'Gasto agregado correctamente.');
    }

    public function destroyExpense(Request $request, int $id): RedirectResponse
    {
        $expense = Expense::with('subAccount.budget')->findOrFail($id);

        if ($expense->subAccount->budget->user_id !== $request->user()->id) {
            abort(403);
        }

        DB::transaction(function () use ($expense) {
            $subAccount = $expense->subAccount;
            $subAccount->current_amount += $expense->amount;
            $subAccount->save();

            $budget = $subAccount->budget;
            $budget->available_amount += $expense->amount;
            $budget->save();

            $expense->delete();
        });

        return back()->with('success', 'Gasto eliminado y fondos restaurados.');
    }
}
