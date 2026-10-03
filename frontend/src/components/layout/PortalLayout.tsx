import { Building2, LogOut } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/useAuth';
import Button from '../Button/Button';

// Simple top-bar layout for pages every logged-in employee can open
export default function PortalLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen overflow-x-clip">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white">
              <Building2 className="h-5 w-5" />
            </span>
            <span className="font-semibold">HR Portal</span>
          </Link>
          <div className="flex min-w-0 items-center gap-3">
            <span className="hidden truncate text-sm text-gray-600 sm:block">{user?.email}</span>
            <Button variant="secondary" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-4 md:p-6">{children}</main>
    </div>
  );
}