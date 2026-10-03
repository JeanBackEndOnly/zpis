import { Link } from 'react-router-dom';
import Button from '../components/Button/Button';
import { useAuth } from '../features/auth/useAuth';

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-lg font-semibold text-red-700">
          {(user?.email ?? '?').slice(0, 2).toUpperCase()}
        </div>
        <h2 className="text-xl font-semibold">Welcome</h2>
        <p className="mt-1 text-sm text-gray-500">{user?.email}</p>
        <p className="mt-3 inline-block rounded-full bg-red-50 px-3 py-1 text-xs font-medium capitalize text-red-700">
          {user?.user_role}
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <Link
            to="/leave"
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            My leave requests
          </Link>
          {user?.user_role === 'admin' && (
            <Link
              to="/admin"
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
            >
              Go to admin panel
            </Link>
          )}
          <Button variant="secondary" onClick={logout}>Logout</Button>
        </div>
      </div>
    </div>
  );
}