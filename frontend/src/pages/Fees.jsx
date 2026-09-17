import { useEffect, useState } from 'react';
import { Search, Plus, X, Wallet, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import api from '../api/client';

const emptyForm = { student_id: '', amount: '', status: 'Pending', method: '', reference: '' };

const statusStyles = {
  Paid: 'bg-green-100 text-green-700',
  Pending: 'bg-amber-100 text-amber-700',
  Overdue: 'bg-red-100 text-red-700',
};

export default function Fees() {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');

  const loadPayments = () => {
    api.get('/payments', { params: { search, status, limit: 10 } })
      .then((res) => { setPayments(res.data.data); setTotal(res.data.total); })
      .catch(() => {});
  };

  const loadSummary = () => {
    api.get('/payments/summary').then((res) => setSummary(res.data)).catch(() => {});
  };

  useEffect(() => { loadPayments(); }, [search, status]);
  useEffect(() => {
    loadSummary();
    api.get('/students', { params: { limit: 500 } })
      .then((res) => setStudents(res.data.data))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.post('/payments', form);
      setShowModal(false);
      setForm(emptyForm);
      loadPayments();
      loadSummary();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not record payment.');
    }
  };

  const markPaid = async (id) => {
    try {
      await api.put(`/payments/${id}`, { status: 'Paid', paid_at: new Date().toISOString().slice(0, 10) });
      loadPayments();
      loadSummary();
    } catch {
      // silent fail is fine here — user can retry from the table
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Fees & Payments</h1>
          <p className="text-sm text-slate-500">{total} payment record{total === 1 ? '' : 's'}</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-brand-blue text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={16} /> Record Payment
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-600 rounded-xl p-4 text-white flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center"><CheckCircle2 size={20} /></div>
          <div>
            <p className="text-xs text-white/80">Total Paid</p>
            <p className="text-lg font-semibold">GHS {Number(summary?.total_paid || 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-amber-500 rounded-xl p-4 text-white flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center"><Clock size={20} /></div>
          <div>
            <p className="text-xs text-white/80">Pending</p>
            <p className="text-lg font-semibold">GHS {Number(summary?.total_pending || 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-red-600 rounded-xl p-4 text-white flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center"><AlertCircle size={20} /></div>
          <div>
            <p className="text-xs text-white/80">Overdue</p>
            <p className="text-lg font-semibold">GHS {Number(summary?.total_overdue || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3">
          <div className="relative max-w-xs flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name or admission no."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
            <option value="">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>

        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100">
              <th className="px-4 py-3 font-medium">Student Name</th>
              <th className="px-4 py-3 font-medium">Class</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{p.student_name || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{p.class_name || '—'}</td>
                <td className="px-4 py-3 text-slate-600">GHS {Number(p.amount).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusStyles[p.status] || 'bg-slate-100 text-slate-600'}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3">
                  {p.status !== 'Paid' && (
                    <button onClick={() => markPaid(p.id)} className="text-brand-blue text-xs font-medium hover:underline">
                      Mark Paid
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!payments.length && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No payment records found.</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Wallet size={18} /> Record Payment</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <select required value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select Student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name} ({s.admission_no})</option>
                ))}
              </select>
              <input required type="number" step="0.01" placeholder="Amount (GHS)" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
              <input placeholder="Payment Method (e.g. Mobile Money)" value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Reference No. (optional)" value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <button type="submit" className="w-full bg-brand-blue text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700">
                Save Payment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}