import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Mail, Lock, ArrowRight, Ship, Shield, Sparkles, Anchor } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService, AuthResponse } from '../services/auth';
import { apiCache } from '../services/apiCache';
import BrandLogo from '../components/BrandLogo';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const redirectTo = params.get('redirect');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!formData.email || !formData.password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);

    // Helper: set a client-side timeout to avoid UI getting stuck
    const timeout = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));

    // Prefetch bundles in background (non-blocking)
    const prefetchBundles = async () => {
      try {
        import('../pages/RoleDashboard');
        import('../pages/FisherProfilePage');
        import('../pages/AdminPanelPage');
      } catch (e) {
        // ignore prefetch errors
      }
    };

    // Prefetch essential data via cache (non-blocking)
    const prefetchData = () => {
      apiCache.prefetch('user-profile', () => fetch('/api/user/profile').then(r => r.json()).catch(() => null));
      apiCache.prefetch('fishers-list', () => fetch('/api/fishers?limit=20').then(r => r.json()).catch(() => []));
    };

    try {
      // Start prefetching while login is in-flight
      prefetchBundles();
      prefetchData();

      // Start login request
      const loginPromise: Promise<AuthResponse> = authService.login(formData);

      // Show optimistic toast immediately
      const toastId = toast.loading('Signing you in...');

      // Wait for login to complete or timeout after 6s
      const result = (await Promise.race([loginPromise, timeout(6000)])) as AuthResponse;

      // Check if user data exists and provide fallback for missing fields
      if (!result || !result.user) {
        console.error('Login result:', result);
        throw new Error('Invalid login response - missing user data');
      }

      // Ensure full_name exists, use email fallback if needed
      const userName = result.user.full_name || result.user.email?.split('@')[0] || 'User';

      // Update toast to success (if still present)
      toast.success(`Welcome back, ${userName}! 🎉`, { id: toastId });

      // Navigate IMMEDIATELY without any delay
      const targetRoute = redirectTo 
        || (result.user.role === 'admin' ? '/admin' : 
            result.user.role === 'fisher' ? '/admin' : 
            result.user.role === 'distributor' ? '/admin' :
            '/dashboard');

      // Use replace to avoid back button issues
      navigate(targetRoute, { replace: true });

    } catch (error: any) {
      let errorMessage = error.message || 'Login failed';
      const detail = error.response?.data?.detail;
      if (typeof detail === 'string') {
        errorMessage = detail;
      } else if (Array.isArray(detail)) {
        errorMessage = detail.map((e: any) => e.msg).join(', ');
      } else if (detail && typeof detail === 'object') {
        errorMessage = JSON.stringify(detail);
      }

      // Dev admin fallback: allow local admin session if backend login fails
      const isAdminCreds = formData.email.trim().toLowerCase() === 'admin@gmail.com' && formData.password === 'admin';
      if (isAdminCreds) {
        const fakeToken = 'dev_admin_token_' + Math.random().toString(36).slice(2);
        const devAdmin = {
          id: 'admin-dev',
          email: 'admin@gmail.com',
          full_name: 'Administrator',
          role: 'admin' as const,
          is_verified: true,
          created_at: new Date().toISOString(),
        };
        localStorage.setItem('auth_token', fakeToken);
        localStorage.setItem('user', JSON.stringify(devAdmin));
        toast.success('Admin mode enabled');
        setTimeout(() => navigate('/admin'), 300);
        return;
      }

      // Show helpful error for database issues
      if (errorMessage.includes('Could not find the table') || errorMessage.includes('PGRST')) {
        toast.error('Database not setup! Please run SQL schema in Supabase first.', { duration: 6000 });
      } else if (errorMessage.includes('Invalid credentials') || errorMessage.includes('401')) {
        toast.error('Invalid email or password. Please try again.');
      } else if (error.code === 'ECONNABORTED' || errorMessage.includes('timeout') || errorMessage.includes('Network Error')) {
        toast.error(
          (t) => (
            <div className="flex flex-col gap-2 text-slate-800">
              <p className="font-bold">Backend Server Offline</p>
              <p>The login server is not responding. Please ensure the backend is running.</p>
              <p>
                See{' '}
                <code className="bg-slate-200 text-slate-900 px-1.5 py-0.5 rounded font-mono text-sm">
                  BACKEND_SETUP.md
                </code>{' '}
                for instructions.
              </p>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="mt-2 w-full px-4 py-2 rounded-lg font-semibold text-sm border border-slate-300 hover:bg-slate-100 text-slate-800 transition-colors"
              >
                Dismiss
              </button>
            </div>
          ),
          { duration: 15000 }
        );
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Premium Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgxNiwgMTg1LCAxMjksIDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
      <div className="absolute top-40 right-20 w-40 h-40 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
      <div className="absolute bottom-20 left-1/3 w-36 h-36 bg-teal-400 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>

      {/* Content */}
      <div className="relative min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Branding */}
          <div className="hidden lg:block space-y-8">
            <BrandLogo />

            <h1 className="text-5xl font-black text-slate-900 leading-tight">
              Authentic <span className="gradient-text-blue">Seafood Products</span>
              <br />from Coastal Fishers
            </h1>

            <p className="text-xl text-slate-600 leading-relaxed">
              Blockchain-powered traceability ensuring authenticity from ocean to your table.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Shield, label: 'Blockchain Verified', color: 'blue' },
                { icon: Ship, label: 'Sustainable Fishing', color: 'cyan' },
                { icon: Sparkles, label: 'Premium Quality', color: 'yellow' },
                { icon: LogIn, label: 'Secure Access', color: 'teal' },
              ].map((item, index) => (
                <div key={index} className="glass-card p-6 rounded-2xl">
                  <item.icon className={`w-8 h-8 text-${item.color}-600 mb-3`} />
                  <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full max-w-md mx-auto">
            <div className="glass-premium p-10 rounded-3xl shadow-2xl">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  <BrandLogo className="scale-90" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">
                  Welcome Back
                </h2>
                <p className="text-slate-600">
                  Sign in to your account
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-900">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-white/50 border-2 border-slate-200 rounded-xl text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-900">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-white/50 border-2 border-slate-200 rounded-xl text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-slate-600 font-medium">Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-glow-blue py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
                <span className="text-sm text-slate-500 font-medium">OR</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
              </div>

              {/* Sign Up Link */}
              <p className="text-center text-slate-600">
                Don't have an account?{' '}
                <Link to="/signup" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
                  Create Account
                </Link>
              </p>
            </div>

            {/* Additional Info */}
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                Protected by blockchain technology 🔐
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
