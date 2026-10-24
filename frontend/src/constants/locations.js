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
    id: 'mirpur_13',
    name: 'Mirpur 13 / BRTA',
    area: 'Mirpur',
    lat: 23.8040,
    lng: 90.3780,
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
    id: 'uttara',
    name: 'Uttara (Sector 3 / Azampur)',
    area: 'Uttara',
    lat: 23.8600,
    lng: 90.4000,
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
    id: 'kuril',
    name: 'Kuril Bishwa Road Flyover',
    area: 'Kuril',
    lat: 23.8190,
    lng: 90.4190,
    isCampus: false,
  },
];

// Student Vehicle Types (Bike vs Car) - No student drives a CNG
export const VEHICLE_TYPES = [
  {
    id: 'bike',
    name: 'Campus Bike',
    icon: '🏍️',
    image: '/bike_vehicle.jpg',
    tagline: 'Fast solo commute with student rider',
    desc: 'Beat Dhaka traffic on two wheels',
    etaText: '2-4 mins away',
    seatsLabel: '1 seat max',
    baseFare: 25,
    perKm: 9,
    defaultSeats: 1,
    maxSeats: 1,
  },
  {
    id: 'car',
    name: 'Student Carpool',
    icon: '🚗',
    image: '/car_vehicle.jpg',
    tagline: 'AC comfort, shared ride with peers',
    desc: 'Split fuel costs across 1-4 campus riders',
    etaText: '4-7 mins away',
    seatsLabel: '1-4 seats',
    baseFare: 55,
    perKm: 15,
    defaultSeats: 1,
    maxSeats: 4,
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

// Student friendly fare estimate based on distance and vehicle type
export function estimateFare(distanceKm, vehicleType = 'car') {
  if (!distanceKm || distanceKm <= 0) distanceKm = 1;
  const vehicle = VEHICLE_TYPES.find((v) => v.id === vehicleType) || VEHICLE_TYPES[1];
  const raw = vehicle.baseFare + distanceKm * vehicle.perKm;
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
