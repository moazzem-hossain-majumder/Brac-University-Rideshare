import { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function ProfileSetup({ onDone }) {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    location: user?.location || '',
    department: user?.department || '',
    bio: user?.bio || '',
  });
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
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (picture) fd.append('profilePicture', picture);
      const { data } = await api.put('/profile/me', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser({ ...data, profileComplete: true });
      if (onDone) onDone();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const isFirstTime = !user?.profileComplete;

  return (
    <div
      className={
        isFirstTime
          ? 'min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 text-white'
          : 'max-w-lg mx-auto py-4'
      }
    >
      <div className="w-full max-w-md">
        {isFirstTime && (
          <div className="text-center mb-8">
            <img
              src="/bracu_logo.png"
              alt="BRACU"
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-400/40 shadow-xl mx-auto mb-4"
            />
            <h1 className="text-3xl font-extrabold font-heading text-white mb-2">Set up your profile</h1>
            <p className="text-indigo-200 text-sm">Let fellow students know who you are before your first ride</p>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7">
          {error && (
            <div className="mb-4 p-3.5 bg-rose-500/20 border border-rose-500/40 text-rose-200 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-2 mb-3">
              <label className="cursor-pointer group">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed border-indigo-400/60 dark:border-indigo-400/40 flex items-center justify-center relative bg-slate-50 dark:bg-slate-800">
                  {preview ? (
                    <img src={preview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <div className="text-3xl">📷</div>
                      <div className="text-xs text-slate-400 mt-1">Upload Photo</div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold rounded-2xl">
                    Change
                  </div>
                </div>
                <input type="file" accept="image/*" onChange={handlePicture} className="hidden" />
              </label>
            </div>

            {[
              { key: 'name', label: 'Full Name', placeholder: 'Your full name', required: true },
              { key: 'phone', label: 'Phone Number', placeholder: '+880...', required: true },
              { key: 'location', label: 'Your Area', placeholder: 'e.g. Mirpur, Uttara...', required: true },
              { key: 'department', label: 'Department', placeholder: 'e.g. CSE, EEE, BBA...' },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {f.label}
                </label>
                <input
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  required={f.required}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
                />
              </div>
            ))}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Short Bio
              </label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={2}
                placeholder="Tell riders or passengers about yourself..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none placeholder:text-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Saving...' : isFirstTime ? 'Save & Continue →' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
