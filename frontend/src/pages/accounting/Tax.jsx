import { useEffect, useState } from 'react';
import { Plus, X, Pencil, Trash2 } from 'lucide-react';
import api from '../../api/client';
import { money, errMsg } from './format';

const TYPES = ['PAYE', 'SSNIT', 'Tier 2 Pension', 'VAT', 'Withholding Tax', 'Corporate Income Tax', 'Other'];
const input = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue';
const empty = { tax_type: 'PAYE', period_label: '', amount_due: '', amount_paid: '0', due_date: '', paid_date: '', reference: '', notes: '' };

const BADGE = {
  Paid: 'bg-green-50 text-green-700',
  'Part paid': 'bg-blue-50 text-blue-700',
  Overdue: 'bg-red-50 text-red-700',
  Pending: 'bg-amber-50 text-amber-700',
};

const d = (v) => (v ? String(v).slice(0, 10) : '');

export default function Tax() {
  const [data, setData] = useState({ records: [], outstanding: 0, overdue: 0 });
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/finance/tax').then((r) => { setData(r.data); setError(''); })
    .catch((e) => setError(errMsg(e, 'Could not fetch tax records')));
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditingId(null); setForm(empty); setFormError(''); };
  const openEdit = (r) => {
    setEditingId(r.id);
    setForm({ tax_type: r.tax_type, period_label: r.period_label, amount_due: r.amount_due, amount_paid: r.amount_paid,
      due_date: d(r.due_date), paid_date: d(r.paid_date), reference: r.reference || '', notes: r.notes || '' });
    setFormError('');
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editingId) await api.put(`/finance/tax/${editingId}`, form);
      else await api.post('/finance/tax', form);
      setForm(null);
      load();
    } catch (err) {
      setFormError(errMsg(err, 'Could not save tax record'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (r) => {
    if (!window.confirm(`Delete the ${r.tax_type} record for ${r.period_label}?`)) return;
    try { await api.delete(`/finance/tax/${r.id}`); load(); }
    catch (err) { setError(errMsg(err, 'Could not delete tax record')); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Tax compliance</h2>
        <button onClick={openNew} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-blue text-white text-sm font-medium">
          <Plus className="w-4 h-4" /> Add tax record
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Outstanding to pay</p>
          <p className="text-2xl font-semibold mt-1">{money(data.outstanding)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Overdue records</p>
          <p className={`text-2xl font-semibold mt-1 ${data.overdue > 0 ? 'text-red-600' : ''}`}>{data.overdue}</p>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[780px]">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="px-4 py-3 font-medium">Tax</th>
              <th className="px-4 py-3 font-medium">Period</th>
              <th className="px-4 py-3 font-medium">Due date</th>
              <th className="px-4 py-3 font-medium text-right">Due</th>
              <th className="px-4 py-3 font-medium text-right">Paid</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {data.records.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                No tax records yet. PAYE and SSNIT are added automatically when you mark a payroll as paid.
              </td></tr>
            )}
            {data.records.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium">{r.tax_type}</td>
                <td className="px-4 py-3">{r.period_label}</td>
                <td className="px-4 py-3 whitespace-nowrap">{d(r.due_date) || '-'}</td>
                <td className="px-4 py-3 text-right">{money(r.amount_due)}</td>
                <td className="px-4 py-3 text-right">{money(r.amount_paid)}</td>
                <td className="px-4 py-3"><span className={`px-2.5 py-0.5 rounded-full text-xs ${BADGE[r.status]}`}>{r.status}</span></td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button onClick={() => openEdit(r)} className="p-1.5 text-slate-400 hover:text-brand-blue" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => remove(r)} className="p-1.5 text-slate-400 hover:text-red-600" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400">To record a payment, click the pencil, enter the amount paid and the date paid.</p>

      {form && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={save} className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editingId ? 'Edit tax record' : 'Add tax record'}</h3>
              <button type="button" onClick={() => setForm(null)} className="p-1 text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Tax type</label>
                <input list="tax-types" required value={form.tax_type} onChange={(e) => setForm({ ...form, tax_type: e.target.value })} className={input} />
                <datalist id="tax-types">{TYPES.map((t) => <option key={t} value={t} />)}</datalist>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Period</label>
                <input required value={form.period_label} placeholder="e.g. October 2026" onChange={(e) => setForm({ ...form, period_label: e.target.value })} className={input} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount due (GH₵)</label>
                <input type="number" min="0" step="0.01" required value={form.amount_due} onChange={(e) => setForm({ ...form, amount_due: e.target.value })} className={input} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Due date</label>
                <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className={input} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount paid (GH₵)</label>
                <input type="number" min="0" step="0.01" value={form.amount_paid} onChange={(e) => setForm({ ...form, amount_paid: e.target.value })} className={input} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date paid</label>
                <input type="date" value={form.paid_date} onChange={(e) => setForm({ ...form, paid_date: e.target.value })} className={input} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Receipt / reference</label>
                <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className={input} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Notes</label>
                <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={input} />
              </div>
            </div>
            {formError && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{formError}</div>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setForm(null)} className="px-4 py-2 text-sm rounded-lg border border-slate-300">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-brand-blue text-white font-medium disabled:opacity-60">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}