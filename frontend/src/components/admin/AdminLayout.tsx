import { Building2, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/useAuth';
import Button from '../Button/Button';
import SidebarNav from './SidebarNav';

function Brand() {
  return (
    <div className="flex items-center gap-2 px-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white">
        <Building2 className="h-5 w-5" />
      </span>
      <span className="text-base font-semibold">HR Admin</span>
    </div>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const initials = (user?.email ?? '?').slice(0, 2).toUpperCase();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-gray-200 bg-white p-4 md:flex">
        <div className="mb-6">
          <Brand />
        </div>
        <div className="-mr-2 flex-1 overflow-y-auto pr-2">
          <SidebarNav />
        </div>
      </aside>

      {/* Drawer (mobile) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white p-4 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <Brand />
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white/80 px-4 py-3 backdrop-blur md:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:invisible"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700">
              {initials}
            </div>
            <span className="hidden text-sm text-gray-600 sm:block">{user?.email}</span>
            <Button variant="secondary" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}