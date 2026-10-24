import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../../context/ThemeContext';
import { CAMPUS_LOCATIONS } from '../../constants/locations';
import { loadGoogleMapsSDK, GOOGLE_MAPS_DARK_STYLE } from '../../utils/googleMapsLoader';

const googleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
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

function createLeafletPinIcon(label, isPickup = true) {
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
  className = 'w-full h-full min-h-[300px]',
}) {
  const { isDark } = useTheme();
  const mapContainerRef = useRef(null);

  // Mode: 'google' (if key available) or 'leaflet'
  const [provider, setProvider] = useState(() => (googleKey ? 'google' : 'leaflet'));
  const [googleReady, setGoogleReady] = useState(false);

  // Leaflet refs
  const leafletMapRef = useRef(null);
  const leafletTileRef = useRef(null);
  const leafletPickupRef = useRef(null);
  const leafletDropoffRef = useRef(null);
  const leafletRouteRef = useRef(null);

  // Google Maps refs
  const googleMapRef = useRef(null);
  const googlePickupMarkerRef = useRef(null);
  const googleDropoffMarkerRef = useRef(null);
  const googlePolylineRef = useRef(null);

  const activeModeRef = useRef(activeMode);
  activeModeRef.current = activeMode;

  // Try loading Google Maps if key exists
  useEffect(() => {
    // Graceful fallback if Google Maps API key has quota/referrer errors
    window.gm_authFailure = () => {
      console.warn('Google Maps authentication failed, falling back to OpenStreetMap');
      setProvider('leaflet');
    };

    if (!googleKey) {
      setProvider('leaflet');
      return;
    }

    loadGoogleMapsSDK(googleKey)
      .then(() => {
        setGoogleReady(true);
      })
      .catch((err) => {
        console.warn('Google Maps SDK failed to load, falling back to Leaflet:', err);
        setProvider('leaflet');
      });
  }, []);

  // ── 1. Google Maps Initialization & Render ─────────────────────────
  useEffect(() => {
    if (provider !== 'google' || !googleReady || !mapContainerRef.current) return;

    // Cleanup Leaflet if was initialized
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    if (!googleMapRef.current) {
      const center = {
        lat: pickupCoord?.lat || 23.7745,
        lng: pickupCoord?.lng || 90.4258,
      };

      const gMap = new window.google.maps.Map(mapContainerRef.current, {
        center,
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: isDark ? GOOGLE_MAPS_DARK_STYLE : [],
      });

      gMap.addListener('click', (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        const nearestName = findNearestLandmark(lat, lng);
        if (onSelectLocation) {
          onSelectLocation(activeModeRef.current, { lat, lng, name: nearestName });
        }
      });

      googleMapRef.current = gMap;
    } else {
      googleMapRef.current.setOptions({
        styles: isDark ? GOOGLE_MAPS_DARK_STYLE : [],
      });
    }

    const gMap = googleMapRef.current;
    if (!gMap) return;

    const bounds = new window.google.maps.LatLngBounds();
    let hasCoords = false;

    // Pickup Marker
    if (pickupCoord?.lat && pickupCoord?.lng) {
      const pos = { lat: pickupCoord.lat, lng: pickupCoord.lng };
      bounds.extend(pos);
      hasCoords = true;

      if (!googlePickupMarkerRef.current) {
        const marker = new window.google.maps.Marker({
          position: pos,
          map: gMap,
          draggable: true,
          title: pickupCoord.name || 'Pick-up',
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
          },
        });

        marker.addListener('dragend', (e) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          const nearest = findNearestLandmark(lat, lng);
          if (onSelectLocation) {
            onSelectLocation('pickup', { lat, lng, name: nearest });
          }
        });

        googlePickupMarkerRef.current = marker;
      } else {
        googlePickupMarkerRef.current.setPosition(pos);
        googlePickupMarkerRef.current.setTitle(pickupCoord.name || 'Pick-up');
      }
    } else if (googlePickupMarkerRef.current) {
      googlePickupMarkerRef.current.setMap(null);
      googlePickupMarkerRef.current = null;
    }

    // Dropoff Marker
    if (dropoffCoord?.lat && dropoffCoord?.lng) {
      const pos = { lat: dropoffCoord.lat, lng: dropoffCoord.lng };
      bounds.extend(pos);
      hasCoords = true;

      if (!googleDropoffMarkerRef.current) {
        const marker = new window.google.maps.Marker({
          position: pos,
          map: gMap,
          draggable: true,
          title: dropoffCoord.name || 'Drop-off',
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          },
        });

        marker.addListener('dragend', (e) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          const nearest = findNearestLandmark(lat, lng);
          if (onSelectLocation) {
            onSelectLocation('dropoff', { lat, lng, name: nearest });
          }
        });

        googleDropoffMarkerRef.current = marker;
      } else {
        googleDropoffMarkerRef.current.setPosition(pos);
        googleDropoffMarkerRef.current.setTitle(dropoffCoord.name || 'Drop-off');
      }
    } else if (googleDropoffMarkerRef.current) {
      googleDropoffMarkerRef.current.setMap(null);
      googleDropoffMarkerRef.current = null;
    }

    // Polyline
    if (pickupCoord?.lat && pickupCoord?.lng && dropoffCoord?.lat && dropoffCoord?.lng) {
      const path = [
        { lat: pickupCoord.lat, lng: pickupCoord.lng },
        { lat: dropoffCoord.lat, lng: dropoffCoord.lng },
      ];

      if (!googlePolylineRef.current) {
        googlePolylineRef.current = new window.google.maps.Polyline({
          path,
          geodesic: true,
          strokeColor: '#6366f1',
          strokeOpacity: 0.9,
          strokeWeight: 4,
          map: gMap,
        });
      } else {
        googlePolylineRef.current.setPath(path);
      }
    } else if (googlePolylineRef.current) {
      googlePolylineRef.current.setMap(null);
      googlePolylineRef.current = null;
    }

    if (hasCoords) {
      if (pickupCoord && dropoffCoord) {
        gMap.fitBounds(bounds);
      } else if (pickupCoord) {
        gMap.setCenter({ lat: pickupCoord.lat, lng: pickupCoord.lng });
      }
    }
  }, [provider, googleReady, isDark, pickupCoord, dropoffCoord]);

  // ── 2. Leaflet Fallback / Direct Provider ──────────────────────────
  useEffect(() => {
    if (provider !== 'leaflet' || !mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      const center = [pickupCoord?.lat || 23.7745, pickupCoord?.lng || 90.4258];

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

      leafletTileRef.current = tileLayer;
      leafletMapRef.current = map;

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        const nearestName = findNearestLandmark(lat, lng);
        if (onSelectLocation) {
          onSelectLocation(activeModeRef.current, { lat, lng, name: nearestName });
        }
      });
    }

    const map = leafletMapRef.current;
    if (!map) return;

    const bounds = [];

    // Pickup Marker
    if (pickupCoord?.lat && pickupCoord?.lng) {
      const p = [pickupCoord.lat, pickupCoord.lng];
      bounds.push(p);
      if (!leafletPickupRef.current) {
        leafletPickupRef.current = L.marker(p, {
          icon: createLeafletPinIcon(pickupCoord.name || 'Pickup', true),
          draggable: true,
        }).addTo(map);

        leafletPickupRef.current.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng();
          const nearest = findNearestLandmark(lat, lng);
          if (onSelectLocation) {
            onSelectLocation('pickup', { lat, lng, name: nearest });
          }
        });
      } else {
        leafletPickupRef.current.setLatLng(p);
        leafletPickupRef.current.setIcon(createLeafletPinIcon(pickupCoord.name || 'Pickup', true));
      }
    } else if (leafletPickupRef.current) {
      leafletPickupRef.current.remove();
      leafletPickupRef.current = null;
    }

    // Dropoff Marker
    if (dropoffCoord?.lat && dropoffCoord?.lng) {
      const d = [dropoffCoord.lat, dropoffCoord.lng];
      bounds.push(d);
      if (!leafletDropoffRef.current) {
        leafletDropoffRef.current = L.marker(d, {
          icon: createLeafletPinIcon(dropoffCoord.name || 'Drop-off', false),
          draggable: true,
        }).addTo(map);

        leafletDropoffRef.current.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng();
          const nearest = findNearestLandmark(lat, lng);
          if (onSelectLocation) {
            onSelectLocation('dropoff', { lat, lng, name: nearest });
          }
        });
      } else {
        leafletDropoffRef.current.setLatLng(d);
        leafletDropoffRef.current.setIcon(createLeafletPinIcon(dropoffCoord.name || 'Drop-off', false));
      }
    } else if (leafletDropoffRef.current) {
      leafletDropoffRef.current.remove();
      leafletDropoffRef.current = null;
    }

    // Route Polyline
    if (pickupCoord?.lat && pickupCoord?.lng && dropoffCoord?.lat && dropoffCoord?.lng) {
      const latlngs = [
        [pickupCoord.lat, pickupCoord.lng],
        [dropoffCoord.lat, dropoffCoord.lng],
      ];
      if (!leafletRouteRef.current) {
        leafletRouteRef.current = L.polyline(latlngs, {
          color: '#6366f1',
          weight: 4,
          opacity: 0.85,
          dashArray: '8, 8',
        }).addTo(map);
      } else {
        leafletRouteRef.current.setLatLngs(latlngs);
      }
    } else if (leafletRouteRef.current) {
      leafletRouteRef.current.remove();
      leafletRouteRef.current = null;
    }

    if (bounds.length > 0) {
      if (bounds.length === 1) {
        map.setView(bounds[0], 14, { animate: true });
      } else {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: true });
      }
    }
  }, [provider, pickupCoord, dropoffCoord]);

  // Update Leaflet tile layer on theme toggle
  useEffect(() => {
    if (leafletTileRef.current) {
      const tileConfig = isDark ? TILES.dark : TILES.light;
      leafletTileRef.current.setUrl(tileConfig.url);
    }
  }, [isDark]);

  return (
    <div
      className={`relative overflow-hidden ${className} ${
        provider === 'leaflet' && isDark && !cartoKey ? 'dark-map-tiles' : ''
      }`}
    >
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Mode Indicator & Provider Badge */}
      <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md text-white text-xs font-semibold shadow-lg border border-white/10">
          <span>{activeMode === 'pickup' ? '📍 Tap map to set Pick-up' : '🏁 Tap map to set Drop-off'}</span>
        </div>

        {googleKey && (
          <button
            type="button"
            onClick={() => setProvider((p) => (p === 'google' ? 'leaflet' : 'google'))}
            className="px-2.5 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-800 dark:text-white text-[11px] font-bold shadow-lg border border-slate-200 dark:border-white/10 hover:bg-white transition-all cursor-pointer flex items-center gap-1"
            title="Toggle between Google Maps and OpenStreetMap"
          >
            <span>{provider === 'google' ? '🗺️ Google Map' : '🌍 OpenStreetMap'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
