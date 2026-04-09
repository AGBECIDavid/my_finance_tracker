import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters.js';

// Bar chart comparing income vs expenses month by month
export default function IncomeExpenseBarChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Revenus vs Dépenses</h3>
        <div className="h-64 flex items-center justify-center text-slate-400">
          Aucune donnée à afficher
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="font-semibold mb-4">Revenus vs Dépenses</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => formatCurrency(value)} />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Bar dataKey="income" name="Revenus" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name="Dépenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
