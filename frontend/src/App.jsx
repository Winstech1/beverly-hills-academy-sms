import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import ComingSoon from './pages/ComingSoon';
import Classes from './pages/Classes';
import Fees from './pages/Fees';
import Attendance from './pages/Attendance';
import Examinations from './pages/Examinations';
import Subjects from './pages/Subjects';
import Assignments from './pages/Assignments';
import Transportation from './pages/Transportation';
import Reports from './pages/Reports';
import Library from './pages/Library';
import Communication from './pages/Communication';
import Timetable from './pages/Timetable';
import StudentPortal from './pages/StudentPortal';
import Boarding from './pages/Boarding';
import Settings from './pages/Settings';
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="my-portal" element={<StudentPortal />} />
            <Route path="students" element={<Students />} />
            <Route path="teachers" element={<Teachers />} />
            <Route path="classes" element={<Classes />} />
            <Route path="subjects" element={<Subjects />} />
            <Route path="examinations" element={<Examinations />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="fees" element={<Fees />} />
            <Route path="timetable" element={<Timetable />} />
            <Route path="assignments" element={<Assignments />} />
             <Route path="library" element={<Library />} />
            <Route path="transportation" element={<Transportation />} />
            <Route path="hostel" element={<Boarding />} />
            <Route path="communication" element={<Communication />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
