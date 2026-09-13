import { useEffect, useState } from 'react';
import { Plus, X, FileText, Trash2 } from 'lucide-react';
import api from '../api/client';

const emptyForm = { title: '', class_id: '', subject_id: '', description: '', due_date: '' };

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classFilter, setClassFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');

  const load = () => {
    api.get('/assignments', { params: classFilter ? { class_id: classFilter } : {} })
      .then((res) => setAssignments(res.data))
      .catch(() => {});
  };

  useEffect(() => { load(); }, [classFilter]);
  useEffect(() => {
    api.get('/classes').then((res) => setClasses(res.data)).catch(() => {});
    api.get('/subjects').then((res) => setSubjects(res.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.post('/assignments', form);
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not create assignment.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/assignments/${id}`);
      load();
    } catch {
      // table refresh will simply not remove the row if this fails
    }
  };

  const isOverdue = (dueDate) => dueDate && new Date(dueDate) < new Date(new Date().toDateString());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <FileText size={20} /> Assignments
          </h1>
          <p className="text-sm text-slate-500">{assignments.length} assignment{assignments.length === 1 ? '' : 's'}</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
            <option value="">All Classes</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-brand-blue text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
            <Plus size={16} /> Add Assignment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assignments.map((a) => (
          <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">{a.title}</h3>
                <p className="text-xs text-slate-500">{a.class_name} • {a.subject_name}</p>
              </div>
              <button onClick={() => handleDelete(a.id)} className="text-slate-400 hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </div>
            {a.description && <p className="text-sm text-slate-600 mt-2">{a.description}</p>}
            {a.due_date && (
              <p className={`text-xs mt-3 font-medium ${isOverdue(a.due_date) ? 'text-red-600' : 'text-slate-500'}`}>
                Due: {new Date(a.due_date).toLocaleDateString()} {isOverdue(a.due_date) && '(Overdue)'}
              </p>
            )}
          </div>
        ))}
        {!assignments.length && (
          <p className="col-span-full text-center text-slate-400 py-8">No assignments yet.</p>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
            <h2 className="text-lg font-semibold mb-4">Add Assignment</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required placeholder="Title (e.g. Fractions Worksheet)" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <select required value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select Class</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select required value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select Subject</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <textarea placeholder="Description (optional)" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input type="date" value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <button type="submit" className="w-full bg-brand-blue text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700">
                Save Assignment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}