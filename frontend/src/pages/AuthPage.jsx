import { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [tab, setTab] = useState('login');
  const [loginRole, setLoginRole] = useState('student');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const fd = new FormData(e.target);
    try {
      const { data } = await api.post('/auth/login', {
        email: fd.get('email'),
        password: fd.get('password'),
        userType: loginRole,
      });
      login(data.user, data.token);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    const fd = new FormData(e.target);
    try {
      const { data } = await api.post('/auth/register', {
        name: fd.get('name'),
        email: fd.get('email'),
        phone: fd.get('phone'),
        password: fd.get('password'),
        studentId: fd.get('student_id'),
      });
      setSuccess(data.message || 'Registration submitted! Waiting for approval.');
      setTab('login');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Fast Test Login
  const handleDemoLogin = async (email, password, role) => {
    setError('');
    setLoading(true);
    setLoginRole(role);
    try {
      const { data } = await api.post('/auth/login', {
        email,
        password,
        userType: role,
      });
      login(data.user, data.token);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white selection:bg-indigo-500 selection:text-white">
      {/* Left Panel: Brand Showcase */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-16 relative overflow-hidden">
        {/* Glow ambient background elements */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3.5">
          <img
            src="/bracu_logo.png"
            alt="BRAC University Rideshare"
            className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-400/40 shadow-xl shadow-indigo-500/25"
          />
          <div>
            <div className="font-heading font-black text-lg tracking-tight">BRAC University</div>
            <div className="text-xs uppercase tracking-widest text-indigo-400 font-bold">Campus Rideshare</div>
          </div>
        </div>

        {/* Hero Pitch */}
        <div className="relative z-10 max-w-lg my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-6">
            <span>🎓</span> Verified BRACU Students Only
          </div>
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight font-heading mb-6">
            Smarter, safer <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              campus rides
            </span>{' '}
            every day.
          </h1>
          <p className="text-slate-300 text-base leading-relaxed mb-10">
            Split costs, beat Dhaka traffic, and travel comfortably between Merul Badda, Mohakhali, Banani, Mirpur, and Uttara with fellow students.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-2xl mb-1">🏍️ 🚗</div>
              <div className="font-bold text-sm text-white">Bike & Carpool</div>
              <div className="text-xs text-slate-400 mt-0.5">Flexible commute options tailored to students</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-2xl mb-1">🗺️ ⚡</div>
              <div className="font-bold text-sm text-white">Live Tracking</div>
              <div className="text-xs text-slate-400 mt-0.5">Real-time GPS routing with safety SOS hotline</div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 pt-6 border-t border-white/10">
          <span>BRAC University • Merul Badda, Dhaka</span>
          <span>Safe Student Mobility</span>
        </div>
      </div>

      {/* Right Panel: Interactive Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile Brand Header */}
          <div className="lg:hidden flex flex-col items-center text-center mb-6">
            <img
              src="/bracu_logo.png"
              alt="BRAC University Rideshare"
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-400/40 shadow-xl mb-3"
            />
            <h2 className="text-xl font-black font-heading">BRACU Rideshare</h2>
            <p className="text-xs text-slate-400">Student Campus Mobility Platform</p>
          </div>

          {/* Quick Demo Test Logins Banner */}
          <div className="mb-6 p-4 rounded-3xl bg-indigo-950/60 border border-indigo-500/30 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>⚡</span> 1-Click Fast Test Logins
              </span>
              <span className="text-[10px] text-slate-400">Dev Testing</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('moazzem@g.bracu.ac.bd', 'password123', 'student')}
                disabled={loading}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-center transition-all text-xs font-bold text-slate-200 hover:text-white cursor-pointer"
                title="Log in as Student Passenger"
              >
                <div className="text-base mb-0.5">🧍</div>
                <div className="truncate">Passenger</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('mithil@g.bracu.ac.bd', 'password123', 'student')}
                disabled={loading}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-center transition-all text-xs font-bold text-slate-200 hover:text-white cursor-pointer"
                title="Log in as Student Rider"
              >
                <div className="text-base mb-0.5">🏍️</div>
                <div className="truncate">Rider</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('admin@gmail.com', 'admin123', 'admin')}
                disabled={loading}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-center transition-all text-xs font-bold text-slate-200 hover:text-white cursor-pointer"
                title="Log in as Campus Admin"
              >
                <div className="text-base mb-0.5">🛡️</div>
                <div className="truncate">Admin</div>
              </button>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-slate-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/15 overflow-hidden p-6 sm:p-7">
            {/* Tabs */}
            <div className="flex p-1.5 bg-black/40 rounded-2xl gap-1 mb-6 border border-white/10">
              <button
                onClick={() => {
                  setTab('login');
                  setError('');
                  setSuccess('');
                }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  tab === 'login' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setTab('register');
                  setError('');
                  setSuccess('');
                }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  tab === 'register' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3.5 bg-rose-500/20 border border-rose-500/40 text-rose-200 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <span>✅</span>
                <span>{success}</span>
              </div>
            )}

            {/* Login Tab */}
            {tab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Role Switcher (Student vs Admin) */}
                <div className="flex gap-2 p-1 bg-black/30 rounded-xl border border-white/5">
                  {[
                    { val: 'student', label: '🎓 Student' },
                    { val: 'admin', label: '🛡️ Admin' },
                  ].map((r) => (
                    <button
                      key={r.val}
                      type="button"
                      onClick={() => setLoginRole(r.val)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        loginRole === r.val
                          ? 'bg-white/20 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder={loginRole === 'student' ? 'you@g.bracu.ac.bd' : 'admin@gmail.com'}
                    className="w-full px-4 py-3 bg-slate-800/90 border border-white/15 rounded-xl text-white placeholder-slate-500 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Password
                  </label>
                  <input
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-800/90 border border-white/15 rounded-xl text-white placeholder-slate-500 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Signing in...' : 'Sign In →'}
                </button>

                <p className="text-center text-slate-400 text-xs pt-2">
                  New to BRACU Rideshare?{' '}
                  <button
                    type="button"
                    onClick={() => setTab('register')}
                    className="text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer"
                  >
                    Register here
                  </button>
                </p>
              </form>
            )}

            {/* Register Tab */}
            {tab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div className="p-3 bg-indigo-500/15 border border-indigo-400/30 rounded-xl text-indigo-300 text-xs font-medium">
                  🔒 Requires your official <span className="font-bold text-white">@g.bracu.ac.bd</span> student email
                </div>

                <div>
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="Full Name (e.g. Tanvir Ahmed)"
                    className="w-full px-4 py-3 bg-slate-800/90 border border-white/15 rounded-xl text-white placeholder-slate-500 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <input
                    name="student_id"
                    type="text"
                    required
                    placeholder="Student ID (e.g. 21101234)"
                    className="w-full px-4 py-3 bg-slate-800/90 border border-white/15 rounded-xl text-white placeholder-slate-500 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="student.name@g.bracu.ac.bd"
                    className="w-full px-4 py-3 bg-slate-800/90 border border-white/15 rounded-xl text-white placeholder-slate-500 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <input
                    name="phone"
                    type="tel"
                    required
                    placeholder="Phone (01XXXXXXXXX)"
                    className="w-full px-4 py-3 bg-slate-800/90 border border-white/15 rounded-xl text-white placeholder-slate-500 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <input
                    name="password"
                    type="password"
                    required
                    placeholder="Create a Password"
                    className="w-full px-4 py-3 bg-slate-800/90 border border-white/15 rounded-xl text-white placeholder-slate-500 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Creating Account...' : 'Register as Student →'}
                </button>

                <p className="text-center text-slate-400 text-xs pt-1">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setTab('login')}
                    className="text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer"
                  >
                    Sign in
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
