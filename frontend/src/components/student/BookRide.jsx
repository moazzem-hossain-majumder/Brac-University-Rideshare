import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function BookRide() {
  const { sessionRole } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingRide, setBookingRide] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/rides').then(r => setRides(r.data)).finally(() => setLoading(false));
  }, []);

  const handleBook = async (rideId) => {
    try {
      await api.post('/bookings', { rideId, paymentMethod });
      setMsg('Ride booked successfully!');
      setBookingRide(null);
      setRides(prev => prev.filter(r => r._id !== rideId));
    } catch (err) {
      setMsg(err.response?.data?.message || 'Booking failed');
    }
  };

  if (loading) return <div className="text-gray-500">Loading available rides...</div>;

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Available Rides</h2>
      {msg && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">{msg}</div>}
      {rides.length === 0 ? (
        <p className="text-gray-500">No rides available right now.</p>
      ) : (
        <div className="space-y-3">
          {rides.map(ride => (
            <div key={ride._id} className="border rounded-xl p-4 flex justify-between items-start">
              <div>
                <div className="font-medium text-gray-800">{ride.startLocation} → {ride.endLocation}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {new Date(ride.rideDateTime).toLocaleString()} · Tk {ride.fare} · Rider: {ride.rider?.name}
                </div>
              </div>
              <button onClick={() => setBookingRide(ride._id)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors">
                Book
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Booking modal */}
      {bookingRide && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 shadow-xl">
            <h3 className="font-semibold text-gray-800 mb-4">Confirm Booking</h3>
            <label className="block text-sm text-gray-700 mb-2">Payment Method</label>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-400">
              {['Cash', 'Card', 'Bkash', 'Nagad'].map(m => <option key={m}>{m}</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={() => handleBook(bookingRide)}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm hover:bg-indigo-700">Confirm</button>
              <button onClick={() => setBookingRide(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-200">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
