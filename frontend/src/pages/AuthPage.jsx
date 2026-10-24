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
    e.preventDefault(); setError(''); setLoading(true);
    const fd = new FormData(e.target);
    try {
      const { data } = await api.post('/auth/login', { email: fd.get('email'), password: fd.get('password'), userType: loginRole });
      login(data.user, data.token);
    } catch (err) { setError(err.response?.data?.message || 'Login failed'); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
    const fd = new FormData(e.target);
    try {
      const { data } = await api.post('/auth/register', { name: fd.get('name'), email: fd.get('email'), phone: fd.get('phone'), password: fd.get('password'), studentId: fd.get('student_id') });
      setSuccess(data.message); setTab('login');
    } catch (err) { setError(err.response?.data?.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 text-white">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <span className="text-xl font-bold">BRACU Rideshare</span>
        </div>
        <h1 className="text-5xl font-bold leading-tight mb-6">
          Smarter rides<br />for BRAC students
        </h1>
        <p className="text-indigo-300 text-lg mb-10">Connect with fellow students for safe, affordable campus rides. Request or offer rides in real time.</p>
        <div className="flex flex-col gap-4">
          {[
            { icon: '⚡', title: 'Real-time offers', desc: 'Get fare offers from available riders instantly' },
            { icon: '💬', title: 'In-ride chat', desc: 'Communicate directly with your rider or passenger' },
            { icon: '🔒', title: 'BRACU only', desc: 'Exclusive to @g.bracu.ac.bd emails for safety' },
          ].map(f => (
            <div key={f.title} className="flex items-start gap-4">
              <div className="text-2xl mt-0.5">{f.icon}</div>
              <div>
                <div className="font-semibold text-white">{f.title}</div>
                <div className="text-indigo-300 text-sm">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            {/* Logo mobile */}
            <div className="lg:hidden flex items-center justify-center gap-2 pt-8 pb-2">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <span className="text-white font-bold text-lg">BRACU Rideshare</span>
            </div>

            {/* Tabs */}
            <div className="flex p-2 mx-6 mt-6 bg-white/10 rounded-2xl gap-1">
              {['login', 'register'].map(t => (
                <button key={t} onClick={() => { setTab(t); setError(''); setSuccess(''); }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-white text-indigo-700 shadow-md' : 'text-white/70 hover:text-white'}`}>
                  {t}
                </button>
              ))}
            </div>

            <div className="p-6 pt-5">
              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 text-red-200 rounded-xl text-sm flex items-center gap-2">
                  <span>⚠️</span> {error}
                </div>
              )}
              {success && (
                <div className="mb-4 p-3 bg-green-500/20 border border-green-400/30 text-green-200 rounded-xl text-sm flex items-center gap-2">
                  <span>✅</span> {success}
                </div>
              )}

              {tab === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="flex gap-2 p-1 bg-white/10 rounded-xl">
                    {[{ val: 'student', label: '🎓 Student' }, { val: 'admin', label: '🛡️ Admin' }].map(r => (
                      <button key={r.val} type="button" onClick={() => setLoginRole(r.val)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${loginRole === r.val ? 'bg-white text-indigo-700 shadow' : 'text-white/70 hover:text-white'}`}>
                        {r.label}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wide">Email</label>
                    <input name="email" type="email" required
                      placeholder={loginRole === 'student' ? 'you@g.bracu.ac.bd' : 'admin@gmail.com'}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wide">Password</label>
                    <input name="password" type="password" required placeholder="••••••••"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent" />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold text-sm hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50">
                    {loading ? 'Signing in...' : 'Sign In →'}
                  </button>
                  <p className="text-center text-white/50 text-xs">
                    No account? <button type="button" onClick={() => setTab('register')} className="text-indigo-300 hover:text-white font-medium">Register here</button>
                  </p>
                </form>
              )}

              {tab === 'register' && (
                <form onSubmit={handleRegister} className="space-y-3">
                  <div className="p-3 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-200 text-xs">
                    🔒 Only <span className="font-semibold text-white">@g.bracu.ac.bd</span> emails accepted
                  </div>
                  {[
                    { name: 'name', placeholder: 'Full Name', type: 'text' },
                    { name: 'student_id', placeholder: 'Student ID (8 digits)', type: 'text' },
                    { name: 'email', placeholder: 'you@g.bracu.ac.bd', type: 'email' },
                    { name: 'password', placeholder: 'Password', type: 'password' },
                    { name: 'phone', placeholder: 'Phone Number', type: 'text' },
                  ].map(f => (
                    <input key={f.name} name={f.name} type={f.type} placeholder={f.placeholder}
                      required={f.name !== 'student_id'}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent" />
                  ))}
                  <button type="submit" disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold text-sm hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50">
                    {loading ? 'Registering...' : 'Create Account →'}
                  </button>
                  <p className="text-center text-white/50 text-xs">
                    Have an account? <button type="button" onClick={() => setTab('login')} className="text-indigo-300 hover:text-white font-medium">Sign in</button>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
