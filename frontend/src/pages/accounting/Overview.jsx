import { useEffect, useState } from 'react';
import api from '../../api/client';
import { money, MONTHS, errMsg } from './format';

function CategoryList({ title, rows, color }) {
  const total = rows.reduce((s, r) => s + r.total, 0) || 1;
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="font-semibold text-slate-900 mb-4">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">No records yet for this year.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.category}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-700">{r.category}</span>
                <span className="font-medium text-slate-900">{money(r.total)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100">
                <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${(r.total / total) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Overview() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    api.get('/finance/summary', { params: { year } })
      .then((res) => setData(res.data))
      .catch((err) => setError(errMsg(err, 'Could not load finance summary')));
  }, [year]);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const max = data ? Math.max(1, ...data.months.map((m) => Math.max(m.income, m.expense))) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Financial overview</h2>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>}

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500">Total income</p>
              <p className="text-2xl font-semibold text-green-600 mt-1">{money(data.totalIncome)}</p>
              <p className="text-xs text-slate-400 mt-1">Includes school fees marked Paid</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500">Total expenses</p>
              <p className="text-2xl font-semibold text-red-600 mt-1">{money(data.totalExpense)}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500">{data.netSurplus >= 0 ? 'Net surplus' : 'Net deficit'}</p>
              <p className={`text-2xl font-semibold mt-1 ${data.netSurplus >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                {money(Math.abs(data.netSurplus))}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="font-semibold text-slate-900">Income vs expenses by month</h3>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500" />Income</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-400" />Expenses</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="flex items-end gap-2 h-44 min-w-[520px]">
                {data.months.map((m) => (
                  <div key={m.month} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div className="flex items-end gap-0.5 w-full h-full justify-center">
                      <div className="w-1/2 max-w-[14px] rounded-t bg-green-500"
                        style={{ height: `${(m.income / max) * 100}%` }}
                        title={`${MONTHS[m.month - 1]} income: ${money(m.income)}`} />
                      <div className="w-1/2 max-w-[14px] rounded-t bg-red-400"
                        style={{ height: `${(m.expense / max) * 100}%` }}
                        title={`${MONTHS[m.month - 1]} expenses: ${money(m.expense)}`} />
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1">{MONTHS[m.month - 1].slice(0, 3)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CategoryList title="Income by category" rows={data.incomeByCategory} color="bg-green-500" />
            <CategoryList title="Expenses by category" rows={data.expenseByCategory} color="bg-red-400" />
          </div>
        </>
      )}
    </div>
  );
}