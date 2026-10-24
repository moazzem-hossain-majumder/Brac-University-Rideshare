// ─────────────────────────────────────────────────────────────────────────────
// BRAC University & Popular Commute Locations in Dhaka
// ─────────────────────────────────────────────────────────────────────────────
export const CAMPUS_LOCATIONS = [
  {
    id: 'bracu_badda',
    name: 'BRACU Merul Badda (Main Campus)',
    area: 'Merul Badda',
    lat: 23.7745,
    lng: 90.4258,
    isCampus: true,
  },
  {
    id: 'bracu_mohakhali',
    name: 'BRACU Mohakhali Campus',
    area: 'Mohakhali',
    lat: 23.7788,
    lng: 90.4042,
    isCampus: true,
  },
  {
    id: 'mirpur_10',
    name: 'Mirpur 10 Circle / Metro Station',
    area: 'Mirpur',
    lat: 23.8070,
    lng: 90.3686,
    isCampus: false,
  },
  {
    id: 'mirpur_1',
    name: 'Mirpur 1 Muktijoddha Market',
    area: 'Mirpur',
    lat: 23.7956,
    lng: 90.3537,
    isCampus: false,
  },
  {
    id: 'dhanmondi_27',
    name: 'Dhanmondi 27 / Rapa Plaza',
    area: 'Dhanmondi',
    lat: 23.7530,
    lng: 90.3770,
    isCampus: false,
  },
  {
    id: 'dhanmondi_32',
    name: 'Dhanmondi 32 / Russell Square',
    area: 'Dhanmondi',
    lat: 23.7513,
    lng: 90.3812,
    isCampus: false,
  },
  {
    id: 'uttara_house_building',
    name: 'Uttara House Building (Sector 7/9)',
    area: 'Uttara',
    lat: 23.8680,
    lng: 90.3980,
    isCampus: false,
  },
  {
    id: 'uttara_jasimuddin',
    name: 'Uttara Jasimuddin Road',
    area: 'Uttara',
    lat: 23.8540,
    lng: 90.4010,
    isCampus: false,
  },
  {
    id: 'banani_11',
    name: 'Banani Road 11',
    area: 'Banani',
    lat: 23.7937,
    lng: 90.4044,
    isCampus: false,
  },
  {
    id: 'gulshan_1',
    name: 'Gulshan 1 Circle',
    area: 'Gulshan',
    lat: 23.7808,
    lng: 90.4167,
    isCampus: false,
  },
  {
    id: 'gulshan_2',
    name: 'Gulshan 2 Circle',
    area: 'Gulshan',
    lat: 23.7925,
    lng: 90.4150,
    isCampus: false,
  },
  {
    id: 'badda_link',
    name: 'Badda Link Road / Middle Badda',
    area: 'Badda',
    lat: 23.7780,
    lng: 90.4280,
    isCampus: false,
  },
  {
    id: 'rampura_bridge',
    name: 'Rampura Bridge / TV Center',
    area: 'Rampura',
    lat: 23.7620,
    lng: 90.4250,
    isCampus: false,
  },
  {
    id: 'bashundhara_gate',
    name: 'Bashundhara Main Gate / Jamuna Future Park',
    area: 'Bashundhara',
    lat: 23.8150,
    lng: 90.4240,
    isCampus: false,
  },
  {
    id: 'kuril_bishwa',
    name: 'Kuril Bishwa Road Flyover',
    area: 'Kuril',
    lat: 23.8190,
    lng: 90.4190,
    isCampus: false,
  },
];

// Calculate Haversine distance in kilometers
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Student friendly fare estimate (Base Tk 35 + Tk 12/km, rounded to nearest 5)
export function estimateFare(distanceKm) {
  if (!distanceKm || distanceKm <= 0) return 40;
  const raw = 35 + distanceKm * 12;
  return Math.ceil(raw / 5) * 5;
}

// Find closest coordinates given a location string
export function findLocationCoords(locationString, fallbackIndex = 0) {
  if (!locationString) return CAMPUS_LOCATIONS[0];
  const query = locationString.toLowerCase().trim();

  const found = CAMPUS_LOCATIONS.find(
    (loc) =>
      query.includes(loc.name.toLowerCase()) ||
      query.includes(loc.area.toLowerCase()) ||
      loc.name.toLowerCase().includes(query)
  );

  return found || CAMPUS_LOCATIONS[fallbackIndex % CAMPUS_LOCATIONS.length];
}
