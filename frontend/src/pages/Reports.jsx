import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';
import api from '../api/client';

export default function Reports() {
  const [feeData, setFeeData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [academicData, setAcademicData] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/reports/fee-collection').then((res) => setFeeData(res.data)).catch(() => setError('Could not load reports.'));
    api.get('/reports/attendance-rate').then((res) => setAttendanceData(res.data)).catch(() => {});
    api.get('/reports/academic-performance').then((res) => setAcademicData(res.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <BarChart3 size={20} /> Reports & Analytics
        </h1>
        <p className="text-sm text-slate-500">Class-by-class breakdown across fees, attendance, and academics</p>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Fee Collection by Class (GHS)</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={feeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="class_name" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="collected" name="Collected" fill="#16a34a" />
            <Bar dataKey="pending" name="Pending" fill="#f59e0b" />
            <Bar dataKey="overdue" name="Overdue" fill="#dc2626" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Attendance Rate by Class (last 30 days)</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={attendanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="class_name" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 12 }} unit="%" domain={[0, 100]} />
            <Tooltip formatter={(value) => `${value}%`} />
            <Bar dataKey="attendance_rate" name="Attendance Rate" fill="#2563eb" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Average Exam Score by Class</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={academicData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="class_name" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="average_score" name="Average Score" fill="#7c3aed" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}