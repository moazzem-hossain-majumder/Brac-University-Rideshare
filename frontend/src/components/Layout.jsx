import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ProfileSetup from '../pages/ProfileSetup';
import { isSupabaseConfigured } from '../api/supabase';
import { useTheme } from '../context/ThemeContext';

export default function Layout({ children, navItems, activeTab, setActiveTab }) {
  const { user, sessionRole, selectRole, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [showProfile, setShowProfile] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden font-sans select-none transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* ── Top Uber-Style Navigation Header ───────────────────────── */}
      <header className={`h-16 shrink-0 z-40 px-4 sm:px-6 flex items-center justify-between border-b backdrop-blur-xl transition-colors ${
        isDark ? 'bg-slate-950/90 border-white/10' : 'bg-white/95 border-slate-200/80 shadow-xs'
      }`}>
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <img
            src="/bracu_logo.png"
            alt="BRAC University Rideshare"
            className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/30 shadow-md shadow-indigo-500/15"
          />
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="font-heading font-black text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                BRACU
              </span>
              <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                Rideshare
              </span>
            </div>
          </div>
        </div>

        {/* Center: Uber-Style Segmented Ride vs Drive Pill Switcher */}
        {user?.userType === 'student' && (
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
            <button
              onClick={() => {
                selectRole('Passenger');
                if (setActiveTab) setActiveTab('main');
              }}
              className={`flex items-center gap-1.5 px-3.5 sm:px-5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                sessionRole === 'Passenger'
                  ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🧍</span>
              <span>Ride</span>
            </button>
            <button
              onClick={() => {
                selectRole('Rider');
                if (setActiveTab) setActiveTab('main');
              }}
              className={`flex items-center gap-1.5 px-3.5 sm:px-5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                sessionRole === 'Rider'
                  ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🏍️</span>
              <span>Drive</span>
            </button>
          </div>
        )}

        {/* Right: Actions, Safety SOS, Theme & User Profile Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Campus Safety SOS */}
          <button
            onClick={() => setShowSosModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all cursor-pointer"
            title="Campus Emergency SOS & Security Hotline"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span className="hidden md:inline">Campus</span> SOS
          </button>

          {/* Theme Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition-all cursor-pointer text-sm"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* User Profile Avatar & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 sm:pr-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all cursor-pointer"
            >
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt=""
                  className="w-8 h-8 rounded-xl object-cover ring-2 ring-indigo-500/40"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
                  {user?.name?.[0] || 'U'}
                </div>
              )}
              <span className="hidden lg:block text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
                {user?.name?.split(' ')[0]}
              </span>
              <span className="text-[10px] text-slate-400">▾</span>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div
                className="absolute right-0 mt-2 w-64 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setShowUserMenu(false)}
              >
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="font-bold text-sm text-slate-900 dark:text-white truncate">{user?.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</div>
                  <div className="mt-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                    ID: {user?.studentId || 'Verified Student'} · {user?.department || 'BRACU'}
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => setShowProfile(true)}
                    className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                  >
                    <span>👤</span>
                    <span>Student Profile & Vehicle</span>
                  </button>

                  {navItems?.map(
                    (it) =>
                      it.key !== 'main' && (
                        <button
                          key={it.key}
                          onClick={() => setActiveTab && setActiveTab(it.key)}
                          className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                        >
                          <span>{it.icon}</span>
                          <span>{it.label}</span>
                        </button>
                      )
                  )}

                  <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors"
                  >
                    <span>🚪</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Viewport Canvas (Full Bleed) ───────────────────────── */}
      <main className="flex-1 relative w-full h-[calc(100vh-4rem)] overflow-hidden">
        {children}
      </main>

      {/* ── Profile Setup Drawer Modal ───────────────────────────────── */}
      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative">
            <button
              onClick={() => setShowProfile(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              ✕
            </button>
            <ProfileSetup onDone={() => setShowProfile(false)} />
          </div>
        </div>
      )}

      {/* ── Safety SOS Hotline Modal ─────────────────────────────────── */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-rose-600 to-red-600 p-6 text-white text-center">
              <div className="text-4xl mb-2">🛡️</div>
              <h3 className="text-xl font-black font-heading">BRACU Campus Safety Hotline</h3>
              <p className="text-xs text-rose-100 mt-1">24/7 Rapid Emergency Response & Proctor Office</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-2">
                <div className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase">Emergency Hotlines</div>
                <div className="flex items-center justify-between text-sm font-black text-slate-900 dark:text-white">
                  <span>BRACU Security Control Room:</span>
                  <a href="tel:+8809638464646" className="text-rose-600 underline font-mono">
                    +880 9638 464646
                  </a>
                </div>
                <div className="flex items-center justify-between text-sm font-black text-slate-900 dark:text-white">
                  <span>Merul Badda Campus Police Post:</span>
                  <a href="tel:999" className="text-rose-600 underline font-mono">
                    999
                  </a>
                </div>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Your live GPS coordinates and campus rider details are logged on every trip for student safety. In an emergency, our campus security will instantly dispatch personnel to your location.
              </div>

              <button
                onClick={() => setShowSosModal(false)}
                className="w-full py-3.5 rounded-xl font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-all text-sm"
              >
                Close Emergency Information
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
