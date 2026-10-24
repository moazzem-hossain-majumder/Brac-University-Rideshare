import { useEffect, useState } from 'react';
import api from '../../api/axios';
import socket from '../../api/socket';
import { useAuth } from '../../context/AuthContext';
import ChatBox from './ChatBox';
import LiveRideMap from '../common/LiveRideMap';
import { CAMPUS_LOCATIONS, calculateDistanceKm, estimateFare, findLocationCoords } from '../../constants/locations';

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
      setTimeout(onSuccess, 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl">
        <div className={`bg-gradient-to-r ${bgGrad} px-6 py-5 text-white`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl font-black">{brandName}</span>
            <button onClick={onClose} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm hover:bg-white/30">
              ✕
            </button>
          </div>
          <div className="text-white/80 text-sm">Payment Amount</div>
          <div className="text-3xl font-bold">Tk {fare}</div>
        </div>

        <div className="bg-white px-6 py-6">
          {step === 3 ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-3">✅</div>
              <div className="font-bold text-gray-800 text-lg">Payment Successful!</div>
              <div className="text-gray-500 text-sm mt-1">Tk {fare} paid via {brandName}</div>
            </div>
          ) : step === 1 ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {brandName} Account Number
              </label>
              <input
                value={number}
                onChange={e => setNumber(e.target.value.replace(/\D/g, ''))}
                maxLength={11}
                placeholder="01XXXXXXXXX"
                type="tel"
                className={`w-full px-4 py-3 border-2 ${borderColor} rounded-xl text-lg font-mono focus:outline-none text-center tracking-widest`}
              />
              <p className="text-xs text-gray-400 mt-2 text-center">
                Enter your {brandName} registered number
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {brandName} PIN
              </label>
              <input
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                maxLength={5}
                placeholder="• • • • •"
                type="password"
                className={`w-full px-4 py-3 border-2 ${borderColor} rounded-xl text-lg font-mono focus:outline-none text-center tracking-widest`}
              />
              <p className="text-xs text-gray-400 mt-2 text-center">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 text-white text-center">
          <div className="text-3xl mb-2">⭐</div>
          <div className="font-bold text-lg">Rate your ride</div>
          <div className="text-indigo-200 text-sm">with {riderName}</div>
        </div>
        <div className="p-6">
          {done ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-2">🙏</div>
              <div className="font-semibold text-gray-800">Thanks for your feedback!</div>
            </div>
          ) : (
            <>
              <div className="flex justify-center gap-3 mb-5">
                {[1, 2, 3, 4, 5].map(s => (
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
                onChange={e => setComment(e.target.value)}
                rows={3}
                placeholder="Tell us about your experience (optional)"
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none mb-4"
              />
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-2.5 border rounded-xl text-sm text-gray-500 hover:bg-gray-50">
                  Skip
                </button>
                <button
                  onClick={submit}
                  disabled={!rating}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-40"
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
  const [view, setView] = useState('request');
  const [form, setForm] = useState({ startLocation: '', endLocation: '', scheduledTime: '', seatsNeeded: 1 });
  const [myRequest, setMyRequest] = useState(null);
  const [offers, setOffers] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [completedRide, setCompletedRide] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    socket.connect();
    socket.emit('join_user', user.id);
    socket.on('offer_received', (offer) => {
      setOffers((prev) => (prev.find((o) => o._id === offer._id) ? prev : [offer, ...prev]));
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
        socket.emit('join_ride', data._id);
        setView('active');
        return;
      }
    } catch (_) {}
    try {
      const reqs = await api.get('/ride-requests/mine');
      const open = reqs.data.find((r) => r.status === 'Open');
      if (open) {
        setMyRequest(open);
        const offs = await api.get(`/ride-offers/request/${open._id}`);
        setOffers(offs.data);
        setView('offers');
      }
    } catch (_) {}
  };

  const postRequest = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const { data } = await api.post('/ride-requests', form);
      setMyRequest(data); setView('offers');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post request');
    } finally { setLoading(false); }
  };

  const acceptOffer = async (offer) => {
    try {
      const { data } = await api.patch(`/ride-offers/${offer._id}/accept`);
      socket.emit('offer_accepted', { riderId: offer.rider._id, rideId: data._id });
      setActiveRide(data); setView('active');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
    }
  };

  const cancelRequest = async () => {
    await api.patch(`/ride-requests/${myRequest._id}/cancel`);
    setMyRequest(null); setOffers([]); setView('request');
  };

  const onPaymentSuccess = () => {
    setPayModal(null);
    setCompletedRide(activeRide);
    setShowFeedback(true);
  };

  const handleCash = async () => {
    await api.patch(`/active-rides/${activeRide._id}/complete`, { paymentMethod: 'Cash' });
    setCompletedRide(activeRide);
    setShowFeedback(true);
  };

  const onFeedbackClose = () => {
    setShowFeedback(false); setCompletedRide(null); setActiveRide(null); setView('request');
  };

  // ── Active ride screen ──
  if (view === 'active' && activeRide) {
    return (
      <div className="max-w-lg mx-auto">
        {payModal && (
          <MobilePayModal
            method={payModal}
            fare={activeRide.fare}
            rideId={activeRide._id}
            onSuccess={onPaymentSuccess}
            onClose={() => setPayModal(null)}
          />
        )}
        {showFeedback && (
          <FeedbackModal
            rideId={completedRide?._id}
            riderName={completedRide?.rider?.name}
            onClose={onFeedbackClose}
          />
        )}

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Ride</h2>
          <p className="text-gray-500 text-sm mt-1">Live tracking & navigation</p>
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
              <img src={activeRide.rider.profilePicture} alt="" className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/30" />
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
              <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
              <span className="text-white/70">From</span>
              <span className="font-medium ml-auto">{activeRide.request?.startLocation}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
              <span className="text-white/70">To</span>
              <span className="font-medium ml-auto">{activeRide.request?.endLocation}</span>
            </div>
          </div>
          <div className={`mt-4 flex items-center gap-2 text-sm font-medium ${activeRide.status === 'Arrived' ? 'text-green-300' : 'text-yellow-300'}`}>
            {activeRide.status === 'Arrived' ? '✅ Arrived at destination!' : '🚗 Ride in progress...'}
          </div>
        </div>

        {activeRide.status === 'Arrived' && activeRide.paymentStatus === 'Pending' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-1">Complete Payment</h3>
            <p className="text-gray-500 text-sm mb-4">Pay Tk {activeRide.fare} to your rider</p>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setPayModal('Bkash')}
                className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-gradient-to-b from-pink-50 to-pink-100 border border-pink-200 hover:from-pink-100 hover:to-pink-200 transition-all"
              >
                <span className="text-2xl">💳</span>
                <span className="text-xs font-bold text-pink-700">bKash</span>
              </button>
              <button
                onClick={() => setPayModal('Nagad')}
                className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-gradient-to-b from-orange-50 to-orange-100 border border-orange-200 hover:from-orange-100 hover:to-orange-200 transition-all"
              >
                <span className="text-2xl">💰</span>
                <span className="text-xs font-bold text-orange-700">Nagad</span>
              </button>
              <button
                onClick={handleCash}
                className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-gradient-to-b from-green-50 to-green-100 border border-green-200 hover:from-green-100 hover:to-green-200 transition-all"
              >
                <span className="text-2xl">💵</span>
                <span className="text-xs font-bold text-green-700">Cash</span>
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowChat(!showChat)}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 rounded-2xl text-sm font-medium text-gray-700 transition-colors mb-3"
        >
          💬 {showChat ? 'Hide Chat' : 'Chat with Rider'}
        </button>
        {showChat && <ChatBox rideId={activeRide._id} otherName={activeRide.rider?.name} />}
      </div>
    );
  }

  // ── Offers screen ──
  if (view === 'offers') {
    return (
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Ride Offers</h2>
            <p className="text-gray-500 text-sm mt-1">Choose your preferred rider</p>
          </div>
          <button onClick={cancelRequest} className="text-sm text-red-500 hover:text-red-700 font-medium">
            Cancel
          </button>
        </div>

        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span className="text-green-500 font-bold">●</span>
            <span className="font-medium">{myRequest?.startLocation}</span>
            <span className="text-gray-400 mx-1">→</span>
            <span className="font-medium">{myRequest?.endLocation}</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {new Date(myRequest?.scheduledTime).toLocaleString()}
          </div>
        </div>

        {offers.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">⏳</div>
            <div className="text-gray-700 font-semibold">Waiting for riders...</div>
            <div className="text-gray-400 text-sm mt-1">Riders will send their offers here</div>
            <div className="mt-4 flex justify-center gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-indigo-300 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {offers.map(offer => (
              <div key={offer._id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {offer.rider?.profilePicture ? (
                      <img src={offer.rider.profilePicture} alt="" className="w-11 h-11 rounded-xl object-cover" />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">
                        {offer.rider?.name?.[0]}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-gray-800">{offer.rider?.name}</div>
                      <div className="text-xs text-gray-500">{offer.rider?.department} · {offer.rider?.location}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-indigo-600">Tk {offer.fare}</div>
                  </div>
                </div>
                {offer.note && (
                  <div className="mt-3 text-sm text-gray-500 italic bg-gray-50 rounded-xl px-3 py-2">
                    "{offer.note}"
                  </div>
                )}
                <button
                  onClick={() => acceptOffer(offer)}
                  className="w-full mt-3 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md shadow-indigo-500/20"
                >
                  Accept this offer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Request form ──
  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Request a Ride</h2>
        <p className="text-gray-500 text-sm mt-1">Post your request and riders will offer you fares</p>
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">{error}</div>
      )}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <form onSubmit={postRequest} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Pick-up Location
              </label>
              <span className="text-[11px] text-indigo-500 font-medium">Quick Pick</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {['Mirpur 10', 'Uttara', 'Dhanmondi', 'Mohakhali'].map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setForm({ ...form, startLocation: loc })}
                  className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg font-medium text-slate-600 border border-slate-200 transition-colors"
                >
                  📍 {loc}
                </button>
              ))}
            </div>
            <input
              value={form.startLocation}
              onChange={(e) => setForm({ ...form, startLocation: e.target.value })}
              required
              placeholder="e.g. Mirpur 10, Dhanmondi 27..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Drop-off Location
              </label>
              <span className="text-[11px] text-indigo-500 font-medium">Campus Destinations</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {['BRACU Merul Badda', 'BRACU Mohakhali', 'Banani 11', 'Kuril'].map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setForm({ ...form, endLocation: loc })}
                  className="px-2.5 py-1 text-xs bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 rounded-lg font-medium border border-indigo-200/60 transition-colors"
                >
                  🎓 {loc}
                </button>
              ))}
            </div>
            <input
              value={form.endLocation}
              onChange={(e) => setForm({ ...form, endLocation: e.target.value })}
              required
              placeholder="e.g. BRACU Merul Badda, Mohakhali..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Real-time Estimated Distance & Fare preview */}
          {form.startLocation && form.endLocation && (
            <div className="p-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wide">
                  Estimated Trip
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  Approx.{' '}
                  <span className="font-bold text-slate-800">
                    {calculateDistanceKm(
                      findLocationCoords(form.startLocation, 2).lat,
                      findLocationCoords(form.startLocation, 2).lng,
                      findLocationCoords(form.endLocation, 0).lat,
                      findLocationCoords(form.endLocation, 0).lng
                    )}{' '}
                    km
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-slate-400">Fair Fare Guide</div>
                <div className="text-lg font-black text-indigo-700">
                  Tk{' '}
                  {estimateFare(
                    calculateDistanceKm(
                      findLocationCoords(form.startLocation, 2).lat,
                      findLocationCoords(form.startLocation, 2).lng,
                      findLocationCoords(form.endLocation, 0).lat,
                      findLocationCoords(form.endLocation, 0).lng
                    )
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">When</label>
              <input
                type="datetime-local"
                value={form.scheduledTime}
                onChange={e => setForm({ ...form, scheduledTime: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Seats</label>
              <input
                type="number"
                min={1}
                max={4}
                value={form.seatsNeeded}
                onChange={e => setForm({ ...form, seatsNeeded: +e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
          >
            {loading ? 'Posting...' : 'Request a Ride'}
          </button>
        </form>
      </div>
    </div>
  );
}
