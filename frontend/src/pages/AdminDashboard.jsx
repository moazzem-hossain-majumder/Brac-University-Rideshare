import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../api/supabase';

const TABS = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'students', label: 'Students', icon: '👥' },
  { key: 'rides', label: 'Ride Requests', icon: '🗺️' },
  { key: 'active', label: 'Active Rides', icon: '🚗' },
  { key: 'feedback', label: 'Feedback', icon: '⭐' },
];

function StatCard({ icon, label, value, color }) {
  return (
    <div className={`rounded-2xl p-5 ${color}`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-3xl font-black text-gray-800">{value ?? '—'}</div>
      <div className="text-sm text-gray-500 font-medium mt-1">{label}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('overview');
  const [students, setStudents] = useState([]);
  const [rides, setRides] = useState([]);
  const [activeRides, setActiveRides] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [profileModal, setProfileModal] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/users').then(r => setStudents(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === 'rides') api.get('/ride-requests/open').then(r => setRides(r.data)).catch(() => {});
    if (tab === 'active') api.get('/active-rides/history').then(r => setActiveRides(r.data)).catch(() => {});
    if (tab === 'feedback') api.get('/feedback').then(r => setFeedback(r.data)).catch(() => {});
  }, [tab]);

  const approve = async (id) => {
    const { data } = await api.patch(`/users/${id}/approve`);
    setStudents(p => p.map(s => s._id === id ? data : s));
  };
  const remove = async (id) => {
    if (!confirm('Delete this student?')) return;
    await api.delete(`/users/${id}`);
    setStudents(p => p.filter(s => s._id !== id));
  };
  const toggleFeedback = async (id) => {
    const { data } = await api.patch(`/feedback/${id}/visibility`);
    setFeedback(p => p.map(f => f._id === id ? { ...f, status: data.status } : f));
  };

  const filtered = filter === 'all' ? students : students.filter(s => s.status === filter);
  const pending = students.filter(s => s.status === 'Pending').length;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-slate-900 to-indigo-950 flex flex-col shrink-0">
        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
          <div className="w-9 h-9 bg-red-500 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-white text-lg">🛡️</span>
          </div>
          <div>
            <div className="text-white font-bold text-sm">Admin Panel</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-red-400 text-xs">Super Admin</span>
              <span className="text-white/20 text-xs">•</span>
              {isSupabaseConfigured() ? (
                <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Supabase
                </span>
              ) : (
                <span className="text-[10px] font-medium text-amber-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Local Mode
                </span>
              )}
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                tab === t.key ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}>
              <span className="text-lg">{t.icon}</span>
              {t.label}
              {t.key === 'students' && pending > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pending}</span>
              )}
              {tab === t.key && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 p-3 mb-2">
            <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-sm">{user?.name?.[0]}</div>
            <div>
              <div className="text-white text-sm font-medium">{user?.name}</div>
              <div className="text-white/40 text-xs">Super Admin</div>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors">
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-8">
        {/* Profile Modal */}
        {profileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setProfileModal(null)}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
              <div className="text-center mb-5">
                {profileModal.profilePicture
                  ? <img src={profileModal.profilePicture} className="w-20 h-20 rounded-2xl object-cover mx-auto mb-3 ring-4 ring-indigo-100" />
                  : <div className="w-20 h-20 rounded-2xl bg-indigo-100 flex items-center justify-center text-3xl font-bold text-indigo-600 mx-auto mb-3">{profileModal.name?.[0]}</div>
                }
                <div className="font-bold text-xl text-gray-800">{profileModal.name}</div>
                <div className="text-gray-500 text-sm">{profileModal.email}</div>
              </div>
              <div className="space-y-2 text-sm">
                {[
                  ['Student ID', profileModal.studentId || '—'],
                  ['Phone', profileModal.phone || '—'],
                  ['Department', profileModal.department || '—'],
                  ['Location', profileModal.location || '—'],
                  ['Status', profileModal.status],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">{k}</span>
                    <span className={`font-medium ${v === 'Approved' ? 'text-green-600' : v === 'Pending' ? 'text-yellow-600' : 'text-gray-800'}`}>{v}</span>
                  </div>
                ))}
                {profileModal.bio && <div className="py-2 text-gray-600 italic">"{profileModal.bio}"</div>}
              </div>
              <button onClick={() => setProfileModal(null)} className="w-full mt-5 py-2.5 bg-gray-100 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200">Close</button>
            </div>
          </div>
        )}

        {/* Overview */}
        {tab === 'overview' && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-black text-gray-900">Dashboard Overview</h1>
              <p className="text-gray-500 mt-1">Welcome back, {user?.name}</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon="👥" label="Total Students" value={students.length} color="bg-blue-50" />
              <StatCard icon="⏳" label="Pending Approval" value={pending} color="bg-yellow-50" />
              <StatCard icon="✅" label="Approved" value={students.filter(s => s.status === 'Approved').length} color="bg-green-50" />
              <StatCard icon="⭐" label="Total Feedback" value={feedback.length} color="bg-purple-50" />
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-800 mb-4">Pending Approvals</h3>
              {students.filter(s => s.status === 'Pending').length === 0
                ? <p className="text-gray-400 text-sm">No pending approvals</p>
                : students.filter(s => s.status === 'Pending').map(s => (
                  <div key={s._id} className="flex items-center gap-3 py-3 border-b last:border-0">
                    <div className="w-9 h-9 rounded-xl bg-yellow-100 flex items-center justify-center font-bold text-yellow-600">{s.name?.[0]}</div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 text-sm">{s.name}</div>
                      <div className="text-xs text-gray-500">{s.email}</div>
                    </div>
                    <button onClick={() => approve(s._id)} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-700">Approve</button>
                    <button onClick={() => remove(s._id)} className="bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-200">Delete</button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Students */}
        {tab === 'students' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-black text-gray-900">Students</h1>
                <p className="text-gray-500 mt-1">{students.length} total</p>
              </div>
              <select value={filter} onChange={e => setFilter(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
                <option value="all">All Students</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
              </select>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Student', 'Email', 'Department', 'Phone', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(s => (
                    <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <button onClick={() => setProfileModal(s)} className="flex items-center gap-3 hover:opacity-80">
                          {s.profilePicture
                            ? <img src={s.profilePicture} className="w-9 h-9 rounded-xl object-cover" />
                            : <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-sm">{s.name?.[0]}</div>
                          }
                          <span className="font-medium text-gray-800 text-sm">{s.name}</span>
                        </button>
                      </td>
                      <td className="px-5 py-4 text-gray-500 text-sm">{s.email}</td>
                      <td className="px-5 py-4 text-gray-500 text-sm">{s.department || '—'}</td>
                      <td className="px-5 py-4 text-gray-500 text-sm">{s.phone || '—'}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{s.status}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          {s.status === 'Pending' && (
                            <button onClick={() => approve(s._id)} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-700">Approve</button>
                          )}
                          <button onClick={() => remove(s._id)} className="bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-200">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <div className="text-center py-10 text-gray-400">No students found</div>}
            </div>
          </div>
        )}

        {/* Ride Requests */}
        {tab === 'rides' && (
          <div>
            <div className="mb-6">
              <h1 className="text-3xl font-black text-gray-900">Ride Requests</h1>
              <p className="text-gray-500 mt-1">All open passenger requests</p>
            </div>
            {rides.length === 0
              ? <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 text-gray-400">No open requests</div>
              : <div className="space-y-3">
                {rides.map(r => (
                  <div key={r._id} className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {r.passenger?.profilePicture
                          ? <img src={r.passenger.profilePicture} className="w-10 h-10 rounded-xl object-cover" />
                          : <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center font-bold text-purple-600">{r.passenger?.name?.[0]}</div>
                        }
                        <div>
                          <div className="font-semibold text-gray-800">{r.passenger?.name}</div>
                          <div className="text-xs text-gray-500">{r.passenger?.department}</div>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{r.status}</span>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 space-y-1">
                      <div>📍 <span className="font-medium">{r.startLocation}</span> → <span className="font-medium">{r.endLocation}</span></div>
                      <div>🕐 {new Date(r.scheduledTime).toLocaleString()} · 👥 {r.seatsNeeded} seat(s)</div>
                    </div>
                  </div>
                ))}
              </div>
            }
          </div>
        )}

        {/* Active/Past Rides */}
        {tab === 'active' && (
          <div>
            <div className="mb-6">
              <h1 className="text-3xl font-black text-gray-900">Ride History</h1>
              <p className="text-gray-500 mt-1">All completed rides on the platform</p>
            </div>
            {activeRides.length === 0
              ? <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 text-gray-400">No rides yet</div>
              : <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Rider', 'Passenger', 'Route', 'Fare', 'Payment', 'Date'].map(h => (
                        <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activeRides.map(r => (
                      <tr key={r._id} className="hover:bg-gray-50">
                        <td className="px-5 py-4 font-medium text-gray-800">{r.rider?.name}</td>
                        <td className="px-5 py-4 text-gray-600">{r.passenger?.name}</td>
                        <td className="px-5 py-4 text-gray-500 text-xs">{r.request?.startLocation} → {r.request?.endLocation}</td>
                        <td className="px-5 py-4 font-bold text-indigo-600">৳{r.fare}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${r.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.paymentStatus}</span>
                        </td>
                        <td className="px-5 py-4 text-gray-400 text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            }
          </div>
        )}

        {/* Feedback */}
        {tab === 'feedback' && (
          <div>
            <div className="mb-6">
              <h1 className="text-3xl font-black text-gray-900">Feedback & Ratings</h1>
              <p className="text-gray-500 mt-1">All passenger ride reviews</p>
            </div>
            {feedback.length === 0
              ? <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 text-gray-400">No feedback yet</div>
              : <div className="space-y-3">
                {feedback.map(f => (
                  <div key={f._id} className={`bg-white rounded-2xl border p-5 transition-opacity ${f.status === 'Hidden' ? 'opacity-50 border-gray-100' : 'border-gray-200'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 mb-3">
                        {f.passenger?.profilePicture
                          ? <img src={f.passenger.profilePicture} className="w-10 h-10 rounded-xl object-cover" />
                          : <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">{f.passenger?.name?.[0]}</div>
                        }
                        <div>
                          <div className="font-semibold text-gray-800">{f.passenger?.name}</div>
                          <div className="flex gap-0.5 mt-0.5">
                            {[1,2,3,4,5].map(s => <span key={s} className={s <= f.rating ? 'text-yellow-400' : 'text-gray-200'}>★</span>)}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => toggleFeedback(f._id)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium ${f.status === 'Visible' ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}>
                        {f.status === 'Visible' ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {f.comment && <p className="text-gray-600 text-sm italic bg-gray-50 rounded-xl px-4 py-2.5">"{f.comment}"</p>}
                    <div className="text-xs text-gray-400 mt-2">{new Date(f.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            }
          </div>
        )}
      </main>
    </div>
  );
}
