import { useEffect, useState } from 'react';
import { GraduationCap, ClipboardList, CalendarCheck, Wallet } from 'lucide-react';
import api from '../api/client';

const statusStyles = {
  Present: 'bg-green-100 text-green-700',
  Absent: 'bg-red-100 text-red-700',
  Late: 'bg-amber-100 text-amber-700',
  Paid: 'bg-green-100 text-green-700',
  Pending: 'bg-amber-100 text-amber-700',
  Overdue: 'bg-red-100 text-red-700',
};

export default function StudentPortal() {
  const [tab, setTab] = useState('results');
  const [me, setMe] = useState(null);
  const [results, setResults] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/students/me').then((res) => setMe(res.data)).catch(() => setError('No student record is linked to this login yet.'));
    api.get('/exams/my-results').then((res) => setResults(res.data)).catch(() => {});
    api.get('/attendance/mine').then((res) => setAttendance(res.data)).catch(() => {});
    api.get('/payments/mine').then((res) => setPayments(res.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <GraduationCap size={20} /> My Portal
        </h1>
        <p className="text-sm text-slate-500">
          {me ? `${me.full_name} — ${me.class_name || 'No class assigned'}` : 'Your results, attendance, and fees'}
        </p>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      <div className="flex gap-2">
        <button onClick={() => setTab('results')}
          className={`text-sm px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${tab === 'results' ? 'bg-brand-blue text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
          <ClipboardList size={14} /> Results
        </button>
        <button onClick={() => setTab('attendance')}
          className={`text-sm px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${tab === 'attendance' ? 'bg-brand-blue text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
          <CalendarCheck size={14} /> Attendance
        </button>
        <button onClick={() => setTab('fees')}
          className={`text-sm px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${tab === 'fees' ? 'bg-brand-blue text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
          <Wallet size={14} /> Fees
        </button>
      </div>

      {tab === 'results' && (
        <div className="bg-white rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="px-4 py-3 font-medium">Exam</th>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Grade</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{r.exam_name}</td>
                  <td className="px-4 py-3 text-slate-600">{r.subject_name}</td>
                  <td className="px-4 py-3 text-slate-600">{r.score} / {r.max_score}</td>
                  <td className="px-4 py-3 text-slate-600">{r.grade}</td>
                  <td className="px-4 py-3 text-slate-600">{new Date(r.exam_date).toLocaleDateString()}</td>
                </tr>
              ))}
              {!results.length && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No results published yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'attendance' && (
        <div className="bg-white rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((a, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="px-4 py-3 text-slate-600">{new Date(a.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusStyles[a.status]}`}>{a.status}</span>
                  </td>
                </tr>
              ))}
              {!attendance.length && (
                <tr><td colSpan={2} className="px-4 py-8 text-center text-slate-400">No attendance records yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'fees' && (
        <div className="bg-white rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="px-4 py-3 text-slate-800 font-medium">GHS {Number(p.amount).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusStyles[p.status]}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.method || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
              {!payments.length && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No fee records yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}