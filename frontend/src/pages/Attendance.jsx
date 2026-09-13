import { useEffect, useState } from 'react';
import { CalendarCheck, Save } from 'lucide-react';
import api from '../api/client';

const today = () => new Date().toISOString().slice(0, 10);
const statusOptions = ['Present', 'Absent', 'Late'];

const statusStyles = {
  Present: 'bg-green-100 text-green-700 border-green-300',
  Absent: 'bg-red-100 text-red-700 border-red-300',
  Late: 'bg-amber-100 text-amber-700 border-amber-300',
};

export default function Attendance() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(today());
  const [roster, setRoster] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/classes').then((res) => {
      setClasses(res.data);
      if (res.data.length) setClassId(String(res.data[0].id));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!classId || !date) return;
    api.get('/attendance', { params: { class_id: classId, date } })
      .then((res) => setRoster(res.data.map((r) => ({ ...r, status: r.status || 'Present' }))))
      .catch(() => setRoster([]));
  }, [classId, date]);

  const setStatus = (studentId, status) => {
    setRoster((prev) => prev.map((r) => (r.student_id === studentId ? { ...r, status } : r)));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.post('/attendance', {
        class_id: classId,
        date,
        records: roster.map((r) => ({ student_id: r.student_id, status: r.status })),
      });
      setMessage('Attendance saved successfully.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not save attendance.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <CalendarCheck size={20} /> Attendance
        </h1>
        <p className="text-sm text-slate-500">Mark daily attendance for a class</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Class</label>
          <select value={classId} onChange={(e) => setClassId(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm min-w-[160px]">
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <button onClick={handleSave} disabled={saving || !roster.length}
          className="ml-auto flex items-center gap-2 bg-brand-blue text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60">
          <Save size={16} /> {saving ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>

      {message && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg px-4 py-3">
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100">
              <th className="px-4 py-3 font-medium">Student Name</th>
              <th className="px-4 py-3 font-medium">Admission No.</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((r) => (
              <tr key={r.student_id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{r.full_name}</td>
                <td className="px-4 py-3 text-slate-600">{r.admission_no}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {statusOptions.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setStatus(r.student_id, opt)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          r.status === opt ? statusStyles[opt] : 'bg-white text-slate-500 border-slate-200'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {!roster.length && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                No students in this class yet.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}