import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Users,
  ClipboardCheck,
  Wallet,
} from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const highlights = [
    { icon: Users, text: 'Students, guardians and staff in one place' },
    { icon: ClipboardCheck, text: 'Attendance, exams and results made simple' },
    { icon: Wallet, text: 'Fees, store and welfare tracked clearly' },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      {/* Brand panel */}
      <div className="relative lg:w-1/2 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white overflow-hidden">
        {/* soft decorative shapes */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-brand-blue/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-brand-green/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between h-full px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-blue to-blue-700 flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-900/40">
              BH
            </div>
            <div className="leading-tight">
              <p className="font-semibold text-base">Beverly Hills Academy</p>
              <p className="text-xs text-blue-200">Wa</p>
            </div>
          </div>

          <div className="hidden lg:block my-12">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 mb-6">
              <GraduationCap className="w-7 h-7 text-blue-200" />
            </div>
            <h1 className="text-4xl font-semibold leading-tight max-w-md">
              Welcome back to your school workspace
            </h1>
            <p className="mt-4 text-blue-100/80 max-w-md leading-relaxed">
              Everything the school runs on, from the classroom to the front office, in one secure system.
            </p>

            <ul className="mt-10 space-y-4">
              {highlights.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-blue-100">
                  <span className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <p className="hidden lg:block text-xs text-blue-200/70">
            &copy; {new Date().getFullYear()} Beverly Hills Academy, Wa. All rights reserved.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900">Sign in</h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Admins sign in with email. Teachers and students use their username.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email or username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="identifier"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email or username"
                  autoComplete="username"
                  autoFocus
                  required
                  className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 focus:outline-none focus:text-brand-blue"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-blue text-white text-sm font-semibold shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            Forgot your password? Contact the school administrator to reset it.
          </p>
          <p className="mt-6 text-center text-xs text-slate-400 lg:hidden">
            &copy; {new Date().getFullYear()} Beverly Hills Academy, Wa
          </p>
        </div>
      </div>
    </div>
  );
}