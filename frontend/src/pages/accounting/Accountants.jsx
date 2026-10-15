import { useEffect, useState } from 'react';
import { Trash2, KeyRound } from 'lucide-react';
import api from '../../api/client';
import { errMsg } from './format';

const input = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue';

export default function Accountants() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ full_name: '', username: '', password: '' });
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/accountants').then((r) => setRows(r.data))
    .catch((e) => setError(errMsg(e, 'Could not fetch accountants')));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setOk('');
    try {
      const res = await api.post('/accountants', form);
      setOk(`Account created. ${res.data.full_name} can sign in with username "${res.data.username}".`);
      setForm({ full_name: '', username: '', password: '' });
      load();
    } catch (err) {
      setError(errMsg(err, 'Could not create account'));
    } finally {
      setSaving(false);
    }
  };

  const reset = async (a) => {
    const pw = window.prompt(`New password for ${a.full_name} (at least 6 characters):`);
    if (!pw) return;
    try { await api.put(`/accountants/${a.id}/password`, { password: pw }); setOk('Password reset.'); setError(''); }
    catch (err) { setError(errMsg(err, 'Could not reset password')); }
  };

  const remove = async (a) => {
    if (!window.confirm(`Remove ${a.full_name}'s accountant account? Records they entered are kept.`)) return;
    try { await api.delete(`/accountants/${a.id}`); load(); }
    catch (err) { setError(errMsg(err, 'Could not remove account')); }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-slate-900">Accountant accounts</h2>

      <form onSubmit={create} className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Full name</label>
          <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={input} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className={input} autoComplete="off" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input type="text" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={input} autoComplete="off" />
        </div>
        <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-brand-blue text-white font-medium disabled:opacity-60">
          {saving ? 'Creating...' : 'Create account'}
        </button>
      </form>

      {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>}
      {ok && <div className="rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3">{ok}</div>}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[520px]">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-10 text-center text-slate-400">No accountant accounts yet.</td></tr>
            )}
            {rows.map((a) => (
              <tr key={a.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium">{a.full_name}</td>
                <td className="px-4 py-3">{a.username}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button onClick={() => reset(a)} className="p-1.5 text-slate-400 hover:text-brand-blue" title="Reset password"><KeyRound className="w-4 h-4" /></button>
                  <button onClick={() => remove(a)} className="p-1.5 text-slate-400 hover:text-red-600" title="Remove"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}