import { useEffect, useState } from 'react';
import { Plus, X, Pencil, Trash2, ArrowLeft, Printer } from 'lucide-react';
import api from '../../api/client';
import { money, MONTHS, errMsg } from './format';

const input = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue';
const emptyEmp = { full_name: '', position: '', basic_salary: '', allowances: '0', ssnit_number: '', tin_number: '', bank_name: '', account_number: '', active: true };

const STATUS_STYLE = {
  draft: 'bg-amber-50 text-amber-700',
  approved: 'bg-blue-50 text-blue-700',
  paid: 'bg-green-50 text-green-700',
};

function printPayslip(run, it) {
  const w = window.open('', '_blank', 'width=720,height=900');
  if (!w) return alert('Allow pop-ups to print the payslip.');
  const row = (a, b, bold) => `<tr><td${bold ? ' style="font-weight:700"' : ''}>${a}</td><td style="text-align:right${bold ? ';font-weight:700' : ''}">${b}</td></tr>`;
  w.document.write(`<!doctype html><html><head><title>Payslip - ${it.employee_name}</title>
  <style>
    body{font-family:Arial,sans-serif;margin:40px;color:#0f172a}
    h1{font-size:20px;margin:0} .sub{color:#64748b;font-size:13px;margin:2px 0 24px}
    table{width:100%;border-collapse:collapse;margin-bottom:20px;font-size:14px}
    td{padding:8px 4px;border-bottom:1px solid #e2e8f0}
    .box{background:#f8fafc;border:1px solid #e2e8f0;padding:14px;border-radius:8px;margin-bottom:20px;font-size:14px}
    .net{font-size:18px}
  </style></head><body>
    <h1>Beverly Hills Academy, Wa</h1>
    <p class="sub">Payslip for ${MONTHS[run.month - 1]} ${run.year}</p>
    <div class="box">
      <b>${it.employee_name}</b><br/>
      ${it.position || ''}<br/>
      SSNIT No: ${it.ssnit_number || '-'} &nbsp;|&nbsp; TIN: ${it.tin_number || '-'}
    </div>
    <table>
      ${row('Basic salary', money(it.basic_salary))}
      ${row('Allowances', money(it.allowances))}
      ${row('Gross pay', money(it.gross_pay), true)}
      ${row('SSNIT (employee 5.5%)', '- ' + money(it.ssnit_employee))}
      ${row('PAYE tax', '- ' + money(it.paye_tax))}
      ${row('Other deductions', '- ' + money(it.other_deductions))}
    </table>
    <table class="net">${row('Net pay', money(it.net_pay), true)}</table>
    <p class="sub">Employer SSNIT contribution (13%): ${money(it.ssnit_employer)}. This is not deducted from your pay.</p>
    <script>window.onload=function(){window.print()}<\/script>
  </body></html>`);
  w.document.close();
}

