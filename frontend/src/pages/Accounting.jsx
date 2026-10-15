import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Overview from './accounting/Overview';
import Transactions from './accounting/Transactions';
import Budgets from './accounting/Budgets';
import Payroll from './accounting/Payroll';
import Tax from './accounting/Tax';
import Accountants from './accounting/Accountants';

export default function Accounting() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', component: Overview },
    { id: 'transactions', label: 'Transactions', component: Transactions },
    { id: 'budgets', label: 'Budgets', component: Budgets },
    { id: 'payroll', label: 'Payroll', component: Payroll },
    { id: 'tax', label: 'Tax', component: Tax },
  ];
  if (user?.role === 'admin' || user?.role === 'principal') {
    tabs.push({ id: 'accountants', label: 'Accountants', component: Accountants });
  }
  const Active = (tabs.find((t) => t.id === tab) || tabs[0]).component;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Accounting</h1>
        <p className="text-sm text-slate-500 mt-1">Income, expenses, budgets, payroll and tax in one place.</p>
      </div>

      <div className="border-b border-slate-200 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-1 min-w-max">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
                tab === t.id ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <Active />
    </div>
  );
}