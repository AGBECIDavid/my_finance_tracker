from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib import messages
from django.db.models import Sum
from .models import Income, Expense
from .forms import IncomeForm, ExpenseForm
from datetime import datetime

# --- AUTHENTIFICATION ---

def register_view(request):
    if request.method == "POST":
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('dashboard')
    else:
        form = UserCreationForm()
    return render(request, 'finance/register.html', {'form': form})

def login_view(request):
    if request.method == "POST":
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            return redirect('dashboard')
    else:
        form = AuthenticationForm()
    return render(request, 'finance/login.html', {'form': form})

def logout_view(request):
    logout(request)
    return redirect('login')

# --- LOGIQUE DASHBOARD ---

def get_finance_totals(user, period, start_date=None, end_date=None):
    today = datetime.now()
    inc_qs = Income.objects.filter(user=user)
    exp_qs = Expense.objects.filter(user=user)

    if start_date and end_date:
        inc_qs = inc_qs.filter(date__range=[start_date, end_date])
        exp_qs = exp_qs.filter(date__range=[start_date, end_date])
    elif period == 'day':
        inc_qs = inc_qs.filter(date=today.date())
        exp_qs = exp_qs.filter(date=today.date())
    elif period == 'month':
        inc_qs = inc_qs.filter(date__month=today.month, date__year=today.year)
        exp_qs = exp_qs.filter(date__month=today.month, date__year=today.year)
    elif period == 'year':
        inc_qs = inc_qs.filter(date__year=today.year)
        exp_qs = exp_qs.filter(date__year=today.year)

    total_inc = inc_qs.aggregate(Sum('amount'))['amount__sum'] or 0
    total_exp = exp_qs.aggregate(Sum('amount'))['amount__sum'] or 0
    
    return total_inc, total_exp, inc_qs, exp_qs

@login_required
def dashboard(request):
    period = request.GET.get('filter', 'month')
    start_date = request.GET.get('start')
    end_date = request.GET.get('end')

    total_inc, total_exp, inc_qs, exp_qs = get_finance_totals(request.user, period, start_date, end_date)

    percent_spent = 0
    if total_inc > 0:
        percent_spent = round((total_exp / total_inc) * 100)

    context = {
        'incomes': inc_qs,
        'expenses': exp_qs,
        'total_income': total_inc,
        'total_expense': total_exp,
        'balance': total_inc - total_exp,
        'percent_spent': percent_spent,
        'filter': period,
        'start_date': start_date,
        'end_date': end_date,
        'chart_labels': ['Revenu', 'Dépense', 'Solde'],
        'chart_values': [float(total_inc), float(total_exp), float(total_inc - total_exp)],
    }
    return render(request, 'finance/dashboard.html', context)

# --- ACTIONS AJOUT / SUPPRESSION ---

@login_required
def add_income(request):
    if request.method == "POST":
        form = IncomeForm(request.POST)
        if form.is_valid():
            income = form.save(commit=False)
            income.user = request.user
            income.save()
            return redirect('dashboard')
    return render(request, 'finance/form.html', {'form': IncomeForm(), 'title': 'Ajouter un revenu'})

@login_required
def add_expense(request):
    if request.method == "POST":
        form = ExpenseForm(request.POST)
        if form.is_valid():
            expense = form.save(commit=False)
            expense.user = request.user
            expense.save()
            return redirect('dashboard')
    return render(request, 'finance/form.html', {'form': ExpenseForm(), 'title': 'Ajouter une dépense'})

@login_required
def delete_income(request, pk):
    income = get_object_or_404(Income, pk=pk, user=request.user)
    income.delete()
    return redirect('dashboard')

@login_required
def delete_expense(request, pk):
    expense = get_object_or_404(Expense, pk=pk, user=request.user)
    expense.delete()
    return redirect('dashboard')