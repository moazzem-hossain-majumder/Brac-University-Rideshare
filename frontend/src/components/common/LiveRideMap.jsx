import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../../context/ThemeContext';

const cartoKey = import.meta.env.VITE_CARTO_API_KEY || '';

// Tile URLs for Light & Dark mode (Free OpenStreetMap by default, or Carto if key is present)
const TILES = {
  dark: {
    url: cartoKey
      ? `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?api_key=${cartoKey}`
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  light: {
    url: cartoKey
      ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?api_key=${cartoKey}`
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
};

// Custom SVG Icons
function createPickupIcon() {
  return L.divIcon({
    className: 'custom-map-icon',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-8 h-8 rounded-full bg-emerald-500/30 animate-ping"></div>
        <div class="w-7 h-7 rounded-full bg-emerald-500 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">
          📍
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function createDropoffIcon() {
  return L.divIcon({
    className: 'custom-map-icon',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="w-8 h-8 rounded-full bg-rose-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">
          🏁
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function createRiderIcon(heading = 0) {
  return L.divIcon({
    className: 'custom-map-icon',
    html: `
      <div class="relative flex items-center justify-center" style="transform: rotate(${heading}deg); transition: transform 0.5s ease;">
        <div class="absolute w-10 h-10 rounded-full bg-indigo-500/30 animate-pulse"></div>
        <div class="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 border-2 border-white shadow-xl flex items-center justify-center text-white text-base">
          🚗
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

export default function LiveRideMap({
  riderLocation,
  pickupLocation,
  dropoffLocation,
  isRider = false,
  riderName = 'Rider',
  onLocationUpdate,
  etaMinutes = 6,
  className = '',
}) {
  const { isDark, toggleTheme } = useTheme();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);

  const riderMarkerRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const dropoffMarkerRef = useRef(null);
  const routeLineRef = useRef(null);

  const [simulating, setSimulating] = useState(false);
  const [gpsActive, setGpsActive] = useState(false);
  const [speed, setSpeed] = useState(32);
  const [eta, setEta] = useState(etaMinutes);
  const [showSosModal, setShowSosModal] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center at BRAC University Merul Badda
    const defaultCenter = [
      pickupLocation?.lat || 23.7745,
      pickupLocation?.lng || 90.4258,
    ];

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 14,
      zoomControl: false,
    });

    // Custom Zoom Control top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Initial Tile Layer
    const currentTheme = isDark ? 'dark' : 'light';
    const tileConfig = TILES[currentTheme];
    const tileLayer = L.tileLayer(tileConfig.url, {
      maxZoom: 19,
      attribution: tileConfig.attribution,
    }).addTo(map);

    mapInstanceRef.current = map;
    tileLayerRef.current = tileLayer;

    // Cleanup on unmount
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when Dark/Light mode toggles
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const currentTheme = isDark ? 'dark' : 'light';
    tileLayerRef.current.setUrl(TILES[currentTheme].url);
  }, [isDark]);

  // Update Markers & Route
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const bounds = [];

    // 1. Pickup Marker
    if (pickupLocation?.lat && pickupLocation?.lng) {
      const pPos = [pickupLocation.lat, pickupLocation.lng];
      bounds.push(pPos);
      if (!pickupMarkerRef.current) {
        pickupMarkerRef.current = L.marker(pPos, { icon: createPickupIcon() })
          .bindPopup(`<b>Pickup Location</b><br/>${pickupLocation.label || 'Pickup'}`)
          .addTo(map);
      } else {
        pickupMarkerRef.current.setLatLng(pPos);
      }
    }

    // 2. Dropoff Marker
    if (dropoffLocation?.lat && dropoffLocation?.lng) {
      const dPos = [dropoffLocation.lat, dropoffLocation.lng];
      bounds.push(dPos);
      if (!dropoffMarkerRef.current) {
        dropoffMarkerRef.current = L.marker(dPos, { icon: createDropoffIcon() })
          .bindPopup(`<b>Destination</b><br/>${dropoffLocation.label || 'Destination'}`)
          .addTo(map);
      } else {
        dropoffMarkerRef.current.setLatLng(dPos);
      }
    }

    // 3. Rider Marker
    if (riderLocation?.lat && riderLocation?.lng) {
      const rPos = [riderLocation.lat, riderLocation.lng];
      bounds.push(rPos);
      if (!riderMarkerRef.current) {
        riderMarkerRef.current = L.marker(rPos, {
          icon: createRiderIcon(riderLocation.heading || 0),
        })
          .bindPopup(`<b>${riderName}</b><br/>En route`)
          .addTo(map);
      } else {
        riderMarkerRef.current.setLatLng(rPos);
        riderMarkerRef.current.setIcon(createRiderIcon(riderLocation.heading || 0));
      }
    }

    // 4. Route Polyline
    const routePoints = [];
    if (riderLocation?.lat && riderLocation?.lng) {
      routePoints.push([riderLocation.lat, riderLocation.lng]);
    }
    if (pickupLocation?.lat && pickupLocation?.lng) {
      routePoints.push([pickupLocation.lat, pickupLocation.lng]);
    }
    if (dropoffLocation?.lat && dropoffLocation?.lng) {
      routePoints.push([dropoffLocation.lat, dropoffLocation.lng]);
    }

    if (routePoints.length >= 2) {
      const routeColor = isDark ? '#818cf8' : '#4f46e5';
      if (!routeLineRef.current) {
        routeLineRef.current = L.polyline(routePoints, {
          color: routeColor,
          weight: 5,
          opacity: 0.85,
          dashArray: '8, 8',
          lineCap: 'round',
        }).addTo(map);
      } else {
        routeLineRef.current.setLatLngs(routePoints);
        routeLineRef.current.setStyle({ color: routeColor });
      }
    }

    // Fit map bounds if points exist
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [riderLocation, pickupLocation, dropoffLocation, isDark]);

  // Recenter Map Helper
  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    const points = [];
    if (riderLocation?.lat) points.push([riderLocation.lat, riderLocation.lng]);
    if (pickupLocation?.lat) points.push([pickupLocation.lat, pickupLocation.lng]);
    if (dropoffLocation?.lat) points.push([dropoffLocation.lat, dropoffLocation.lng]);
    if (points.length > 0) {
      mapInstanceRef.current.fitBounds(points, { padding: [50, 50] });
    }
  };

  // ── Drive Simulation for Demo / Presentations ──
  useEffect(() => {
    let interval = null;
    if (simulating && isRider) {
      let step = 0;
      const totalSteps = 25;

      const startLat = riderLocation?.lat || pickupLocation?.lat || 23.807;
      const startLng = riderLocation?.lng || pickupLocation?.lng || 90.3686;
      const targetLat = dropoffLocation?.lat || 23.7745;
      const targetLng = dropoffLocation?.lng || 90.4258;

      interval = setInterval(() => {
        step += 1;
        const progress = Math.min(step / totalSteps, 1);
        const curLat = startLat + (targetLat - startLat) * progress;
        const curLng = startLng + (targetLng - startLng) * progress;

        // Calculate heading
        const dLat = targetLat - startLat;
        const dLng = targetLng - startLng;
        const heading = (Math.atan2(dLng, dLat) * 180) / Math.PI;

        const updatedSpeed = Math.floor(25 + Math.sin(step) * 10);
        const updatedEta = Math.max(1, Math.ceil(etaMinutes * (1 - progress)));

        setSpeed(updatedSpeed);
        setEta(updatedEta);

        if (onLocationUpdate) {
          onLocationUpdate({
            lat: curLat,
            lng: curLng,
            heading,
            speed: updatedSpeed,
            etaMinutes: updatedEta,
          });
        }

        if (progress >= 1) {
          setSimulating(false);
          clearInterval(interval);
        }
      }, 1500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [simulating, isRider, pickupLocation, dropoffLocation]);

  // ── Real Device GPS Watcher ──
  const toggleGps = () => {
    if (gpsActive) {
      setGpsActive(false);
      return;
    }

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setGpsActive(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, heading, speed: rawSpeed } = pos.coords;
        if (onLocationUpdate) {
          onLocationUpdate({
            lat: latitude,
            lng: longitude,
            heading: heading || 0,
            speed: rawSpeed ? Math.round(rawSpeed * 3.6) : 30,
          });
        }
      },
      (err) => {
        console.error('GPS error:', err);
        setGpsActive(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className={`relative w-full rounded-3xl overflow-hidden border shadow-2xl transition-all duration-300 ${isDark ? 'border-slate-800 bg-slate-900 shadow-indigo-500/10' : 'border-slate-200 bg-white shadow-slate-300/40'} ${isDark && !cartoKey ? 'dark-map-tiles' : ''} ${className}`}>
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-80 sm:h-96 z-0" />

      {/* Top Floating Badges: Live Status & Theme Toggle */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        {/* Live Tracking Status */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-full text-white text-xs shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-semibold tracking-wide">Live Navigation</span>
          <span className="text-white/40">|</span>
          <span className="text-indigo-300 font-mono">ETA: {eta} min</span>
        </div>

        {/* Map Controls: Dark/Light Mode & Recenter */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md border border-white/10 p-1 rounded-2xl shadow-lg">
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm hover:bg-white/10 transition-colors text-white"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Map`}
          >
            {isDark ? '🌙' : '☀️'}
          </button>
          <button
            onClick={handleRecenter}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm hover:bg-white/10 transition-colors text-white"
            title="Recenter Map"
          >
            🎯
          </button>
        </div>
      </div>

      {/* Bottom Floating Stats Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Speed & Driver Info */}
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl text-white shadow-xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-lg">
            🚗
          </div>
          <div>
            <div className="text-xs font-bold leading-none">{riderName}</div>
            <div className="text-[11px] text-indigo-300 mt-0.5 font-mono">
              Speed: <span className="font-bold text-white">{speed} km/h</span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Simulator, GPS, Emergency SOS */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Rider Controls */}
          {isRider && (
            <>
              <button
                onClick={() => setSimulating((prev) => !prev)}
                className={`px-3 py-2 rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-1.5 ${
                  simulating
                    ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                <span>{simulating ? '⏸️ Pause Sim' : '▶️ Test Drive Sim'}</span>
              </button>
              <button
                onClick={toggleGps}
                className={`px-3 py-2 rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-1.5 ${
                  gpsActive
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800/90 text-slate-200 border border-white/20 hover:bg-slate-700'
                }`}
              >
                <span>{gpsActive ? '📡 GPS On' : '📡 Use GPS'}</span>
              </button>
            </>
          )}

          {/* Emergency SOS Button */}
          <button
            onClick={() => setShowSosModal(true)}
            className="px-3.5 py-2 bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/30 backdrop-blur-md border border-rose-400/40 flex items-center gap-1.5 transition-transform active:scale-95"
            title="Emergency Safety Hotline"
          >
            <span>🚨</span>
            <span className="hidden sm:inline">Emergency</span> SOS
          </button>
        </div>
      </div>

      {/* Emergency SOS Modal */}
      {showSosModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-rose-500/50 rounded-3xl p-6 max-w-sm w-full text-white shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-2xl mx-auto mb-3">
              🚨
            </div>
            <h3 className="text-center font-bold text-lg mb-1 text-rose-300">
              Campus Emergency SOS
            </h3>
            <p className="text-center text-xs text-slate-400 mb-5">
              Live location and ride details can be shared immediately with BRAC University Proctor Office and Emergency Services.
            </p>

            <div className="space-y-2 mb-5">
              <a
                href="tel:999"
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-center rounded-xl block text-sm shadow-lg shadow-rose-600/30"
              >
                📞 Call Police / Emergency (999)
              </a>
              <a
                href="tel:+8802222264051"
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-center rounded-xl block text-xs border border-white/10"
              >
                🏢 BRACU Campus Security (+880 2 222264051)
              </a>
            </div>

            <button
              onClick={() => setShowSosModal(false)}
              className="w-full py-2 bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-semibold rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
