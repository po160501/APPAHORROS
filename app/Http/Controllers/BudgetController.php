<?php

namespace App\Http\Controllers;

use App\Models\Budget;
use App\Models\SubAccount;
use App\Models\Expense;
use App\Models\MonthlyIncome;
use App\Models\AccountTransfer;
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
            ->whereIn('type', ['gasto', 'ahorro'])
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

        // Comparativa con mes anterior
        $prevMonth = Carbon::createFromFormat('Y-m', $month)->subMonth()->format('Y-m');
        $prevBudgets = Budget::where('user_id', $user->id)
            ->where('month', $prevMonth)
            ->whereIn('type', ['gasto', 'ahorro'])
            ->with('subAccounts.expenses')
            ->get();

        $income = MonthlyIncome::where('user_id', $user->id)
            ->where('month', $month)
            ->value('amount') ?? 0;

        return Inertia::render('Dashboard', [
            'budgets' => $budgets,
            'selectedMonth' => $month,
            'budgetMonths' => $budgetMonths,
            'prevBudgets' => $prevBudgets,
            'income' => (float) $income,
        ]);
    }

    public function storeBudget(Request $request): RedirectResponse
    {
        $request->validate([
            'month' => 'required|date_format:Y-m',
            'name' => 'required|string|max:100',
            'amount' => 'required|numeric|min:0.01',
            'type' => 'required|in:gasto,ahorro',
            'target_month' => 'nullable|required_if:type,ahorro|date_format:Y-m|after_or_equal:month',
        ]);

        Budget::create([
            'user_id' => $request->user()->id,
            'month' => $request->month,
            'name' => $request->name,
            'type' => $request->type,
            'target_month' => $request->type === 'ahorro' ? $request->target_month : null,
            'initial_amount' => $request->amount,
            'available_amount' => $request->type === 'ahorro' ? 0 : $request->amount,
            'income' => 0,
        ]);

        return back()->with('success', 'Cuenta creada con éxito.');
    }

    public function updateIncome(Request $request): RedirectResponse
    {
        $request->validate([
            'month' => 'required|date_format:Y-m',
            'income' => 'required|numeric|min:0',
        ]);

        // Store income as a special budget record or update all budgets of the month
        // We use a dedicated "income" field on the first gasto budget, or create a meta record
        // Simplest: store on user's month meta — we'll use a single budget row with type=ingreso
        MonthlyIncome::updateOrCreate(
            ['user_id' => $request->user()->id, 'month' => $request->month],
            ['amount' => $request->income],
        );

        return back()->with('success', 'Ingreso actualizado.');
    }

    public function storeAccountTransfer(Request $request): RedirectResponse
    {
        $request->validate([
            'from_budget_id' => 'required|different:to_budget_id|exists:budgets,id',
            'to_budget_id' => 'required|exists:budgets,id',
            'amount' => 'required|numeric|min:0.01',
            'comment' => 'nullable|string|max:255',
            'date' => 'required|date',
        ]);

        DB::transaction(function () use ($request) {
            $from = Budget::lockForUpdate()->findOrFail($request->from_budget_id);
            $to = Budget::lockForUpdate()->findOrFail($request->to_budget_id);
            abort_unless($from->user_id === $request->user()->id && $to->user_id === $request->user()->id, 403);

            AccountTransfer::create($request->only('from_budget_id', 'to_budget_id', 'amount', 'comment', 'date'));
            $from->available_amount -= $request->amount;
            $to->available_amount += $request->amount;
            $from->save();
            $to->save();
        });

        return back()->with('success', 'Transferencia realizada.');
    }

    public function updateBudget(Request $request, Budget $budget): RedirectResponse
    {
        abort_unless($budget->user_id === $request->user()->id, 403);

        $request->validate([
            'name' => 'required|string|max:100',
            'amount' => 'required|numeric|min:0.01',
            'target_month' => $budget->type === 'ahorro' ? 'required|date_format:Y-m' : 'nullable|date_format:Y-m',
        ]);

        if ($budget->type === 'gasto') {
            $allocated = $budget->subAccounts()->sum('initial_amount');
            if ($request->amount < $allocated) {
                return back()->withErrors(['amount' => 'El monto no puede ser menor que lo ya asignado a las subcuentas.']);
            }
        }

        DB::transaction(function () use ($budget, $request) {
            $difference = (float) $request->amount - (float) $budget->initial_amount;
            $budget->name = $request->name;
            $budget->initial_amount = $request->amount;
            $budget->target_month = $budget->type === 'ahorro' ? $request->target_month : null;
            if ($budget->type === 'gasto') {
                $budget->available_amount += $difference;
            }
            $budget->save();
        });

        return back()->with('success', 'Cuenta actualizada.');
    }

    public function destroyBudget(Request $request, Budget $budget): RedirectResponse
    {
        abort_unless($budget->user_id === $request->user()->id, 403);

        DB::transaction(function () use ($budget) {
            $budget->delete();
        });

        return back()->with('success', 'Cuenta principal eliminada.');
    }

    public function storeSubAccount(Request $request): RedirectResponse
    {
        $request->validate([
            'budget_id' => 'required|exists:budgets,id',
            'name' => 'required|string|max:100',
            'amount' => 'required|numeric|min:0.01',
            'type' => 'required|in:gasto,ahorro',
        ]);

        $budget = Budget::findOrFail($request->budget_id);

        if ($budget->user_id !== $request->user()->id) abort(403);

        if ($request->type === 'gasto') {
            $allocatedSum = $budget->subAccounts()->where('type', 'gasto')->sum('initial_amount');
            $remainingToAllocate = $budget->initial_amount - $allocatedSum;

            if ($request->amount > $remainingToAllocate) {
                return back()->withErrors([
                    'amount' => sprintf(
                        'No puedes asignar esta cantidad. El monto máximo disponible para asignar es $%s.',
                        number_format($remainingToAllocate, 2)
                    )
                ]);
            }
        }

        SubAccount::create([
            'budget_id' => $budget->id,
            'name' => $request->name,
            'type' => $request->type,
            'initial_amount' => $request->amount,
            'current_amount' => $request->type === 'ahorro' ? 0 : $request->amount,
        ]);

        return back()->with('success', 'Subcuenta creada correctamente.');
    }

    public function updateSubAccount(Request $request, SubAccount $subAccount): RedirectResponse
    {
        $subAccount->load('budget');
        abort_unless($subAccount->budget->user_id === $request->user()->id, 403);

        $request->validate([
            'name' => 'required|string|max:100',
            'amount' => 'required|numeric|min:0.01',
        ]);

        $budget = $subAccount->budget;
        $otherAllocated = $budget->subAccounts()->whereKeyNot($subAccount->id)->sum('initial_amount');
        if ($request->amount + $otherAllocated > $budget->initial_amount) {
            return back()->withErrors(['amount' => 'El monto excede lo disponible para asignar en esta cuenta.']);
        }

        DB::transaction(function () use ($subAccount, $request) {
            $difference = (float) $request->amount - (float) $subAccount->initial_amount;
            $subAccount->name = $request->name;
            $subAccount->initial_amount = $request->amount;
            $subAccount->current_amount += $difference;
            $subAccount->save();
        });

        return back()->with('success', 'Subcuenta actualizada.');
    }

    public function storeSaving(Request $request): RedirectResponse
    {
        $request->validate([
            'budget_id' => 'required|exists:budgets,id',
            'amount' => 'required|numeric|min:0.01',
            'comment' => 'nullable|string|max:255',
            'date' => 'required|date',
        ]);

        $budget = Budget::findOrFail($request->budget_id);

        if ($budget->user_id !== $request->user()->id) abort(403);
        if ($budget->type !== 'ahorro') abort(422);

        $subAccount = $budget->subAccounts()->firstOrCreate(
            ['budget_id' => $budget->id],
            ['name' => $budget->name, 'type' => 'ahorro', 'initial_amount' => 0, 'current_amount' => 0]
        );

        DB::transaction(function () use ($subAccount, $budget, $request) {
            Expense::create([
                'sub_account_id' => $subAccount->id,
                'amount' => $request->amount,
                'comment' => $request->comment,
                'date' => $request->date,
                'is_saving' => true,
            ]);

            $subAccount->current_amount += $request->amount;
            $subAccount->save();

            $budget->available_amount += $request->amount;
            $budget->save();
        });

        return back()->with('success', 'Depósito registrado correctamente.');
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

        if ($subAccount->budget->user_id !== $request->user()->id) abort(403);

        DB::transaction(function () use ($subAccount, $request) {
            Expense::create([
                'sub_account_id' => $subAccount->id,
                'amount' => $request->amount,
                'comment' => $request->comment,
                'date' => $request->date,
                'is_saving' => false,
            ]);

            $subAccount->current_amount -= $request->amount;
            $subAccount->save();

            $budget = $subAccount->budget;
            $budget->available_amount -= $request->amount;
            $budget->save();
        });

        return back()->with('success', 'Gasto agregado correctamente.');
    }

    public function updateExpense(Request $request, int $id): RedirectResponse
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'comment' => 'nullable|string|max:255',
            'date' => 'required|date',
        ]);

        $expense = Expense::with('subAccount.budget')->findOrFail($id);

        if ($expense->subAccount->budget->user_id !== $request->user()->id) abort(403);

        DB::transaction(function () use ($expense, $request) {
            $diff = $request->amount - $expense->amount;
            $subAccount = $expense->subAccount;
            $budget = $subAccount->budget;

            $expense->update([
                'amount' => $request->amount,
                'comment' => $request->comment,
                'date' => $request->date,
            ]);

            if ($expense->is_saving) {
                $subAccount->current_amount += $diff;
                $budget->available_amount += $diff;
            } else {
                $subAccount->current_amount -= $diff;
                $budget->available_amount -= $diff;
            }

            $subAccount->save();
            $budget->save();
        });

        return back()->with('success', 'Registro actualizado.');
    }

    public function destroyExpense(Request $request, int $id): RedirectResponse
    {
        $expense = Expense::with('subAccount.budget')->findOrFail($id);

        if ($expense->subAccount->budget->user_id !== $request->user()->id) abort(403);

        DB::transaction(function () use ($expense) {
            $subAccount = $expense->subAccount;
            $budget = $subAccount->budget;

            if ($expense->is_saving) {
                $subAccount->current_amount -= $expense->amount;
                $budget->available_amount -= $expense->amount;
            } else {
                $subAccount->current_amount += $expense->amount;
                $budget->available_amount += $expense->amount;
            }

            $subAccount->save();
            $budget->save();
            $expense->delete();
        });

        return back()->with('success', 'Registro eliminado.');
    }
}
