import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const statusColor = {
  Pending: 'bg-yellow-100 text-yellow-700',
  Confirmed: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
  Available: 'bg-blue-100 text-blue-700',
  Completed: 'bg-gray-100 text-gray-700',
};

export default function MyRides() {
  const { sessionRole } = useAuth();
  const isRider = sessionRole === 'Rider';
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ startLocation: '', endLocation: '', rideDateTime: '', fare: '', seats: 3 });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const endpoint = isRider ? '/rides/mine' : '/bookings/mine';
    api.get(endpoint).then(r => setData(r.data)).finally(() => setLoading(false));
  }, [isRider]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/rides', form);
      setMsg('Ride created!');
      setShowForm(false);
      api.get('/rides/mine').then(r => setData(r.data));
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed');
    }
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">{isRider ? 'My Rides' : 'My Bookings'}</h2>
        {isRider && (
          <button onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
            + Create Ride
          </button>
        )}
      </div>

      {msg && <div className="mb-3 p-3 bg-green-50 text-green-700 rounded-lg text-sm">{msg}</div>}

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 p-4 border rounded-xl space-y-3 bg-gray-50">
          <input value={form.startLocation} onChange={e => setForm({ ...form, startLocation: e.target.value })}
            placeholder="Start Location" required className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <input value={form.endLocation} onChange={e => setForm({ ...form, endLocation: e.target.value })}
            placeholder="End Location" required className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <input type="datetime-local" value={form.rideDateTime} onChange={e => setForm({ ...form, rideDateTime: e.target.value })}
            required className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <input type="number" value={form.fare} onChange={e => setForm({ ...form, fare: e.target.value })}
            placeholder="Fare (Tk)" required className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <input type="number" value={form.seats} onChange={e => setForm({ ...form, seats: e.target.value })}
            placeholder="Seats available" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">Submit</button>
        </form>
      )}

      {data.length === 0 ? (
        <p className="text-gray-500">{isRider ? 'No rides created yet.' : 'No bookings yet.'}</p>
      ) : (
        <div className="space-y-3">
          {data.map(item => {
            const ride = isRider ? item : item.ride;
            return (
              <div key={item._id} className="border rounded-xl p-4">
                <div className="flex justify-between">
                  <div className="font-medium text-gray-800">{ride?.startLocation} → {ride?.endLocation}</div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[item.status]}`}>{item.status}</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {new Date(ride?.rideDateTime).toLocaleString()} · Tk {ride?.fare}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
