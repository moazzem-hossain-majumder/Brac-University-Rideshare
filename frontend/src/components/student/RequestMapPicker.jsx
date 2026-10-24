import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../../context/ThemeContext';
import { CAMPUS_LOCATIONS } from '../../constants/locations';

const cartoKey = import.meta.env.VITE_CARTO_API_KEY || '';

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

function createPinIcon(label, isPickup = true) {
  const bg = isPickup ? 'bg-emerald-500' : 'bg-rose-600';
  const emoji = isPickup ? '📍' : '🏁';
  return L.divIcon({
    className: 'custom-picker-pin',
    html: `
      <div class="relative flex flex-col items-center">
        <div class="px-2 py-0.5 rounded-md text-[10px] font-bold text-white bg-slate-900/90 shadow whitespace-nowrap mb-1">
          ${label}
        </div>
        <div class="w-8 h-8 rounded-full ${bg} border-2 border-white shadow-xl flex items-center justify-center text-white text-sm">
          ${emoji}
        </div>
      </div>
    `,
    iconSize: [80, 52],
    iconAnchor: [40, 50],
  });
}

// Find nearest landmark to coordinates
function findNearestLandmark(lat, lng) {
  let minD = Infinity;
  let nearest = null;
  for (const loc of CAMPUS_LOCATIONS) {
    const d = Math.hypot(loc.lat - lat, loc.lng - lng);
    if (d < minD) {
      minD = d;
      nearest = loc;
    }
  }
  if (nearest && minD < 0.015) {
    return nearest.name;
  }
  return `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}

export default function RequestMapPicker({
  pickupCoord,
  dropoffCoord,
  activeMode, // 'pickup' | 'dropoff'
  onSelectLocation,
}) {
  const { isDark } = useTheme();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const dropoffMarkerRef = useRef(null);
  const routeLineRef = useRef(null);
  const activeModeRef = useRef(activeMode);
  activeModeRef.current = activeMode;

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const center = [
      pickupCoord?.lat || 23.7745,
      pickupCoord?.lng || 90.4258,
    ];

    const map = L.map(mapContainerRef.current, {
      center,
      zoom: 13,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    const tileConfig = isDark ? TILES.dark : TILES.light;
    const tileLayer = L.tileLayer(tileConfig.url, {
      maxZoom: 19,
      attribution: tileConfig.attribution,
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    mapInstanceRef.current = map;

    // Click on map to place pin
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      const nearestName = findNearestLandmark(lat, lng);
      if (onSelectLocation) {
        onSelectLocation(activeModeRef.current, {
          lat,
          lng,
          name: nearestName,
        });
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile theme
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.setUrl(isDark ? TILES.dark.url : TILES.light.url);
  }, [isDark]);

  // Update Markers & Route
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const bounds = [];

    // Pickup Marker
    if (pickupCoord?.lat && pickupCoord?.lng) {
      const p = [pickupCoord.lat, pickupCoord.lng];
      bounds.push(p);
      if (!pickupMarkerRef.current) {
        pickupMarkerRef.current = L.marker(p, {
          icon: createPinIcon(pickupCoord.name || 'Pickup', true),
          draggable: true,
        }).addTo(map);

        pickupMarkerRef.current.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng();
          const nearest = findNearestLandmark(lat, lng);
          if (onSelectLocation) {
            onSelectLocation('pickup', { lat, lng, name: nearest });
          }
        });
      } else {
        pickupMarkerRef.current.setLatLng(p);
        pickupMarkerRef.current.setIcon(createPinIcon(pickupCoord.name || 'Pickup', true));
      }
    } else if (pickupMarkerRef.current) {
      pickupMarkerRef.current.remove();
      pickupMarkerRef.current = null;
    }

    // Dropoff Marker
    if (dropoffCoord?.lat && dropoffCoord?.lng) {
      const d = [dropoffCoord.lat, dropoffCoord.lng];
      bounds.push(d);
      if (!dropoffMarkerRef.current) {
        dropoffMarkerRef.current = L.marker(d, {
          icon: createPinIcon(dropoffCoord.name || 'Drop-off', false),
          draggable: true,
        }).addTo(map);

        dropoffMarkerRef.current.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng();
          const nearest = findNearestLandmark(lat, lng);
          if (onSelectLocation) {
            onSelectLocation('dropoff', { lat, lng, name: nearest });
          }
        });
      } else {
        dropoffMarkerRef.current.setLatLng(d);
        dropoffMarkerRef.current.setIcon(createPinIcon(dropoffCoord.name || 'Drop-off', false));
      }
    } else if (dropoffMarkerRef.current) {
      dropoffMarkerRef.current.remove();
      dropoffMarkerRef.current = null;
    }

    // Route Polyline
    if (pickupCoord?.lat && pickupCoord?.lng && dropoffCoord?.lat && dropoffCoord?.lng) {
      const latlngs = [
        [pickupCoord.lat, pickupCoord.lng],
        [dropoffCoord.lat, dropoffCoord.lng],
      ];
      if (!routeLineRef.current) {
        routeLineRef.current = L.polyline(latlngs, {
          color: '#6366f1',
          weight: 4,
          opacity: 0.85,
          dashArray: '8, 8',
        }).addTo(map);
      } else {
        routeLineRef.current.setLatLngs(latlngs);
      }
    } else if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    // Auto fit bounds
    if (bounds.length > 0) {
      if (bounds.length === 1) {
        map.setView(bounds[0], 14, { animate: true });
      } else {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: true });
      }
    }
  }, [pickupCoord, dropoffCoord]);

  return (
    <div className={`relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner ${isDark && !cartoKey ? 'dark-map-tiles' : ''}`}>
      <div ref={mapContainerRef} className="w-full h-full" />
      {/* Floating Mode Indicator / Instruction Badge */}
      <div className="absolute top-2.5 left-2.5 z-[1000] pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md text-white text-xs font-semibold shadow-lg border border-white/10">
          <span>{activeMode === 'pickup' ? '📍 Tap map to set Pick-up' : '🏁 Tap map to set Drop-off'}</span>
        </div>
      </div>
    </div>
  );
}
