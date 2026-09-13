import { useEffect, useState } from 'react';
import { Plus, X, CalendarDays, Trash2 } from 'lucide-react';
import api from '../api/client';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const emptyForm = { subject_id: '', teacher_id: '', day_of_week: 'Monday', start_time: '', end_time: '' };

export default function Timetable() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [slots, setSlots] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');

  const loadSlots = () => {
    if (!classId) return;
    api.get('/timetable', { params: { class_id: classId } }).then((res) => setSlots(res.data)).catch(() => {});
  };

  useEffect(() => {
    api.get('/classes').then((res) => {
      setClasses(res.data);
      if (res.data.length) setClassId(String(res.data[0].id));
    }).catch(() => {});
    api.get('/subjects').then((res) => setSubjects(res.data)).catch(() => {});
    api.get('/teachers', { params: { limit: 200 } }).then((res) => setTeachers(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => { loadSlots(); }, [classId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.post('/timetable', { ...form, class_id: classId });
      setShowModal(false);
      setForm(emptyForm);
      loadSlots();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not add timetable slot.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/timetable/${id}`);
      loadSlots();
    } catch {
      // leave row as-is if delete fails
    }
  };

  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = Number(h);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const display = hour % 12 === 0 ? 12 : hour % 12;
    return `${display}:${m} ${suffix}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <CalendarDays size={20} /> Timetable
          </h1>
          <p className="text-sm text-slate-500">Weekly class schedule</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={classId} onChange={(e) => setClassId(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm min-w-[160px]">
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-brand-blue text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
            <Plus size={16} /> Add Period
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {days.map((day) => (
          <div key={day} className="bg-white rounded-xl border border-slate-200 p-3">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 text-center border-b border-slate-100 pb-2">{day}</h3>
            <div className="space-y-2">
              {slots.filter((s) => s.day_of_week === day).map((s) => (
                <div key={s.id} className="bg-blue-50 border border-blue-100 rounded-lg p-2 relative group">
                  <button onClick={() => handleDelete(s.id)}
                    className="absolute top-1 right-1 text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100">
                    <Trash2 size={12} />
                  </button>
                  <p className="text-xs font-medium text-slate-800">{s.subject_name}</p>
                  <p className="text-xs text-slate-500">{formatTime(s.start_time)} – {formatTime(s.end_time)}</p>
                  {s.teacher_name && <p className="text-xs text-slate-400">{s.teacher_name}</p>}
                </div>
              ))}
              {!slots.filter((s) => s.day_of_week === day).length && (
                <p className="text-xs text-slate-300 text-center py-4">No periods</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
            <h2 className="text-lg font-semibold mb-4">Add Period</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <select value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                {days.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select required value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select Subject</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={form.teacher_id} onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select Teacher (optional)</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
              </select>
              <div className="flex gap-3">
                <input required type="time" value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                <input required type="time" value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <button type="submit" className="w-full bg-brand-blue text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700">
                Save Period
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}