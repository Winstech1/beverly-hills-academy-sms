import { useEffect, useState } from 'react';
import { HeartHandshake, FileText } from 'lucide-react';
import api from '../api/client';

const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function TeacherWelfare() {
  const [data, setData] = useState({ contributions: [], total: 0 });
  const [policies, setPolicies] = useState([]);

  useEffect(() => {
    api.get('/welfare/contributions/mine').then((res) => setData(res.data)).catch(() => {});
    api.get('/welfare/policies').then((res) => setPolicies(res.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <HeartHandshake size={20} /> My Welfare
        </h1>
        <p className="text-sm text-slate-500">Your monthly contributions and welfare policies</p>
      </div>

      <div className="bg-brand-blue rounded-xl p-5 text-white">
        <p className="text-sm text-white/80">Total Contributed</p>
        <p className="text-3xl font-semibold mt-1">GHS {Number(data.total).toLocaleString()}</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100">
              <th className="px-4 py-3 font-medium">Month</th>
              <th className="px-4 py-3 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.contributions.map((c, i) => (
              <tr key={i} className="border-b border-slate-50">
                <td className="px-4 py-3 text-slate-800">{monthNames[c.month - 1]} {c.year}</td>
                <td className="px-4 py-3 text-slate-600">GHS {Number(c.amount).toLocaleString()}</td>
              </tr>
            ))}
            {!data.contributions.length && (
              <tr><td colSpan={2} className="px-4 py-8 text-center text-slate-400">No contributions recorded yet.</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      <h2 className="text-sm font-semibold text-slate-700 mt-6">Welfare Policies</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {policies.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2"><FileText size={16} /> {p.title}</h3>
            <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{p.content}</p>
            {p.document_url && (
              <a href={p.document_url} target="_blank" rel="noreferrer" className="text-xs text-brand-blue hover:underline mt-2 inline-block">
                View attached document
              </a>
            )}
          </div>
        ))}
        {!policies.length && (
          <p className="col-span-full text-center text-slate-400 py-8">No welfare policies posted yet.</p>
        )}
      </div>
    </div>
  );
}