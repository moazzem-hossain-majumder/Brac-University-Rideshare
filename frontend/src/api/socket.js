import { supabase, isSupabaseConfigured } from './supabase';

class RealtimeBridge {
  constructor() {
    this.listeners = new Map();
    this.channels = new Map();
    this.currentUserId = null;
    this.currentRideId = null;
    this.broadcastChannel = typeof window !== 'undefined' && window.BroadcastChannel
      ? new BroadcastChannel('bracu_rideshare_realtime')
      : null;

    if (this.broadcastChannel) {
      this.broadcastChannel.onmessage = (event) => {
        const { eventName, data } = event.data || {};
        if (eventName) {
          this._dispatch(eventName, data);
        }
      };
    }
  }

  connect() {
    // Connection managed via Supabase channels
    return this;
  }

  disconnect() {
    this.channels.forEach((channel) => {
      if (supabase && channel?.unsubscribe) {
        channel.unsubscribe();
      }
    });
    this.channels.clear();
    return this;
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return this;
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return this;
    if (callback) {
      this.listeners.get(event).delete(callback);
    } else {
      this.listeners.delete(event);
    }
    return this;
  }

  _dispatch(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try { cb(data); } catch (err) { console.error('Realtime listener error:', err); }
      });
    }
  }

  emit(event, data) {
    // 1. Dispatch locally / cross-tab
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ eventName: event, data });
    }

    // 2. Handle room joins
    if (event === 'join_user') {
      const userId = data;
      this.currentUserId = userId;
      if (isSupabaseConfigured() && supabase) {
        const channelName = `user_${userId}`;
        if (!this.channels.has(channelName)) {
          const channel = supabase.channel(channelName);
          channel
            .on('broadcast', { event: 'offer_received' }, (payload) => this._dispatch('offer_received', payload.payload))
            .on('broadcast', { event: 'ride_confirmed' }, (payload) => this._dispatch('ride_confirmed', payload.payload))
            .on('broadcast', { event: 'show_payment' }, (payload) => this._dispatch('show_payment', payload.payload))
            .subscribe();
          this.channels.set(channelName, channel);
        }
      }
      return;
    }

    if (event === 'join_ride') {
      const rideId = data;
      this.currentRideId = rideId;
      if (isSupabaseConfigured() && supabase) {
        const channelName = `ride_${rideId}`;
        if (!this.channels.has(channelName)) {
          const channel = supabase.channel(channelName);
          channel
            .on('broadcast', { event: 'receive_message' }, (payload) => this._dispatch('receive_message', payload.payload))
            .on('broadcast', { event: 'location_update' }, (payload) => this._dispatch('location_update', payload.payload))
            .subscribe();
          this.channels.set(channelName, channel);
        }
      }
      return;
    }

    if (event === 'send_location') {
      const rideId = data.rideId || this.currentRideId;
      if (rideId) {
        if (isSupabaseConfigured() && supabase) {
          const channel = supabase.channel(`ride_${rideId}`);
          channel.subscribe(status => {
            if (status === 'SUBSCRIBED') {
              channel.send({ type: 'broadcast', event: 'location_update', payload: data });
            }
          });
        }
        this._dispatch('location_update', data);
      }
      return;
    }

    // 3. Handle outbound real-time messages
    if (event === 'new_offer') {
      const passengerId = data.passengerId;
      if (passengerId) {
        if (isSupabaseConfigured() && supabase) {
          const channel = supabase.channel(`user_${passengerId}`);
          channel.subscribe(status => {
            if (status === 'SUBSCRIBED') {
              channel.send({ type: 'broadcast', event: 'offer_received', payload: data });
            }
          });
        }
        this._dispatch('offer_received', data);
      }
      return;
    }

    if (event === 'offer_accepted') {
      const riderId = data.riderId;
      if (riderId) {
        if (isSupabaseConfigured() && supabase) {
          const channel = supabase.channel(`user_${riderId}`);
          channel.subscribe(status => {
            if (status === 'SUBSCRIBED') {
              channel.send({ type: 'broadcast', event: 'ride_confirmed', payload: data });
            }
          });
        }
        this._dispatch('ride_confirmed', data);
      }
      return;
    }

    if (event === 'rider_arrived') {
      const passengerId = data.passengerId;
      if (passengerId) {
        if (isSupabaseConfigured() && supabase) {
          const channel = supabase.channel(`user_${passengerId}`);
          channel.subscribe(status => {
            if (status === 'SUBSCRIBED') {
              channel.send({ type: 'broadcast', event: 'show_payment', payload: data });
            }
          });
        }
        this._dispatch('show_payment', data);
      }
      return;
    }

    if (event === 'send_message') {
      const rideId = data.rideId || this.currentRideId;
      if (rideId) {
        if (isSupabaseConfigured() && supabase) {
          const channel = supabase.channel(`ride_${rideId}`);
          channel.subscribe(status => {
            if (status === 'SUBSCRIBED') {
              channel.send({ type: 'broadcast', event: 'receive_message', payload: data });
            }
          });
        }
        this._dispatch('receive_message', data);
      }
      return;
    }

    // Default trigger
    this._dispatch(event, data);
  }
}

const socket = new RealtimeBridge();
export default socket;
