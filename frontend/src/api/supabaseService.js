import { supabase, isSupabaseConfigured } from './supabase';
import { findLocationCoords } from '../constants/locations';

// Normalize helper to guarantee MongoDB-like compatibility (_id, id, camelCase)
export function normalizeUser(row) {
  if (!row) return null;
  return {
    ...row,
    id: row.id,
    _id: row.id,
    userType: row.user_type,
    studentId: row.student_id,
    profilePicture: row.profile_picture || '',
    profileComplete: Boolean(row.profile_complete),
    createdAt: row.created_at,
  };
}

export function normalizeRequest(row) {
  if (!row) return null;
  return {
    ...row,
    id: row.id,
    _id: row.id,
    startLocation: row.start_location,
    endLocation: row.end_location,
    scheduledTime: row.scheduled_time,
    seatsNeeded: row.seats_needed,
    passenger: row.passenger ? normalizeUser(row.passenger) : { _id: row.passenger_id, id: row.passenger_id },
    acceptedOffer: row.accepted_offer_id,
    createdAt: row.created_at,
  };
}

export function normalizeOffer(row) {
  if (!row) return null;
  return {
    ...row,
    id: row.id,
    _id: row.id,
    request: row.request_id,
    rider: row.rider ? normalizeUser(row.rider) : { _id: row.rider_id, id: row.rider_id },
    fare: Number(row.fare),
    createdAt: row.created_at,
  };
}

export function normalizeActiveRide(row) {
  if (!row) return null;
  const req = row.request ? normalizeRequest(row.request) : null;
  const pickup = row.pickup_lat && row.pickup_lng
    ? { lat: Number(row.pickup_lat), lng: Number(row.pickup_lng), label: req?.startLocation || 'Pickup' }
    : findLocationCoords(req?.startLocation, 2);
  const dropoff = row.dropoff_lat && row.dropoff_lng
    ? { lat: Number(row.dropoff_lat), lng: Number(row.dropoff_lng), label: req?.endLocation || 'Destination' }
    : findLocationCoords(req?.endLocation, 0);

  const riderLoc = row.rider_latitude && row.rider_longitude
    ? {
        lat: Number(row.rider_latitude),
        lng: Number(row.rider_longitude),
        heading: Number(row.rider_heading || 0),
        speed: Number(row.rider_speed || 0),
      }
    : {
        lat: pickup.lat - 0.003,
        lng: pickup.lng - 0.002,
        heading: 45,
        speed: 28,
      };

  return {
    ...row,
    id: row.id,
    _id: row.id,
    rider: row.rider ? normalizeUser(row.rider) : { _id: row.rider_id, id: row.rider_id },
    passenger: row.passenger ? normalizeUser(row.passenger) : { _id: row.passenger_id, id: row.passenger_id },
    request: req || { _id: row.request_id, id: row.request_id },
    fare: Number(row.fare),
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    riderLocation: riderLoc,
    pickupLocation: pickup,
    dropoffLocation: dropoff,
    etaMinutes: row.eta_minutes || 5,
    sosTriggered: Boolean(row.sos_triggered),
    createdAt: row.created_at,
  };
}

