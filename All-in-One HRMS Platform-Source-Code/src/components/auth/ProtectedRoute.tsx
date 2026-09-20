import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { selectIsAuthenticated, selectCurrentUser } from '../../auth/authSlice';

interface ProtectedRouteProps {
  allowedRoles?: ('admin' | 'hr' | 'employee' | 'manager')[];
}

export default function ProtectedRoute({ allowedRoles }: Readonly<ProtectedRouteProps>) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);
  
  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }
  
  // Check if user has the required role (if roles are specified)
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  // If authenticated and authorized, render the child routes
  return <Outlet />;
}
