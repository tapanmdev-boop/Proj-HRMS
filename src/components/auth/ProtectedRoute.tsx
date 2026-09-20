import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { selectAuthStatus, selectCurrentUser } from '../../auth/authSlice';
import { canAccessPath } from '../layout/navigation';

export default function ProtectedRoute() {
  const status = useAppSelector(selectAuthStatus);
  const user = useAppSelector(selectCurrentUser);
  const location = useLocation();

  // A stored session is being restored: wait, so a reload never flashes the sign-in page.
  if (status === 'initializing') {
    return (
      <div className="flex h-screen items-center justify-center bg-ivory-100" role="status" aria-label="Loading your session">
        <span className="h-5 w-5 animate-spin rounded-full border-[1.5px] border-ivory-400 border-t-ink-900" />
      </div>
    );
  }

  if (status !== 'authenticated' || !user) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  }

  // Role rules come from the navigation config; the API enforces the same rules independently.
  if (!canAccessPath(user.role, location.pathname)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
