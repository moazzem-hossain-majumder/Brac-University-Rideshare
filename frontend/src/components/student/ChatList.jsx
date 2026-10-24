import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import ChatBox from './ChatBox';

export default function ChatList() {
  const { sessionRole } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [riderRides, setRiderRides] = useState([]);
  const [selected, setSelected] = useState(null); // { bookingId, name }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionRole === 'Passenger') {
      api.get('/bookings/mine')
        .then(r => setBookings(r.data.filter(b => b.status === 'Confirmed')))
        .finally(() => setLoading(false));
    } else {
      // Rider sees all confirmed bookings on their rides
      api.get('/bookings').then(r => {
        setBookings(r.data.filter(b => b.status === 'Confirmed'));
      }).catch(() => {
        // fallback: rider may not have admin access, get via rides/mine bookings
        setBookings([]);
      }).finally(() => setLoading(false));
    }
  }, [sessionRole]);

  if (selected) {
    return <ChatBox bookingId={selected.bookingId} otherName={selected.name} onBack={() => setSelected(null)} />;
  }

  if (loading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Chats</h2>
      {bookings.length === 0 ? (
        <p className="text-gray-500">No confirmed bookings to chat on yet.</p>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => {
            const ride = b.ride;
            const otherName = sessionRole === 'Passenger' ? ride?.rider?.name : b.passenger?.name;
            return (
              <button key={b._id} onClick={() => setSelected({ bookingId: b._id, name: otherName })}
                className="w-full text-left border rounded-xl p-4 hover:bg-indigo-50 transition-colors">
                <div className="font-medium text-gray-800">{ride?.startLocation} → {ride?.endLocation}</div>
                <div className="text-sm text-gray-500 mt-1">Chat with: {otherName || 'Other party'}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
