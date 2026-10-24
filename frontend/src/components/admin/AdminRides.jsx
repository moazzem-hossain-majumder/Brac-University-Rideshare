import { useEffect, useState } from 'react';
import api from '../../api/axios';

const statusColor = { Available: 'bg-blue-100 text-blue-700', Booked: 'bg-yellow-100 text-yellow-700', Completed: 'bg-green-100 text-green-700' };

export default function AdminRides() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/rides/all').then(r => setRides(r.data)).finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    const updated = await api.patch(`/rides/${id}/status`, { status });
    setRides(prev => prev.map(r => r._id === id ? { ...r, status: updated.data.status } : r));
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">All Rides</h2>
      {rides.length === 0 ? (
        <p className="text-gray-500">No rides found.</p>
      ) : (
        <div className="space-y-3">
          {rides.map(ride => (
            <div key={ride._id} className="border rounded-xl p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-gray-800">{ride.startLocation} → {ride.endLocation}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {new Date(ride.rideDateTime).toLocaleString()} · Tk {ride.fare} · Rider: {ride.rider?.name}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[ride.status]}`}>{ride.status}</span>
                  <select value={ride.status} onChange={e => updateStatus(ride._id, e.target.value)}
                    className="text-xs border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    <option>Available</option>
                    <option>Booked</option>
                    <option>Completed</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
