import { useEffect, useState } from 'react';
import { Plus, X, ClipboardList, ArrowLeft, Save } from 'lucide-react';
import api from '../api/client';

const emptyForm = { name: '', class_id: '', subject_id: '', exam_date: '', max_score: 100 };

export default function Examinations() {
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');

  const [activeExam, setActiveExam] = useState(null); // when set, shows the results-entry view
  const [roster, setRoster] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const loadExams = () => {
    api.get('/exams').then((res) => setExams(res.data)).catch(() => {});
  };

  useEffect(() => {
    loadExams();
    api.get('/classes').then((res) => setClasses(res.data)).catch(() => {});
    api.get('/subjects').then((res) => setSubjects(res.data)).catch(() => {});
  }, []);

  const handleCreateExam = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.post('/exams', form);
      setShowModal(false);
      setForm(emptyForm);
      loadExams();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not create exam.');
    }
  };

  const openResults = async (exam) => {
    setMessage('');
    try {
      const res = await api.get(`/exams/${exam.id}/results`);
      setActiveExam(res.data.exam);
      setRoster(res.data.roster.map((r) => ({ ...r, score: r.score ?? '' })));
    } catch {
      setMessage('Could not load results for this exam.');
    }
  };

  const setScore = (studentId, score) => {
    setRoster((prev) => prev.map((r) => (r.student_id === studentId ? { ...r, score } : r)));
  };

  const handleSaveResults = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.post(`/exams/${activeExam.id}/results`, {
        records: roster.map((r) => ({ student_id: r.student_id, score: r.score })),
      });
      setMessage('Results saved successfully.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not save results.');
    } finally {
      setSaving(false);
    }
  };

  // ---- Results entry view ----
  if (activeExam) {
    return (
      <div className="space-y-4">
        <button onClick={() => setActiveExam(null)} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft size={16} /> Back to Exams
        </button>

        <div>
          <h1 className="text-xl font-semibold text-slate-900">{activeExam.name}</h1>
          <p className="text-sm text-slate-500">Max score: {activeExam.max_score}</p>
        </div>

        {message && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg px-4 py-3">{message}</div>
        )}

        <div className="bg-white rounded-xl border border-slate-200">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="px-4 py-3 font-medium">Student Name</th>
                <th className="px-4 py-3 font-medium">Admission No.</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Grade</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((r) => (
                <tr key={r.student_id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{r.full_name}</td>
                  <td className="px-4 py-3 text-slate-600">{r.admission_no}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      max={activeExam.max_score}
                      value={r.score}
                      onChange={(e) => setScore(r.student_id, e.target.value)}
                      className="w-20 border border-slate-300 rounded-lg px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.grade || '—'}</td>
                </tr>
              ))}
              {!roster.length && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No students in this class.</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        <button onClick={handleSaveResults} disabled={saving || !roster.length}
          className="flex items-center gap-2 bg-brand-blue text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60">
          <Save size={16} /> {saving ? 'Saving...' : 'Save Results'}
        </button>
      </div>
    );
  }

  // ---- Exam list view ----
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <ClipboardList size={20} /> Examinations & Results
          </h1>
          <p className="text-sm text-slate-500">{exams.length} exam{exams.length === 1 ? '' : 's'} scheduled</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-brand-blue text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={16} /> Add Exam
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100">
              <th className="px-4 py-3 font-medium">Exam Name</th>
              <th className="px-4 py-3 font-medium">Class</th>
              <th className="px-4 py-3 font-medium">Subject</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((ex) => (
              <tr key={ex.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{ex.name}</td>
                <td className="px-4 py-3 text-slate-600">{ex.class_name}</td>
                <td className="px-4 py-3 text-slate-600">{ex.subject_name}</td>
                <td className="px-4 py-3 text-slate-600">{new Date(ex.exam_date).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <button onClick={() => openResults(ex)} className="text-brand-blue text-xs font-medium hover:underline">
                    Enter Results
                  </button>
                </td>
              </tr>
            ))}
            {!exams.length && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No exams scheduled yet.</td></tr>
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
            <h2 className="text-lg font-semibold mb-4">Add Exam</h2>
            <form onSubmit={handleCreateExam} className="space-y-3">
              <input required placeholder="Exam Name (e.g. Mid Term 1)" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
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
              <input required type="date" value={form.exam_date}
                onChange={(e) => setForm({ ...form, exam_date: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input type="number" placeholder="Max Score" value={form.max_score}
                onChange={(e) => setForm({ ...form, max_score: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <button type="submit" className="w-full bg-brand-blue text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700">
                Save Exam
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}