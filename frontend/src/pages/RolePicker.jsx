import { useAuth } from '../context/AuthContext';

export default function RolePicker() {
  const { user, selectRole, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Hey, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-indigo-300">How are you travelling today?</p>
        </div>

        <div className="flex flex-col gap-4">
          <button onClick={() => selectRole('Rider')}
            className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-2xl p-6 text-left hover:from-indigo-500 hover:to-indigo-400 transition-all shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-1">
            <div className="text-4xl mb-3">🚗</div>
            <div className="font-bold text-xl mb-1">I'm a Rider</div>
            <div className="text-indigo-200 text-sm">Offer rides to fellow students and earn</div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-5xl font-black">→</div>
          </button>

          <button onClick={() => selectRole('Passenger')}
            className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-2xl p-6 text-left hover:from-purple-500 hover:to-purple-400 transition-all shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-1">
            <div className="text-4xl mb-3">🧍</div>
            <div className="font-bold text-xl mb-1">I'm a Passenger</div>
            <div className="text-purple-200 text-sm">Request a ride and choose your preferred offer</div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-5xl font-black">→</div>
          </button>
        </div>

        <p className="text-center text-white/30 text-xs mt-8">
          Switch roles anytime by{' '}
          <button onClick={logout} className="text-indigo-400 hover:text-white underline">logging out</button>
        </p>
      </div>
    </div>
  );
}
