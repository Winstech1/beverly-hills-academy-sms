import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Users2, GraduationCap, BookOpen, Layers, ClipboardList,
  CalendarCheck, Wallet, CalendarDays, FileText, Library, Bus, Building2,
  MessageSquare, BarChart3, Settings, LogOut, ClipboardCheck, ClipboardSignature,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Admin/principal nav, grouped into sections for easier scanning.
const adminSections = [
  {
    label: 'Overview',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Academics',
    items: [
      { to: '/students', label: 'Students', icon: Users },
      { to: '/teachers', label: 'Teachers', icon: GraduationCap },
      { to: '/classes', label: 'Classes', icon: Layers },
      { to: '/subjects', label: 'Subjects', icon: BookOpen },
      { to: '/examinations', label: 'Examinations', icon: ClipboardList },
      { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
      { to: '/timetable', label: 'Timetable', icon: CalendarDays },
      { to: '/assignments', label: 'Assignments', icon: FileText },
    ],
  },
  {
    label: 'Campus Life',
    items: [
      { to: '/library', label: 'Library', icon: Library },
      { to: '/transportation', label: 'Transportation', icon: Bus },
      { to: '/hostel', label: 'Boarding House', icon: Building2 },
    ],
  },
  {
    label: 'Admissions',
    items: [
      { to: '/admissions', label: 'Admissions', icon: ClipboardCheck },
      { to: '/guardians', label: 'Guardians', icon: Users2 },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/fees', label: 'Fees & Payments', icon: Wallet },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/communication', label: 'Communication', icon: MessageSquare },
      { to: '/approvals', label: 'Approvals', icon: ClipboardSignature },
      { to: '/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

// Teachers and students get short, flat lists — no need for section grouping.
const teacherItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/students', label: 'My Class', icon: Users },
  { to: '/examinations', label: 'Examinations', icon: ClipboardList },
  { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/timetable', label: 'Timetable', icon: CalendarDays },
  { to: '/assignments', label: 'Assignments', icon: FileText },
  { to: '/communication', label: 'Communication', icon: MessageSquare },
  { to: '/approvals', label: 'Approvals', icon: ClipboardSignature },
];

const studentItems = [
  { to: '/my-portal', label: 'My Portal', icon: GraduationCap },
  { to: '/timetable', label: 'Timetable', icon: CalendarDays },
  { to: '/communication', label: 'Communication', icon: MessageSquare },
];

function NavItem({ to, label, icon: Icon, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={() => onNavigate?.()}
      className={({ isActive }) =>
        `group flex items-center gap-3 pl-3 pr-3 py-2.5 rounded-lg text-sm border-l-2 transition-all ${
          isActive
            ? 'bg-white/10 border-brand-blue text-white font-medium'
            : 'border-transparent text-slate-300 hover:bg-white/5 hover:border-white/20 hover:text-white'
        }`
      }
    >
      <Icon size={18} className="shrink-0" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

export default function Sidebar({ onNavigate }) {
  const { user, logout } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';

  return (
    <aside className="w-64 bg-gradient-to-b from-navy-950 to-navy-900 text-slate-200 flex flex-col shrink-0 h-screen sticky top-0">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-blue to-blue-700 flex items-center justify-center font-bold shadow-lg shadow-blue-900/40">
          BH
        </div>
        <div>
          <p className="font-semibold text-white leading-tight">Beverly Hills</p>
          <p className="text-xs text-slate-400 leading-tight">Academy, Wa</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
        {isTeacher && teacherItems.map((item) => (
          <NavItem key={item.to} {...item} onNavigate={onNavigate} />
        ))}
        {isStudent && studentItems.map((item) => (
          <NavItem key={item.to} {...item} onNavigate={onNavigate} />
        ))}
        {!isTeacher && !isStudent && adminSections.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem key={item.to} {...item} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
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