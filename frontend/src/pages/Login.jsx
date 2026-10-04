import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email/username and password.');
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Login failed. Please check your details and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">

      {/* Main Login Container */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">

        {/* =====================================================
            LEFT BRANDING SECTION
        ====================================================== */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-700 via-blue-800 to-slate-950 text-white p-10 relative overflow-hidden">

          {/* Decorative circles */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/20 rounded-full"></div>
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-400/10 rounded-full"></div>

          <div className="relative z-10 flex flex-col justify-between w-full">

            {/* Logo */}
            <div>
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center shadow-lg">
                  <span className="text-blue-700 font-extrabold text-xl">
                    BH
                  </span>
                </div>

                <div>
                  <h2 className="text-xl font-bold">
                    Beverly Hills Academy
                  </h2>
                  <p className="text-blue-200 text-sm">
                    Wa, Ghana
                  </p>
                </div>
              </div>
            </div>

            {/* Welcome Message */}
            <div className="my-10">
              <p className="text-blue-200 uppercase tracking-widest text-xs font-semibold mb-3">
                School Management System
              </p>

              <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                Manage your school
                <span className="text-blue-300"> smarter.</span>
              </h1>

              <p className="mt-5 text-blue-100 leading-relaxed max-w-md">
                Access student records, attendance, academics, fees,
                teachers and other school management tools from one
                secure platform.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4">

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-2xl mb-2">🎓</div>
                <p className="font-semibold text-sm">Student Management</p>
                <p className="text-xs text-blue-200 mt-1">
                  Records & academics
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-2xl mb-2">📊</div>
                <p className="font-semibold text-sm">School Reports</p>
                <p className="text-xs text-blue-200 mt-1">
                  Data & performance
                </p>
              </div>

            </div>

            <p className="text-xs text-blue-300 mt-8">
              © {new Date().getFullYear()} Beverly Hills Academy, Wa
            </p>

          </div>
        </div>


        {/* =====================================================
            RIGHT LOGIN SECTION
        ====================================================== */}
        <div className="w-full md:w-1/2 p-7 sm:p-10 lg:p-12">

          {/* Mobile Logo */}
          <div className="md:hidden flex justify-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-extrabold text-xl">
                BH
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <p className="text-blue-600 text-sm font-semibold mb-2">
              WELCOME BACK 
            </p>

            <h2 className="text-3xl font-bold text-slate-900">
              Sign in to your account
            </h2>

            <p className="text-slate-500 mt-2 text-sm">
              Enter your details to access the school management system.
            </p>
          </div>


          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email or Username
              </label>

              <div className="relative">

                {/* User Icon */}
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 21a8 8 0 0 0-16 0" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>

                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-11 pr-4 py-3 text-sm text-slate-900 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  placeholder="Enter your email or username"
                />

              </div>
            </div>


            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Password
                </label>

                <button
                  type="button"
                  className="text-xs font-medium text-blue-600 hover:text-blue-800"
                  onClick={() => {
                    // Add forgot-password functionality later
                  }}
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">

                {/* Lock Icon */}
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect
                      width="18"
                      height="11"
                      x="3"
                      y="11"
                      rx="2"
                    />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>


                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-11 pr-12 py-3 text-sm text-slate-900 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  placeholder="Enter your password"
                />


                {/* Show / Hide Password */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="m3 3 18 18" />
                      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                      <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c7 0 10 8 10 8a18.4 18.4 0 0 1-3.2 4.4" />
                      <path d="M6.6 6.6C3.7 8.4 2 12 2 12s3 8 10 8a10.5 10.5 0 0 0 3.4-.6" />
                    </svg>
                  )}
                </button>

              </div>
            </div>


            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-3">
                <div className="text-red-500 mt-0.5">
                  ⚠️
                </div>

                <p className="text-sm text-red-600">
                  {error}
                </p>
              </div>
            )}


            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 text-white py-3.5 text-sm font-semibold shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>

                  Signing in...
                </span>
              ) : (
                'Sign In to Dashboard →'
              )}
            </button>

          </form>


          {/* Security Notice */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect
                  width="18"
                  height="11"
                  x="3"
                  y="11"
                  rx="2"
                />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>

              Secure school management portal
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}