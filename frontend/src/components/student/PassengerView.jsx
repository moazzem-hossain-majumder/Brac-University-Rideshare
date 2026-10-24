import { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import socket from '../../api/socket';
import { useAuth } from '../../context/AuthContext';
import ChatBox from './ChatBox';
import LiveRideMap from '../common/LiveRideMap';
import RequestMapPicker from './RequestMapPicker';
import {
  CAMPUS_LOCATIONS,
  VEHICLE_TYPES,
  calculateDistanceKm,
  estimateFare,
  findLocationCoords,
} from '../../constants/locations';

// ── Mobile Payment Modal (bKash / Nagad) ─────────────────────────────
function MobilePayModal({ method, fare, rideId, onSuccess, onClose }) {
  const [number, setNumber] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const isBkash = method === 'Bkash';
  const brandName = isBkash ? 'bKash' : 'Nagad';
  const bgGrad = isBkash ? 'from-pink-600 to-rose-600' : 'from-orange-600 to-amber-600';
  const btnGrad = isBkash ? 'from-pink-600 to-rose-600' : 'from-orange-600 to-amber-600';

  const handleConfirm = async () => {
    if (step === 1) {
      if (number.length < 11) return;
      setStep(2);
      return;
    }
    setLoading(true);
    try {
      await api.patch(`/active-rides/${rideId}/complete`, { paymentMethod: method });
      setStep(3);
      setTimeout(onSuccess, 1600);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className={`bg-gradient-to-r ${bgGrad} px-6 py-5 text-white`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl font-black font-heading">{brandName}</span>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm hover:bg-white/30 cursor-pointer"
            >
              ✕
            </button>
          </div>
          <div className="text-white/80 text-xs font-semibold uppercase tracking-wider">Payment Amount</div>
          <div className="text-3xl font-black font-heading">৳ {fare}</div>
        </div>

        <div className="p-6">
          {step === 3 ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-3">✅</div>
              <div className="font-black text-slate-900 dark:text-white text-lg">Payment Successful!</div>
              <div className="text-slate-500 dark:text-slate-400 text-sm mt-1">৳ {fare} paid via {brandName}</div>
            </div>
          ) : step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  {brandName} Mobile Account
                </label>
                <input
                  value={number}
                  onChange={(e) => setNumber(e.target.value.replace(/\D/g, ''))}
                  maxLength={11}
                  placeholder="017XXXXXXXX"
                  type="tel"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl text-lg font-mono focus:outline-none focus:border-indigo-500 text-center tracking-widest font-bold"
                />
                <p className="text-xs text-slate-400 mt-1.5 text-center">
                  Enter your 11-digit {brandName} wallet number
                </p>
              </div>

              <button
                onClick={handleConfirm}
                disabled={loading || number.length < 11}
                className={`w-full py-3.5 rounded-2xl font-bold text-white transition-all disabled:opacity-40 bg-gradient-to-r ${btnGrad} shadow-lg cursor-pointer text-sm`}
              >
                Continue →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  {brandName} PIN
                </label>
                <input
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  maxLength={5}
                  placeholder="• • • • •"
                  type="password"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl text-xl font-mono focus:outline-none focus:border-indigo-500 text-center tracking-widest font-bold"
                />
                <p className="text-xs text-slate-400 mt-1.5 text-center">
                  Simulated PIN verification for student testing
                </p>
              </div>

              <button
                onClick={handleConfirm}
                disabled={loading || pin.length < 4}
                className={`w-full py-3.5 rounded-2xl font-bold text-white transition-all disabled:opacity-40 bg-gradient-to-r ${btnGrad} shadow-lg cursor-pointer text-sm`}
              >
                {loading ? 'Processing...' : `Confirm Pay ৳ ${fare}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Post-ride Feedback Modal ─────────────────────────────────────────
function FeedbackModal({ rideId, riderName, onClose }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!rating) return;
    await api.post('/feedback', { rideId, rating, comment });
    setDone(true);
    setTimeout(onClose, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 text-white text-center">
          <div className="text-3xl mb-1.5">⭐</div>
          <div className="font-black text-lg font-heading">Rate Your Campus Commute</div>
          <div className="text-indigo-200 text-xs">with {riderName || 'Rider'}</div>
        </div>
        <div className="p-6">
          {done ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-2">🎉</div>
              <div className="font-bold text-slate-900 dark:text-white">Thank you for rating!</div>
            </div>
          ) : (
            <>
              <div className="flex justify-center gap-3 mb-5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setRating(s)}
                    className={`text-3xl transition-transform hover:scale-125 cursor-pointer ${
                      s <= rating ? 'opacity-100' : 'opacity-25'
                    }`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="How was the ride? Punctual, safe driving, friendly..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-4"
              />
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={submit}
                  disabled={!rating}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold hover:opacity-90 shadow-md transition-all cursor-pointer"
                >
                  Submit
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Uber-Grade Passenger View ───────────────────────────────────
export default function PassengerView() {
  const { user } = useAuth();
  const [view, setView] = useState('request'); // 'request' | 'offers' | 'active'
  const [myRequest, setMyRequest] = useState(null);
  const [offers, setOffers] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [completedRide, setCompletedRide] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptingOfferId, setAcceptingOfferId] = useState(null);

  // Form & Map State
  const [vehicleType, setVehicleType] = useState('bike');
  const [timeMode, setTimeMode] = useState('now'); // 'now' | 'scheduled'
  const [mapActivePin, setMapActivePin] = useState('pickup'); // 'pickup' | 'dropoff'

  const [pickupCoord, setPickupCoord] = useState(() => ({
    lat: 23.8070,
    lng: 90.3686,
    name: 'Mirpur 10 Circle',
  }));

  const [dropoffCoord, setDropoffCoord] = useState(() => ({
    lat: 23.7745,
    lng: 90.4258,
    name: 'BRACU Merul Badda Main Campus',
  }));

  const [form, setForm] = useState({
    startLocation: 'Mirpur 10 Circle',
    endLocation: 'BRACU Merul Badda Main Campus',
    scheduledTime: new Date().toISOString(),
    seatsNeeded: 1,
  });

  // Calculate live distance & fare based on current coordinates & selected vehicle
  const currentDistanceKm = useMemo(() => {
    return calculateDistanceKm(
      pickupCoord?.lat,
      pickupCoord?.lng,
      dropoffCoord?.lat,
      dropoffCoord?.lng
    );
  }, [pickupCoord, dropoffCoord]);

  const currentFareEstimate = useMemo(() => {
    return estimateFare(currentDistanceKm, vehicleType);
  }, [currentDistanceKm, vehicleType]);

  useEffect(() => {
    socket.connect();
    socket.emit('join_user', user?.id || user?._id);

    socket.on('offer_received', (offer) => {
      setOffers((prev) => {
        const id = offer._id || offer.id;
        if (prev.some((o) => (o._id || o.id) === id)) return prev;
        return [offer, ...prev];
      });
    });

    socket.on('show_payment', () => {
      setActiveRide((prev) => (prev ? { ...prev, status: 'Arrived' } : prev));
    });

    socket.on('location_update', (loc) => {
      setActiveRide((prev) => (prev ? { ...prev, riderLocation: loc } : prev));
    });

    checkExisting();

    return () => {
      socket.off('offer_received');
      socket.off('show_payment');
      socket.off('location_update');
      socket.disconnect();
    };
  }, []);

  const checkExisting = async () => {
    try {
      const { data } = await api.get('/active-rides/mine');
      if (data) {
        setActiveRide(data);
        socket.emit('join_ride', data._id || data.id);
        setView('active');
        return;
      }
    } catch (_) {}

    try {
      const reqs = await api.get('/ride-requests/mine');
      const open = (reqs.data || []).find((r) => r.status === 'Open');
      if (open) {
        setMyRequest(open);
        const offs = await api.get(`/ride-offers/request/${open._id || open.id}`);
        setOffers(offs.data || []);
        setView('offers');
      }
    } catch (_) {}
  };

  const handleMapSelect = (mode, coord) => {
    if (mode === 'pickup') {
      setPickupCoord(coord);
      setForm((prev) => ({ ...prev, startLocation: coord.name }));
    } else {
      setDropoffCoord(coord);
      setForm((prev) => ({ ...prev, endLocation: coord.name }));
    }
  };

  const handleQuickPickPickup = (locName) => {
    const coords = findLocationCoords(locName, 2);
    setPickupCoord({ lat: coords.lat, lng: coords.lng, name: locName });
    setForm((prev) => ({ ...prev, startLocation: locName }));
  };

  const handleQuickPickDropoff = (locName) => {
    const coords = findLocationCoords(locName, 0);
    setDropoffCoord({ lat: coords.lat, lng: coords.lng, name: locName });
    setForm((prev) => ({ ...prev, endLocation: locName }));
  };

  // Swap pickup & destination
  const handleSwapLocations = () => {
    const oldP = pickupCoord;
    const oldD = dropoffCoord;
    setPickupCoord(oldD);
    setDropoffCoord(oldP);
    setForm((prev) => ({
      ...prev,
      startLocation: oldD.name,
      endLocation: oldP.name,
    }));
  };

  const postRequest = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const departureTime =
        timeMode === 'now' ? new Date().toISOString() : form.scheduledTime || new Date().toISOString();

      const payload = {
        ...form,
        scheduledTime: departureTime,
        vehicleType,
        estimatedDistance: currentDistanceKm,
        estimatedFare: currentFareEstimate,
        pickupLat: pickupCoord?.lat,
        pickupLng: pickupCoord?.lng,
        dropoffLat: dropoffCoord?.lat,
        dropoffLng: dropoffCoord?.lng,
      };

      const { data } = await api.post('/ride-requests', payload);
      setMyRequest(data);
      setOffers([]);
      setView('offers');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to post request');
    } finally {
      setLoading(false);
    }
  };

  const acceptOffer = async (offer) => {
    setError('');
    const offerId = offer._id || offer.id;
    const riderId = offer.rider?._id || offer.rider?.id;
    setAcceptingOfferId(offerId);

    try {
      const { data } = await api.patch(`/ride-offers/${offerId}/accept`);
      if (riderId) {
        socket.emit('offer_accepted', {
          riderId,
          rideId: data._id || data.id,
        });
      }
      setActiveRide(data);
      setView('active');
    } catch (err) {
      console.error('Accept offer failure:', err);
      setError(err.response?.data?.message || err.message || 'Could not accept this offer');
    } finally {
      setAcceptingOfferId(null);
    }
  };

  const cancelRequest = async () => {
    if (!myRequest) return;
    try {
      await api.patch(`/ride-requests/${myRequest._id || myRequest.id}/cancel`);
    } catch (_) {}
    setMyRequest(null);
    setOffers([]);
    setView('request');
  };

  const onPaymentSuccess = () => {
    setPayModal(null);
    setCompletedRide(activeRide);
    setShowFeedback(true);
  };

  const handleCash = async () => {
    await api.patch(`/active-rides/${activeRide._id || activeRide.id}/complete`, { paymentMethod: 'Cash' });
    setCompletedRide(activeRide);
    setShowFeedback(true);
  };

  const onFeedbackClose = () => {
    setShowFeedback(false);
    setCompletedRide(null);
    setActiveRide(null);
    setView('request');
  };

  return (
    <div className="relative w-full h-full flex flex-col lg:flex-row overflow-hidden bg-slate-900">
      {/* ── Left Drawer: Booking & Ride Controls (Uber-Style Floating Panel) ── */}
      <div className="w-full lg:w-[470px] xl:w-[500px] h-full overflow-y-auto custom-scrollbar z-20 flex flex-col justify-between bg-white/95 dark:bg-slate-950/95 lg:bg-white/90 lg:dark:bg-slate-950/90 backdrop-blur-2xl border-r border-slate-200/80 dark:border-white/10 shadow-2xl p-5 sm:p-7 shrink-0">
        {/* Modals */}
        {payModal && (
          <MobilePayModal
            method={payModal}
            fare={activeRide?.fare}
            rideId={activeRide?._id || activeRide?.id}
            onSuccess={onPaymentSuccess}
            onClose={() => setPayModal(null)}
          />
        )}
        {showFeedback && (
          <FeedbackModal
            rideId={completedRide?._id || completedRide?.id}
            riderName={completedRide?.rider?.name}
            onClose={onFeedbackClose}
          />
        )}

        {/* ── State 1: Request a Ride (Booking Mode) ──────────────────── */}
        {view === 'request' && (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Campus Mobility
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-slate-900 dark:text-white mt-1">
                Where to, {user?.name?.split(' ')[0] || 'Student'}?
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Fast student rides across Dhaka & BRACU Campuses
              </p>
            </div>

            {error && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={postRequest} className="space-y-5">
              {/* Uber-Style Route Selector Box with Connecting Line */}
              <div className="bg-slate-50 dark:bg-slate-900/90 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative">
                {/* Swap button */}
                <button
                  type="button"
                  onClick={handleSwapLocations}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:scale-110 transition-all z-10 cursor-pointer"
                  title="Swap Pickup and Drop-off locations"
                >
                  ⇅
                </button>

                <div className="space-y-4">
                  {/* Pick-up Row */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5 pr-10">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 shrink-0"></span>
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Pickup Spot
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMapActivePin('pickup')}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-lg transition-colors ${
                          mapActivePin === 'pickup'
                            ? 'bg-emerald-500 text-white'
                            : 'text-indigo-600 dark:text-indigo-400 hover:underline'
                        }`}
                      >
                        📍 Tap on Map
                      </button>
                    </div>

                    <input
                      value={form.startLocation}
                      onChange={(e) => {
                        setForm({ ...form, startLocation: e.target.value });
                        const coords = findLocationCoords(e.target.value, 2);
                        setPickupCoord({ lat: coords.lat, lng: coords.lng, name: e.target.value });
                      }}
                      required
                      placeholder="Enter pickup area (e.g. Mirpur 10, Dhanmondi)"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                    />

                    {/* Quick pickup chips */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {['Mirpur 10', 'Uttara', 'Dhanmondi', 'Mohakhali'].map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => handleQuickPickPickup(loc)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all cursor-pointer"
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Route Divider Line */}
                  <div className="border-t border-dashed border-slate-200 dark:border-slate-800 my-1 ml-5"></div>

                  {/* Drop-off Row */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5 pr-10">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-md bg-rose-600 ring-4 ring-rose-500/20 shrink-0"></span>
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Destination
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMapActivePin('dropoff')}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-lg transition-colors ${
                          mapActivePin === 'dropoff'
                            ? 'bg-rose-600 text-white'
                            : 'text-indigo-600 dark:text-indigo-400 hover:underline'
                        }`}
                      >
                        🏁 Tap on Map
                      </button>
                    </div>

                    <input
                      value={form.endLocation}
                      onChange={(e) => {
                        setForm({ ...form, endLocation: e.target.value });
                        const coords = findLocationCoords(e.target.value, 0);
                        setDropoffCoord({ lat: coords.lat, lng: coords.lng, name: e.target.value });
                      }}
                      required
                      placeholder="Enter destination (e.g. BRACU Merul Badda)"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                    />

                    {/* Quick campus dropoff chips */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {['BRACU Merul Badda', 'BRACU Mohakhali', 'Banani 11', 'Kuril'].map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => handleQuickPickDropoff(loc)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-all cursor-pointer"
                        >
                          🎓 {loc}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Uber-Style Vehicle Selection Tier Cards */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2.5">
                  Select Campus Ride Option
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {VEHICLE_TYPES.map((v) => {
                    const isSelected = vehicleType === v.id;
                    const vFare = estimateFare(currentDistanceKm, v.id);

                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setVehicleType(v.id);
                          if (form.seatsNeeded > v.maxSeats) {
                            setForm({ ...form, seatsNeeded: v.maxSeats });
                          }
                        }}
                        className={`relative p-3.5 rounded-3xl border text-left transition-all overflow-hidden cursor-pointer group ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/90 dark:bg-indigo-950/70 shadow-lg ring-2 ring-indigo-500/40'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        {/* Vehicle 3D Render Image */}
                        <div className="h-20 w-full mb-2 overflow-hidden rounded-2xl bg-slate-950/10 dark:bg-slate-950/60 flex items-center justify-center relative">
                          <img
                            src={v.image || '/bike_vehicle.jpg'}
                            alt={v.name}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute top-1.5 left-1.5 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-900/80 text-white backdrop-blur-sm">
                            {v.seatsLabel}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="font-heading font-black text-sm text-slate-900 dark:text-white">
                            {v.name}
                          </div>
                          <div className="text-sm font-black font-heading text-indigo-600 dark:text-indigo-400">
                            ৳ {vFare}
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {v.tagline}
                        </div>

                        <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-slate-400">
                          <span>⏱️ {v.etaText}</span>
                          {isSelected && <span className="text-indigo-600 dark:text-indigo-400">✓ Selected</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ride Timing (Now vs Schedule) & Seats Needed */}
              <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Departure</span>
                  <div className="flex items-center bg-slate-200 dark:bg-slate-800 p-0.5 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setTimeMode('now');
                        setForm({ ...form, scheduledTime: new Date().toISOString() });
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        timeMode === 'now'
                          ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      ⚡ Now
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeMode('scheduled')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        timeMode === 'scheduled'
                          ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      📅 Schedule
                    </button>
                  </div>
                </div>

                {timeMode === 'scheduled' && (
                  <input
                    type="datetime-local"
                    value={form.scheduledTime ? form.scheduledTime.substring(0, 16) : ''}
                    onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                )}

                {/* Seats Needed counter */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Passenger Seats</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, seatsNeeded: Math.max(1, form.seatsNeeded - 1) })}
                      disabled={form.seatsNeeded <= 1}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold flex items-center justify-center disabled:opacity-30 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-black text-sm text-slate-900 dark:text-white">{form.seatsNeeded}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          seatsNeeded: Math.min(vehicleType === 'bike' ? 1 : 4, form.seatsNeeded + 1),
                        })
                      }
                      disabled={form.seatsNeeded >= (vehicleType === 'bike' ? 1 : 4)}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold flex items-center justify-center disabled:opacity-30 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Trip Fare & Distance Guarantee Card */}
              <div className="p-4 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Calculated Distance
                  </div>
                  <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                    Approx. {currentDistanceKm} km · ~{Math.round(currentDistanceKm * 2.5 + 4)} mins
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suggested Fare</div>
                  <div className="text-2xl font-black font-heading text-indigo-600 dark:text-indigo-400">
                    ৳ {currentFareEstimate}
                  </div>
                </div>
              </div>

              {/* Big Uber-Style Request Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl font-black font-heading text-white text-base bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-xl shadow-indigo-500/25 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Broadcasting Request...</span>
                  </>
                ) : (
                  <span>
                    Request {vehicleType === 'bike' ? 'Campus Bike' : 'Student Carpool'} · ৳ {currentFareEstimate}
                  </span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ── State 2: Waiting for Riders / Offers Screen ──────────────── */}
        {view === 'offers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Live Request
                </span>
                <h2 className="text-2xl font-black font-heading text-slate-900 dark:text-white">
                  Rider Offers
                </h2>
              </div>
              <button
                onClick={cancelRequest}
                className="px-3.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 text-xs font-bold hover:bg-rose-100 transition-all cursor-pointer"
              >
                Cancel Request
              </button>
            </div>

            {error && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Trip Route Summary Badge */}
            <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <span className="text-emerald-500 font-black">●</span>
                <span className="font-bold">{myRequest?.startLocation}</span>
                <span className="text-slate-400">➔</span>
                <span className="font-bold">{myRequest?.endLocation}</span>
              </div>
              <div className="text-slate-400 flex items-center justify-between">
                <span>{myRequest?.vehicleType === 'bike' ? '🏍️ Campus Bike' : '🚗 Student Carpool'}</span>
                <span>Est. ৳ {myRequest?.estimatedFare}</span>
              </div>
            </div>

            {/* Radar Animation if no offers yet */}
            {offers.length === 0 ? (
              <div className="text-center py-12 px-6 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-radar"></div>
                  <div className="absolute inset-2 rounded-full bg-indigo-500/30 animate-radar" style={{ animationDelay: '0.6s' }}></div>
                  <div className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center text-2xl shadow-xl shadow-indigo-500/40">
                    📡
                  </div>
                </div>

                <h3 className="font-heading font-black text-slate-900 dark:text-white text-lg">
                  Searching for campus riders...
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  Riders currently commuting on your route will submit their fare offers here in real time.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Received Offers ({offers.length})
                </div>

                {offers.map((offer) => {
                  const offerId = offer._id || offer.id;
                  const isAccepting = acceptingOfferId === offerId;

                  return (
                    <div
                      key={offerId}
                      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {offer.rider?.profilePicture ? (
                            <img
                              src={offer.rider.profilePicture}
                              alt=""
                              className="w-11 h-11 rounded-2xl object-cover ring-2 ring-indigo-500/30"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center font-black text-indigo-600 dark:text-indigo-400 text-base">
                              {offer.rider?.name?.[0] || 'R'}
                            </div>
                          )}
                          <div>
                            <div className="font-black text-slate-900 dark:text-white text-sm">
                              {offer.rider?.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {offer.rider?.department || 'BRACU Student'} · ★ 4.9
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Fare</span>
                          <span className="text-2xl font-black font-heading text-indigo-600 dark:text-indigo-400">
                            ৳ {offer.fare}
                          </span>
                        </div>
                      </div>

                      {offer.note && (
                        <div className="text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3 py-2 mb-3 border border-slate-200 dark:border-slate-700/60">
                          "{offer.note}"
                        </div>
                      )}

                      <button
                        onClick={() => acceptOffer(offer)}
                        disabled={isAccepting}
                        className="w-full py-3 rounded-2xl font-black font-heading text-white text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isAccepting ? 'Confirming Ride...' : 'Accept This Offer'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── State 3: Active Ride Tracking Screen ─────────────────────── */}
        {view === 'active' && activeRide && (
          <div className="space-y-5">
            {/* ETA Banner */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-5 text-white shadow-lg shadow-emerald-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase font-bold tracking-wider text-emerald-100">
                    {activeRide.status === 'Arrived' ? 'Arrived at destination' : 'Driver on the way'}
                  </div>
                  <div className="text-2xl font-black font-heading mt-0.5">
                    {activeRide.status === 'Arrived' ? 'Arrived at Campus!' : `Arriving in ~${activeRide.etaMinutes || 4} mins`}
                  </div>
                </div>
                <div className="text-3xl">🚗</div>
              </div>
            </div>

            {/* Driver Profile Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-3.5">
                {activeRide.rider?.profilePicture ? (
                  <img
                    src={activeRide.rider.profilePicture}
                    alt=""
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/30"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center font-black text-indigo-600 dark:text-indigo-400 text-xl">
                    {activeRide.rider?.name?.[0] || 'R'}
                  </div>
                )}
                <div>
                  <div className="font-black text-base text-slate-900 dark:text-white">
                    {activeRide.rider?.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {activeRide.rider?.phone || 'Verified BRACU Rider'}
                  </div>
                  <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ✓ Verified Student Community
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-xs text-slate-400">Total Fare</div>
                  <div className="text-2xl font-black font-heading text-indigo-600 dark:text-indigo-400">
                    ৳ {activeRide.fare}
                  </div>
                </div>
              </div>

              {/* Trip route snippet */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-xs space-y-1.5 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">●</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{activeRide.request?.startLocation}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-rose-500 font-bold">■</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{activeRide.request?.endLocation}</span>
                </div>
              </div>

              {/* Payment trigger when arrived */}
              {activeRide.status === 'Arrived' && activeRide.paymentStatus === 'Pending' && (
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Pay ৳ {activeRide.fare} to Rider
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setPayModal('Bkash')}
                      className="py-3 rounded-2xl bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-800 text-pink-600 dark:text-pink-300 font-black text-xs hover:bg-pink-100 transition-all cursor-pointer flex flex-col items-center gap-1"
                    >
                      <span className="text-lg">💳</span>
                      <span>bKash</span>
                    </button>
                    <button
                      onClick={() => setPayModal('Nagad')}
                      className="py-3 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-300 font-black text-xs hover:bg-orange-100 transition-all cursor-pointer flex flex-col items-center gap-1"
                    >
                      <span className="text-lg">💰</span>
                      <span>Nagad</span>
                    </button>
                    <button
                      onClick={handleCash}
                      className="py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-300 font-black text-xs hover:bg-emerald-100 transition-all cursor-pointer flex flex-col items-center gap-1"
                    >
                      <span className="text-lg">💵</span>
                      <span>Cash</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Chat Toggle Button */}
              <button
                onClick={() => setShowChat(!showChat)}
                className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                💬 {showChat ? 'Hide Chat' : 'Chat with Rider'}
              </button>
              {showChat && (
                <div className="mt-2">
                  <ChatBox rideId={activeRide._id || activeRide.id} otherName={activeRide.rider?.name} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Right Panel: Full-Bleed Edge-to-Edge Interactive Live Map ──── */}
      <div className="flex-1 h-[45vh] lg:h-full relative overflow-hidden bg-slate-950">
        {view === 'active' && activeRide ? (
          <LiveRideMap
            riderLocation={activeRide.riderLocation}
            pickupLocation={activeRide.pickupLocation}
            dropoffLocation={activeRide.dropoffLocation}
            isRider={false}
            riderName={activeRide.rider?.name || 'Rider'}
            etaMinutes={activeRide.etaMinutes || 5}
            className="w-full h-full"
          />
        ) : (
          <RequestMapPicker
            pickupCoord={pickupCoord}
            dropoffCoord={dropoffCoord}
            activeMode={mapActivePin}
            onSelectLocation={handleMapSelect}
            className="w-full h-full"
          />
        )}
      </div>
    </div>
  );
}