export function normalizeFeedback(row) {
  if (!row) return null;
  return {
    ...row,
    id: row.id,
    _id: row.id,
    passenger: row.passenger ? normalizeUser(row.passenger) : { _id: row.passenger_id, id: row.passenger_id },
    ride: row.ride ? normalizeActiveRide(row.ride) : null,
    rating: Number(row.rating),
    createdAt: row.created_at,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Supabase Database Service
// ─────────────────────────────────────────────────────────────────────────────
export const SupabaseService = {
  // ── Auth ──
  async login({ email, password, userType }) {
    if (isSupabaseConfigured()) {
      const cleanEmail = email.trim().toLowerCase();
      const { data: user, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', cleanEmail)
        .eq('user_type', userType)
        .single();

      if (error || !user) {
        throw new Error('Invalid credentials');
      }

      // Check student approval
      if (user.user_type === 'student' && user.status !== 'Approved') {
        const err = new Error('Your account is pending admin approval');
        err.status = 403;
        throw err;
      }

      const normalized = normalizeUser(user);
      return {
        token: `sb_token_${user.id}`,
        user: normalized,
      };
    }

    // Local simulated auth if no Supabase credentials
    return MockStorage.login({ email, password, userType });
  },

  async register({ name, email, phone, password, studentId }) {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith('@g.bracu.ac.bd')) {
      throw new Error('Only @g.bracu.ac.bd email addresses are allowed');
    }

    if (isSupabaseConfigured()) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', cleanEmail)
        .single();

      if (existing) {
        throw new Error('Email already registered');
      }

      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          name,
          email: cleanEmail,
          phone,
          student_id: studentId,
          user_type: 'student',
          status: 'Pending',
          role: 'Passenger',
          profile_complete: false,
        }])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return { message: 'Registration submitted! Waiting for admin approval.', user: normalizeUser(data) };
    }

    return MockStorage.register({ name, email: cleanEmail, phone, password, studentId });
  },

  // ── Profile ──
  async getProfile(userId) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw new Error(error.message);
      return normalizeUser(data);
    }
    return MockStorage.getProfile(userId);
  },

  async updateProfile(userId, formDataOrObject) {
    let updates = {};
    let file = null;

    if (formDataOrObject instanceof FormData) {
      for (const [key, value] of formDataOrObject.entries()) {
        if (key === 'profilePicture' && value instanceof File) {
          file = value;
        } else {
          updates[key] = value;
        }
      }
    } else {
      updates = { ...formDataOrObject };
      file = updates.profilePicture instanceof File ? updates.profilePicture : null;
    }

    let profilePictureUrl = updates.profilePicture;

    if (file && isSupabaseConfigured()) {
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        profilePictureUrl = urlData.publicUrl;
      }
    }

    const payload = {
      name: updates.name,
      phone: updates.phone,
      location: updates.location,
      department: updates.department,
      bio: updates.bio,
      profile_complete: true,
    };
    if (profilePictureUrl && typeof profilePictureUrl === 'string') {
      payload.profile_picture = profilePictureUrl;
    }

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', userId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return normalizeUser(data);
    }

    return MockStorage.updateProfile(userId, payload);
  },

  // ── Ride Requests ──
  async postRideRequest(userId, requestData) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('ride_requests')
        .insert([{
          passenger_id: userId,
          start_location: requestData.startLocation,
          end_location: requestData.endLocation,
          scheduled_time: requestData.scheduledTime,
          seats_needed: Number(requestData.seatsNeeded) || 1,
          status: 'Open',
        }])
        .select('*, passenger:profiles(*)')
        .single();

      if (error) throw new Error(error.message);
      return normalizeRequest(data);
    }
    return MockStorage.postRideRequest(userId, requestData);
  },

  async getOpenRequests() {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('ride_requests')
        .select('*, passenger:profiles(*)')
        .eq('status', 'Open')
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data || []).map(normalizeRequest);
    }
    return MockStorage.getOpenRequests();
  },

  async getMyRequests(userId) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('ride_requests')
        .select('*, passenger:profiles(*)')
        .eq('passenger_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data || []).map(normalizeRequest);
    }
    return MockStorage.getMyRequests(userId);
  },

  async cancelRequest(userId, requestId) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('ride_requests')
        .update({ status: 'Cancelled' })
        .eq('id', requestId)
        .eq('passenger_id', userId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return normalizeRequest(data);
    }
    return MockStorage.cancelRequest(userId, requestId);
  },

  // ── Ride Offers ──
  async sendOffer(riderId, riderName, { requestId, fare, note }) {
    if (isSupabaseConfigured()) {
      // Check request
      const { data: request } = await supabase
        .from('ride_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (!request || request.status !== 'Open') {
        throw new Error('Request not available');
      }

      const { data: offer, error } = await supabase
        .from('ride_offers')
        .insert([{
          request_id: requestId,
          rider_id: riderId,
          fare: Number(fare),
          note: note || '',
          status: 'Pending',
        }])
        .select('*, rider:profiles(*)')
        .single();

      if (error) throw new Error(error.message);

      // Create notification for passenger
      await supabase.from('notifications').insert([{
        receiver_id: request.passenger_id,
        message: `${riderName} offered Tk ${fare} for your ride request`,
      }]);

      return normalizeOffer(offer);
    }
    return MockStorage.sendOffer(riderId, riderName, { requestId, fare, note });
  },

  async getOffersForRequest(requestId) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('ride_offers')
        .select('*, rider:profiles(*)')
        .eq('request_id', requestId);

      if (error) throw new Error(error.message);
      return (data || []).map(normalizeOffer);
    }
    return MockStorage.getOffersForRequest(requestId);
  },

  async acceptOffer(passengerId, passengerName, offerId) {
    if (isSupabaseConfigured()) {
      const { data: offer } = await supabase
        .from('ride_offers')
        .select('*, request:ride_requests(*)')
        .eq('id', offerId)
        .single();

      if (!offer) throw new Error('Offer not found');
      if (offer.request.passenger_id !== passengerId) throw new Error('Not authorized');

      // Update offer statuses
      await supabase.from('ride_offers').update({ status: 'Rejected' }).eq('request_id', offer.request_id);
      await supabase.from('ride_offers').update({ status: 'Accepted' }).eq('id', offerId);
      await supabase.from('ride_requests').update({ status: 'Accepted', accepted_offer_id: offerId }).eq('id', offer.request_id);

      // Create active ride
      const { data: activeRide, error: activeErr } = await supabase
        .from('active_rides')
        .insert([{
          request_id: offer.request_id,
          offer_id: offerId,
          rider_id: offer.rider_id,
          passenger_id: passengerId,
          fare: offer.fare,
          status: 'Ongoing',
          payment_status: 'Pending',
        }])
        .select('*, rider:profiles(*), passenger:profiles(*), request:ride_requests(*)')
        .single();

      if (activeErr) throw new Error(activeErr.message);

      // Notify rider
      await supabase.from('notifications').insert([{
        receiver_id: offer.rider_id,
        message: `${passengerName} accepted your offer of Tk ${offer.fare}`,
      }]);

      return normalizeActiveRide(activeRide);
    }
    return MockStorage.acceptOffer(passengerId, passengerName, offerId);
  },

  // ── Active Rides ──
  async getMyActiveRide(userId) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('active_rides')
        .select('*, rider:profiles(*), passenger:profiles(*), request:ride_requests(*)')
        .or(`rider_id.eq.${userId},passenger_id.eq.${userId}`)
        .in('status', ['Ongoing', 'Arrived'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) return null;
      return normalizeActiveRide(data);
    }
    return MockStorage.getMyActiveRide(userId);
  },

  async getRideHistory(userId) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('active_rides')
        .select('*, rider:profiles(*), passenger:profiles(*), request:ride_requests(*)')
        .or(`rider_id.eq.${userId},passenger_id.eq.${userId}`)
        .eq('status', 'Completed')
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data || []).map(normalizeActiveRide);
    }
    return MockStorage.getRideHistory(userId);
  },

  async markArrived(riderId, rideId) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('active_rides')
        .update({ status: 'Arrived' })
        .eq('id', rideId)
        .eq('rider_id', riderId)
        .select('*, rider:profiles(*), passenger:profiles(*), request:ride_requests(*)')
        .single();

      if (error) throw new Error(error.message);
      return normalizeActiveRide(data);
    }
    return MockStorage.markArrived(riderId, rideId);
  },

  async completeRide(rideId, { paymentMethod }) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('active_rides')
        .update({
          status: 'Completed',
          payment_status: 'Paid',
          payment_method: paymentMethod || 'Cash',
        })
        .eq('id', rideId)
        .select('*, rider:profiles(*), passenger:profiles(*), request:ride_requests(*)')
        .single();

      if (error) throw new Error(error.message);
      return normalizeActiveRide(data);
    }
    return MockStorage.completeRide(rideId, { paymentMethod });
  },

  async updateRiderLocation(rideId, { lat, lng, heading, speed, etaMinutes }) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('active_rides')
        .update({
          rider_latitude: lat,
          rider_longitude: lng,
          rider_heading: heading || 0,
          rider_speed: speed || 0,
          eta_minutes: etaMinutes || 5,
          last_location_updated_at: new Date().toISOString(),
        })
        .eq('id', rideId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return normalizeActiveRide(data);
    }
    return MockStorage.updateRiderLocation(rideId, { lat, lng, heading, speed, etaMinutes });
  },

  // ── Chat ──
  async getChatMessages(rideId) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('ride_id', rideId)
        .order('created_at', { ascending: true });

      if (error) return [];
      return (data || []).map(row => ({
        ...row,
        _id: row.id,
        sender: row.sender_id,
        senderName: row.sender_name,
        createdAt: row.created_at,
      }));
    }
    return MockStorage.getChatMessages(rideId);
  },

  async sendChatMessage(userId, userName, { bookingId, message }) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('chats')
        .insert([{
          ride_id: bookingId,
          sender_id: userId,
          sender_name: userName,
          message,
        }])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return {
        ...data,
        _id: data.id,
        sender: data.sender_id,
        senderName: data.sender_name,
      };
    }
    return MockStorage.sendChatMessage(userId, userName, { bookingId, message });
  },

  // ── Notifications ──
  async getNotifications(userId) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('receiver_id', userId)
        .order('created_at', { ascending: false });

      if (error) return [];
      return (data || []).map(row => ({
        ...row,
        _id: row.id,
        createdAt: row.created_at,
      }));
    }
    return MockStorage.getNotifications(userId);
  },

  async markNotificationRead(id) {
    if (isSupabaseConfigured()) {
      const { data } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .select()
        .single();
      return data ? { ...data, _id: data.id } : null;
    }
    return MockStorage.markNotificationRead(id);
  },

  // ── Feedback ──
  async submitFeedback(userId, { rideId, rating, comment }) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('feedbacks')
        .insert([{
          ride_id: rideId,
          passenger_id: userId,
          rating: Number(rating),
          comment: comment || '',
          status: 'Visible',
        }])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return normalizeFeedback(data);
    }
    return MockStorage.submitFeedback(userId, { rideId, rating, comment });
  },

  async getAllFeedback() {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('feedbacks')
        .select('*, passenger:profiles(*), ride:active_rides(*, rider:profiles(*), request:ride_requests(*))')
        .order('created_at', { ascending: false });

      if (error) return [];
      return (data || []).map(normalizeFeedback);
    }
    return MockStorage.getAllFeedback();
  },

  async toggleFeedbackVisibility(id) {
    if (isSupabaseConfigured()) {
      const { data: current } = await supabase.from('feedbacks').select('status').eq('id', id).single();
      const newStatus = current?.status === 'Visible' ? 'Hidden' : 'Visible';
      const { data, error } = await supabase
        .from('feedbacks')
        .update({ status: newStatus })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return normalizeFeedback(data);
    }
    return MockStorage.toggleFeedbackVisibility(id);
  },

  // ── Admin Students ──
  async getStudents() {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'student')
        .order('created_at', { ascending: false });

      if (error) return [];
      return (data || []).map(normalizeUser);
    }
    return MockStorage.getStudents();
  },

  async approveStudent(id) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ status: 'Approved' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return normalizeUser(data);
    }
    return MockStorage.approveStudent(id);
  },

  async deleteStudent(id) {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return { message: 'User deleted' };
    }
    return MockStorage.deleteStudent(id);
  },

  // ── Standalone Rides & Bookings ──
  async getMineRides(userId) {
    if (isSupabaseConfigured()) {
      const { data } = await supabase.from('rides').select('*').eq('rider_id', userId);
      return data || [];
    }
    return MockStorage.getMineRides(userId);
  },

  async createRide(userId, rideData) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('rides')
        .insert([{
          rider_id: userId,
          start_location: rideData.startLocation,
          end_location: rideData.endLocation,
          ride_date_time: rideData.rideDateTime,
          fare: Number(rideData.fare),
          seats: Number(rideData.seats) || 3,
          status: 'Available',
        }])
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    }
    return MockStorage.createRide(userId, rideData);
  },

  async getMineBookings(userId) {
    if (isSupabaseConfigured()) {
      const { data } = await supabase.from('bookings').select('*, ride:rides(*, rider:profiles(*))').eq('passenger_id', userId);
      return data || [];
    }
    return MockStorage.getMineBookings(userId);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// In-Memory / LocalStorage Mock Storage (Seamless offline & initial dev testing)
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_KEY = 'bracu_rideshare_mock_db';

function getMockDB() {
  try {
    const raw = localStorage.getItem(MOCK_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}

  // Seed default admin and initial sample data
  const initial = {
    users: [
      {
        id: 'admin_id_001',
        _id: 'admin_id_001',
        name: 'Super Admin',
        email: 'admin@gmail.com',
        phone: '01700000000',
        userType: 'admin',
        status: 'Approved',
        profileComplete: true,
      },
      {
        id: 'student_id_001',
        _id: 'student_id_001',
        name: 'Tanvir Ahmed',
        email: 'tanvir@g.bracu.ac.bd',
        phone: '01711111111',
        userType: 'student',
        studentId: '20101420',
        status: 'Approved',
        profileComplete: true,
        location: 'Mirpur 10',
        department: 'CSE',
        bio: 'Daily commuter from Mirpur to BRACU Merul Badda.',
      },
      {
        id: 'student_id_002',
        _id: 'student_id_002',
        name: 'Sadia Rahman',
        email: 'sadia@g.bracu.ac.bd',
        phone: '01722222222',
        userType: 'student',
        studentId: '21101850',
        status: 'Pending',
        profileComplete: false,
        location: 'Uttara Sector 7',
        department: 'BBA',
        bio: 'BRACU BBA 3rd year student.',
      },
    ],
    requests: [
      {
        id: 'req_001',
        _id: 'req_001',
        passenger: {
          _id: 'student_id_001',
          id: 'student_id_001',
          name: 'Tanvir Ahmed',
          location: 'Mirpur 10',
          department: 'CSE',
          phone: '01711111111',
        },
        startLocation: 'Mirpur 10',
        endLocation: 'BRACU Merul Badda',
        scheduledTime: new Date(Date.now() + 3600000).toISOString(),
        seatsNeeded: 1,
        status: 'Open',
        createdAt: new Date().toISOString(),
      },
    ],
    offers: [],
    activeRides: [],
    chats: {},
    notifications: [],
    feedback: [],
    rides: [],
    bookings: [],
  };

  saveMockDB(initial);
  return initial;
}

function saveMockDB(db) {
  try {
    localStorage.setItem(MOCK_KEY, JSON.stringify(db));
  } catch (_) {}
}

const MockStorage = {
  login({ email, userType }) {
    const db = getMockDB();
    const cleanEmail = email.trim().toLowerCase();
    const user = db.users.find(u => u.email.toLowerCase() === cleanEmail && u.userType === userType);

    if (!user) throw new Error('Invalid credentials');
    if (user.userType === 'student' && user.status !== 'Approved') {
      const err = new Error('Your account is pending admin approval');
      err.status = 403;
      throw err;
    }

    return { token: `mock_jwt_${user.id}`, user };
  },

  register({ name, email, phone, studentId }) {
    const db = getMockDB();
    const cleanEmail = email.trim().toLowerCase();
    if (db.users.some(u => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('Email already registered');
    }

    const newUser = {
      id: `usr_${Date.now()}`,
      _id: `usr_${Date.now()}`,
      name,
      email: cleanEmail,
      phone,
      studentId,
      userType: 'student',
      status: 'Pending',
      role: 'Passenger',
      profileComplete: false,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    saveMockDB(db);
    return { message: 'Registration submitted! Waiting for admin approval.', user: newUser };
  },

  getProfile(userId) {
    const db = getMockDB();
    const user = db.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    return user;
  },

  updateProfile(userId, payload) {
    const db = getMockDB();
    const idx = db.users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      db.users[idx] = { ...db.users[idx], ...payload, profileComplete: true };
      saveMockDB(db);
      return db.users[idx];
    }
    return null;
  },

  postRideRequest(userId, requestData) {
    const db = getMockDB();
    const user = db.users.find(u => u.id === userId);
    const newReq = {
      id: `req_${Date.now()}`,
      _id: `req_${Date.now()}`,
      passenger: user,
      startLocation: requestData.startLocation,
      endLocation: requestData.endLocation,
      scheduledTime: requestData.scheduledTime,
      seatsNeeded: Number(requestData.seatsNeeded) || 1,
      status: 'Open',
      createdAt: new Date().toISOString(),
    };
    db.requests.unshift(newReq);
    saveMockDB(db);
    return newReq;
  },

  getOpenRequests() {
    const db = getMockDB();
    return db.requests.filter(r => r.status === 'Open');
  },

  getMyRequests(userId) {
    const db = getMockDB();
    return db.requests.filter(r => r.passenger?._id === userId || r.passenger?.id === userId);
  },

  cancelRequest(userId, requestId) {
    const db = getMockDB();
    const req = db.requests.find(r => r.id === requestId);
    if (req) {
      req.status = 'Cancelled';
      saveMockDB(db);
    }
    return req;
  },

  sendOffer(riderId, riderName, { requestId, fare, note }) {
    const db = getMockDB();
    const rider = db.users.find(u => u.id === riderId);
    const request = db.requests.find(r => r.id === requestId);
    if (!request || request.status !== 'Open') throw new Error('Request not available');

    const offer = {
      id: `off_${Date.now()}`,
      _id: `off_${Date.now()}`,
      request: requestId,
      rider,
      fare: Number(fare),
      note: note || '',
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    db.offers.push(offer);

    // Notification
    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      _id: `notif_${Date.now()}`,
      receiver_id: request.passenger._id,
      message: `${riderName} offered Tk ${fare} for your ride request`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    saveMockDB(db);
    return offer;
  },

  getOffersForRequest(requestId) {
    const db = getMockDB();
    return db.offers.filter(o => o.request === requestId);
  },

  acceptOffer(passengerId, passengerName, offerId) {
    const db = getMockDB();
    const offer = db.offers.find(o => o.id === offerId);
    if (!offer) throw new Error('Offer not found');
    const request = db.requests.find(r => r.id === offer.request);

    offer.status = 'Accepted';
    request.status = 'Accepted';

    const activeRide = {
      id: `act_${Date.now()}`,
      _id: `act_${Date.now()}`,
      rider: offer.rider,
      passenger: db.users.find(u => u.id === passengerId),
      request,
      fare: offer.fare,
      status: 'Ongoing',
      paymentStatus: 'Pending',
      createdAt: new Date().toISOString(),
    };
    db.activeRides.unshift(activeRide);

    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      _id: `notif_${Date.now()}`,
      receiver_id: offer.rider.id,
      message: `${passengerName} accepted your offer of Tk ${offer.fare}`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    saveMockDB(db);
    return activeRide;
  },

  getMyActiveRide(userId) {
    const db = getMockDB();
    return db.activeRides.find(
      r => (r.rider?._id === userId || r.passenger?._id === userId) && ['Ongoing', 'Arrived'].includes(r.status)
    ) || null;
  },

  getRideHistory(userId) {
    const db = getMockDB();
    return db.activeRides.filter(
      r => (r.rider?._id === userId || r.passenger?._id === userId) && r.status === 'Completed'
    );
  },

  markArrived(riderId, rideId) {
    const db = getMockDB();
    const ride = db.activeRides.find(r => r.id === rideId);
    if (ride) {
      ride.status = 'Arrived';
      saveMockDB(db);
    }
    return ride;
  },

  completeRide(rideId, { paymentMethod }) {
    const db = getMockDB();
    const ride = db.activeRides.find(r => r.id === rideId);
    if (ride) {
      ride.status = 'Completed';
      ride.paymentStatus = 'Paid';
      ride.paymentMethod = paymentMethod || 'Cash';
      saveMockDB(db);
    }
    return ride;
  },

  updateRiderLocation(rideId, { lat, lng, heading, speed, etaMinutes }) {
    const db = getMockDB();
    const ride = db.activeRides.find(r => r.id === rideId);
    if (ride) {
      ride.rider_latitude = lat;
      ride.rider_longitude = lng;
      ride.rider_heading = heading || 0;
      ride.rider_speed = speed || 0;
      ride.eta_minutes = etaMinutes || 5;
      saveMockDB(db);
    }
    return ride;
  },

  getChatMessages(rideId) {
    const db = getMockDB();
    return db.chats[rideId] || [];
  },

  sendChatMessage(userId, userName, { bookingId, message }) {
    const db = getMockDB();
    if (!db.chats[bookingId]) db.chats[bookingId] = [];
    const msg = {
      _id: `msg_${Date.now()}`,
      rideId: bookingId,
      sender: userId,
      senderName: userName,
      message,
      createdAt: new Date().toISOString(),
    };
    db.chats[bookingId].push(msg);
    saveMockDB(db);
    return msg;
  },

  getNotifications(userId) {
    const db = getMockDB();
    return db.notifications.filter(n => n.receiver_id === userId);
  },

  markNotificationRead(id) {
    const db = getMockDB();
    const n = db.notifications.find(item => item.id === id || item._id === id);
    if (n) {
      n.read = true;
      saveMockDB(db);
    }
    return n;
  },

  submitFeedback(userId, { rideId, rating, comment }) {
    const db = getMockDB();
    const passenger = db.users.find(u => u.id === userId);
    const ride = db.activeRides.find(r => r.id === rideId);
    const fb = {
      id: `fb_${Date.now()}`,
      _id: `fb_${Date.now()}`,
      passenger,
      ride,
      rating,
      comment,
      status: 'Visible',
      createdAt: new Date().toISOString(),
    };
    db.feedback.unshift(fb);
    saveMockDB(db);
    return fb;
  },

  getAllFeedback() {
    const db = getMockDB();
    return db.feedback;
  },

  toggleFeedbackVisibility(id) {
    const db = getMockDB();
    const fb = db.feedback.find(item => item.id === id || item._id === id);
    if (fb) {
      fb.status = fb.status === 'Visible' ? 'Hidden' : 'Visible';
      saveMockDB(db);
    }
    return fb;
  },

  getStudents() {
    const db = getMockDB();
    return db.users.filter(u => u.userType === 'student');
  },

  approveStudent(id) {
    const db = getMockDB();
    const student = db.users.find(u => u.id === id || u._id === id);
    if (student) {
      student.status = 'Approved';
      saveMockDB(db);
    }
    return student;
  },

  deleteStudent(id) {
    const db = getMockDB();
    db.users = db.users.filter(u => u.id !== id && u._id !== id);
    saveMockDB(db);
    return { message: 'User deleted' };
  },

  getMineRides(userId) {
    const db = getMockDB();
    return db.rides.filter(r => r.rider_id === userId);
  },

  createRide(userId, rideData) {
    const db = getMockDB();
    const ride = {
      id: `ride_${Date.now()}`,
      _id: `ride_${Date.now()}`,
      rider_id: userId,
      ...rideData,
      status: 'Available',
      createdAt: new Date().toISOString(),
    };
    db.rides.unshift(ride);
    saveMockDB(db);
    return ride;
  },

  getMineBookings(userId) {
    const db = getMockDB();
    return db.bookings.filter(b => b.passenger_id === userId);
  },
};
