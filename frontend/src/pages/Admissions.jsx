import { useEffect, useState } from 'react';
import { Plus, X, UserPlus, DoorOpen, LogOut, CheckCircle2, Trash2 } from 'lucide-react';
import api from '../api/client';

const emptyApplicantForm = {
  full_name: '', date_of_birth: '', gender: '', applying_for_class_id: '',
  guardian_name: '', guardian_phone: '', source: 'Walk-in', notes: '',
};
const emptyVisitorForm = { visitor_name: '', phone: '', purpose: '', person_to_see: '' };

const statusStyles = {
  Pending: 'bg-slate-100 text-slate-600',
  'Under Review': 'bg-blue-100 text-blue-700',
  Accepted: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
  Enrolled: 'bg-purple-100 text-purple-700',
};

export default function Admissions() {
  const [tab, setTab] = useState('applicants'); // 'applicants' | 'reception'
  const [applicants, setApplicants] = useState([]);
  const [classes, setClasses] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');

  const [showApplicantModal, setShowApplicantModal] = useState(false);
  const [applicantForm, setApplicantForm] = useState(emptyApplicantForm);
  const [applicantError, setApplicantError] = useState('');

  const [convertingId, setConvertingId] = useState(null);
  const [admissionNo, setAdmissionNo] = useState('');
  const [convertError, setConvertError] = useState('');

  const [visitors, setVisitors] = useState([]);
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [visitorForm, setVisitorForm] = useState(emptyVisitorForm);
  const [visitorError, setVisitorError] = useState('');

  const loadApplicants = () => api.get('/applicants', { params: statusFilter ? { status: statusFilter } : {} })
    .then((res) => setApplicants(res.data)).catch(() => {});
  const loadVisitors = () => api.get('/visitors', { params: { active: true } }).then((res) => setVisitors(res.data)).catch(() => {});

  useEffect(() => { loadApplicants(); }, [statusFilter]);
  useEffect(() => {
    loadVisitors();
    api.get('/classes').then((res) => setClasses(res.data)).catch(() => {});
  }, []);

  const handleAddApplicant = async (e) => {
    e.preventDefault();
    setApplicantError('');
    try {
      await api.post('/applicants', applicantForm);
      setShowApplicantModal(false);
      setApplicantForm(emptyApplicantForm);
      loadApplicants();
    } catch (err) {
      setApplicantError(err.response?.data?.message || 'Could not add applicant.');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/applicants/${id}`, { status });
      loadApplicants();
    } catch {
      // row stays as-is if it fails
    }
  };
  const handleDeleteApplicant = async (id) => {
    if (!window.confirm('Delete this applicant record? This cannot be undone.')) return;
    try {
      await api.delete(`/applicants/${id}`);
      loadApplicants();
    } catch {
      // row stays as-is if it fails
    }
  };
  const handleConvert = async (e) => {
    e.preventDefault();
    setConvertError('');
    try {
      await api.post(`/applicants/${convertingId}/convert`, { admission_no: admissionNo });
      setConvertingId(null);
      setAdmissionNo('');
      loadApplicants();
    } catch (err) {
      setConvertError(err.response?.data?.message || 'Could not enroll applicant.');
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setVisitorError('');
    try {
      await api.post('/visitors', visitorForm);
      setShowVisitorModal(false);
      setVisitorForm(emptyVisitorForm);
      loadVisitors();
    } catch (err) {
      setVisitorError(err.response?.data?.message || 'Could not sign in visitor.');
    }
  };

  const handleSignOut = async (id) => {
    try {
      await api.put(`/visitors/${id}/checkout`);
      loadVisitors();
    } catch {
      // row stays as-is if it fails
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <UserPlus size={20} /> Admissions & Reception
          </h1>
          <p className="text-sm text-slate-500">Prospective students and front desk visitors</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('applicants')}
            className={`text-sm px-4 py-2 rounded-lg font-medium ${tab === 'applicants' ? 'bg-brand-blue text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            Admissions
          </button>
          <button onClick={() => setTab('reception')}
            className={`text-sm px-4 py-2 rounded-lg font-medium ${tab === 'reception' ? 'bg-brand-blue text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            Reception
          </button>
        </div>
      </div>

      {tab === 'applicants' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Under Review">Under Review</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
              <option value="Enrolled">Enrolled</option>
            </select>
            <button onClick={() => setShowApplicantModal(true)}
              className="flex items-center gap-2 bg-brand-blue text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
              <Plus size={16} /> Add Applicant
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-3 font-medium">Applicant</th>
                  <th className="px-4 py-3 font-medium">Applying For</th>
                  <th className="px-4 py-3 font-medium">Guardian</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applicants.map((a) => (
                  <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{a.full_name}</td>
                    <td className="px-4 py-3 text-slate-600">{a.applying_for_class_name || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{a.guardian_name || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{a.source}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusStyles[a.status]}`}>{a.status}</span>
                    </td>
                                       <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {a.status === 'Pending' && (
                          <button onClick={() => updateStatus(a.id, 'Under Review')} className="text-brand-blue text-xs font-medium hover:underline">
                            Start Review
                          </button>
                        )}
                        {a.status === 'Under Review' && (
                          <>
                            <button onClick={() => updateStatus(a.id, 'Accepted')} className="text-green-600 text-xs font-medium hover:underline">Accept</button>
                            <button onClick={() => updateStatus(a.id, 'Rejected')} className="text-red-600 text-xs font-medium hover:underline">Reject</button>
                          </>
                        )}
                        {a.status === 'Accepted' && (
                          <button onClick={() => setConvertingId(a.id)} className="text-purple-600 text-xs font-medium hover:underline flex items-center gap-1">
                            <CheckCircle2 size={12} /> Enroll as Student
                          </button>
                        )}
                        <button onClick={() => handleDeleteApplicant(a.id)} className="text-slate-400 hover:text-red-600 ml-auto">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!applicants.length && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No applicants found.</td></tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'reception' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowVisitorModal(true)}
              className="flex items-center gap-2 bg-brand-blue text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
              <DoorOpen size={16} /> Sign In Visitor
            </button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-3 font-medium">Visitor</th>
                  <th className="px-4 py-3 font-medium">Purpose</th>
                  <th className="px-4 py-3 font-medium">To See</th>
                  <th className="px-4 py-3 font-medium">Time In</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visitors.map((v) => (
                  <tr key={v.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{v.visitor_name}</td>
                    <td className="px-4 py-3 text-slate-600">{v.purpose || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{v.person_to_see || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{new Date(v.time_in).toLocaleTimeString()}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleSignOut(v.id)} className="text-brand-blue text-xs font-medium hover:underline flex items-center gap-1">
                        <LogOut size={12} /> Sign Out
                      </button>
                    </td>
                  </tr>
                ))}
                {!visitors.length && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No visitors currently signed in.</td></tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {showApplicantModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowApplicantModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
            <h2 className="text-lg font-semibold mb-4">Add Applicant</h2>
            <form onSubmit={handleAddApplicant} className="space-y-3">
              <input required placeholder="Full Name" value={applicantForm.full_name}
                onChange={(e) => setApplicantForm({ ...applicantForm, full_name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input type="date" placeholder="Date of Birth" value={applicantForm.date_of_birth}
                onChange={(e) => setApplicantForm({ ...applicantForm, date_of_birth: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <select value={applicantForm.applying_for_class_id} onChange={(e) => setApplicantForm({ ...applicantForm, applying_for_class_id: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Applying For (class)</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input placeholder="Guardian Name" value={applicantForm.guardian_name}
                onChange={(e) => setApplicantForm({ ...applicantForm, guardian_name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Guardian Phone" value={applicantForm.guardian_phone}
                onChange={(e) => setApplicantForm({ ...applicantForm, guardian_phone: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <select value={applicantForm.source} onChange={(e) => setApplicantForm({ ...applicantForm, source: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="Walk-in">Walk-in</option>
                <option value="Referral">Referral</option>
                <option value="Online">Online</option>
                <option value="Other">Other</option>
              </select>
              <textarea placeholder="Notes (optional)" rows={2} value={applicantForm.notes}
                onChange={(e) => setApplicantForm({ ...applicantForm, notes: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />

              {applicantError && <p className="text-sm text-red-600">{applicantError}</p>}

              <button type="submit" className="w-full bg-brand-blue text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700">
                Save Applicant
              </button>
            </form>
          </div>
        </div>
      )}

      {convertingId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 relative">
            <button onClick={() => setConvertingId(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
            <h2 className="text-lg font-semibold mb-4">Enroll as Student</h2>
            <form onSubmit={handleConvert} className="space-y-3">
              <input required placeholder="Assign Admission No. (e.g. STU010)" value={admissionNo}
                onChange={(e) => setAdmissionNo(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />

              {convertError && <p className="text-sm text-red-600">{convertError}</p>}

              <button type="submit" className="w-full bg-brand-blue text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700">
                Confirm Enrollment
              </button>
            </form>
          </div>
        </div>
      )}

      {showVisitorModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowVisitorModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
            <h2 className="text-lg font-semibold mb-4">Sign In Visitor</h2>
            <form onSubmit={handleSignIn} className="space-y-3">
              <input required placeholder="Visitor Name" value={visitorForm.visitor_name}
                onChange={(e) => setVisitorForm({ ...visitorForm, visitor_name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Phone (optional)" value={visitorForm.phone}
                onChange={(e) => setVisitorForm({ ...visitorForm, phone: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Purpose of Visit" value={visitorForm.purpose}
                onChange={(e) => setVisitorForm({ ...visitorForm, purpose: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Person to See" value={visitorForm.person_to_see}
                onChange={(e) => setVisitorForm({ ...visitorForm, person_to_see: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />

              {visitorError && <p className="text-sm text-red-600">{visitorError}</p>}

              <button type="submit" className="w-full bg-brand-blue text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700">
                Sign In
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}