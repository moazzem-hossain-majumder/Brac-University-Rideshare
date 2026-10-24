import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ProfileSetup from '../pages/ProfileSetup';
import { isSupabaseConfigured } from '../api/supabase';
import { useTheme } from '../context/ThemeContext';

export default function Layout({ children, navItems, activeTab, setActiveTab }) {
  const { user, sessionRole, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [showProfile, setShowProfile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (showProfile) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => setShowProfile(false)}
          className="flex items-center gap-2 text-indigo-300 hover:text-white mb-6 text-sm font-medium transition-colors">
          ← Back to Dashboard
        </button>
        <ProfileSetup onDone={() => setShowProfile(false)} />
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen flex transition-colors duration-200 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-slate-900 to-indigo-950 flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
          <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div>
            <div className="text-white font-bold text-sm">BRACU Rideshare</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {sessionRole && <span className={`text-xs font-medium ${sessionRole === 'Rider' ? 'text-indigo-400' : 'text-purple-400'}`}>{sessionRole}</span>}
              <span className="text-white/20 text-xs">•</span>
              {isSupabaseConfigured() ? (
                <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Supabase
                </span>
              ) : (
                <span className="text-[10px] font-medium text-amber-300 flex items-center gap-1" title="Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Local Mode
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button key={item.key} onClick={() => { setActiveTab(item.key); setMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.key
                  ? 'bg-white/15 text-white shadow-inner'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}>
              <span className="text-lg">{item.icon}</span>
              {item.label}
              {activeTab === item.key && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />}
            </button>
          ))}
        </nav>

        {/* Profile & Settings */}
        <div className="p-4 border-t border-white/10 space-y-2">
          {/* Theme Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-all border border-white/10"
          >
            <span className="flex items-center gap-2">
              <span>{isDark ? '🌙' : '☀️'}</span>
              <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-400/20">
              Toggle
            </span>
          </button>

          <button onClick={() => setShowProfile(true)}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors text-left mb-1">
            {user?.profilePicture
              ? <img src={user.profilePicture} className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-400" />
              : <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">{user?.name?.[0]}</div>
            }
            <div className="overflow-hidden">
              <div className="text-white text-sm font-medium truncate">{user?.name}</div>
              <div className="text-white/40 text-xs truncate">{user?.email}</div>
            </div>
          </button>
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors">
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className={`lg:hidden border-b px-4 py-3 flex items-center justify-between transition-colors ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-bold text-sm">BRACU Rideshare</span>
          </div>
          <button onClick={toggleTheme} className="p-1.5 rounded-lg text-sm">
            {isDark ? '🌙' : '☀️'}
          </button>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
