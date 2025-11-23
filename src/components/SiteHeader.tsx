import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService, User as AuthUser } from '../services/auth';
import { Shield, ScanLine, Home, LayoutGrid, User as UserIcon, Mail, BadgeCheck, LogOut, MapPin, Phone, BookOpen } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import BrandLogo from './BrandLogo';

export default function SiteHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(authService.getCurrentUser());
    setMenuOpen(false);
  }, [location.pathname]);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isFisher = user?.role === 'fisher';
  const isAdmin = user?.role === 'admin';
  const isConsumerOrDistributor = user?.role === 'consumer' || user?.role === 'distributor';
  const canRegister = isFisher || isAdmin;
  const canViewAdmin = isFisher || isAdmin;

  const NavLink = ({ to, label, icon: Icon }: { to: string; label: string; icon: any }) => {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
          active
            ? 'bg-ocean-50 text-ocean-700'
            : 'text-slate-600 hover:bg-slate-50 hover:text-ocean-600'
        }`}
      >
        <Icon className={`w-4 h-4 ${active ? 'text-ocean-600' : 'text-slate-400'}`} />
        <span>{label}</span>
      </Link>
    );
  };

  const homeHref = user ? (user.role === 'fisher' ? '/admin' : '/dashboard') : '/';

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setMenuOpen(false);
      toast.success('Signed out');
      navigate('/');
    } catch (err) {
      console.error(err);
      toast.error('Failed to sign out');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to={homeHref} className="flex items-center cursor-pointer group">
          <BrandLogo variant="dark" className="scale-90 origin-left" />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {/* Consumer/Distributor: Dashboard, Fisher Stories, and Verify */}
          {isConsumerOrDistributor ? (
            <>
              <NavLink to={homeHref} label="Dashboard" icon={Home} />
              <NavLink to="/fisher-stories" label="Stories" icon={BookOpen} />
              <NavLink to="/verify" label="Verify Catch" icon={ScanLine} />
            </>
          ) : (
            <>
              {!isFisher && <NavLink to={homeHref} label="Dashboard" icon={Home} />}
              {canRegister && <NavLink to="/data-entry" label="Register Catch" icon={Shield} />}
              {canViewAdmin && <NavLink to="/admin" label={isFisher ? "Dashboard" : "Admin Panel"} icon={LayoutGrid} />}
              {/* Fisher Data - only for fishers to write/edit */}
              {isFisher && <NavLink to="/fisher-data" label="My Data" icon={BookOpen} />}            
              {/* Fisher Stories - for everyone to read */}
              <NavLink to="/fisher-stories" label="Stories" icon={BookOpen} />
              <NavLink to="/verify" label="Verify" icon={ScanLine} />
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <div className="text-right pr-1">
                  <div className="text-xs font-bold text-slate-700 leading-tight">{user.full_name || 'User'}</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-ocean-100 text-ocean-700 flex items-center justify-center text-xs font-black border-2 border-white shadow-sm">
                  {user.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl p-4 z-50 animate-fade-in ring-1 ring-black/5">
                  <div className="text-sm font-bold text-slate-900 mb-2">Account</div>
                  <div className="flex items-center gap-3 mb-4 p-2 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-ocean-600 text-white flex items-center justify-center text-sm font-bold shadow-md">
                      {user.full_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate flex items-center gap-2">
                        {user.full_name || 'User'}
                        {user.is_verified && (
                          <BadgeCheck className="w-4 h-4 text-ocean-500" />
                        )}
                      </div>
                      <div className="text-slate-500 text-xs truncate flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {user.email}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600 px-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Role</span>
                      <span className="uppercase text-[10px] px-2 py-0.5 rounded-full bg-ocean-50 text-ocean-700 font-bold border border-ocean-100">{user.role}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span className="truncate">{user.phone}</span>
                      </div>
                    )}
                    {user.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="truncate">{user.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      to={homeHref}
                      onClick={() => setMenuOpen(false)}
                      className="flex-1 px-3 py-2 text-sm font-bold text-center rounded-xl text-ocean-700 bg-ocean-50 hover:bg-ocean-100 transition-colors"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="px-5 py-2.5 rounded-xl text-sm font-bold bg-ocean-600 text-white hover:bg-ocean-700 shadow-lg shadow-ocean-500/20 transition-all hover:scale-105">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
