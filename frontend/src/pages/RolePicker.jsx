import { useAuth } from '../context/AuthContext';

export default function RolePicker() {
  const { user, selectRole, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 text-white relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 -left-32 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <img
            src="/bracu_logo.png"
            alt="BRAC University Rideshare"
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-400/40 shadow-xl mx-auto mb-4"
          />
          <h1 className="text-3xl font-extrabold font-heading text-white mb-2">
            Hey, {user?.name?.split(' ')[0] || 'Student'}! 👋
          </h1>
          <p className="text-indigo-200 text-sm">
            How are you commuting on campus today?
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => selectRole('Rider')}
            className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-3xl p-6 text-left transition-all shadow-xl shadow-indigo-600/25 hover:shadow-indigo-500/40 hover:-translate-y-1 border border-indigo-400/30 cursor-pointer"
          >
            <div className="text-4xl mb-3">🏍️ 🚗</div>
            <div className="font-extrabold text-xl mb-1 font-heading">I'm a Student Rider</div>
            <div className="text-indigo-200 text-xs leading-relaxed">
              Have a bike or car? Offer seats to fellow students and earn fair fares.
            </div>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-white/40 text-4xl font-black transition-colors">
              →
            </div>
          </button>

          <button
            onClick={() => selectRole('Passenger')}
            className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-3xl p-6 text-left transition-all shadow-xl shadow-purple-600/25 hover:shadow-purple-500/40 hover:-translate-y-1 border border-purple-400/30 cursor-pointer"
          >
            <div className="text-4xl mb-3">🧍</div>
            <div className="font-extrabold text-xl mb-1 font-heading">I'm a Passenger</div>
            <div className="text-purple-200 text-xs leading-relaxed">
              Need a ride to or from campus? Pin your route on map and pick the best offer.
            </div>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-white/40 text-4xl font-black transition-colors">
              →
            </div>
          </button>
        </div>

        <p className="text-center text-slate-400 text-xs mt-7">
          You can also switch anytime with 1-click in the sidebar •{' '}
          <button onClick={logout} className="text-indigo-400 hover:text-white underline cursor-pointer">
            Sign out
          </button>
        </p>
      </div>
    </div>
  );
}
