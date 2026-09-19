import { useEffect, useState } from 'react';
import { Plus, X, Briefcase, ArrowLeft, Trash2, UserPlus2 } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const emptyJobForm = { title: '', department: '', description: '', requirements: '', closing_date: '' };
const emptyApplicantForm = { full_name: '', email: '', phone: '', resume_url: '', cover_letter: '' };

const applicantStatuses = ['Applied', 'Shortlisted', 'Interviewed', 'Hired', 'Rejected'];
const statusStyles = {
  Applied: 'bg-slate-100 text-slate-600',
  Shortlisted: 'bg-blue-100 text-blue-700',
  Interviewed: 'bg-amber-100 text-amber-700',
  Hired: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
};

export default function Recruitment() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'principal';
  const [jobs, setJobs] = useState([]);
  const [showJobModal, setShowJobModal] = useState(false);
  const [jobForm, setJobForm] = useState(emptyJobForm);
  const [jobError, setJobError] = useState('');

  const [activeJob, setActiveJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [showApplicantModal, setShowApplicantModal] = useState(false);
  const [applicantForm, setApplicantForm] = useState(emptyApplicantForm);
  const [applicantError, setApplicantError] = useState('');

    const loadJobs = () => {
    const endpoint = canManage ? '/recruitment/jobs' : '/recruitment/jobs/open';
    api.get(endpoint).then((res) => setJobs(res.data)).catch(() => {});
  };
  const loadApplicants = (jobId) => api.get(`/recruitment/jobs/${jobId}/applicants`).then((res) => setApplicants(res.data)).catch(() => {});

  useEffect(() => { loadJobs(); }, []);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setJobError('');
    try {
      await api.post('/recruitment/jobs', jobForm);
      setShowJobModal(false);
      setJobForm(emptyJobForm);
      loadJobs();
    } catch (err) {
      setJobError(err.response?.data?.message || 'Could not create job posting.');
    }
  };

  const toggleJobStatus = async (job) => {
    try {
      await api.put(`/recruitment/jobs/${job.id}`, { status: job.status === 'Open' ? 'Closed' : 'Open' });
      loadJobs();
    } catch {
      // list stays as-is if it fails
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm('Delete this job posting and all its applicants?')) return;
    try {
      await api.delete(`/recruitment/jobs/${id}`);
      loadJobs();
    } catch {
      // stays listed if delete fails
    }
  };

  const openJob = (job) => {
    setActiveJob(job);
    loadApplicants(job.id);
  };

  const handleAddApplicant = async (e) => {
    e.preventDefault();
    setApplicantError('');
    try {
      await api.post(`/recruitment/jobs/${activeJob.id}/applicants`, applicantForm);
      setShowApplicantModal(false);
      setApplicantForm(emptyApplicantForm);
      loadApplicants(activeJob.id);
      loadJobs();
    } catch (err) {
      setApplicantError(err.response?.data?.message || 'Could not add applicant.');
    }
  };

  const updateApplicantStatus = async (id, status) => {
    try {
      await api.put(`/recruitment/job-applicants/${id}`, { status });
      loadApplicants(activeJob.id);
    } catch {
      // stays as-is if it fails
    }
  };

  const handleDeleteApplicant = async (id) => {
    try {
      await api.delete(`/recruitment/job-applicants/${id}`);
      loadApplicants(activeJob.id);
      loadJobs();
    } catch {
      // stays listed if delete fails
    }
  };

  // ---- Applicant pipeline view for one job ----
  if (activeJob) {
    return (
      <div className="space-y-4">
        <button onClick={() => setActiveJob(null)} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft size={16} /> Back to Job Postings
        </button>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{activeJob.title}</h1>
            <p className="text-sm text-slate-500">{activeJob.department || 'No department set'}</p>
          </div>
          <button onClick={() => setShowApplicantModal(true)}
            className="flex items-center gap-2 bg-brand-blue text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
            <UserPlus2 size={16} /> Add Applicant
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {applicants.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">{a.full_name}</h3>
                  <p className="text-xs text-slate-500">{a.email || 'No email'} • {a.phone || 'No phone'}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${statusStyles[a.status]}`}>{a.status}</span>
              </div>
              {a.cover_letter && <p className="text-sm text-slate-600 mt-2 line-clamp-3">{a.cover_letter}</p>}
              <div className="flex flex-wrap gap-2 mt-3">
                {applicantStatuses.filter((s) => s !== a.status).map((s) => (
                  <button key={s} onClick={() => updateApplicantStatus(a.id, s)}
                    className="text-xs px-2 py-1 rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100">
                    Mark {s}
                  </button>
                ))}
                <button onClick={() => handleDeleteApplicant(a.id)} className="text-slate-300 hover:text-red-600 ml-auto">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {!applicants.length && (
            <p className="col-span-full text-center text-slate-400 py-8">No applicants yet for this role.</p>
          )}
        </div>

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
                <input type="email" placeholder="Email" value={applicantForm.email}
                  onChange={(e) => setApplicantForm({ ...applicantForm, email: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                <input placeholder="Phone" value={applicantForm.phone}
                  onChange={(e) => setApplicantForm({ ...applicantForm, phone: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                <input placeholder="Resume Link (optional)" value={applicantForm.resume_url}
                  onChange={(e) => setApplicantForm({ ...applicantForm, resume_url: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                <textarea placeholder="Cover Letter / Notes (optional)" rows={3} value={applicantForm.cover_letter}
                  onChange={(e) => setApplicantForm({ ...applicantForm, cover_letter: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />

                {applicantError && <p className="text-sm text-red-600">{applicantError}</p>}

                <button type="submit" className="w-full bg-brand-blue text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700">
                  Save Applicant
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---- Job postings list view ----
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Briefcase size={20} /> Recruitment
          </h1>
          <p className="text-sm text-slate-500">{jobs.length} job posting{jobs.length === 1 ? '' : 's'}</p>
        </div>
                {canManage && (
          <button onClick={() => setShowJobModal(true)}
            className="flex items-center gap-2 bg-brand-blue text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
            <Plus size={16} /> Post a Job
          </button>
        )}
      </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.map((j) => (
          <div key={j.id} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between">
              {canManage ? (
                <button onClick={() => openJob(j)} className="text-left">
                  <h3 className="font-semibold text-slate-800 hover:text-brand-blue">{j.title}</h3>
                  <p className="text-xs text-slate-500">{j.department || 'No department set'}</p>
                </button>
              ) : (
                <div>
                  <h3 className="font-semibold text-slate-800">{j.title}</h3>
                  <p className="text-xs text-slate-500">{j.department || 'No department set'}</p>
                </div>
              )}
              {canManage && (
                <button onClick={() => handleDeleteJob(j.id)} className="text-slate-300 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            {j.description && <p className="text-sm text-slate-600 mt-2 line-clamp-2">{j.description}</p>}
            {j.requirements && !canManage && <p className="text-xs text-slate-500 mt-2"><span className="font-medium">Requirements:</span> {j.requirements}</p>}
            {j.closing_date && !canManage && (
              <p className="text-xs text-slate-400 mt-2">Closes {new Date(j.closing_date).toLocaleDateString()}</p>
            )}
            {canManage && (
              <>
                <div className="flex items-center justify-between mt-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${j.status === 'Open' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {j.status}
                  </span>
                  <span className="text-xs text-slate-400">{j.applicant_count} applicant{j.applicant_count === '1' ? '' : 's'}</span>
                </div>
                <button onClick={() => toggleJobStatus(j)} className="text-xs text-brand-blue hover:underline mt-2">
                  Mark as {j.status === 'Open' ? 'Closed' : 'Open'}
                </button>
              </>
            )}
          </div>
        ))}
        {!jobs.length && (
          <p className="col-span-full text-center text-slate-400 py-8">
            {canManage ? 'No job postings yet.' : 'No open positions right now — check back soon!'}
          </p>
        )}
      </div>
      {showJobModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowJobModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
            <h2 className="text-lg font-semibold mb-4">Post a Job</h2>
            <form onSubmit={handleCreateJob} className="space-y-3">
              <input required placeholder="Job Title (e.g. Mathematics Teacher)" value={jobForm.title}
                onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Department" value={jobForm.department}
                onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <textarea placeholder="Description" rows={3} value={jobForm.description}
                onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <textarea placeholder="Requirements (optional)" rows={2} value={jobForm.requirements}
                onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input type="date" placeholder="Closing Date (optional)" value={jobForm.closing_date}
                onChange={(e) => setJobForm({ ...jobForm, closing_date: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />

              {jobError && <p className="text-sm text-red-600">{jobError}</p>}

              <button type="submit" className="w-full bg-brand-blue text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700">
                Save Job Posting
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}