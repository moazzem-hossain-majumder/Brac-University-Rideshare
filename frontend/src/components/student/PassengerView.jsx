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

// ── bKash / Nagad payment modal ──────────────────────────────────────
function MobilePayModal({ method, fare, rideId, onSuccess, onClose }) {
  const [number, setNumber] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const isBkash = method === 'Bkash';
  const bgGrad = isBkash ? 'from-pink-600 to-pink-500' : 'from-orange-600 to-orange-500';
  const borderColor = isBkash ? 'border-pink-400' : 'border-orange-400';
  const btnGrad = isBkash ? 'from-pink-600 to-pink-500' : 'from-orange-600 to-orange-500';
  const brandName = isBkash ? 'bKash' : 'Nagad';

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
      setTimeout(onSuccess, 1800);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className={`bg-gradient-to-r ${bgGrad} px-6 py-5 text-white`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl font-black">{brandName}</span>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm hover:bg-white/30"
            >
              ✕
            </button>
          </div>
          <div className="text-white/80 text-sm">Payment Amount</div>
          <div className="text-3xl font-bold">Tk {fare}</div>
        </div>

        <div className="px-6 py-6">
          {step === 3 ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-3">✅</div>
              <div className="font-bold text-slate-800 dark:text-white text-lg">Payment Successful!</div>
              <div className="text-slate-500 dark:text-slate-400 text-sm mt-1">Tk {fare} paid via {brandName}</div>
            </div>
          ) : step === 1 ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {brandName} Account Number
              </label>
              <input
                value={number}
                onChange={(e) => setNumber(e.target.value.replace(/\D/g, ''))}
                maxLength={11}
                placeholder="01XXXXXXXXX"
                type="tel"
                className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 ${borderColor} text-slate-900 dark:text-white rounded-xl text-lg font-mono focus:outline-none text-center tracking-widest`}
              />
              <p className="text-xs text-slate-400 mt-2 text-center">
                Enter your {brandName} registered number
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {brandName} PIN
              </label>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                maxLength={5}
                placeholder="• • • • •"
                type="password"
                className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 ${borderColor} text-slate-900 dark:text-white rounded-xl text-lg font-mono focus:outline-none text-center tracking-widest`}
              />
              <p className="text-xs text-slate-400 mt-2 text-center">
                Enter your {brandName} PIN to confirm
              </p>
            </div>
          )}

          {step !== 3 && (
            <button
              onClick={handleConfirm}
              disabled={loading || (step === 1 && number.length < 11) || (step === 2 && pin.length < 4)}
              className={`w-full mt-5 py-3.5 rounded-xl font-bold text-white transition-all disabled:opacity-40 bg-gradient-to-r ${btnGrad} hover:opacity-90 shadow-lg`}
            >
              {loading ? 'Processing...' : step === 1 ? 'Continue →' : `Pay Tk ${fare}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Post-ride feedback modal ─────────────────────────────────────────
function FeedbackModal({ rideId, riderName, onClose }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!rating) return;
    await api.post('/feedback', { rideId, rating, comment });
    setDone(true);
    setTimeout(onClose, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 text-white text-center">
          <div className="text-3xl mb-2">⭐</div>
          <div className="font-bold text-lg">Rate your ride</div>
          <div className="text-indigo-200 text-sm">with {riderName}</div>
        </div>
        <div className="p-6">
          {done ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-2">🙏</div>
              <div className="font-semibold text-slate-800 dark:text-white">Thanks for your feedback!</div>
            </div>
          ) : (
            <>
              <div className="flex justify-center gap-3 mb-5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setRating(s)}
                    className={`text-4xl transition-transform hover:scale-110 ${s <= rating ? 'opacity-100' : 'opacity-30'}`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Tell us about your experience (optional)"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={submit}
                  disabled={!rating}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 transition-colors"
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

// ── Main component ───────────────────────────────────────────────────
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
    name: 'Mirpur 10',
  }));

  const [dropoffCoord, setDropoffCoord] = useState(() => ({
    lat: 23.7745,
    lng: 90.4258,
    name: 'BRACU Merul Badda',
  }));

  const [form, setForm] = useState({
    startLocation: 'Mirpur 10',
    endLocation: 'BRACU Merul Badda',
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
    socket.emit('join_user', user.id || user._id);

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

  // Handle location selection from interactive Map
  const handleMapSelect = (mode, coord) => {
    if (mode === 'pickup') {
      setPickupCoord(coord);
      setForm((prev) => ({ ...prev, startLocation: coord.name }));
    } else {
      setDropoffCoord(coord);
      setForm((prev) => ({ ...prev, endLocation: coord.name }));
    }
  };

  // Handle preset quick pick buttons
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
      setError(err.response?.data?.message || err.message || 'Could not accept this offer. Please try again.');
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

  // ── Active ride screen ──────────────────────────────────────────────
  if (view === 'active' && activeRide) {
    return (
      <div className="max-w-lg mx-auto">
        {payModal && (
          <MobilePayModal
            method={payModal}
            fare={activeRide.fare}
            rideId={activeRide._id || activeRide.id}
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

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Ride</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Live tracking & navigation</p>
        </div>

        {/* Live Rider Map */}
        <div className="mb-4">
          <LiveRideMap
            riderLocation={activeRide.riderLocation}
            pickupLocation={activeRide.pickupLocation}
            dropoffLocation={activeRide.dropoffLocation}
            isRider={false}
            riderName={activeRide.rider?.name || 'Rider'}
            etaMinutes={activeRide.etaMinutes || 5}
          />
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white mb-4 shadow-xl shadow-indigo-500/20">
          <div className="flex items-center gap-4 mb-5">
            {activeRide.rider?.profilePicture ? (
              <img
                src={activeRide.rider.profilePicture}
                alt=""
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/30"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
                {activeRide.rider?.name?.[0]}
              </div>
            )}
            <div>
              <div className="font-bold text-xl">{activeRide.rider?.name}</div>
              <div className="text-indigo-200 text-sm">{activeRide.rider?.phone}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-white/70 text-xs">Fare</div>
              <div className="text-2xl font-black">Tk {activeRide.fare}</div>
            </div>
          </div>
          <div className="bg-white/15 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-white/70">From</span>
              <span className="font-medium ml-auto">{activeRide.request?.startLocation}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
              <span className="text-white/70">To</span>
              <span className="font-medium ml-auto">{activeRide.request?.endLocation}</span>
            </div>
          </div>
          <div
            className={`mt-4 flex items-center gap-2 text-sm font-medium ${
              activeRide.status === 'Arrived' ? 'text-emerald-300' : 'text-amber-300'
            }`}
          >
            {activeRide.status === 'Arrived' ? '✅ Arrived at destination!' : '🚗 Ride in progress...'}
          </div>
        </div>

        {activeRide.status === 'Arrived' && activeRide.paymentStatus === 'Pending' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 mb-4 shadow-xl">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1">Complete Payment</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
              Pay Tk {activeRide.fare} to your rider
            </p>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setPayModal('Bkash')}
                className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-gradient-to-b from-pink-50 to-pink-100 dark:from-pink-950/40 dark:to-pink-900/30 border border-pink-200 dark:border-pink-800 hover:from-pink-100 hover:to-pink-200 transition-all"
              >
                <span className="text-2xl">💳</span>
                <span className="text-xs font-bold text-pink-700 dark:text-pink-300">bKash</span>
              </button>
              <button
                onClick={() => setPayModal('Nagad')}
                className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-gradient-to-b from-orange-50 to-orange-100 dark:from-orange-950/40 dark:to-orange-900/30 border border-orange-200 dark:border-orange-800 hover:from-orange-100 hover:to-orange-200 transition-all"
              >
                <span className="text-2xl">💰</span>
                <span className="text-xs font-bold text-orange-700 dark:text-orange-300">Nagad</span>
              </button>
              <button
                onClick={handleCash}
                className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-gradient-to-b from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/30 border border-emerald-200 dark:border-emerald-800 hover:from-emerald-100 hover:to-emerald-200 transition-all"
              >
                <span className="text-2xl">💵</span>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Cash</span>
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowChat(!showChat)}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors mb-3"
        >
          💬 {showChat ? 'Hide Chat' : 'Chat with Rider'}
        </button>
        {showChat && <ChatBox rideId={activeRide._id || activeRide.id} otherName={activeRide.rider?.name} />}
      </div>
    );
  }

  // ── Offers screen ──────────────────────────────────────────────────
  if (view === 'offers') {
    return (
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Ride Offers</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Choose your preferred rider</p>
          </div>
          <button
            onClick={cancelRequest}
            className="text-sm text-rose-500 hover:text-rose-600 font-semibold px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 transition-colors"
          >
            Cancel Request
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-sm font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Route Summary Card */}
        <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <span className="text-emerald-500 font-bold">●</span>
            <span className="font-semibold text-slate-900 dark:text-white">{myRequest?.startLocation}</span>
            <span className="text-slate-400 mx-1">→</span>
            <span className="font-semibold text-slate-900 dark:text-white">{myRequest?.endLocation}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <span>🕐 {new Date(myRequest?.scheduledTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
            <span className="font-medium text-indigo-500 uppercase">{myRequest?.vehicleType || 'Bike'} Requested</span>
          </div>
        </div>

        {offers.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8">
            <div className="text-6xl mb-4">⏳</div>
            <div className="text-slate-800 dark:text-slate-100 font-bold text-lg">Waiting for riders...</div>
            <div className="text-slate-400 text-sm mt-1">Active riders on campus will send their fare offers here</div>
            <div className="mt-5 flex justify-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            {offers.map((offer) => {
              const offerId = offer._id || offer.id;
              const isAccepting = acceptingOfferId === offerId;

              return (
                <div
                  key={offerId}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      {offer.rider?.profilePicture ? (
                        <img
                          src={offer.rider.profilePicture}
                          alt=""
                          className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500/20"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-lg">
                          {offer.rider?.name?.[0] || 'R'}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-base">
                          {offer.rider?.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {offer.rider?.department || 'BRACU Student'} · {offer.rider?.location || 'Dhaka'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                        Tk {offer.fare}
                      </div>
                    </div>
                  </div>

                  {offer.note && (
                    <div className="mt-3.5 text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/60">
                      "{offer.note}"
                    </div>
                  )}

                  <button
                    onClick={() => acceptOffer(offer)}
                    disabled={isAccepting}
                    className="w-full mt-4 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isAccepting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Accepting offer...</span>
                      </>
                    ) : (
                      <span>Accept this offer</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Request a Ride screen ──────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Request a Ride</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Pick on map, choose vehicle & departure, and get instant offers
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-sm font-semibold">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-7">
        <form onSubmit={postRequest} className="space-y-5">
          {/* 1. Pick-up Location */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Pick-up Location
              </label>
              <button
                type="button"
                onClick={() => setMapActivePin('pickup')}
                className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors ${
                  mapActivePin === 'pickup'
                    ? 'bg-emerald-500 text-white'
                    : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800'
                }`}
              >
                📍 Pin on Map
              </button>
            </div>

            {/* Quick Pick Buttons */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {['Mirpur 10', 'Uttara', 'Dhanmondi', 'Mohakhali'].map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => handleQuickPickPickup(loc)}
                  className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  📍 {loc}
                </button>
              ))}
            </div>

            <input
              value={form.startLocation}
              onChange={(e) => {
                setForm({ ...form, startLocation: e.target.value });
                const coords = findLocationCoords(e.target.value, 2);
                setPickupCoord({ lat: coords.lat, lng: coords.lng, name: e.target.value });
              }}
              required
              placeholder="e.g. Mirpur 10, Dhanmondi 27..."
              className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
            />
          </div>

          {/* 2. Drop-off Location */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Drop-off Location
              </label>
              <button
                type="button"
                onClick={() => setMapActivePin('dropoff')}
                className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors ${
                  mapActivePin === 'dropoff'
                    ? 'bg-rose-600 text-white'
                    : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800'
                }`}
              >
                🏁 Pin on Map
              </button>
            </div>

            {/* Campus Destinations Quick Pick */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {['BRACU Merul Badda', 'BRACU Mohakhali', 'Banani 11', 'Kuril'].map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => handleQuickPickDropoff(loc)}
                  className="px-2.5 py-1 text-xs bg-indigo-50/80 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg font-semibold border border-indigo-200 dark:border-indigo-800 transition-colors"
                >
                  🎓 {loc}
                </button>
              ))}
            </div>

            <input
              value={form.endLocation}
              onChange={(e) => {
                setForm({ ...form, endLocation: e.target.value });
                const coords = findLocationCoords(e.target.value, 0);
                setDropoffCoord({ lat: coords.lat, lng: coords.lng, name: e.target.value });
              }}
              required
              placeholder="e.g. BRACU Merul Badda, Mohakhali..."
              className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
            />
          </div>

          {/* 3. Interactive Map Pin Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Select via Interactive Map
              </span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setMapActivePin('pickup')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    mapActivePin === 'pickup'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  📍 Pick-up
                </button>
                <button
                  type="button"
                  onClick={() => setMapActivePin('dropoff')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    mapActivePin === 'dropoff'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  🏁 Drop-off
                </button>
              </div>
            </div>
            <RequestMapPicker
              pickupCoord={pickupCoord}
              dropoffCoord={dropoffCoord}
              activeMode={mapActivePin}
              onSelectLocation={handleMapSelect}
            />
          </div>

          {/* 4. Vehicle Selection (Bike vs Car vs CNG) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Select Vehicle Type
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {VEHICLE_TYPES.map((v) => {
                const selected = vehicleType === v.id;
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
                    className={`relative p-3 rounded-2xl border text-left transition-all ${
                      selected
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 shadow-md ring-2 ring-indigo-500/30'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="text-2xl mb-1">{v.icon}</div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">{v.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{v.desc}</div>
                    <div className="mt-2 text-xs font-black text-indigo-600 dark:text-indigo-400">
                      Tk {vFare}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Live Fair Fare & Distance Guide */}
          <div className="p-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Estimated Trip
              </div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                Approx. <span className="text-base font-black text-slate-900 dark:text-white">{currentDistanceKm} km</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-400">Fair Fare Guide</div>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                Tk {currentFareEstimate}
              </div>
            </div>
          </div>

          {/* 6. Uber BD Style Timing (Leave Now vs Schedule for Later) & Seats */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Departure Time
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setTimeMode('now');
                    setForm({ ...form, scheduledTime: new Date().toISOString() });
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                    timeMode === 'now'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  ⚡ Leave Now (Instant)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTimeMode('scheduled');
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                    timeMode === 'scheduled'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  📅 Schedule for Later
                </button>
              </div>

              {timeMode === 'scheduled' ? (
                <input
                  type="datetime-local"
                  value={form.scheduledTime ? form.scheduledTime.substring(0, 16) : ''}
                  onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <div className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                  <span>⚡ Departure: Ride Now</span>
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Seats Needed
              </label>
              <input
                type="number"
                min={1}
                max={vehicleType === 'bike' ? 1 : vehicleType === 'cng' ? 3 : 4}
                value={form.seatsNeeded}
                onChange={(e) => setForm({ ...form, seatsNeeded: +e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                {vehicleType === 'bike' ? '🏍️ Bike allows maximum 1 passenger seat' : vehicleType === 'cng' ? '🛺 CNG allows up to 3 seats' : '🚗 Car allows up to 4 seats'}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-xl shadow-indigo-500/25 disabled:opacity-50 text-base cursor-pointer"
          >
            {loading ? 'Posting Request...' : 'Request a Ride'}
          </button>
        </form>
      </div>
    </div>
  );
}
