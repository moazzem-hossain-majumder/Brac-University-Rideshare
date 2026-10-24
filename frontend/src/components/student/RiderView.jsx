import { useEffect, useState } from 'react';
import api from '../../api/axios';
import socket from '../../api/socket';
import { useAuth } from '../../context/AuthContext';
import ChatBox from './ChatBox';
import LiveRideMap from '../common/LiveRideMap';
import {
  VEHICLE_TYPES,
  calculateDistanceKm,
  estimateFare,
  findLocationCoords,
} from '../../constants/locations';

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
    socket.emit('join_user', user.id || user._id);

    socket.on('ride_confirmed', async () => {
      const { data } = await api.get('/active-rides/mine');
      if (data) {
        setActiveRide(data);
        socket.emit('join_ride', data._id || data.id);
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
        socket.emit('join_ride', data._id || data.id);
        setLoading(false);
        return;
      }
    } catch {}

    try {
      const { data } = await api.get('/ride-requests/open');
      setRequests(data || []);
    } catch {}
    setLoading(false);
  };

  const handleLocationUpdate = async (loc) => {
    if (!activeRide) return;
    const rideId = activeRide._id || activeRide.id;
    setActiveRide((prev) => (prev ? { ...prev, riderLocation: loc } : prev));
    socket.emit('send_location', { rideId, ...loc });
    try {
      await api.patch(`/active-rides/${rideId}/location`, loc);
    } catch (_) {}
  };

  const sendOffer = async (req) => {
    const reqKey = req._id || req.id;
    const f = offerForms[reqKey] || {};
    if (!f.fare) return;

    try {
      const { data } = await api.post('/ride-offers', {
        requestId: reqKey,
        fare: +f.fare,
        note: f.note || '',
      });

      const passengerId = req.passenger?._id || req.passenger?.id;
      socket.emit('new_offer', {
        ...data,
        passengerId,
      });

      setSentOffers((prev) => ({ ...prev, [reqKey]: true }));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit offer');
    }
  };

  const markArrived = async () => {
    if (!activeRide) return;
    const rideId = activeRide._id || activeRide.id;
    await api.patch(`/active-rides/${rideId}/arrived`);
    socket.emit('rider_arrived', {
      passengerId: activeRide.passenger?._id || activeRide.passenger?.id,
      rideId,
    });
    setActiveRide((prev) => ({ ...prev, status: 'Arrived' }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-indigo-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Active Ride ────────────────────────────────────────────────────
  if (activeRide) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Current Ride</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {activeRide.status === 'Arrived' ? 'Waiting for passenger payment...' : 'You are currently on the way'}
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
            {activeRide.passenger?.profilePicture ? (
              <img
                src={activeRide.passenger.profilePicture}
                alt=""
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/30"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
                {activeRide.passenger?.name?.[0]}
              </div>
            )}
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
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0"></div>
              <span className="text-white/70">From</span>
              <span className="font-medium ml-auto">{activeRide.request?.startLocation}</span>
            </div>
            <div className="border-l-2 border-white/20 h-3 ml-1"></div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0"></div>
              <span className="text-white/70">To</span>
              <span className="font-medium ml-auto">{activeRide.request?.endLocation}</span>
            </div>
          </div>
        </div>

        {activeRide.status === 'Ongoing' && (
          <button
            onClick={markArrived}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25 mb-4 text-base cursor-pointer"
          >
            ✅ Mark as Arrived at Destination
          </button>
        )}

        {activeRide.status === 'Arrived' && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <span className="text-2xl">💰</span>
            <div>
              <div className="font-semibold text-amber-800 dark:text-amber-200">Waiting for payment</div>
              <div className="text-amber-600 dark:text-amber-400 text-sm">
                Passenger is completing Tk {activeRide.fare} payment
              </div>
            </div>
          </div>
        )}

        {activeRide.paymentStatus === 'Paid' && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <div className="font-semibold text-emerald-800 dark:text-emerald-200">Payment received!</div>
              <div className="text-emerald-600 dark:text-emerald-400 text-sm">
                ৳{activeRide.fare} · Ride complete
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowChat(!showChat)}
          className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors"
        >
          💬 {showChat ? 'Hide Chat' : 'Chat with Passenger'}
        </button>
        {showChat && (
          <div className="mt-3">
            <ChatBox rideId={activeRide._id || activeRide.id} otherName={activeRide.passenger?.name} />
          </div>
        )}
      </div>
    );
  }

  // ── Open Requests ──────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Open Ride Requests</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Review passenger routes, distances, and send your fare offers
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-sm font-semibold">
          {error}
        </div>
      )}

      {requests.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <div className="text-6xl mb-4">🔍</div>
          <div className="text-slate-800 dark:text-slate-100 font-bold text-lg">No open requests right now</div>
          <div className="text-slate-400 text-sm mt-1">
            New passenger requests will appear here automatically in real time
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const reqKey = req._id || req.id;
            const isOfferSent = sentOffers[reqKey];

            // Calculate distance & suggested fair fare
            const vType = req.vehicleType || 'bike';
            const vehicleObj = VEHICLE_TYPES.find((v) => v.id === vType) || VEHICLE_TYPES[0];

            const distanceKm =
              req.estimatedDistance ||
              calculateDistanceKm(
                req.pickupLat || findLocationCoords(req.startLocation, 2).lat,
                req.pickupLng || findLocationCoords(req.startLocation, 2).lng,
                req.dropoffLat || findLocationCoords(req.endLocation, 0).lat,
                req.dropoffLng || findLocationCoords(req.endLocation, 0).lng
              );

            const suggestedFare = req.estimatedFare || estimateFare(distanceKm, vType);

            return (
              <div
                key={reqKey}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Passenger Info & Post Time */}
                <div className="flex items-center gap-3.5 mb-4">
                  {req.passenger?.profilePicture ? (
                    <img
                      src={req.passenger.profilePicture}
                      alt=""
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-purple-500/20"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 flex items-center justify-center font-bold text-purple-600 dark:text-purple-400 text-lg">
                      {req.passenger?.name?.[0] || 'P'}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-base">
                      {req.passenger?.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {req.passenger?.department || 'BRACU Student'} · {req.passenger?.location || 'Dhaka'}
                    </div>
                  </div>
                  <div className="ml-auto text-xs text-slate-400">
                    {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Trip Details with Distance & Suggested Fair Fare Guide */}
                <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-4 space-y-3">
                  {/* Top highlight bar: Vehicle Type + Approx Distance + Fair Fare Guide */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-700/70">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                        <span>{vehicleObj.icon}</span>
                        <span>{vehicleObj.name}</span>
                      </span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        Approx. <span className="text-slate-900 dark:text-white font-extrabold">{distanceKm} km</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Fair Fare Guide</span>
                      <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                        Tk {suggestedFare}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-500 font-bold">●</span>
                      <span className="text-slate-500 dark:text-slate-400">From</span>
                      <span className="font-semibold text-slate-900 dark:text-white ml-auto">{req.startLocation}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-rose-500 font-bold">●</span>
                      <span className="text-slate-500 dark:text-slate-400">To</span>
                      <span className="font-semibold text-slate-900 dark:text-white ml-auto">{req.endLocation}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🕐</span>
                      <span className="text-slate-500 dark:text-slate-400">When</span>
                      <span className="text-slate-800 dark:text-slate-200 ml-auto font-medium">
                        {new Date(req.scheduledTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>👥</span>
                      <span className="text-slate-500 dark:text-slate-400">Seats</span>
                      <span className="text-slate-800 dark:text-slate-200 ml-auto font-medium">{req.seatsNeeded}</span>
                    </div>
                  </div>
                </div>

                {/* Offer Input / Sent State */}
                {isOfferSent ? (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl px-4 py-3">
                    <span>✓</span> Offer of Tk {offerForms[reqKey]?.fare || suggestedFare} sent — waiting for passenger
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      {/* Clean numeric typing input without browser spinners */}
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                          ৳
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder={`${suggestedFare}`}
                          value={offerForms[reqKey]?.fare ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setOfferForms((p) => ({
                              ...p,
                              [reqKey]: { ...p[reqKey], fare: val },
                            }));
                          }}
                          className="w-28 pl-7 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
                        />
                      </div>

                      {/* 1-tap Suggested Fare Chip */}
                      <button
                        type="button"
                        onClick={() =>
                          setOfferForms((p) => ({
                            ...p,
                            [reqKey]: { ...p[reqKey], fare: String(suggestedFare) },
                          }))
                        }
                        className="px-2.5 py-2.5 text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors shrink-0"
                        title="Click to fill calculated fair fare"
                      >
                        Use ৳{suggestedFare}
                      </button>
                    </div>

                    <input
                      placeholder="Add a note (optional)"
                      value={offerForms[reqKey]?.note || ''}
                      onChange={(e) =>
                        setOfferForms((p) => ({
                          ...p,
                          [reqKey]: { ...p[reqKey], note: e.target.value },
                        }))
                      }
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
                    />

                    <button
                      onClick={() => sendOffer(req)}
                      disabled={!offerForms[reqKey]?.fare}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-500/20 disabled:opacity-40 shrink-0 cursor-pointer"
                    >
                      Offer
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
