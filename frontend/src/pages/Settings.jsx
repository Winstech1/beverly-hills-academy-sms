import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, School, KeyRound, Save } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const [tab, setTab] = useState('school'); // 'school' | 'profile'

  const [school, setSchool] = useState({ school_name: '', address: '', phone: '', email: '' });
  const [schoolMsg, setSchoolMsg] = useState('');
  const [savingSchool, setSavingSchool] = useState(false);

  const [pw, setPw] = useState({ current_password: '', new_password: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    api.get('/settings').then((res) => {
      if (res.data) setSchool({
        school_name: res.data.school_name || '',
        address: res.data.address || '',
        phone: res.data.phone || '',
        email: res.data.email || '',
      });
    }).catch(() => {});
  }, []);

  const saveSchool = async (e) => {
    e.preventDefault();
    setSavingSchool(true);
    setSchoolMsg('');
    try {
      await api.put('/settings', school);
      setSchoolMsg('School information saved.');
    } catch (err) {
      setSchoolMsg(err.response?.data?.message || 'Could not save settings.');
    } finally {
      setSavingSchool(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwMsg('');

    if (pw.new_password !== pw.confirm) {
      setPwMsg('New password and confirmation do not match.');
      return;
    }

    setSavingPw(true);
    try {
      await api.put('/auth/change-password', {
        current_password: pw.current_password,
        new_password: pw.new_password,
      });
      setPw({ current_password: '', new_password: '', confirm: '' });
      setPwMsg('Password changed successfully. Use your new password next time you sign in.');
    } catch (err) {
      setPwMsg(err.response?.data?.message || 'Could not change password.');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <SettingsIcon size={20} /> Settings
        </h1>
        <p className="text-sm text-slate-500">School information and your account</p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('school')}
          className={`text-sm px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${tab === 'school' ? 'bg-brand-blue text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
          <School size={14} /> School Info
        </button>
        <button onClick={() => setTab('profile')}
          className={`text-sm px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${tab === 'profile' ? 'bg-brand-blue text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
          <KeyRound size={14} /> My Account
        </button>
      </div>

      {tab === 'school' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 max-w-lg">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">School Information</h2>
          <form onSubmit={saveSchool} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">School Name</label>
              <input required value={school.school_name}
                onChange={(e) => setSchool({ ...school, school_name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Address</label>
              <textarea rows={2} value={school.address}
                onChange={(e) => setSchool({ ...school, address: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
              <input value={school.phone}
                onChange={(e) => setSchool({ ...school, phone: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
              <input type="email" value={school.email}
                onChange={(e) => setSchool({ ...school, email: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>

            {schoolMsg && <p className="text-sm text-slate-600">{schoolMsg}</p>}

            <button type="submit" disabled={savingSchool}
              className="flex items-center gap-2 bg-brand-blue text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
              <Save size={16} /> {savingSchool ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {tab === 'profile' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 max-w-lg">
          <h2 className="text-sm font-semibold text-slate-700 mb-1">My Account</h2>
          <p className="text-xs text-slate-400 mb-4">Signed in as {user?.email} ({user?.role})</p>

          <form onSubmit={changePassword} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Current Password</label>
              <input required type="password" value={pw.current_password}
                onChange={(e) => setPw({ ...pw, current_password: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">New Password</label>
              <input required type="password" value={pw.new_password}
                onChange={(e) => setPw({ ...pw, new_password: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <p className="text-xs text-slate-400 mt-1">At least 8 characters.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Confirm New Password</label>
              <input required type="password" value={pw.confirm}
                onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>

            {pwMsg && <p className="text-sm text-slate-600">{pwMsg}</p>}

            <button type="submit" disabled={savingPw}
              className="flex items-center gap-2 bg-brand-blue text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
              <KeyRound size={16} /> {savingPw ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}