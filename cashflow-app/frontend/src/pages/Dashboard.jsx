import { useEffect, useState } from 'react';
import { dashboardApi } from '../services/api/dashboard.api.js';
import { transactionApi } from '../services/api/transaction.api.js';
import StatCard from '../components/dashboard/StatCard.jsx';
import ExpensePieChart from '../components/dashboard/ExpensePieChart.jsx';
import IncomeExpenseBarChart from '../components/dashboard/IncomeExpenseBarChart.jsx';
import { formatCurrency, formatDate } from '../utils/formatters.js';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [expensesByCategory, setExpensesByCategory] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      // Load everything in parallel for speed
      const [summaryData, expenseData, monthlyData, transactions] = await Promise.all([
        dashboardApi.getSummary(),
        dashboardApi.getExpensesByCategory(),
        dashboardApi.getMonthly(),
        transactionApi.getAll(),
      ]);
      setSummary(summaryData);
      setExpensesByCategory(expenseData);
      setMonthly(monthlyData);
      setRecentTransactions(transactions.slice(0, 5));
    } catch (e) {
      setError('Erreur lors du chargement du dashboard');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-slate-500">Chargement du dashboard...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p className="text-slate-500 mt-1">Aperçu de vos finances</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Revenus totaux"
          amount={summary?.totalIncome}
          icon="📈"
          color="green"
        />
        <StatCard
          title="Dépenses totales"
          amount={summary?.totalExpense}
          icon="📉"
          color="red"
        />
        <StatCard
          title="Cashflow"
          amount={summary?.cashflow}
          icon="💰"
          color={summary?.cashflow >= 0 ? 'green' : 'red'}
          trend={`${summary?.transactionCount || 0} transaction(s)`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <IncomeExpenseBarChart data={monthly} />
        <ExpensePieChart data={expensesByCategory} />
      </div>

      {/* Recent transactions */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Transactions récentes</h3>
        {recentTransactions.length === 0 ? (
          <p className="text-slate-400 text-center py-8">Aucune transaction</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                    style={{ backgroundColor: `${tx.category.color}20` }}
                  >
                    {tx.category.icon}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{tx.description}</p>
                    <p className="text-xs text-slate-500">
                      {tx.category.name} • {formatDate(tx.date)}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-semibold ${
                    tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {tx.type === 'INCOME' ? '+' : '-'}
                  {formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