function Employees() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/payroll/employees').then((r) => setRows(r.data))
    .catch((e) => setError(errMsg(e, 'Could not fetch employees')));
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditingId(null); setForm(emptyEmp); setError(''); };
  const openEdit = (e) => {
    setEditingId(e.id);
    setForm({ ...emptyEmp, ...e, ssnit_number: e.ssnit_number || '', tin_number: e.tin_number || '',
      bank_name: e.bank_name || '', account_number: e.account_number || '', position: e.position || '' });
    setError('');
  };

  const save = async (ev) => {
    ev.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) await api.put(`/payroll/employees/${editingId}`, form);
      else await api.post('/payroll/employees', form);
      setForm(null);
      load();
    } catch (err) {
      setError(errMsg(err, 'Could not save employee'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (e) => {
    if (!window.confirm(`Remove ${e.full_name} from payroll? Past payslips are kept.`)) return;
    try { await api.delete(`/payroll/employees/${e.id}`); load(); }
    catch (err) { setError(errMsg(err, 'Could not remove employee')); }
  };

  const total = rows.filter((r) => r.active).reduce((s, r) => s + Number(r.basic_salary) + Number(r.allowances), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">Staff and salaries</h3>
          <p className="text-xs text-slate-500">Monthly gross for active staff: <b>{money(total)}</b></p>
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-blue text-white text-sm font-medium">
          <Plus className="w-4 h-4" /> Add staff
        </button>
      </div>
      {!form && error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Position</th>
              <th className="px-4 py-3 font-medium text-right">Basic</th>
              <th className="px-4 py-3 font-medium text-right">Allowances</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No staff added yet. Add teachers and other staff to run payroll.</td></tr>
            )}
            {rows.map((e) => (
              <tr key={e.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium">{e.full_name}</td>
                <td className="px-4 py-3 text-slate-600">{e.position || '-'}</td>
                <td className="px-4 py-3 text-right">{money(e.basic_salary)}</td>
                <td className="px-4 py-3 text-right">{money(e.allowances)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${e.active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {e.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button onClick={() => openEdit(e)} className="p-1.5 text-slate-400 hover:text-brand-blue" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => remove(e)} className="p-1.5 text-slate-400 hover:text-red-600" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={save} className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editingId ? 'Edit staff' : 'Add staff'}</h3>
              <button type="button" onClick={() => setForm(null)} className="p-1 text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Full name</label>
                <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={input} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Position</label>
                <input value={form.position} placeholder="e.g. Class teacher, Cook, Security" onChange={(e) => setForm({ ...form, position: e.target.value })} className={input} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Basic salary (GH₵)</label>
                <input type="number" min="0" step="0.01" required value={form.basic_salary} onChange={(e) => setForm({ ...form, basic_salary: e.target.value })} className={input} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Allowances (GH₵)</label>
                <input type="number" min="0" step="0.01" value={form.allowances} onChange={(e) => setForm({ ...form, allowances: e.target.value })} className={input} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SSNIT number</label>
                <input value={form.ssnit_number} onChange={(e) => setForm({ ...form, ssnit_number: e.target.value })} className={input} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">TIN</label>
                <input value={form.tin_number} onChange={(e) => setForm({ ...form, tin_number: e.target.value })} className={input} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bank</label>
                <input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} className={input} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Account number</label>
                <input value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} className={input} />
              </div>
              {editingId && (
                <label className="sm:col-span-2 flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                  Active (included in payroll)
                </label>
              )}
            </div>
            {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setForm(null)} className="px-4 py-2 text-sm rounded-lg border border-slate-300">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-brand-blue text-white font-medium disabled:opacity-60">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function RunDetail({ runId, onBack }) {
  const [run, setRun] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api.get(`/payroll/runs/${runId}`).then((r) => setRun(r.data))
    .catch((e) => setError(errMsg(e, 'Could not load payroll')));
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [runId]);

  const setStatus = async (status) => {
    const msg = status === 'paid'
      ? 'Mark this payroll as PAID? This records the salary expenses and creates PAYE and SSNIT entries in the tax tracker. It cannot be undone.'
      : 'Approve this payroll? You will no longer be able to edit it.';
    if (!window.confirm(msg)) return;
    setBusy(true);
    try { await api.patch(`/payroll/runs/${runId}/status`, { status }); setError(''); await load(); }
    catch (e) { setError(errMsg(e, 'Could not update status')); }
    finally { setBusy(false); }
  };

  const editDeduction = async (it) => {
    const v = window.prompt(`Other deductions for ${it.employee_name} (GH₵, e.g. salary advance):`, it.other_deductions);
    if (v === null) return;
    try { await api.put(`/payroll/items/${it.id}`, { other_deductions: Number(v) || 0 }); setError(''); load(); }
    catch (e) { setError(errMsg(e, 'Could not update payslip')); }
  };

  const remove = async () => {
    if (!window.confirm('Delete this draft payroll?')) return;
    try { await api.delete(`/payroll/runs/${runId}`); onBack(true); }
    catch (e) { setError(errMsg(e, 'Could not delete payroll')); }
  };

  if (!run) return <p className="text-sm text-slate-400">{error || 'Loading...'}</p>;

  const sum = (k) => run.items.reduce((s, i) => s + Number(i[k]), 0);

  return (
    <div className="space-y-4">
      <button onClick={() => onBack(false)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" /> Back to payroll runs
      </button>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">{MONTHS[run.month - 1]} {run.year} payroll</h3>
          <span className={`px-2.5 py-0.5 rounded-full text-xs capitalize ${STATUS_STYLE[run.status]}`}>{run.status}</span>
        </div>
        <div className="flex gap-2">
          {run.status === 'draft' && (
            <>
              <button onClick={remove} className="px-3.5 py-2 text-sm rounded-lg border border-red-200 text-red-600">Delete draft</button>
              <button disabled={busy} onClick={() => setStatus('approved')} className="px-3.5 py-2 text-sm rounded-lg bg-brand-blue text-white font-medium">Approve</button>
            </>
          )}
          {run.status === 'approved' && (
            <button disabled={busy} onClick={() => setStatus('paid')} className="px-3.5 py-2 text-sm rounded-lg bg-green-600 text-white font-medium">Mark as paid</button>
          )}
        </div>
      </div>
      {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[860px]">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="px-4 py-3 font-medium">Staff</th>
              <th className="px-4 py-3 font-medium text-right">Gross</th>
              <th className="px-4 py-3 font-medium text-right">SSNIT 5.5%</th>
              <th className="px-4 py-3 font-medium text-right">PAYE</th>
              <th className="px-4 py-3 font-medium text-right">Other ded.</th>
              <th className="px-4 py-3 font-medium text-right">Net pay</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {run.items.map((it) => (
              <tr key={it.id} className="border-b border-slate-100">
                <td className="px-4 py-3">
                  <span className="font-medium">{it.employee_name}</span>
                  <span className="block text-xs text-slate-400">{it.position}</span>
                </td>
                <td className="px-4 py-3 text-right">{money(it.gross_pay)}</td>
                <td className="px-4 py-3 text-right">{money(it.ssnit_employee)}</td>
                <td className="px-4 py-3 text-right">{money(it.paye_tax)}</td>
                <td className="px-4 py-3 text-right">
                  {run.status === 'draft' ? (
                    <button onClick={() => editDeduction(it)} className="text-brand-blue hover:underline">{money(it.other_deductions)}</button>
                  ) : money(it.other_deductions)}
                </td>
                <td className="px-4 py-3 text-right font-semibold">{money(it.net_pay)}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => printPayslip(run, it)} className="p-1.5 text-slate-400 hover:text-brand-blue" aria-label="Print payslip" title="Print payslip">
                    <Printer className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-semibold">
              <td className="px-4 py-3">Total ({run.items.length} staff)</td>
              <td className="px-4 py-3 text-right">{money(sum('gross_pay'))}</td>
              <td className="px-4 py-3 text-right">{money(sum('ssnit_employee'))}</td>
              <td className="px-4 py-3 text-right">{money(sum('paye_tax'))}</td>
              <td className="px-4 py-3 text-right">{money(sum('other_deductions'))}</td>
              <td className="px-4 py-3 text-right">{money(sum('net_pay'))}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">
        Employer SSNIT (13%) for this month: <b>{money(sum('ssnit_employer'))}</b>. It is paid by the school on top of salaries.
      </p>
    </div>
  );
}

function Runs() {
  const now = new Date();
  const [runs, setRuns] = useState([]);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [openId, setOpenId] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api.get('/payroll/runs').then((r) => setRuns(r.data))
    .catch((e) => setError(errMsg(e, 'Could not fetch payroll runs')));
  useEffect(() => { load(); }, []);

  const generate = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await api.post('/payroll/runs', { month, year });
      await load();
      setOpenId(res.data.id);
    } catch (e) {
      setError(errMsg(e, 'Could not generate payroll'));
    } finally {
      setBusy(false);
    }
  };

  if (openId) return <RunDetail runId={openId} onBack={() => { setOpenId(null); load(); }} />;

  const years = Array.from({ length: 4 }, (_, i) => now.getFullYear() + 1 - i);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Month</label>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={input}>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Year</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={input}>
            {years.map((y) => <option key={y}>{y}</option>)}
          </select>
        </div>
        <button onClick={generate} disabled={busy} className="px-4 py-2 text-sm rounded-lg bg-brand-blue text-white font-medium disabled:opacity-60">
          {busy ? 'Calculating...' : 'Run payroll'}
        </button>
        <p className="text-xs text-slate-400 basis-full">Calculates SSNIT and PAYE for all active staff. Running a draft month again recalculates it.</p>
      </div>
      {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="px-4 py-3 font-medium">Period</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Staff</th>
              <th className="px-4 py-3 font-medium text-right">Gross</th>
              <th className="px-4 py-3 font-medium text-right">PAYE</th>
              <th className="px-4 py-3 font-medium text-right">Net pay</th>
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No payroll runs yet. Add your staff first, then run payroll above.</td></tr>
            )}
            {runs.map((r) => (
              <tr key={r.id} onClick={() => setOpenId(r.id)} className="border-b border-slate-100 last:border-0 cursor-pointer hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{MONTHS[r.month - 1]} {r.year}</td>
                <td className="px-4 py-3"><span className={`px-2.5 py-0.5 rounded-full text-xs capitalize ${STATUS_STYLE[r.status]}`}>{r.status}</span></td>
                <td className="px-4 py-3 text-right">{r.staff_count}</td>
                <td className="px-4 py-3 text-right">{money(r.total_gross)}</td>
                <td className="px-4 py-3 text-right">{money(r.total_paye)}</td>
                <td className="px-4 py-3 text-right font-semibold">{money(r.total_net)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Payroll() {
  const [view, setView] = useState('runs');
  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {[['runs', 'Payroll runs'], ['staff', 'Staff and salaries']].map(([id, label]) => (
          <button key={id} onClick={() => setView(id)}
            className={`px-3.5 py-1.5 rounded-full text-sm ${view === id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {label}
          </button>
        ))}
      </div>
      {view === 'runs' ? <Runs /> : <Employees />}
    </div>
  );
}