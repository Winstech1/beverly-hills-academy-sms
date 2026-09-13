import { useEffect, useState } from 'react';
import { Plus, X, Bus, Trash2, Wallet } from 'lucide-react';
import api from '../api/client';

const emptyRouteForm = { route_name: '', vehicle: '', driver_name: '', capacity: 30 };
const emptyAssignForm = { student_id: '', route_id: '', direction: 'Both', fee_amount: '', amount_paid: '', term: 'Term 1' };

const statusStyles = {
  Paid: 'bg-green-100 text-green-700',
  Partial: 'bg-amber-100 text-amber-700',
  Owing: 'bg-red-100 text-red-700',
};

export default function Transportation() {
  const [tab, setTab] = useState('routes'); // 'routes' | 'students'
  const [routes, setRoutes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);

  const [showRouteModal, setShowRouteModal] = useState(false);
  const [routeForm, setRouteForm] = useState(emptyRouteForm);
  const [routeError, setRouteError] = useState('');

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState(emptyAssignForm);
  const [assignError, setAssignError] = useState('');

  const loadRoutes = () => api.get('/transport/routes').then((res) => setRoutes(res.data)).catch(() => {});
  const loadAssignments = () => api.get('/transport/assignments').then((res) => setAssignments(res.data)).catch(() => {});

  useEffect(() => {
    loadRoutes();
    loadAssignments();
    api.get('/students', { params: { limit: 500 } }).then((res) => setStudents(res.data.data)).catch(() => {});
  }, []);

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    setRouteError('');
    try {
      await api.post('/transport/routes', routeForm);
      setShowRouteModal(false);
      setRouteForm(emptyRouteForm);
      loadRoutes();
    } catch (err) {
      setRouteError(err.response?.data?.message || 'Could not add route.');
    }
  };

  const handleDeleteRoute = async (id) => {
    try {
      await api.delete(`/transport/routes/${id}`);
      loadRoutes();
    } catch (err) {
      setRouteError(err.response?.data?.message || 'Could not delete route.');
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setAssignError('');
    try {
      await api.post('/transport/assignments', assignForm);
      setShowAssignModal(false);
      setAssignForm(emptyAssignForm);
      loadAssignments();
      loadRoutes();
    } catch (err) {
      setAssignError(err.response?.data?.message || 'Could not assign student.');
    }
  };

  const recordPayment = async (assignment) => {
    const extra = window.prompt(`Record additional payment for ${assignment.student_name} (GHS):`);
    if (!extra || isNaN(Number(extra))) return;
    try {
      await api.put(`/transport/assignments/${assignment.id}`, {
        amount_paid: Number(assignment.amount_paid) + Number(extra),
      });
      loadAssignments();
    } catch {
      // if it fails, the table simply won't update — user can retry
    }
  };

  const handleRemoveAssignment = async (id) => {
    try {
      await api.delete(`/transport/assignments/${id}`);
      loadAssignments();
      loadRoutes();
    } catch {
      // leave the row as-is if delete fails
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Bus size={20} /> Transportation
          </h1>
          <p className="text-sm text-slate-500">Buses, routes, and student fee tracking</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('routes')}
            className={`text-sm px-4 py-2 rounded-lg font-medium ${tab === 'routes' ? 'bg-brand-blue text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            Routes
          </button>
          <button onClick={() => setTab('students')}
            className={`text-sm px-4 py-2 rounded-lg font-medium ${tab === 'students' ? 'bg-brand-blue text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            Student Assignments
          </button>
        </div>
      </div>

      {tab === 'routes' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowRouteModal(true)}
              className="flex items-center gap-2 bg-brand-blue text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
              <Plus size={16} /> Add Route
            </button>
          </div>
          {routeError && <p className="text-sm text-red-600">{routeError}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {routes.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">{r.route_name}</h3>
                    <p className="text-xs text-slate-500">{r.vehicle || 'No vehicle set'}</p>
                  </div>
                  <button onClick={() => handleDeleteRoute(r.id)} className="text-slate-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-sm text-slate-600 mt-2">Driver: {r.driver_name || 'Not assigned'}</p>
                <p className="text-xs text-slate-400 mt-1">{r.assigned_count} / {r.capacity} students assigned</p>
                <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{r.status}</span>
              </div>
            ))}
            {!routes.length && <p className="col-span-full text-center text-slate-400 py-8">No routes added yet.</p>}
          </div>
        </div>
      )}

      {tab === 'students' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowAssignModal(true)}
              className="flex items-center gap-2 bg-brand-blue text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
              <Plus size={16} /> Assign Student
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Route</th>
                  <th className="px-4 py-3 font-medium">Direction</th>
                  <th className="px-4 py-3 font-medium">Fee</th>
                  <th className="px-4 py-3 font-medium">Paid</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{a.student_name}</td>
                    <td className="px-4 py-3 text-slate-600">{a.route_name}</td>
                    <td className="px-4 py-3 text-slate-600">{a.direction}</td>
                    <td className="px-4 py-3 text-slate-600">GHS {Number(a.fee_amount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-600">GHS {Number(a.amount_paid).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusStyles[a.status]}`}>{a.status}</span>
                    </td>
                    <td className="px-4 py-3 flex gap-3">
                      {a.status !== 'Paid' && (
                        <button onClick={() => recordPayment(a)} className="text-brand-blue text-xs font-medium hover:underline flex items-center gap-1">
                          <Wallet size={12} /> Record Payment
                        </button>
                      )}
                      <button onClick={() => handleRemoveAssignment(a.id)} className="text-slate-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!assignments.length && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No students assigned to transport yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showRouteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowRouteModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
            <h2 className="text-lg font-semibold mb-4">Add Route</h2>
            <form onSubmit={handleCreateRoute} className="space-y-3">
              <input required placeholder="Route Name (e.g. Route A)" value={routeForm.route_name}
                onChange={(e) => setRouteForm({ ...routeForm, route_name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Vehicle (e.g. Bus 1)" value={routeForm.vehicle}
                onChange={(e) => setRouteForm({ ...routeForm, vehicle: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Driver Name" value={routeForm.driver_name}
                onChange={(e) => setRouteForm({ ...routeForm, driver_name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input type="number" placeholder="Capacity" value={routeForm.capacity}
                onChange={(e) => setRouteForm({ ...routeForm, capacity: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />

              {routeError && <p className="text-sm text-red-600">{routeError}</p>}

              <button type="submit" className="w-full bg-brand-blue text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700">
                Save Route
              </button>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowAssignModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
            <h2 className="text-lg font-semibold mb-4">Assign Student to Route</h2>
            <form onSubmit={handleAssign} className="space-y-3">
              <select required value={assignForm.student_id} onChange={(e) => setAssignForm({ ...assignForm, student_id: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select Student</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.admission_no})</option>)}
              </select>
              <select required value={assignForm.route_id} onChange={(e) => setAssignForm({ ...assignForm, route_id: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select Route</option>
                {routes.map((r) => <option key={r.id} value={r.id}>{r.route_name}</option>)}
              </select>
              <select value={assignForm.direction} onChange={(e) => setAssignForm({ ...assignForm, direction: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="Morning Only">Morning Only</option>
                <option value="Afternoon Only">Afternoon Only</option>
                <option value="Both">Both (Morning & Afternoon)</option>
              </select>
              <input placeholder="Term (e.g. Term 1)" value={assignForm.term}
                onChange={(e) => setAssignForm({ ...assignForm, term: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input required type="number" step="0.01" placeholder="Fee Amount (GHS)" value={assignForm.fee_amount}
                onChange={(e) => setAssignForm({ ...assignForm, fee_amount: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input type="number" step="0.01" placeholder="Amount Already Paid (GHS, optional)" value={assignForm.amount_paid}
                onChange={(e) => setAssignForm({ ...assignForm, amount_paid: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />

              {assignError && <p className="text-sm text-red-600">{assignError}</p>}

              <button type="submit" className="w-full bg-brand-blue text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700">
                Save Assignment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}