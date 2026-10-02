import { Building2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import LoginForm from '../features/auth/LoginForm';
import { useAuth } from '../features/auth/useAuth';

export default function Login() {
  const { user } = useAuth();
  if (user) return <Navigate to={user.user_role === 'admin' ? '/admin' : '/'} replace />;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-red-600 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-white/5" />

        <div className="relative flex items-center gap-2 text-lg font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
            <Building2 className="h-5 w-5" />
          </span>
          HR Admin
        </div>

        <div className="relative">
          <h1 className="text-4xl font-semibold leading-tight">Manage your organization with clarity.</h1>
          <p className="mt-4 max-w-md text-red-100">
            Departments, unit sections, and positions in one clean workspace.
          </p>
        </div>

        <p className="relative text-sm text-red-200">© {new Date().getFullYear()} HR Admin</p>
      </div>

      <div className="flex items-center justify-center bg-white p-6">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
          <p className="mb-8 mt-1 text-sm text-gray-500">Sign in to continue to your dashboard.</p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}