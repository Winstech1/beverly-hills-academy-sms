import { useEffect, useState } from 'react';
import { Plus, X, Building2, Trash2, LogOut, UtensilsCrossed, Users } from 'lucide-react';
import api from '../api/client';

const emptyHouseForm = { name: '', gender: 'Male', warden_name: '', contact_phone: '', capacity: 40 };
const emptyAssignForm = { student_id: '', house_id: '', room_no: '', health_notes: '' };
const emptyMealForm = { house_id: '', day_of_week: 'Monday', meal_type: 'Breakfast', menu: '' };
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];

export default function Boarding() {
  const [tab, setTab] = useState('houses'); // 'houses' | 'students' | 'meals'
  const [houses, setHouses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [mealHouseId, setMealHouseId] = useState('');
  const [meals, setMeals] = useState([]);

  const [showHouseModal, setShowHouseModal] = useState(false);
  const [houseForm, setHouseForm] = useState(emptyHouseForm);
  const [houseError, setHouseError] = useState('');

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState(emptyAssignForm);
  const [assignError, setAssignError] = useState('');

  const [showMealModal, setShowMealModal] = useState(false);
  const [mealForm, setMealForm] = useState(emptyMealForm);
  const [mealError, setMealError] = useState('');

  const loadHouses = () => api.get('/boarding/houses').then((res) => {
    setHouses(res.data);
    if (res.data.length && !mealHouseId) setMealHouseId(String(res.data[0].id));
  }).catch(() => {});
  const loadAssignments = () => api.get('/boarding/assignments', { params: { status: 'Checked In' } }).then((res) => setAssignments(res.data)).catch(() => {});
  const loadMeals = (houseId) => {
    if (!houseId) return;
    api.get('/boarding/meals', { params: { house_id: houseId } }).then((res) => setMeals(res.data)).catch(() => {});
  };

  useEffect(() => {
    loadHouses();
    loadAssignments();
    api.get('/students', { params: { limit: 500 } }).then((res) => setStudents(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => { loadMeals(mealHouseId); }, [mealHouseId]);

  const handleCreateHouse = async (e) => {
    e.preventDefault();
    setHouseError('');
    try {
      await api.post('/boarding/houses', houseForm);
      setShowHouseModal(false);
      setHouseForm(emptyHouseForm);
      loadHouses();
    } catch (err) {
      setHouseError(err.response?.data?.message || 'Could not add house.');
    }
  };

  const handleDeleteHouse = async (id) => {
    try {
      await api.delete(`/boarding/houses/${id}`);
      loadHouses();
    } catch (err) {
      setHouseError(err.response?.data?.message || 'Could not delete house.');
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setAssignError('');
    try {
      await api.post('/boarding/assignments', assignForm);
      setShowAssignModal(false);
      setAssignForm(emptyAssignForm);
      loadAssignments();
      loadHouses();
    } catch (err) {
      setAssignError(err.response?.data?.message || 'Could not check in student.');
    }
  };

  const handleCheckOut = async (id) => {
    try {
      await api.put(`/boarding/assignments/${id}/checkout`);
      loadAssignments();
      loadHouses();
    } catch {
      // row stays as-is if it fails
    }
  };

  const handleAddMeal = async (e) => {
    e.preventDefault();
    setMealError('');
    try {
      await api.post('/boarding/meals', { ...mealForm, house_id: mealHouseId });
      setShowMealModal(false);
      setMealForm({ ...emptyMealForm });
      loadMeals(mealHouseId);
    } catch (err) {
      setMealError(err.response?.data?.message || 'Could not add meal.');
    }
  };

  const handleDeleteMeal = async (id) => {
    try {
      await api.delete(`/boarding/meals/${id}`);
      loadMeals(mealHouseId);
    } catch {
      // row stays as-is if it fails
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Building2 size={20} /> Boarding House
          </h1>
          <p className="text-sm text-slate-500">Houses, student check-in, and weekly meal plans</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('houses')}
            className={`text-sm px-4 py-2 rounded-lg font-medium ${tab === 'houses' ? 'bg-brand-blue text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            Houses
          </button>
          <button onClick={() => setTab('students')}
            className={`text-sm px-4 py-2 rounded-lg font-medium ${tab === 'students' ? 'bg-brand-blue text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            Students
          </button>
          <button onClick={() => setTab('meals')}
            className={`text-sm px-4 py-2 rounded-lg font-medium ${tab === 'meals' ? 'bg-brand-blue text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            Meal Plan
          </button>
        </div>
      </div>

      {tab === 'houses' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowHouseModal(true)}
              className="flex items-center gap-2 bg-brand-blue text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
              <Plus size={16} /> Add House
            </button>
          </div>
          {houseError && <p className="text-sm text-red-600">{houseError}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {houses.map((h) => (
              <div key={h.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">{h.name}</h3>
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${h.gender === 'Male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                      {h.gender === 'Male' ? "Boys' House" : "Girls' House"}
                    </span>
                  </div>
                  <button onClick={() => handleDeleteHouse(h.id)} className="text-slate-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-sm text-slate-600 mt-2">Warden: {h.warden_name || 'Not assigned'}</p>
                <p className="text-xs text-slate-400">{h.contact_phone || 'No contact number'}</p>
                <div className="flex items-center gap-1 mt-3 text-xs text-slate-500">
                  <Users size={12} /> {h.occupied_count} / {h.capacity} occupied
                </div>
              </div>
            ))}
            {!houses.length && <p className="col-span-full text-center text-slate-400 py-8">No boarding houses added yet.</p>}
          </div>
        </div>
      )}

      {tab === 'students' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowAssignModal(true)}
              className="flex items-center gap-2 bg-brand-blue text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
              <Plus size={16} /> Check In Student
            </button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Class</th>
                  <th className="px-4 py-3 font-medium">House</th>
                  <th className="px-4 py-3 font-medium">Room</th>
                  <th className="px-4 py-3 font-medium">Health Notes</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{a.student_name}</td>
                    <td className="px-4 py-3 text-slate-600">{a.class_name}</td>
                    <td className="px-4 py-3 text-slate-600">{a.house_name}</td>
                    <td className="px-4 py-3 text-slate-600">{a.room_no || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-[200px] truncate">{a.health_notes || '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleCheckOut(a.id)} className="text-brand-blue text-xs font-medium hover:underline flex items-center gap-1">
                        <LogOut size={12} /> Check Out
                      </button>
                    </td>
                  </tr>
                ))}
                {!assignments.length && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No students currently boarding.</td></tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'meals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <select value={mealHouseId} onChange={(e) => setMealHouseId(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm min-w-[180px]">
              {houses.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
            <button onClick={() => setShowMealModal(true)}
              className="flex items-center gap-2 bg-brand-blue text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
              <UtensilsCrossed size={16} /> Add Meal
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {days.map((day) => (
              <div key={day} className="bg-white rounded-xl border border-slate-200 p-3">
                <h3 className="text-sm font-semibold text-slate-700 mb-2 text-center border-b border-slate-100 pb-2">{day}</h3>
                <div className="space-y-2">
                  {mealTypes.map((type) => {
                    const meal = meals.find((m) => m.day_of_week === day && m.meal_type === type);
                    return (
                      <div key={type} className="text-xs">
                        <p className="font-medium text-slate-500">{type}</p>
                        {meal ? (
                          <div className="flex items-start justify-between gap-1 bg-slate-50 rounded p-1.5 mt-0.5">
                            <span className="text-slate-700">{meal.menu}</span>
                            <button onClick={() => handleDeleteMeal(meal.id)} className="text-slate-300 hover:text-red-600 shrink-0">
                              <Trash2 size={10} />
                            </button>
                          </div>
                        ) : (
                          <p className="text-slate-300 italic mt-0.5">Not set</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showHouseModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowHouseModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
            <h2 className="text-lg font-semibold mb-4">Add House</h2>
            <form onSubmit={handleCreateHouse} className="space-y-3">
              <input required placeholder="House Name (e.g. Boys' House)" value={houseForm.name}
                onChange={(e) => setHouseForm({ ...houseForm, name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <select value={houseForm.gender} onChange={(e) => setHouseForm({ ...houseForm, gender: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="Male">Boys</option>
                <option value="Female">Girls</option>
              </select>
              <input placeholder="Warden Name" value={houseForm.warden_name}
                onChange={(e) => setHouseForm({ ...houseForm, warden_name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Contact Phone" value={houseForm.contact_phone}
                onChange={(e) => setHouseForm({ ...houseForm, contact_phone: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input type="number" placeholder="Capacity" value={houseForm.capacity}
                onChange={(e) => setHouseForm({ ...houseForm, capacity: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />

              {houseError && <p className="text-sm text-red-600">{houseError}</p>}

              <button type="submit" className="w-full bg-brand-blue text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700">
                Save House
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
            <h2 className="text-lg font-semibold mb-4">Check In Student</h2>
            <form onSubmit={handleAssign} className="space-y-3">
              <select required value={assignForm.student_id} onChange={(e) => setAssignForm({ ...assignForm, student_id: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select Student</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.admission_no})</option>)}
              </select>
              <select required value={assignForm.house_id} onChange={(e) => setAssignForm({ ...assignForm, house_id: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select House</option>
                {houses.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
              <input placeholder="Room No. (e.g. A12)" value={assignForm.room_no}
                onChange={(e) => setAssignForm({ ...assignForm, room_no: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <textarea placeholder="Health Notes (allergies, medication, etc. — optional)" rows={3} value={assignForm.health_notes}
                onChange={(e) => setAssignForm({ ...assignForm, health_notes: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />

              {assignError && <p className="text-sm text-red-600">{assignError}</p>}

              <button type="submit" className="w-full bg-brand-blue text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700">
                Confirm Check-In
              </button>
            </form>
          </div>
        </div>
      )}

      {showMealModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowMealModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
            <h2 className="text-lg font-semibold mb-4">Add Meal</h2>
            <form onSubmit={handleAddMeal} className="space-y-3">
              <select value={mealForm.day_of_week} onChange={(e) => setMealForm({ ...mealForm, day_of_week: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                {days.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={mealForm.meal_type} onChange={(e) => setMealForm({ ...mealForm, meal_type: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                {mealTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input required placeholder="Menu (e.g. Jollof rice with chicken)" value={mealForm.menu}
                onChange={(e) => setMealForm({ ...mealForm, menu: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />

              {mealError && <p className="text-sm text-red-600">{mealError}</p>}

              <button type="submit" className="w-full bg-brand-blue text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700">
                Save Meal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}