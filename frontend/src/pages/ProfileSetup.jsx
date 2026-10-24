import { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function ProfileSetup({ onDone }) {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', location: user?.location || '', department: user?.department || '', bio: user?.bio || '' });
  const [picture, setPicture] = useState(null);
  const [preview, setPreview] = useState(user?.profilePicture || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePicture = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPicture(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (picture) fd.append('profilePicture', picture);
      const { data } = await api.put('/profile/me', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser({ ...data, profileComplete: true });
      if (onDone) onDone();
    } catch (err) { setError(err.response?.data?.message || 'Failed to save profile'); }
    finally { setLoading(false); }
  };

  const isFirstTime = !user?.profileComplete;

  return (
    <div className={isFirstTime ? 'min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4' : ''}>
      <div className="w-full max-w-md">
        {isFirstTime && (
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">👤</div>
            <h1 className="text-3xl font-bold text-white mb-2">Set up your profile</h1>
            <p className="text-indigo-300 text-sm">Let others know who you are before your first ride</p>
          </div>
        )}

        <div className={isFirstTime ? 'bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6' : 'bg-white rounded-2xl border border-gray-200 p-6'}>
          {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 text-red-200 rounded-xl text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3 mb-2">
              <label className="cursor-pointer group">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed border-indigo-400 flex items-center justify-center relative">
                  {preview
                    ? <img src={preview} alt="preview" className="w-full h-full object-cover" />
                    : <div className="text-center"><div className="text-3xl">📷</div><div className={`text-xs mt-1 ${isFirstTime ? 'text-white/60' : 'text-gray-400'}`}>Upload</div></div>
                  }
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs rounded-2xl">Change</div>
                </div>
                <input type="file" accept="image/*" onChange={handlePicture} className="hidden" />
              </label>
            </div>

            {[
              { key: 'name', label: 'Full Name', placeholder: 'Your full name', required: true },
              { key: 'phone', label: 'Phone Number', placeholder: '+880...', required: true },
              { key: 'location', label: 'Your Area', placeholder: 'e.g. Mirpur, Uttara...', required: true },
              { key: 'department', label: 'Department', placeholder: 'e.g. CSE, EEE, BBA...' },
            ].map(f => (
              <div key={f.key}>
                <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${isFirstTime ? 'text-white/60' : 'text-gray-500'}`}>{f.label}</label>
                <input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder} required={f.required}
                  className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${isFirstTime ? 'bg-white/10 border border-white/20 text-white placeholder-white/40' : 'border border-gray-200 text-gray-800'}`} />
              </div>
            ))}

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${isFirstTime ? 'text-white/60' : 'text-gray-500'}`}>Short Bio</label>
              <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })}
                rows={2} placeholder="Tell riders/passengers about yourself..."
                className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none ${isFirstTime ? 'bg-white/10 border border-white/20 text-white placeholder-white/40' : 'border border-gray-200 text-gray-800'}`} />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50">
              {loading ? 'Saving...' : isFirstTime ? 'Save & Continue →' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
