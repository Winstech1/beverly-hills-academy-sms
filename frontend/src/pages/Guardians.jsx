import { useEffect, useState } from 'react';
import { Search, Plus, X, Users2, Trash2, Link2, Phone } from 'lucide-react';
import api from '../api/client';

const emptyForm = { full_name: '', relationship: '', phone: '', alt_phone: '', email: '', occupation: '', address: '' };
const emptyLinkForm = { student_id: '', is_primary: false };

export default function Guardians() {
  const [guardians, setGuardians] = useState([]);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');

  const [activeGuardian, setActiveGuardian] = useState(null); // detail view with children
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkForm, setLinkForm] = useState(emptyLinkForm);
  const [linkError, setLinkError] = useState('');

  const load = () => api.get('/guardians', { params: { search } }).then((res) => setGuardians(res.data)).catch(() => {});

  useEffect(() => { load(); }, [search]);
  useEffect(() => {
    api.get('/students', { params: { limit: 500 } }).then((res) => setStudents(res.data.data)).catch(() => {});
  }, []);

  const openGuardian = async (id) => {
    try {
      const res = await api.get(`/guardians/${id}`);
      setActiveGuardian(res.data);
    } catch {
      // stay on list if it fails
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.post('/guardians', form);
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not add guardian.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/guardians/${id}`);
      setActiveGuardian(null);
      load();
    } catch {
      // stays listed if delete fails
    }
  };

  const handleLink = async (e) => {
    e.preventDefault();
    setLinkError('');
    try {
      await api.post(`/guardians/${activeGuardian.id}/link`, linkForm);
      setShowLinkModal(false);
      setLinkForm(emptyLinkForm);
      openGuardian(activeGuardian.id);
      load();
    } catch (err) {
      setLinkError(err.response?.data?.message || 'Could not link student.');
    }
  };

  const handleUnlink = async (studentId) => {
    try {
      await api.delete(`/guardians/${activeGuardian.id}/link/${studentId}`);
      openGuardian(activeGuardian.id);
      load();
    } catch {
      // leave as-is if it fails
    }
  };

  // ---- Guardian detail view ----
  if (activeGuardian) {
    return (
      <div className="space-y-4">
        <button onClick={() => setActiveGuardian(null)} className="text-sm text-slate-600 hover:text-slate-900">
          ← Back to Guardians
        </button>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">{activeGuardian.full_name}</h1>
              <p className="text-sm text-slate-500">{activeGuardian.relationship || 'Guardian'}</p>
            </div>
            <button onClick={() => handleDelete(activeGuardian.id)} className="text-slate-400 hover:text-red-600">
              <Trash2 size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 text-sm text-slate-600">
            <p className="flex items-center gap-2"><Phone size={14} /> {activeGuardian.phone}</p>
            {activeGuardian.alt_phone && <p className="flex items-center gap-2"><Phone size={14} /> {activeGuardian.alt_phone} (alt)</p>}
            {activeGuardian.email && <p>Email: {activeGuardian.email}</p>}
            {activeGuardian.occupation && <p>Occupation: {activeGuardian.occupation}</p>}
            {activeGuardian.address && <p className="sm:col-span-2">Address: {activeGuardian.address}</p>}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Children ({activeGuardian.children.length})</h2>
          <button onClick={() => setShowLinkModal(true)}
            className="flex items-center gap-2 bg-brand-blue text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
            <Link2 size={16} /> Link Student
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {activeGuardian.children.map((c) => (
            <div key={c.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">{c.full_name} {c.is_primary && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-2">Primary</span>}</p>
                <p className="text-xs text-slate-500">{c.admission_no} • {c.class_name || 'No class'}</p>
              </div>
              <button onClick={() => handleUnlink(c.id)} className="text-slate-400 hover:text-red-600">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {!activeGuardian.children.length && (
            <p className="p-4 text-center text-slate-400">No children linked yet.</p>
          )}
        </div>

        {showLinkModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6 relative">
              <button onClick={() => setShowLinkModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
              <h2 className="text-lg font-semibold mb-4">Link Student</h2>
              <form onSubmit={handleLink} className="space-y-3">
                <select required value={linkForm.student_id} onChange={(e) => setLinkForm({ ...linkForm, student_id: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Select Student</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.admission_no})</option>)}
                </select>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={linkForm.is_primary}
                    onChange={(e) => setLinkForm({ ...linkForm, is_primary: e.target.checked })} />
                  Set as primary contact for this student
                </label>

                {linkError && <p className="text-sm text-red-600">{linkError}</p>}

                <button type="submit" className="w-full bg-brand-blue text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700">
                  Confirm Link
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---- Guardian list view ----
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Users2 size={20} /> Guardians
          </h1>
          <p className="text-sm text-slate-500">{guardians.length} guardian{guardians.length === 1 ? '' : 's'} on record</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-brand-blue text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={16} /> Add Guardian
        </button>
      </div>

      <div className="relative max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone"
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {guardians.map((g) => (
          <button key={g.id} onClick={() => openGuardian(g.id)}
            className="text-left bg-white rounded-xl border border-slate-200 p-4 hover:border-brand-blue transition-colors">
            <h3 className="font-semibold text-slate-800">{g.full_name}</h3>
            <p className="text-xs text-slate-500">{g.relationship || 'Guardian'}</p>
            <p className="text-sm text-slate-600 mt-2 flex items-center gap-2"><Phone size={12} /> {g.phone}</p>
            <p className="text-xs text-slate-400 mt-2">{g.children_count} child{g.children_count === '1' ? '' : 'ren'} linked</p>
          </button>
        ))}
        {!guardians.length && (
          <p className="col-span-full text-center text-slate-400 py-8">No guardians added yet.</p>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
            <h2 className="text-lg font-semibold mb-4">Add Guardian</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required placeholder="Full Name" value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <select value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Relationship (optional)</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Guardian</option>
                <option value="Grandparent">Grandparent</option>
                <option value="Other">Other</option>
              </select>
              <input required placeholder="Phone" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Alternate Phone (optional)" value={form.alt_phone}
                onChange={(e) => setForm({ ...form, alt_phone: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input type="email" placeholder="Email (optional)" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Occupation (optional)" value={form.occupation}
                onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <textarea placeholder="Address (optional)" rows={2} value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <button type="submit" className="w-full bg-brand-blue text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700">
                Save Guardian
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}