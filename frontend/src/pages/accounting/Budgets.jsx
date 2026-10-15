import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import api from '../../api/client';
import { money, MONTHS, errMsg } from './format';

export default function Budgets() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ category: '', type: 'expense', amount: '', notes: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get('/finance/budgets', { params: { year, month } })
      .then((res) => { setRows(res.data); setError(''); })
      .catch((err) => setError(errMsg(err, 'Could not fetch budgets')));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [year, month]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/finance/budgets', { ...form, year, month });
      setForm({ category: '', type: 'expense', amount: '', notes: '' });
      load();
    } catch (err) {
      setError(errMsg(err, 'Could not save budget'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (b) => {
    if (!window.confirm(`Delete the ${b.category} budget?`)) return;
    try { await api.delete(`/finance/budgets/${b.id}`); load(); }
    catch (err) { setError(errMsg(err, 'Could not delete budget')); }
  };

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() + 1 - i);
  const input = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue';

  const expenseRows = rows.filter((r) => r.type === 'expense');
  const budgeted = expenseRows.reduce((s, r) => s + r.budget, 0);
  const spent = expenseRows.reduce((s, r) => s + r.actual, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Budgets</h2>
        <div className="flex gap-2">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <form onSubmit={save} className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
          <input required value={form.category} placeholder="e.g. Utilities, Salaries & Wages"
            onChange={(e) => setForm({ ...form, category: e.target.value })} className={input} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={input}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Budget (GH₵)</label>
          <input type="number" min="0" step="0.01" required value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })} className={input} />
        </div>
        <button type="submit" disabled={saving}
          className="px-4 py-2 text-sm rounded-lg bg-brand-blue text-white font-medium disabled:opacity-60">
          {saving ? 'Saving...' : 'Set budget'}
        </button>
      </form>
      <p className="text-xs text-slate-400 -mt-3">Use the exact category name used in Transactions so actual spending is matched. Setting a budget again for the same category updates it.</p>

      {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>}

      {expenseRows.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Expense budget</p>
            <p className="text-xl font-semibold mt-1">{money(budgeted)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Spent so far</p>
            <p className="text-xl font-semibold mt-1">{money(spent)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">{budgeted - spent >= 0 ? 'Remaining' : 'Over budget by'}</p>
            <p className={`text-xl font-semibold mt-1 ${budgeted - spent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {money(Math.abs(budgeted - spent))}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium text-right">Budget</th>
                <th className="px-4 py-3 font-medium text-right">Actual</th>
                <th className="px-4 py-3 font-medium w-48">Used</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  No budgets set for {MONTHS[month - 1]} {year}. Add one above.
                </td></tr>
              )}
              {rows.map((b) => {
                const pct = b.budget > 0 ? (b.actual / b.budget) * 100 : 0;
                const over = b.type === 'expense' && b.actual > b.budget;
                return (
                  <tr key={b.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">{b.category}</td>
                    <td className="px-4 py-3 capitalize">{b.type}</td>
                    <td className="px-4 py-3 text-right">{money(b.budget)}</td>
                    <td className={`px-4 py-3 text-right ${over ? 'text-red-600 font-medium' : ''}`}>{money(b.actual)}</td>
                    <td className="px-4 py-3">
                      <div className="h-2 rounded-full bg-slate-100">
                        <div className={`h-2 rounded-full ${over ? 'bg-red-500' : b.type === 'income' ? 'bg-green-500' : 'bg-brand-blue'}`}
                          style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                      <span className="text-xs text-slate-400">{Math.round(pct)}%</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => remove(b)} className="p-1.5 text-slate-400 hover:text-red-600" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}