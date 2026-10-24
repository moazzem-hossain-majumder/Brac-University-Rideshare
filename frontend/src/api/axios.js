import { SupabaseService } from './supabaseService';

// Helper to get current authenticated user
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('user')) || null;
  } catch {
    return null;
  }
}

// Clean path helper (strips leading /api or /)
function cleanPath(url) {
  let p = url || '';
  if (p.startsWith('/api')) p = p.substring(4);
  if (!p.startsWith('/')) p = '/' + p;
  return p;
}

// Dispatcher that routes API calls to SupabaseService
async function handleRequest(method, url, data, config) {
  const path = cleanPath(url);
  const user = getCurrentUser();
  const userId = user?.id || user?._id;
  const userName = user?.name || 'Anonymous';

  // ── Auth ──
  if (path === '/auth/login' && method === 'POST') {
    const res = await SupabaseService.login(data);
    return { data: res };
  }
  if (path === '/auth/register' && method === 'POST') {
    const res = await SupabaseService.register(data);
    return { data: res };
  }

  // ── Profile ──
  if ((path === '/profile/me' || path === '/users/me') && method === 'GET') {
    const res = await SupabaseService.getProfile(userId);
    return { data: res };
  }
  if (path === '/profile/me' && (method === 'PUT' || method === 'POST')) {
    const res = await SupabaseService.updateProfile(userId, data);
    return { data: res };
  }

  // ── Users (Admin) ──
  if (path === '/users' && method === 'GET') {
    const res = await SupabaseService.getStudents();
    return { data: res };
  }
  const approveMatch = path.match(/^\/users\/([^/]+)\/approve$/);
  if (approveMatch && method === 'PATCH') {
    const res = await SupabaseService.approveStudent(approveMatch[1]);
    return { data: res };
  }
  const userDeleteMatch = path.match(/^\/users\/([^/]+)$/);
  if (userDeleteMatch && method === 'DELETE') {
    const res = await SupabaseService.deleteStudent(userDeleteMatch[1]);
    return { data: res };
  }
  if (userDeleteMatch && method === 'GET') {
    const res = await SupabaseService.getProfile(userDeleteMatch[1]);
    return { data: res };
  }

  // ── Ride Requests ──
  if (path === '/ride-requests' && method === 'POST') {
    const res = await SupabaseService.postRideRequest(userId, data);
    return { data: res };
  }
  if (path === '/ride-requests/open' && method === 'GET') {
    const res = await SupabaseService.getOpenRequests();
    return { data: res };
  }
  if (path === '/ride-requests/mine' && method === 'GET') {
    const res = await SupabaseService.getMyRequests(userId);
    return { data: res };
  }
  const cancelReqMatch = path.match(/^\/ride-requests\/([^/]+)\/cancel$/);
  if (cancelReqMatch && method === 'PATCH') {
    const res = await SupabaseService.cancelRequest(userId, cancelReqMatch[1]);
    return { data: res };
  }

  // ── Ride Offers ──
  if (path === '/ride-offers' && method === 'POST') {
    const res = await SupabaseService.sendOffer(userId, userName, data);
    return { data: res };
  }
  const offersForReqMatch = path.match(/^\/ride-offers\/request\/([^/]+)$/);
  if (offersForReqMatch && method === 'GET') {
    const res = await SupabaseService.getOffersForRequest(offersForReqMatch[1]);
    return { data: res };
  }
  const acceptOfferMatch = path.match(/^\/ride-offers\/([^/]+)\/accept$/);
  if (acceptOfferMatch && method === 'PATCH') {
    const res = await SupabaseService.acceptOffer(userId, userName, acceptOfferMatch[1]);
    return { data: res };
  }

  // ── Active Rides ──
  if (path === '/active-rides/mine' && method === 'GET') {
    const res = await SupabaseService.getMyActiveRide(userId);
    return { data: res };
  }
  if (path === '/active-rides/history' && method === 'GET') {
    const res = await SupabaseService.getRideHistory(userId);
    return { data: res };
  }
  const arrivedMatch = path.match(/^\/active-rides\/([^/]+)\/arrived$/);
  if (arrivedMatch && method === 'PATCH') {
    const res = await SupabaseService.markArrived(userId, arrivedMatch[1]);
    return { data: res };
  }
  const completeRideMatch = path.match(/^\/active-rides\/([^/]+)\/complete$/);
  if (completeRideMatch && method === 'PATCH') {
    const res = await SupabaseService.completeRide(completeRideMatch[1], data || {});
    return { data: res };
  }
  const locationMatch = path.match(/^\/active-rides\/([^/]+)\/location$/);
  if (locationMatch && method === 'PATCH') {
    const res = await SupabaseService.updateRiderLocation(locationMatch[1], data || {});
    return { data: res };
  }

  // ── Chat ──
  const chatMatch = path.match(/^\/chat\/([^/]+)$/);
  if (chatMatch && method === 'GET') {
    const res = await SupabaseService.getChatMessages(chatMatch[1]);
    return { data: res };
  }
  if (path === '/chat' && method === 'POST') {
    const res = await SupabaseService.sendChatMessage(userId, userName, data);
    return { data: res };
  }

  // ── Notifications ──
  if (path === '/notifications' && method === 'GET') {
    const res = await SupabaseService.getNotifications(userId);
    return { data: res };
  }
  const notifReadMatch = path.match(/^\/notifications\/([^/]+)\/read$/);
  if (notifReadMatch && method === 'PATCH') {
    const res = await SupabaseService.markNotificationRead(notifReadMatch[1]);
    return { data: res };
  }

  // ── Feedback ──
  if (path === '/feedback' && method === 'POST') {
    const res = await SupabaseService.submitFeedback(userId, data);
    return { data: res };
  }
  if (path === '/feedback' && method === 'GET') {
    const res = await SupabaseService.getAllFeedback();
    return { data: res };
  }
  const feedbackVisMatch = path.match(/^\/feedback\/([^/]+)\/visibility$/);
  if (feedbackVisMatch && method === 'PATCH') {
    const res = await SupabaseService.toggleFeedbackVisibility(feedbackVisMatch[1]);
    return { data: res };
  }

  // ── Standalone Rides & Bookings ──
  if (path === '/rides/mine' && method === 'GET') {
    const res = await SupabaseService.getMineRides(userId);
    return { data: res };
  }
  if (path === '/rides' && method === 'POST') {
    const res = await SupabaseService.createRide(userId, data);
    return { data: res };
  }
  if (path === '/rides' && method === 'GET') {
    const res = await SupabaseService.getMineRides(userId);
    return { data: res };
  }
  if (path === '/bookings/mine' && method === 'GET') {
    const res = await SupabaseService.getMineBookings(userId);
    return { data: res };
  }

  // ── Payments (Stripe client secret stub) ──
  if (path === '/payment/create-intent' && method === 'POST') {
    return { data: { clientSecret: 'mock_stripe_client_secret_' + Date.now() } };
  }

  console.warn(`[Supabase API Adapter] Unhandled endpoint: ${method} ${path}`);
  return { data: null };
}

// Emulate Axios API interface with interceptors support
const api = {
  interceptors: {
    request: { use: () => {} },
    response: { use: () => {} },
  },

  async get(url, config) {
    return handleRequest('GET', url, null, config);
  },

  async post(url, data, config) {
    return handleRequest('POST', url, data, config);
  },

  async put(url, data, config) {
    return handleRequest('PUT', url, data, config);
  },

  async patch(url, data, config) {
    return handleRequest('PATCH', url, data, config);
  },

  async delete(url, config) {
    return handleRequest('DELETE', url, null, config);
  },
};

export default api;
