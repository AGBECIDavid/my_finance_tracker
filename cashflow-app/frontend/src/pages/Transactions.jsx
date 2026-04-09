import { useEffect, useState, useMemo } from 'react';
import { transactionApi } from '../services/api/transaction.api.js';
import { categoryApi } from '../services/api/category.api.js';
import Modal from '../components/ui/Modal.jsx';
import TransactionForm from '../components/transactions/TransactionForm.jsx';
import { formatCurrency, formatDate } from '../utils/formatters.js';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [txs, cats] = await Promise.all([
        transactionApi.getAll(),
        categoryApi.getAll(),
      ]);
      setTransactions(txs);
      setCategories(cats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering (fast and responsive)
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (typeFilter !== 'ALL' && tx.type !== typeFilter) return false;
      if (search && !tx.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (startDate && new Date(tx.date) < new Date(startDate)) return false;
      if (endDate && new Date(tx.date) > new Date(endDate)) return false;
      return true;
    });
  }, [transactions, search, typeFilter, startDate, endDate]);

  const handleCreate = async (data) => {
    const newTx = await transactionApi.create(data);
    setTransactions((prev) => [newTx, ...prev]);
    setModalOpen(false);
  };

  const handleUpdate = async (data) => {
    const updated = await transactionApi.update(editing.id, data);
    setTransactions((prev) => prev.map((tx) => (tx.id === updated.id ? updated : tx)));
    setModalOpen(false);
    setEditing(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette transaction ?')) return;
    await transactionApi.remove(id);
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  };

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (tx) => {
    setEditing(tx);
    setModalOpen(true);
  };

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('ALL');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Transactions</h1>
          <p className="text-slate-500 mt-1">{filtered.length} transaction(s)</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          + Nouvelle transaction
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="🔍 Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input"
          >
            <option value="ALL">Tous les types</option>
            <option value="INCOME">Revenus</option>
            <option value="EXPENSE">Dépenses</option>
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input"
            placeholder="Date début"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input"
            placeholder="Date fin"
          />
        </div>
        {(search || typeFilter !== 'ALL' || startDate || endDate) && (
          <button onClick={resetFilters} className="text-sm text-primary-600 mt-3">
            Réinitialiser les filtres
          </button>
        )}
      </div>

      {/* Transactions list */}
      <div className="card">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400">Aucune transaction</p>
            <button onClick={openCreate} className="btn-primary mt-4">
              Ajouter la première
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: `${tx.category.color}20` }}
                  >
                    {tx.category.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{tx.description}</p>
                    <p className="text-xs text-slate-500">
                      {tx.category.name} • {formatDate(tx.date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`font-semibold text-sm ${
                      tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {tx.type === 'INCOME' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(tx)}
                      className="p-2 hover:bg-slate-200 rounded-lg text-sm"
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="p-2 hover:bg-red-100 rounded-lg text-sm"
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for create/edit */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Modifier la transaction' : 'Nouvelle transaction'}
      >
        <TransactionForm
          initial={editing}
          categories={categories}
          onSubmit={editing ? handleUpdate : handleCreate}
          onCancel={() => {
            setModalOpen(false);
            setEditing(null);
          }}
        />
      </Modal>
    </div>
  );
}
