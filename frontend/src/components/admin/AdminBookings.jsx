import { useEffect, useState } from 'react';
import api from '../../api/axios';

const statusColor = { Pending: 'bg-yellow-100 text-yellow-700', Confirmed: 'bg-green-100 text-green-700', Cancelled: 'bg-red-100 text-red-700' };

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/bookings').then(r => setBookings(r.data)).finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    const updated = await api.patch(`/bookings/${id}/status`, { status });
    setBookings(prev => prev.map(b => b._id === id ? { ...b, status: updated.data.status } : b));
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">All Bookings</h2>
      {bookings.length === 0 ? (
        <p className="text-gray-500">No bookings found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 pr-4">Passenger</th>
                <th className="pb-3 pr-4">Ride</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3 pr-4">Payment</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {bookings.map(b => (
                <tr key={b._id}>
                  <td className="py-3 pr-4 text-gray-800">{b.passenger?.name}</td>
                  <td className="py-3 pr-4 text-gray-500">{b.ride?.startLocation} → {b.ride?.endLocation}</td>
                  <td className="py-3 pr-4 text-gray-500">Tk {b.amount}</td>
                  <td className="py-3 pr-4 text-gray-500">{b.paymentMethod || '—'}</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[b.status]}`}>{b.status}</span>
                  </td>
                  <td className="py-3">
                    <select value={b.status} onChange={e => updateStatus(b._id, e.target.value)}
                      className="text-xs border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400">
                      <option>Pending</option>
                      <option>Confirmed</option>
                      <option>Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
