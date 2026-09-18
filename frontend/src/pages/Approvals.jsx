import { useEffect, useState } from 'react';
import { Plus, X, CheckCircle2, ClipboardSignature, Check, Ban } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const emptyForm = { type: 'Leave Request', details: '' };
const requestTypes = ['Leave Request', 'Fee Waiver', 'Expense', 'Other'];

const statusStyles = {
  Pending: 'bg-amber-100 text-amber-700',
  Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
};

export default function Approvals() {
  const { user } = useAuth();
  const isApprover = user?.role === 'admin' || user?.role === 'principal';
  const [tab, setTab] = useState(isApprover ? 'all' : 'mine'); // 'all' | 'mine'

  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');

  const [decidingId, setDecidingId] = useState(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [decideError, setDecideError] = useState('');

  const load = () => {
    const endpoint = tab === 'all' ? '/approvals' : '/approvals/mine';
    api.get(endpoint, { params: tab === 'all' && statusFilter ? { status: statusFilter } : {} })
      .then((res) => setItems(res.data)).catch(() => {});
  };

  useEffect(() => { load(); }, [tab, statusFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.post('/approvals', form);
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not submit request.');
    }
  };

  const decide = async (status) => {
    setDecideError('');
    try {
      await api.put(`/approvals/${decidingId}/decide`, { status, decision_notes: decisionNotes });
      setDecidingId(null);
      setDecisionNotes('');
      load();
    } catch (err) {
      setDecideError(err.response?.data?.message || 'Could not record decision.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <ClipboardSignature size={20} /> Approvals
          </h1>
          <p className="text-sm text-slate-500">Leave requests, fee waivers, and other approvals</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-brand-blue text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={16} /> Submit Request
        </button>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {isApprover && (
            <button onClick={() => setTab('all')}
              className={`text-sm px-4 py-2 rounded-lg font-medium ${tab === 'all' ? 'bg-brand-blue text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
              All Requests
            </button>
          )}
          <button onClick={() => setTab('mine')}
            className={`text-sm px-4 py-2 rounded-lg font-medium ${tab === 'mine' ? 'bg-brand-blue text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            My Requests
          </button>
        </div>
        {tab === 'all' && (
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {items.map((item) => (
          <div key={item.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-slate-800">{item.type}</p>
                {tab === 'all' && <p className="text-xs text-slate-500">Requested by {item.requested_by_name}</p>}
                <p className="text-xs text-slate-400">{new Date(item.created_at).toLocaleString()}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${statusStyles[item.status]}`}>{item.status}</span>
            </div>
            <p className="text-sm text-slate-600 mt-2">{item.details}</p>
            {item.decision_notes && (
              <p className="text-xs text-slate-500 mt-2 italic">Decision note: {item.decision_notes}</p>
            )}
            {item.decided_by_name && (
              <p className="text-xs text-slate-400 mt-1">Decided by {item.decided_by_name}</p>
            )}
            {tab === 'all' && item.status === 'Pending' && (
              <button onClick={() => setDecidingId(item.id)}
                className="mt-3 text-brand-blue text-xs font-medium hover:underline flex items-center gap-1">
                <CheckCircle2 size={12} /> Review & Decide
              </button>
            )}
          </div>
        ))}
        {!items.length && (
          <p className="p-8 text-center text-slate-400">No requests found.</p>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
            <h2 className="text-lg font-semibold mb-4">Submit Request</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                {requestTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <textarea required placeholder="Describe your request..." rows={4} value={form.details}
                onChange={(e) => setForm({ ...form, details: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <button type="submit" className="w-full bg-brand-blue text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700">
                Submit
              </button>
            </form>
          </div>
        </div>
      )}

      {decidingId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 relative">
            <button onClick={() => setDecidingId(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
            <h2 className="text-lg font-semibold mb-4">Review Request</h2>
            <textarea placeholder="Decision note (optional)" rows={3} value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-3" />

            {decideError && <p className="text-sm text-red-600 mb-3">{decideError}</p>}

            <div className="flex gap-3">
              <button onClick={() => decide('Approved')}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-green-700">
                <Check size={16} /> Approve
              </button>
              <button onClick={() => decide('Rejected')}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-red-700">
                <Ban size={16} /> Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}