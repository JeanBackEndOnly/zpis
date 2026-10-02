import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

export default function RequireAuth({ adminOnly = false }: { adminOnly?: boolean }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="center">Loading...</p>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (adminOnly && user.user_role !== 'admin') return <Navigate to="/" replace />;

  return <Outlet />;
}