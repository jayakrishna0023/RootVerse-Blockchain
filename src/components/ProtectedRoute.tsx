import { Navigate } from 'react-router-dom';
import { authService } from '../services/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'consumer' | 'fisher' | 'admin' | 'distributor';
  requiredRoles?: Array<'consumer' | 'fisher' | 'admin' | 'distributor'>;
}

export default function ProtectedRoute({ children, requiredRole, requiredRoles }: ProtectedRouteProps) {
  const isAuthenticated = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser();
  const currentPath = window.location.pathname + window.location.search;

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    const redirect = encodeURIComponent(currentPath);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  // Build the list of accepted roles if provided
  const rolesList = requiredRoles || (requiredRole ? [requiredRole] : undefined);

  // If role is required and user doesn't have it, show access denied page
  if (rolesList && (!currentUser?.role || !rolesList.includes(currentUser.role))) {
    const from = encodeURIComponent(currentPath);
    const required = encodeURIComponent(rolesList.join(','));
    return <Navigate to={`/access-denied?required=${required}&from=${from}`} replace />;
  }

  return <>{children}</>;
}
