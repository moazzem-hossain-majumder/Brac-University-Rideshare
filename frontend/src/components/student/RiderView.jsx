import { useEffect, useState } from 'react';
import api from '../../api/axios';
import socket from '../../api/socket';
import { useAuth } from '../../context/AuthContext';
import ChatBox from './ChatBox';
import LiveRideMap from '../common/LiveRideMap';

export default function RiderView() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [offerForms, setOfferForms] = useState({});
  const [sentOffers, setSentOffers] = useState({});
  const [showChat, setShowChat] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    socket.connect();
    socket.emit('join_user', user.id);
    socket.on('ride_confirmed', async () => {
      const { data } = await api.get('/active-rides/mine');
      if (data) {
        setActiveRide(data);
        socket.emit('join_ride', data._id);
      }
    });
    socket.on('location_update', (loc) => {
      setActiveRide((prev) => (prev ? { ...prev, riderLocation: loc } : prev));
    });
    loadData();
    return () => {
      socket.off('ride_confirmed');
      socket.off('location_update');
      socket.disconnect();
    };
  }, []);

  const loadData = async () => {
    try {
      const { data } = await api.get('/active-rides/mine');
      if (data) {
        setActiveRide(data);
        socket.emit('join_ride', data._id);
        setLoading(false);
        return;
      }
    } catch {}
    try {
      const { data } = await api.get('/ride-requests/open');
      setRequests(data);
    } catch {}
    setLoading(false);
  };

  const handleLocationUpdate = async (loc) => {
    if (!activeRide) return;
    setActiveRide((prev) => (prev ? { ...prev, riderLocation: loc } : prev));
    socket.emit('send_location', { rideId: activeRide._id, ...loc });
    try {
      await api.patch(`/active-rides/${activeRide._id}/location`, loc);
    } catch (_) {}
  };

  const sendOffer = async (requestId) => {
    const f = offerForms[requestId] || {};
    if (!f.fare) return;
    try {
      const { data } = await api.post('/ride-offers', { requestId, fare: +f.fare, note: f.note || '' });
      socket.emit('new_offer', { ...data, passengerId: requests.find(r => r._id === requestId)?.passenger?._id });
      setSentOffers(prev => ({ ...prev, [requestId]: true }));
    } catch (err) { setError(err.response?.data?.message || 'Failed'); }
  };

  const markArrived = async () => {
    await api.patch(`/active-rides/${activeRide._id}/arrived`);
    socket.emit('rider_arrived', { passengerId: activeRide.passenger._id, rideId: activeRide._id });
    setActiveRide(prev => ({ ...prev, status: 'Arrived' }));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex gap-2">
        {[0,1,2].map(i => <div key={i} className="w-3 h-3 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
      </div>
    </div>
  );

  // ── Active Ride ──
  if (activeRide) return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Current Ride</h2>
        <p className="text-gray-500 text-sm mt-1">
          {activeRide.status === 'Arrived' ? 'Waiting for payment...' : 'You are on the way'}
        </p>
      </div>

      {/* Live Navigation & Map */}
      <div className="mb-4">
        <LiveRideMap
          riderLocation={activeRide.riderLocation}
          pickupLocation={activeRide.pickupLocation}
          dropoffLocation={activeRide.dropoffLocation}
          isRider={true}
          riderName={user?.name || 'You'}
          etaMinutes={activeRide.etaMinutes || 5}
          onLocationUpdate={handleLocationUpdate}
        />
      </div>

      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-6 text-white mb-4 shadow-xl shadow-purple-500/20">
        <div className="flex items-center gap-4 mb-5">
          {activeRide.passenger?.profilePicture
            ? <img src={activeRide.passenger.profilePicture} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/30" />
            : <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">{activeRide.passenger?.name?.[0]}</div>
          }
          <div>
            <div className="font-bold text-xl">{activeRide.passenger?.name}</div>
            <div className="text-purple-200 text-sm">{activeRide.passenger?.phone}</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-white/70 text-xs">Your Fare</div>
            <div className="text-2xl font-black">৳{activeRide.fare}</div>
          </div>
        </div>
        <div className="bg-white/15 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <span className="text-white/70">From</span>
            <span className="font-medium ml-auto">{activeRide.request?.startLocation}</span>
          </div>
          <div className="border-l-2 border-white/20 h-3 ml-1"></div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-2 h-2 rounded-full bg-red-400"></div>
            <span className="text-white/70">To</span>
            <span className="font-medium ml-auto">{activeRide.request?.endLocation}</span>
          </div>
        </div>
      </div>

      {activeRide.status === 'Ongoing' && (
        <button onClick={markArrived}
          className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg shadow-green-500/25 mb-4">
          ✅ Mark as Arrived at Destination
        </button>
      )}

      {activeRide.status === 'Arrived' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <span className="text-2xl">💰</span>
          <div>
            <div className="font-semibold text-amber-800">Waiting for payment</div>
            <div className="text-amber-600 text-sm">Passenger is completing the payment</div>
          </div>
        </div>
      )}

      {activeRide.paymentStatus === 'Paid' && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <div className="font-semibold text-green-800">Payment received!</div>
            <div className="text-green-600 text-sm">৳{activeRide.fare} · Ride complete</div>
          </div>
        </div>
      )}

      <button onClick={() => setShowChat(!showChat)}
        className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 rounded-2xl text-sm font-medium text-gray-700 transition-colors">
        💬 {showChat ? 'Hide Chat' : 'Chat with Passenger'}
      </button>
      {showChat && <div className="mt-3"><ChatBox rideId={activeRide._id} otherName={activeRide.passenger?.name} /></div>}
    </div>
  );

  // ── Open Requests ──
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Open Ride Requests</h2>
        <p className="text-gray-500 text-sm mt-1">Send your fare offer to interested passengers</p>
      </div>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">{error}</div>}

      {requests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="text-6xl mb-4">🔍</div>
          <div className="text-gray-700 font-semibold text-lg">No requests right now</div>
          <div className="text-gray-400 text-sm mt-1">New passenger requests will appear here automatically</div>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <div key={req._id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                {req.passenger?.profilePicture
                  ? <img src={req.passenger.profilePicture} className="w-11 h-11 rounded-xl object-cover" />
                  : <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center font-bold text-purple-600">{req.passenger?.name?.[0]}</div>
                }
                <div>
                  <div className="font-semibold text-gray-800">{req.passenger?.name}</div>
                  <div className="text-xs text-gray-500">{req.passenger?.department} · {req.passenger?.location}</div>
                </div>
                <div className="ml-auto text-xs text-gray-400">{new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-green-500 font-bold">●</span>
                  <span className="text-gray-500">From</span>
                  <span className="font-medium text-gray-800 ml-auto">{req.startLocation}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-red-500 font-bold">●</span>
                  <span className="text-gray-500">To</span>
                  <span className="font-medium text-gray-800 ml-auto">{req.endLocation}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🕐</span>
                  <span className="text-gray-500">When</span>
                  <span className="text-gray-700 ml-auto">{new Date(req.scheduledTime).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>👥</span>
                  <span className="text-gray-500">Seats</span>
                  <span className="text-gray-700 ml-auto">{req.seatsNeeded}</span>
                </div>
              </div>

              {sentOffers[req._id] ? (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium bg-green-50 rounded-xl px-4 py-3">
                  <span>✓</span> Offer sent — waiting for response
                </div>
              ) : (
                <div className="flex gap-2">
                  <input type="number" placeholder="Fare ৳"
                    value={offerForms[req._id]?.fare || ''}
                    onChange={e => setOfferForms(p => ({ ...p, [req._id]: { ...p[req._id], fare: e.target.value } }))}
                    className="w-28 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 font-semibold" />
                  <input placeholder="Add a note (optional)"
                    value={offerForms[req._id]?.note || ''}
                    onChange={e => setOfferForms(p => ({ ...p, [req._id]: { ...p[req._id], note: e.target.value } }))}
                    className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  <button onClick={() => sendOffer(req._id)}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md shadow-indigo-500/20">
                    Offer
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
