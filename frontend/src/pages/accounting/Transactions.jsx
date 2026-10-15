import { useEffect, useState } from 'react';
import { Plus, X, Pencil, Trash2, Search } from 'lucide-react';
import api from '../../api/client';
import { money, errMsg, today } from './format';

const INCOME_CATS = ['Admission Fees', 'Donations', 'Grants', 'Canteen / Store Sales', 'Rent / Hall Hire', 'Other Income'];
const EXPENSE_CATS = ['Utilities', 'Maintenance & Repairs', 'Teaching Supplies', 'Food & Catering', 'Transport & Fuel',
  'Equipment', 'Security', 'Marketing', 'Insurance', 'Bank Charges', 'Other Expense'];
const METHODS = ['Cash', 'Mobile Money', 'Bank Transfer', 'Cheque'];

const emptyForm = { type: 'expense', category: '', amount: '', txn_date: today(), description: '', payment_method: 'Cash', reference: '' };

export default function Transactions() {
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({ type: '', from: '', to: '', search: '' });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    api.get('/finance/transactions', { params })
      .then((res) => { setRows(res.data); setError(''); })
      .catch((err) => setError(errMsg(err, 'Could not fetch transactions')));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filters.type, filters.from, filters.to]);

  const openNew = (type) => {
    setEditingId(null);
    setForm({ ...emptyForm, type });
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (t) => {
    setEditingId(t.id);
    setForm({
      type: t.type, category: t.category, amount: t.amount,
      txn_date: String(t.txn_date).slice(0, 10), description: t.description || '',
      payment_method: t.payment_method || 'Cash', reference: t.reference || '',
    });
    setFormError('');
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editingId) await api.put(`/finance/transactions/${editingId}`, form);
      else await api.post('/finance/transactions', form);
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(errMsg(err, 'Could not save transaction'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (t) => {
    if (!window.confirm(`Delete this ${t.type} of ${money(t.amount)}?`)) return;
    try {
      await api.delete(`/finance/transactions/${t.id}`);
      load();
    } catch (err) {
      setError(errMsg(err, 'Could not delete transaction'));
    }
  };

  const totalIn = rows.filter((r) => r.type === 'income').reduce((s, r) => s + Number(r.amount), 0);
  const totalOut = rows.filter((r) => r.type === 'expense').reduce((s, r) => s + Number(r.amount), 0);
  const cats = form.type === 'income' ? INCOME_CATS : EXPENSE_CATS;

  const input = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Transactions</h2>
        <div className="flex gap-2">
          <button onClick={() => openNew('income')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700">
            <Plus className="w-4 h-4" /> Income
          </button>
          <button onClick={() => openNew('expense')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600">
            <Plus className="w-4 h-4" /> Expense
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className={input}>
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expenses</option>
        </select>
        <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} className={input} />
        <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} className={input} />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={filters.search} placeholder="Search description or reference"
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            className={`${input} pl-9`} />
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>}

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  No transactions yet. Use the Income or Expense button to record one.
                </td></tr>
              )}
              {rows.map((t) => (
                <tr key={t.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap">{String(t.txn_date).slice(0, 10)}</td>
                  <td className="px-4 py-3">{t.category}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {t.description || '-'}
                    {t.reference && <span className="block text-xs text-slate-400">Ref: {t.reference}</span>}
                  </td>
                  <td className="px-4 py-3">{t.payment_method}</td>
                  <td className={`px-4 py-3 text-right font-medium whitespace-nowrap ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'income' ? '+' : '-'} {money(t.amount)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <button onClick={() => openEdit(t)} className="p-1.5 text-slate-400 hover:text-brand-blue" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => remove(t)} className="p-1.5 text-slate-400 hover:text-red-600" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length > 0 && (
          <div className="flex justify-end gap-6 px-4 py-3 border-t border-slate-200 text-sm">
            <span className="text-slate-500">Income shown: <b className="text-green-600">{money(totalIn)}</b></span>
            <span className="text-slate-500">Expenses shown: <b className="text-red-600">{money(totalOut)}</b></span>
          </div>
        )}
        <p className="px-4 pb-3 text-xs text-slate-400">School fees paid by students appear in the Overview and Budgets automatically. Record other money here.</p>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={save} className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingId ? 'Edit' : 'Record'} {form.type === 'income' ? 'income' : 'expense'}
              </h3>
              <button type="button" onClick={() => setShowForm(false)} className="p-1 text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, category: '' })} className={input}>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input type="date" required value={form.txn_date} onChange={(e) => setForm({ ...form, txn_date: e.target.value })} className={input} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <input list="txn-cats" required value={form.category} placeholder="Choose or type a category"
                onChange={(e) => setForm({ ...form, category: e.target.value })} className={input} />
              <datalist id="txn-cats">{cats.map((c) => <option key={c} value={c} />)}</datalist>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (GH₵)</label>
                <input type="number" step="0.01" min="0.01" required value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })} className={input} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment method</label>
                <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className={input}>
                  {METHODS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={input} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Receipt / reference no.</label>
              <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className={input} />
            </div>

            {formError && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{formError}</div>}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-700">Cancel</button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 text-sm rounded-lg bg-brand-blue text-white font-medium disabled:opacity-60">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}