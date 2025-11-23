import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, MapPin, ArrowRight, Anchor, Shield, Ship } from 'lucide-react';
import toast from 'react-hot-toast';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { authService } from '../services/auth';

export default function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    location: '',
    role: 'fisher' as 'fisher' | 'admin' | 'distributor',
  });
  
  const [fisherData, setFisherData] = useState({
    vessel_name: '',
    home_port: '',
    tribal_community: '',
    vessel_capacity_tons: 0,
    sustainable_certified: false,
    specialization: [] as string[],
  });

  const [loading, setLoading] = useState(false);

  const handleBasicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (formData.role === 'fisher') {
      setStep(2);
      return;
    }

    await completeRegistration();
  };

  const handleFisherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await completeRegistration();
  };

  const completeRegistration = async () => {
    setLoading(true);

    try {
      // Register user
      await authService.register({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        role: formData.role,
        phone: formData.phone || undefined,
        location: formData.location || undefined,
      });

      // If fisher, create fisher profile
      if (formData.role === 'fisher' && fisherData.vessel_name) {
        await authService.createFisherProfile(fisherData);
      }

      toast.success('Account created successfully! Redirecting...');
      
      // Redirect based on role
      setTimeout(() => {
        if (formData.role === 'admin') {
          navigate('/admin');
        } else if (formData.role === 'fisher') {
          navigate('/data-entry');
        } else {
          navigate('/dashboard');
        }
      }, 1000);
    } catch (error: any) {
      let errorMessage = error.message || 'Registration failed';
      const detail = error.response?.data?.detail;
      if (typeof detail === 'string') {
        errorMessage = detail;
      } else if (Array.isArray(detail)) {
        errorMessage = detail.map((e: any) => e.msg).join(', ');
      } else if (detail && typeof detail === 'object') {
        errorMessage = JSON.stringify(detail);
      }
      
      // Show helpful error for database issues
      if (errorMessage.includes('Could not find the table') || errorMessage.includes('PGRST')) {
        toast.error('Database not setup! Please run SQL schema in Supabase first.', { duration: 6000 });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: 'fisher', label: 'Fisher', icon: Ship, desc: 'Register your catches' },
    { value: 'distributor', label: 'Distributor', icon: Shield, desc: 'Manage supply chain' },
  ];

  const specializations = ['Tuna', 'Mackerel', 'Shrimp', 'Crab', 'Lobster', 'Sardines'];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Premium Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgxNiwgMTg1LCAxMjksIDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
      <div className="absolute top-40 right-20 w-40 h-40 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>

      {/* Content */}
      <div className="relative min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-7xl">
          
          {/* Header */}
          <div className="text-center mb-12 animate-slide-up">
            <Link to="/" className="inline-flex items-center gap-3 px-6 py-3 glass-premium rounded-full mb-6">
              <Anchor className="w-6 h-6 text-blue-600" />
              <span className="font-bold text-slate-900">Coastal Fishers</span>
            </Link>
            
            <h1 className="text-5xl font-black text-slate-900 mb-4">
              Join the <span className="gradient-text-blue">Blockchain Revolution</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Create your account and start your journey with authentic seafood products
            </p>
          </div>

          {/* Step Indicator */}
          {formData.role === 'fisher' && (
            <div className="max-w-2xl mx-auto mb-8">
              <div className="flex items-center justify-center gap-4">
                {[1, 2].map((num) => (
                  <div key={num} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                      step >= num 
                        ? 'bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg' 
                        : 'bg-white/50 text-slate-400'
                    }`}>
                      {num}
                    </div>
                    {num < 2 && (
                      <div className={`w-24 h-1 mx-2 rounded-full transition-all ${
                        step > num ? 'bg-blue-500' : 'bg-slate-200'
                      }`}></div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between max-w-sm mx-auto mt-3 text-sm font-semibold text-slate-600">
                <span className={step >= 1 ? 'text-blue-600' : ''}>Basic Info</span>
                <span className={step >= 2 ? 'text-blue-600' : ''}>Vessel Details</span>
              </div>
            </div>
          )}

          {/* Forms */}
          <div className="max-w-4xl mx-auto">
            {step === 1 ? (
              /* Step 1: Basic Information */
              <div className="glass-premium p-10 rounded-3xl shadow-2xl animate-fade-in-scale">
                <form onSubmit={handleBasicSubmit} className="space-y-6">
                  {/* Role Selection */}
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-900">
                      I am a...
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {roles.map((role) => (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, role: role.value as any })}
                          className={`p-6 rounded-2xl border-2 transition-all ${
                            formData.role === role.value
                              ? 'border-blue-500 bg-blue-50 shadow-lg'
                              : 'border-slate-200 bg-white/50 hover:border-blue-300'
                          }`}
                        >
                          <role.icon className={`w-8 h-8 mx-auto mb-3 ${
                            formData.role === role.value ? 'text-blue-600' : 'text-slate-400'
                          }`} />
                          <p className="font-bold text-slate-900 mb-1">{role.label}</p>
                          <p className="text-xs text-slate-600">{role.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-900">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          className="w-full pl-12 pr-4 py-4 bg-white/50 border-2 border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                          placeholder="John Doe"
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-900">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full pl-12 pr-4 py-4 bg-white/50 border-2 border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                          placeholder="your@email.com"
                          required
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-900">Phone (Optional)</label>
                      <PhoneInput
                        international
                        defaultCountry="IN"
                        value={formData.phone}
                        onChange={(value) => setFormData({ ...formData, phone: value || '' })}
                        className="phone-input-custom w-full px-4 py-4 bg-white/50 border-2 border-slate-200 rounded-xl text-slate-900 font-semibold focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/20 transition-all"
                        placeholder="Enter phone number"
                      />
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-900">Location (Optional)</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          className="w-full pl-12 pr-4 py-4 bg-white/50 border-2 border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                          placeholder="Chennai, Tamil Nadu"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-900">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full pl-12 pr-4 py-4 bg-white/50 border-2 border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-900">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          className="w-full pl-12 pr-4 py-4 bg-white/50 border-2 border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Terms */}
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" required className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-slate-600">
                      I agree to the <Link to="/terms" className="text-blue-600 font-semibold hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-blue-600 font-semibold hover:underline">Privacy Policy</Link>
                    </span>
                  </label>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-glow-blue py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 group"
                  >
                    {formData.role === 'fisher' ? 'Next: Vessel Details' : 'Create Account'}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>

                <p className="text-center text-slate-600 mt-6">
                  Already have an account?{' '}
                  <Link to="/login" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
                    Sign In
                  </Link>
                </p>
              </div>
            ) : (
              /* Step 2: Fisher Details */
              <div className="glass-premium p-10 rounded-3xl shadow-2xl animate-fade-in-scale">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl mb-4 shadow-lg">
                    <Ship className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Tell us about your vessel</h3>
                  <p className="text-slate-600">Help buyers know more about your heritage</p>
                </div>

                <form onSubmit={handleFisherSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Vessel Name */}
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-900">Vessel Name</label>
                      <input
                        type="text"
                        value={fisherData.vessel_name}
                        onChange={(e) => setFisherData({ ...fisherData, vessel_name: e.target.value })}
                        className="w-full px-4 py-4 bg-white/50 border-2 border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                        placeholder="Sea Star 1"
                        required
                      />
                    </div>

                    {/* Home Port */}
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-900">Home Port</label>
                      <input
                        type="text"
                        value={fisherData.home_port}
                        onChange={(e) => setFisherData({ ...fisherData, home_port: e.target.value })}
                        className="w-full px-4 py-4 bg-white/50 border-2 border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                        placeholder="Chennai Harbour"
                        required
                      />
                    </div>

                    {/* Community */}
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-900">Community</label>
                      <input
                        type="text"
                        value={fisherData.tribal_community}
                        onChange={(e) => setFisherData({ ...fisherData, tribal_community: e.target.value })}
                        className="w-full px-4 py-4 bg-white/50 border-2 border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                        placeholder="e.g., Pattinapakkam"
                      />
                    </div>

                    {/* Vessel Capacity */}
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-900">Vessel Capacity (Tons)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={fisherData.vessel_capacity_tons || ''}
                        onChange={(e) => setFisherData({ ...fisherData, vessel_capacity_tons: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-4 bg-white/50 border-2 border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                        placeholder="5.0"
                      />
                    </div>
                  </div>

                  {/* Specialization */}
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-900">Target Species</label>
                    <div className="grid grid-cols-3 gap-3">
                      {specializations.map((spec) => (
                        <button
                          key={spec}
                          type="button"
                          onClick={() => {
                            setFisherData({
                              ...fisherData,
                              specialization: fisherData.specialization.includes(spec)
                                ? fisherData.specialization.filter(s => s !== spec)
                                : [...fisherData.specialization, spec]
                            });
                          }}
                          className={`px-4 py-3 rounded-xl border-2 font-semibold transition-all ${
                            fisherData.specialization.includes(spec)
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-slate-200 bg-white/50 text-slate-600 hover:border-blue-300'
                          }`}
                        >
                          {spec}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sustainable Certified */}
                  <label className="flex items-center gap-3 p-6 bg-white/50 rounded-xl border-2 border-slate-200 cursor-pointer hover:border-blue-300 transition-all">
                    <input
                      type="checkbox"
                      checked={fisherData.sustainable_certified}
                      onChange={(e) => setFisherData({ ...fisherData, sustainable_certified: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="font-bold text-slate-900">Sustainability Certified</p>
                      <p className="text-sm text-slate-600">My vessel follows sustainable fishing practices</p>
                    </div>
                  </label>

                  {/* Buttons */}
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 py-4 rounded-xl font-bold text-slate-700 bg-white/50 border-2 border-slate-200 hover:bg-white transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 btn-glow-blue py-4 rounded-xl font-bold flex items-center justify-center gap-3 group"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Creating Account...
                        </>
                      ) : (
                        <>
                          Complete Registration
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
