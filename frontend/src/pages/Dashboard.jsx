import { useEffect, useState } from 'react';
import { Users, GraduationCap, Layers, Wallet } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/client';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((res) => setStats(res.data))
      .catch(() => setError('Could not load dashboard stats. Is the backend running?'));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Welcome back, {user?.full_name || 'Admin'}!</h1>
        <p className="text-sm text-slate-500">Here's what's happening at your school today.</p>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Students" value={stats?.total_students ?? '—'} color="blue" />
        <StatCard icon={GraduationCap} label="Total Teachers" value={stats?.total_teachers ?? '—'} color="green" />
        <StatCard icon={Layers} label="Total Classes" value={stats?.total_classes ?? '—'} color="purple" />
        <StatCard
          icon={Wallet}
          label="Total Fees Collected"
          value={stats ? `GHS ${Number(stats.total_fees_collected).toLocaleString()}` : '—'}
          color="amber"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Student Enrollment Trend</h2>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={stats?.enrollment_trend || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
