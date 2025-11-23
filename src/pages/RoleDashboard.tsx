import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { authService, User } from '../services/auth';

export default function RoleDashboard() {
  // Get user immediately on mount for faster rendering
  const [user] = useState<User | null>(() => authService.getCurrentUser());
  const navigate = useNavigate();

  // Memoize role check to prevent re-computation
  const role = useMemo(() => user?.role, [user]);

  useEffect(() => {
    if (!user) {
      // No user, redirect to login immediately
      navigate('/login', { replace: true });
      return;
    }

    // PRODUCTION OPTIMIZED: Immediate redirect for admin and fisher to unified dashboard
    if (role === 'admin' || role === 'fisher' || role === 'farmer') {
      navigate('/admin', { replace: true });
    }
  }, [user, role, navigate]);

  // Show loading while redirecting admin/fisher to unified dashboard
  if (role === 'admin' || role === 'fisher' || role === 'farmer') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-semibold">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // Distributors and Admins go to admin panel
  if (role === 'admin' || role === 'distributor') {
    return <Navigate to="/admin" replace />;
  }

  // Fishers go to admin panel (or their specific view if different, but currently seems shared)
  if (role === 'fisher' || role === 'farmer') {
    return <Navigate to="/admin" replace />;
  }

  // Default fallback to login if role is unknown or invalid
  return <Navigate to="/login" replace />;
}
