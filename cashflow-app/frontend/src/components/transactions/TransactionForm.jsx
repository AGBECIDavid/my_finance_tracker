import { useState, useEffect } from 'react';
import { toInputDate } from '../../utils/formatters.js';

// Form to create or edit a transaction
// If `initial` is passed, we're editing; otherwise creating
export default function TransactionForm({ initial, categories, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    type: 'EXPENSE',
    amount: '',
    description: '',
    categoryId: '',
    date: toInputDate(new Date()),
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill when editing
  useEffect(() => {
    if (initial) {
      setForm({
        type: initial.type,
        amount: initial.amount,
        description: initial.description,
        categoryId: initial.categoryId,
        date: toInputDate(initial.date),
      });
    }
  }, [initial]);

  // Filter categories to match the selected type (INCOME or EXPENSE)
  const filteredCategories = categories.filter((c) => c.type === form.type);

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // If type changes, reset category
      if (field === 'type') next.categoryId = '';
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.amount || !form.description || !form.categoryId) {
      setError('Tous les champs sont obligatoires');
      return;
    }
    if (parseFloat(form.amount) <= 0) {
      setError('Le montant doit être positif');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        ...form,
        amount: parseFloat(form.amount),
        categoryId: parseInt(form.categoryId),
      });
    } catch (e) {
      setError(e.response?.data?.error || 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type toggle */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => handleChange('type')({ target: { value: 'EXPENSE' } })}
          className={`py-2 rounded-lg font-medium text-sm transition-colors ${
            form.type === 'EXPENSE'
              ? 'bg-red-100 text-red-700 border-2 border-red-300'
              : 'bg-slate-50 text-slate-600 border-2 border-transparent'
          }`}
        >
          📉 Dépense
        </button>
        <button
          type="button"
          onClick={() => handleChange('type')({ target: { value: 'INCOME' } })}
          className={`py-2 rounded-lg font-medium text-sm transition-colors ${
            form.type === 'INCOME'
              ? 'bg-green-100 text-green-700 border-2 border-green-300'
              : 'bg-slate-50 text-slate-600 border-2 border-transparent'
          }`}
        >
          📈 Revenu
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Montant</label>
        <input
          type="number"
          step="0.01"
          value={form.amount}
          onChange={handleChange('amount')}
          className="input"
          placeholder="0.00"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <input
          type="text"
          value={form.description}
          onChange={handleChange('description')}
          className="input"
          placeholder="Ex: Courses, Salaire..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Catégorie</label>
        <select
          value={form.categoryId}
          onChange={handleChange('categoryId')}
          className="input"
        >
          <option value="">-- Choisir --</option>
          {filteredCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Date</label>
        <input
          type="date"
          value={form.date}
          onChange={handleChange('date')}
          className="input"
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>
      )}

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Annuler
        </button>
        <button type="submit" disabled={submitting} className="btn-primary flex-1">
          {submitting ? '...' : initial ? 'Enregistrer' : 'Ajouter'}
        </button>
      </div>
    </form>
  );
}
