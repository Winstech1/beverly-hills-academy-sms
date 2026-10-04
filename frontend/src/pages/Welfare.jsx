import { useEffect, useState } from 'react';
import { Plus, X, HeartHandshake, Trash2, FileText } from 'lucide-react';
import api from '../api/client';

const emptyContribForm = { teacher_id: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), amount: '' };
const emptyPolicyForm = { title: '', content: '', document_url: '' };
const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function Welfare() {
  const [tab, setTab] = useState('contributions'); // 'contributions' | 'policies'
  const [contributions, setContributions] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());

  const [showContribModal, setShowContribModal] = useState(false);
  const [contribForm, setContribForm] = useState(emptyContribForm);
  const [contribError, setContribError] = useState('');

  const [policies, setPolicies] = useState([]);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policyForm, setPolicyForm] = useState(emptyPolicyForm);
  const [policyError, setPolicyError] = useState('');

  const loadContributions = () => api.get('/welfare/contributions', { params: { year: yearFilter } }).then((res) => setContributions(res.data)).catch(() => {});
  const loadPolicies = () => api.get('/welfare/policies').then((res) => setPolicies(res.data)).catch(() => {});

  useEffect(() => { loadContributions(); }, [yearFilter]);
  useEffect(() => {
    loadPolicies();
    api.get('/teachers', { params: { limit: 200 } }).then((res) => setTeachers(res.data.data)).catch(() => {});
  }, []);

  const handleAddContribution = async (e) => {
    e.preventDefault();
    setContribError('');
    try {
      await api.post('/welfare/contributions', contribForm);
      setShowContribModal(false);
      setContribForm({ ...emptyContribForm, teacher_id: '' });
      loadContributions();
    } catch (err) {
      setContribError(err.response?.data?.message || 'Could not record contribution.');
    }
  };

  const handleDeleteContribution = async (id) => {
    try {
      await api.delete(`/welfare/contributions/${id}`);
      loadContributions();
    } catch {
      // stays listed if delete fails
    }
  };

  const handleAddPolicy = async (e) => {
    e.preventDefault();
    setPolicyError('');
    try {
      await api.post('/welfare/policies', policyForm);
      setShowPolicyModal(false);
      setPolicyForm(emptyPolicyForm);
      loadPolicies();
    } catch (err) {
      setPolicyError(err.response?.data?.message || 'Could not add policy.');
    }
  };

  const handleDeletePolicy = async (id) => {
    if (!window.confirm('Delete this policy?')) return;
    try {
      await api.delete(`/welfare/policies/${id}`);
      loadPolicies();
    } catch {
      // stays listed if delete fails
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <HeartHandshake size={20} /> Staff Welfare
          </h1>
          <p className="text-sm text-slate-500">Monthly contributions and welfare policies</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('contributions')}
            className={`text-sm px-4 py-2 rounded-lg font-medium ${tab === 'contributions' ? 'bg-brand-blue text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            Contributions
          </button>
          <button onClick={() => setTab('policies')}
            className={`text-sm px-4 py-2 rounded-lg font-medium ${tab === 'policies' ? 'bg-brand-blue text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            Policies
          </button>
        </div>
      </div>

      {tab === 'contributions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <input type="number" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-28" />
            <button onClick={() => setShowContribModal(true)}
              className="flex items-center gap-2 bg-brand-blue text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
              <Plus size={16} /> Record Contribution
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-3 font-medium">Teacher</th>
                  <th className="px-4 py-3 font-medium">Month</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Recorded</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contributions.map((c) => (
                  <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{c.teacher_name}</td>
                    <td className="px-4 py-3 text-slate-600">{monthNames[c.month - 1]} {c.year}</td>
                    <td className="px-4 py-3 text-slate-600">GHS {Number(c.amount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{new Date(c.recorded_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDeleteContribution(c.id)} className="text-slate-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!contributions.length && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No contributions recorded for {yearFilter}.</td></tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'policies' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowPolicyModal(true)}
              className="flex items-center gap-2 bg-brand-blue text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
              <Plus size={16} /> Add Policy
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {policies.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2"><FileText size={16} /> {p.title}</h3>
                  <button onClick={() => handleDeletePolicy(p.id)} className="text-slate-300 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="text-sm text-slate-600 mt-2 line-clamp-3">{p.content}</p>
                {p.document_url && (
                  <a href={p.document_url} target="_blank" rel="noreferrer" className="text-xs text-brand-blue hover:underline mt-2 inline-block">
                    View attached document
                  </a>
                )}
                <p className="text-xs text-slate-400 mt-2">By {p.uploaded_by_name || 'Admin'} • {new Date(p.uploaded_at).toLocaleDateString()}</p>
              </div>
            ))}
            {!policies.length && (
              <p className="col-span-full text-center text-slate-400 py-8">No welfare policies added yet.</p>
            )}
          </div>
        </div>
      )}

      {showContribModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowContribModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
            <h2 className="text-lg font-semibold mb-4">Record Contribution</h2>
            <form onSubmit={handleAddContribution} className="space-y-3">
              <select required value={contribForm.teacher_id} onChange={(e) => setContribForm({ ...contribForm, teacher_id: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select Teacher</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
              </select>
              <div className="flex gap-3">
                <select value={contribForm.month} onChange={(e) => setContribForm({ ...contribForm, month: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                  {monthNames.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
                <input type="number" value={contribForm.year} onChange={(e) => setContribForm({ ...contribForm, year: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <input required type="number" step="0.01" placeholder="Amount (GHS)" value={contribForm.amount}
                onChange={(e) => setContribForm({ ...contribForm, amount: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />

              {contribError && <p className="text-sm text-red-600">{contribError}</p>}

              <button type="submit" className="w-full bg-brand-blue text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700">
                Save Contribution
              </button>
            </form>
          </div>
        </div>
      )}

      {showPolicyModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 relative">
            <button onClick={() => setShowPolicyModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
            <h2 className="text-lg font-semibold mb-4">Add Policy</h2>
            <form onSubmit={handleAddPolicy} className="space-y-3">
              <input required placeholder="Policy Title" value={policyForm.title}
                onChange={(e) => setPolicyForm({ ...policyForm, title: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <textarea required placeholder="Policy content / summary" rows={5} value={policyForm.content}
                onChange={(e) => setPolicyForm({ ...policyForm, content: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Document Link (optional — e.g. a Google Drive link)" value={policyForm.document_url}
                onChange={(e) => setPolicyForm({ ...policyForm, document_url: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />

              {policyError && <p className="text-sm text-red-600">{policyError}</p>}

              <button type="submit" className="w-full bg-brand-blue text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700">
                Save Policy
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}