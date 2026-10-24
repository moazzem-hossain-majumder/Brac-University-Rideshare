import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function FeedbackForm() {
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState({ ride: '', rating: 5, comment: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/bookings/mine').then(r => setBookings(r.data.filter(b => b.status === 'Confirmed')));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/feedback', form);
      setMsg('Feedback submitted!');
      setForm({ ride: '', rating: 5, comment: '' });
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Leave Feedback</h2>
      {msg && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">{msg}</div>}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Select Ride</label>
          <select value={form.ride} onChange={e => setForm({...form, ride: e.target.value})}
            required className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">-- select a completed ride --</option>
            {bookings.map(b => (
              <option key={b._id} value={b.ride?._id}>
                {b.ride?.startLocation} → {b.ride?.endLocation}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Rating: {form.rating}/5</label>
          <input type="range" min={1} max={5} value={form.rating} onChange={e => setForm({...form, rating: +e.target.value})}
            className="w-full accent-indigo-600" />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            {[1,2,3,4,5].map(n => <span key={n}>{'⭐'.repeat(n)}</span>)}
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Comment</label>
          <textarea value={form.comment} onChange={e => setForm({...form, comment: e.target.value})}
            rows={3} placeholder="Share your experience..."
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-indigo-700">Submit</button>
      </form>
    </div>
  );
}
