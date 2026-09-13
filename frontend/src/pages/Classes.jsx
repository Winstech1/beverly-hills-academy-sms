import { useEffect, useState } from 'react';
import { Plus, X, Users } from 'lucide-react';
import api from '../api/client';

const emptyForm = { name: '', capacity: 50, class_teacher_id: '' };

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');

  const load = () => {
    api.get('/classes').then((res) => setClasses(res.data)).catch(() => {});
  };

    useEffect(() => {
    load();
    api.get('/teachers', { params: { limit: 200 } }).then((res) => setTeachers(res.data.data)).catch(() => {});
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.post('/classes', form);
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not add class.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Class Management</h1>
          <p className="text-sm text-slate-500">{classes.length} classes — Creche to JHS 3</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-brand-blue text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} /> Add Class
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((c) => (
          <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-800">{c.name}</h3>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                Cap. {c.capacity}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Users size={14} />
              {c.student_count} student{c.student_count === '1' ? '' : 's'}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Class Teacher: {c.class_teacher || 'Not assigned'}
            </p>
          </div>
        ))}
        {!classes.length && (
          <p className="col-span-full text-center text-slate-400 py-8">No classes found.</p>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
            <h2 className="text-lg font-semibold mb-4">Add Class</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required placeholder="Class Name (e.g. JHS 1)" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                            <input type="number" placeholder="Capacity" value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <select value={form.class_teacher_id} onChange={(e) => setForm({ ...form, class_teacher_id: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Assign Class Teacher (optional)</option>
                {teachers.map((t) => <option key={t.id} value={t.user_id || ''} disabled={!t.user_id}>
                  {t.full_name}{!t.user_id ? ' (no login yet)' : ''}
                </option>)}
              </select>

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <button type="submit" className="w-full bg-brand-blue text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700">
                Save Class
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}