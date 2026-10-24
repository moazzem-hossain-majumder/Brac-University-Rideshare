import { useEffect, useState } from 'react';
import api from '../../api/axios';
import socket from '../../api/socket';
import { useAuth } from '../../context/AuthContext';
import ChatBox from './ChatBox';
import LiveRideMap from '../common/LiveRideMap';
import RequestMapPicker from './RequestMapPicker';
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
  const [isOnline, setIsOnline] = useState(true);
  const [selectedReqKey, setSelectedReqKey] = useState(null);

  useEffect(() => {
    socket.connect();
    socket.emit('join_user', user?.id || user?._id);

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
      if (data?.length > 0) {
        setSelectedReqKey(data[0]._id || data[0].id);
      }
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

  // Find coords for highlighted request
  const selectedReq = requests.find((r) => (r._id || r.id) === selectedReqKey) || requests[0];
  const previewPickup = selectedReq
    ? {
        lat: selectedReq.pickupLat || findLocationCoords(selectedReq.startLocation, 2).lat,
        lng: selectedReq.pickupLng || findLocationCoords(selectedReq.startLocation, 2).lng,
        name: selectedReq.startLocation,
      }
    : { lat: 23.807, lng: 90.3686, name: 'Mirpur 10' };

  const previewDropoff = selectedReq
    ? {
        lat: selectedReq.dropoffLat || findLocationCoords(selectedReq.endLocation, 0).lat,
        lng: selectedReq.dropoffLng || findLocationCoords(selectedReq.endLocation, 0).lng,
        name: selectedReq.endLocation,
      }
    : { lat: 23.7745, lng: 90.4258, name: 'BRACU Merul Badda' };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3.5 h-3.5 rounded-full bg-indigo-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col lg:flex-row overflow-hidden bg-slate-900">
      {/* ── Left Drawer: Driver Feed & Active Ride (470px–500px) ───── */}
      <div className="w-full lg:w-[470px] xl:w-[500px] h-full overflow-y-auto custom-scrollbar z-20 flex flex-col justify-between bg-white/95 dark:bg-slate-950/95 lg:bg-white/90 lg:dark:bg-slate-950/90 backdrop-blur-2xl border-r border-slate-200/80 dark:border-white/10 shadow-2xl p-5 sm:p-7 shrink-0">
        {/* Active Ride Screen */}
        {activeRide ? (
          <div className="space-y-5">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Active Commute
              </span>
              <h2 className="text-2xl font-black font-heading text-slate-900 dark:text-white mt-0.5">
                Current Ride
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {activeRide.status === 'Arrived'
                  ? 'Waiting for passenger payment...'
                  : 'You are currently driving to the passenger'}
              </p>
            </div>

            {/* Passenger info card */}
            <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/25">
              <div className="flex items-center gap-4 mb-4">
                {activeRide.passenger?.profilePicture ? (
                  <img
                    src={activeRide.passenger.profilePicture}
                    alt=""
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/30"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-black">
                    {activeRide.passenger?.name?.[0] || 'P'}
                  </div>
                )}
                <div>
                  <div className="font-heading font-black text-xl">{activeRide.passenger?.name}</div>
                  <div className="text-indigo-200 text-xs">{activeRide.passenger?.phone}</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-white/70 text-[10px] uppercase font-bold">Your Fare</div>
                  <div className="text-3xl font-black font-heading">৳ {activeRide.fare}</div>
                </div>
              </div>

              <div className="bg-white/15 rounded-2xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0"></span>
                  <span className="text-white/70">Pickup:</span>
                  <span className="font-bold ml-auto truncate max-w-[200px]">
                    {activeRide.request?.startLocation}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0"></span>
                  <span className="text-white/70">Dropoff:</span>
                  <span className="font-bold ml-auto truncate max-w-[200px]">
                    {activeRide.request?.endLocation}
                  </span>
                </div>
              </div>
            </div>

            {activeRide.status === 'Ongoing' && (
              <button
                onClick={markArrived}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl font-black font-heading text-sm shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
              >
                ✅ Mark as Arrived at Destination
              </button>
            )}

            {activeRide.status === 'Arrived' && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center gap-3">
                <span className="text-2xl">💰</span>
                <div>
                  <div className="font-bold text-amber-800 dark:text-amber-200 text-sm">
                    Waiting for Passenger Payment
                  </div>
                  <div className="text-amber-600 dark:text-amber-400 text-xs">
                    Passenger is completing Tk {activeRide.fare} payment
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowChat(!showChat)}
              className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              💬 {showChat ? 'Hide Chat' : 'Chat with Passenger'}
            </button>
            {showChat && (
              <div className="mt-2">
                <ChatBox rideId={activeRide._id || activeRide.id} otherName={activeRide.passenger?.name} />
              </div>
            )}
          </div>
        ) : (
          /* Driver Feed / Open Requests */
          <div className="space-y-6">
            {/* Driver status banner */}
            <div className="flex items-center justify-between p-4 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                <div>
                  <div className="font-heading font-black text-sm text-slate-900 dark:text-white">
                    {isOnline ? "You're Online" : "You're Offline"}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isOnline ? 'Receiving campus commute requests' : 'Tap to start accepting rides'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOnline(!isOnline)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isOnline
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {isOnline ? 'Online' : 'Offline'}
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Live Feed
                  </span>
                  <h2 className="text-2xl font-black font-heading text-slate-900 dark:text-white mt-0.5">
                    Open Student Requests
                  </h2>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  {requests.length} available
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Send custom fare offers or accept standard Fair Fare guide rates
              </p>
            </div>

            {error && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-semibold">
                {error}
              </div>
            )}

            {requests.length === 0 ? (
              <div className="text-center py-16 px-6 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div className="text-5xl mb-3">🔍</div>
                <div className="font-heading font-black text-base text-slate-900 dark:text-white">
                  No open requests right now
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  New student requests from Mirpur, Uttara, Dhanmondi, and campuses appear here automatically
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => {
                  const reqKey = req._id || req.id;
                  const isOfferSent = sentOffers[reqKey];
                  const isSelected = selectedReqKey === reqKey;

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
                      onClick={() => setSelectedReqKey(reqKey)}
                      className={`p-5 rounded-3xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-white dark:bg-slate-900 shadow-xl ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 hover:border-slate-300'
                      }`}
                    >
                      {/* Passenger header */}
                      <div className="flex items-center gap-3 mb-3">
                        {req.passenger?.profilePicture ? (
                          <img
                            src={req.passenger.profilePicture}
                            alt=""
                            className="w-11 h-11 rounded-2xl object-cover ring-2 ring-indigo-500/20"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center font-black text-indigo-600 dark:text-indigo-400 text-sm">
                            {req.passenger?.name?.[0] || 'P'}
                          </div>
                        )}
                        <div>
                          <div className="font-black text-slate-900 dark:text-white text-sm">
                            {req.passenger?.name}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {req.passenger?.department || 'BRACU Student'} · {req.passenger?.location || 'Dhaka'}
                          </div>
                        </div>

                        <div className="ml-auto text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Fair Guide</span>
                          <span className="text-xl font-black font-heading text-indigo-600 dark:text-indigo-400">
                            ৳ {suggestedFare}
                          </span>
                        </div>
                      </div>

                      {/* Route specs */}
                      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 space-y-2 text-xs border border-slate-200/80 dark:border-slate-700/60 mb-3.5">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60 dark:border-slate-700/50">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                            {vehicleObj.icon} {vehicleObj.name}
                          </span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            Approx. {distanceKm} km · {req.seatsNeeded} seat(s)
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-emerald-500 font-black">●</span>
                          <span className="text-slate-500 dark:text-slate-400">From:</span>
                          <span className="font-bold text-slate-900 dark:text-white ml-auto truncate max-w-[200px]">
                            {req.startLocation}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-rose-500 font-black">■</span>
                          <span className="text-slate-500 dark:text-slate-400">To:</span>
                          <span className="font-bold text-slate-900 dark:text-white ml-auto truncate max-w-[200px]">
                            {req.endLocation}
                          </span>
                        </div>
                      </div>

                      {/* Offer actions */}
                      {isOfferSent ? (
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-black bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl px-4 py-3">
                          <span>✓</span> Offer of ৳ {offerForms[reqKey]?.fare || suggestedFare} sent — waiting for student
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {/* 1-tap quick fare chips */}
                          <div className="flex items-center gap-1.5">
                            {[suggestedFare - 10, suggestedFare, suggestedFare + 15].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOfferForms((p) => ({
                                    ...p,
                                    [reqKey]: { ...p[reqKey], fare: String(Math.max(20, val)) },
                                  }));
                                }}
                                className="flex-1 py-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 cursor-pointer"
                              >
                                ৳ {Math.max(20, val)}
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="relative w-28 shrink-0">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                                ৳
                              </span>
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder={`${suggestedFare}`}
                                value={offerForms[reqKey]?.fare ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '');
                                  setOfferForms((p) => ({
                                    ...p,
                                    [reqKey]: { ...p[reqKey], fare: val },
                                  }));
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full pl-7 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                sendOffer(req);
                              }}
                              disabled={!offerForms[reqKey]?.fare}
                              className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-black font-heading transition-all shadow-md shadow-indigo-500/20 disabled:opacity-40 cursor-pointer"
                            >
                              Send Offer ➔
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Right Panel: Full-Bleed Map (Live navigation or Route preview) ──── */}
      <div className="flex-1 h-[45vh] lg:h-full relative overflow-hidden bg-slate-950">
        {activeRide ? (
          <LiveRideMap
            riderLocation={activeRide.riderLocation}
            pickupLocation={activeRide.pickupLocation}
            dropoffLocation={activeRide.dropoffLocation}
            isRider={true}
            riderName={user?.name || 'You'}
            etaMinutes={activeRide.etaMinutes || 5}
            onLocationUpdate={handleLocationUpdate}
            className="w-full h-full"
          />
        ) : (
          <RequestMapPicker
            pickupCoord={previewPickup}
            dropoffCoord={previewDropoff}
            activeMode="pickup"
            className="w-full h-full"
          />
        )}
      </div>
    </div>
  );
}
