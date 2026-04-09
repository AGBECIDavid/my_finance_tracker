import { useEffect, useState } from 'react';
import { categoryApi } from '../services/api/category.api.js';
import Modal from '../components/ui/Modal.jsx';

const PRESET_COLORS = [
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#6366f1',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b',
];
const PRESET_ICONS = ['💰', '💼', '🍔', '🚗', '🏠', '📱', '🎮', '💊', '✈️', '🎓', '👕', '🎁'];

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    type: 'EXPENSE',
    color: '#6366f1',
    icon: '💰',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryApi.getAll();
      setCategories(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', type: 'EXPENSE', color: '#6366f1', icon: '💰' });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name, type: cat.type, color: cat.color, icon: cat.icon });
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) {
      setError('Le nom est obligatoire');
      return;
    }
    try {
      if (editing) {
        const updated = await categoryApi.update(editing.id, form);
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        const created = await categoryApi.create(form);
        setCategories((prev) => [...prev, created]);
      }
      setModalOpen(false);
    } catch (e) {
      setError(e.response?.data?.error || 'Erreur');
    }
  };

  const handleDelete = async (cat) => {
    if (!confirm(`Supprimer la catégorie "${cat.name}" ?`)) return;
    try {
      await categoryApi.remove(cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    } catch (e) {
      alert(e.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const income = categories.filter((c) => c.type === 'INCOME');
  const expense = categories.filter((c) => c.type === 'EXPENSE');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Catégories</h1>
          <p className="text-slate-500 mt-1">Organisez vos revenus et dépenses</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          + Nouvelle catégorie
        </button>
      </div>

      {loading ? (
        <div className="text-slate-500">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Income categories */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <span className="text-green-600">📈</span> Revenus ({income.length})
            </h3>
            <div className="space-y-2">
              {income.length === 0 ? (
                <p className="text-sm text-slate-400">Aucune catégorie</p>
              ) : (
                income.map((cat) => (
                  <CategoryRow
                    key={cat.id}
                    category={cat}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          </div>

          {/* Expense categories */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <span className="text-red-600">📉</span> Dépenses ({expense.length})
            </h3>
            <div className="space-y-2">
              {expense.length === 0 ? (
                <p className="text-sm text-slate-400">Aucune catégorie</p>
              ) : (
                expense.map((cat) => (
                  <CategoryRow
                    key={cat.id}
                    category={cat}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              placeholder="Ex: Nourriture"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, type: 'EXPENSE' })}
                className={`py-2 rounded-lg text-sm font-medium ${
                  form.type === 'EXPENSE'
                    ? 'bg-red-100 text-red-700 border-2 border-red-300'
                    : 'bg-slate-50 border-2 border-transparent'
                }`}
              >
                📉 Dépense
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, type: 'INCOME' })}
                className={`py-2 rounded-lg text-sm font-medium ${
                  form.type === 'INCOME'
                    ? 'bg-green-100 text-green-700 border-2 border-green-300'
                    : 'bg-slate-50 border-2 border-transparent'
                }`}
              >
                📈 Revenu
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Icône</label>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setForm({ ...form, icon })}
                  className={`aspect-square rounded-lg text-xl flex items-center justify-center ${
                    form.icon === icon
                      ? 'bg-primary-100 border-2 border-primary-500'
                      : 'bg-slate-50 border-2 border-transparent'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Couleur</label>
            <div className="grid grid-cols-10 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, color })}
                  className={`aspect-square rounded-lg ${
                    form.color === color ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary flex-1"
            >
              Annuler
            </button>
            <button type="submit" className="btn-primary flex-1">
              {editing ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// Single row showing a category
function CategoryRow({ category, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
          style={{ backgroundColor: `${category.color}20` }}
        >
          {category.icon}
        </div>
        <span className="font-medium text-sm">{category.name}</span>
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => onEdit(category)}
          className="p-2 hover:bg-slate-200 rounded-lg text-sm"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(category)}
          className="p-2 hover:bg-red-100 rounded-lg text-sm"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
