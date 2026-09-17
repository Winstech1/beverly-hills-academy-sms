import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile top bar — only visible on small screens */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-navy-950 flex items-center px-4 z-30">
        <button onClick={() => setMobileOpen(true)} className="text-white">
          <Menu size={22} />
        </button>
        <span className="text-white font-semibold ml-3 text-sm">Beverly Hills Academy</span>
      </div>

      {/* Overlay behind the sidebar when open on mobile */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar: fixed/off-canvas on mobile, static on desktop */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-200
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </div>

      <main className="flex-1 p-4 lg:p-6 overflow-x-hidden pt-20 lg:pt-6 w-full">
        <Outlet />
      </main>
    </div>
  );
}