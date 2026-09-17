import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Users2, GraduationCap, BookOpen, Layers, ClipboardList,
  CalendarCheck, Wallet, CalendarDays, FileText, Library, Bus, Building2,
  MessageSquare, BarChart3, Settings, LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const adminNavItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/students', label: 'Students', icon: Users },
   { to: '/guardians', label: 'Guardians', icon: Users2 },
  { to: '/teachers', label: 'Teachers', icon: GraduationCap },
  { to: '/classes', label: 'Classes', icon: Layers },
  { to: '/subjects', label: 'Subjects', icon: BookOpen },
  { to: '/examinations', label: 'Examinations', icon: ClipboardList },
  { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/fees', label: 'Fees & Payments', icon: Wallet },
  { to: '/timetable', label: 'Timetable', icon: CalendarDays },
  { to: '/assignments', label: 'Assignments', icon: FileText },
  { to: '/library', label: 'Library', icon: Library },
  { to: '/transportation', label: 'Transportation', icon: Bus },
    { to: '/hostel', label: 'Boarding House', icon: Building2 },
  { to: '/communication', label: 'Communication', icon: MessageSquare },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

// Teachers get a focused view: their class, attendance, results, assignments, timetable, and messaging —
// no access to other classes, fees, staff records, or admin-only reports.
const teacherNavItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/students', label: 'My Class', icon: Users },
  { to: '/examinations', label: 'Examinations', icon: ClipboardList },
  { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/timetable', label: 'Timetable', icon: CalendarDays },
  { to: '/assignments', label: 'Assignments', icon: FileText },
  { to: '/communication', label: 'Communication', icon: MessageSquare },
];

// Students see only their own portal, timetable, and messages.
const studentNavItems = [
  { to: '/my-portal', label: 'My Portal', icon: GraduationCap },
  { to: '/timetable', label: 'Timetable', icon: CalendarDays },
  { to: '/communication', label: 'Communication', icon: MessageSquare },
];
export default function Sidebar({ onNavigate }) {
  const { user, logout } = useAuth();
    const navItems =
    user?.role === 'teacher' ? teacherNavItems :
    user?.role === 'student' ? studentNavItems :
    adminNavItems;

  return (
    <aside className="w-64 bg-navy-950 text-slate-200 flex flex-col shrink-0 h-screen sticky top-0">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="h-10 w-10 rounded-lg bg-brand-blue flex items-center justify-center font-bold">
          BHA
        </div>
        <div>
          <p className="font-semibold text-white leading-tight">Beverly Hills</p>
          <p className="text-xs text-slate-400 leading-tight">Academy, Wa</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
                {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => onNavigate?.()}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-brand-blue text-white'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <p className="text-sm font-medium text-white truncate">{user?.full_name || 'Admin'}</p>
        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
        <button
          onClick={logout}
          className="mt-3 flex items-center gap-2 text-sm text-slate-300 hover:text-white"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
