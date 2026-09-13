import { useEffect, useState } from 'react';
import { Plus, X, BookOpen, Trash2 } from 'lucide-react';
import api from '../api/client';

const emptyForm = { name: '', department: '' };

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [message, setMessage] = useState('');

  const load = () => {
    api.get('/subjects').then((res) => setSubjects(res.data)).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.post('/subjects', form);
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not add subject.');
    }
  };

  const handleDelete = async (id) => {
    setMessage('');
    try {
      await api.delete(`/subjects/${id}`);
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not delete subject.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <BookOpen size={20} /> Subjects
          </h1>
          <p className="text-sm text-slate-500">{subjects.length} subjects on the curriculum</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-brand-blue text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={16} /> Add Subject
        </button>
      </div>

      {message && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3">{message}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((s) => (
          <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-800">{s.name}</h3>
              <p className="text-xs text-slate-400">{s.department || 'No department'}</p>
            </div>
            <button onClick={() => handleDelete(s.id)} className="text-slate-400 hover:text-red-600">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {!subjects.length && (
          <p className="col-span-full text-center text-slate-400 py-8">No subjects added yet.</p>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
            <h2 className="text-lg font-semibold mb-4">Add Subject</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required placeholder="Subject Name (e.g. Dagaare)" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Department (e.g. Ghanaian Language)" value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <button type="submit" className="w-full bg-brand-blue text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700">
                Save Subject
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}