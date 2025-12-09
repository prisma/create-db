import type {
  UserLocation,
  RegionId,
  RegionCoordinates,
  GeoLocationResponse,
} from "./types.js";

// Test locations for geolocation testing
// Set TEST_LOCATION to one of these to simulate being in that location
// Set to null to use real IP-based geolocation
const TEST_LOCATIONS = {
  singapore: { latitude: 1.3521, longitude: 103.8198 }, // ap-southeast-1
  tokyo: { latitude: 35.6762, longitude: 139.6503 }, // ap-northeast-1
  frankfurt: { latitude: 50.1109, longitude: 8.6821 }, // eu-central-1
  paris: { latitude: 48.8566, longitude: 2.3522 }, // eu-west-3
  virginia: { latitude: 38.9072, longitude: -77.0369 }, // us-east-1
  california: { latitude: 37.7749, longitude: -122.4194 }, // us-west-1
};

// Set this to simulate a location (e.g., TEST_LOCATIONS.tokyo)
// or null for real geolocation
const TEST_LOCATION: { latitude: number; longitude: number } | null = null;

export const REGION_COORDINATES: Record<RegionId, RegionCoordinates> = {
  "ap-southeast-1": { lat: 1.3521, lng: 103.8198 },
  "ap-northeast-1": { lat: 35.6762, lng: 139.6503 },
  "eu-central-1": { lat: 50.1109, lng: 8.6821 },
  "eu-west-3": { lat: 48.8566, lng: 2.3522 },
  "us-east-1": { lat: 38.9072, lng: -77.0369 },
  "us-west-1": { lat: 37.7749, lng: -122.4194 },
};

/**
 * Calculate the great-circle distance between two points on Earth using the Haversine formula.
 * @param lat1 Latitude of first point in degrees
 * @param lng1 Longitude of first point in degrees
 * @param lat2 Latitude of second point in degrees
 * @param lng2 Longitude of second point in degrees
 * @returns Distance in kilometers
 */
export function calculateHaversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const EARTH_RADIUS_KM = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);
  const deltaLatRad = toRadians(lat2 - lat1);
  const deltaLngRad = toRadians(lng2 - lng1);

  const a =
    Math.sin(deltaLatRad / 2) ** 2 +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLngRad / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Detect user's location via IP geolocation API or test location override.
 * Returns null if detection fails or times out.
 */
export async function detectUserLocation(): Promise<UserLocation | null> {
  // FOR TESTING: Return test location if configured
  if (TEST_LOCATION !== null) {
    return {
      country: "TEST",
      continent: "TEST",
      city: "Test City",
      region: "Test Region",
      latitude: TEST_LOCATION.latitude,
      longitude: TEST_LOCATION.longitude,
    };
  }

  // Real geolocation via IP API
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch("https://ipapi.co/json/", {
      method: "GET",
      headers: { "User-Agent": "create-db-cli/1.0" },
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const data = (await response.json()) as GeoLocationResponse;

    // Validate that we have valid coordinates
    if (
      typeof data.latitude !== "number" ||
      typeof data.longitude !== "number" ||
      !Number.isFinite(data.latitude) ||
      !Number.isFinite(data.longitude)
    ) {
      return null;
    }

    return {
      country: data.country_code,
      continent: data.continent_code,
      city: data.city,
      region: data.region,
      latitude: data.latitude,
      longitude: data.longitude,
    };
  } catch {
    // Return null on any error (timeout, network, etc.)
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Find the closest AWS region to a given location using Haversine distance.
 * Returns null if the location is invalid or missing coordinates.
 */
export function getRegionClosestToLocation(
  userLocation: {
    latitude?: number | string;
    longitude?: number | string;
  } | null
): RegionId | null {
  // Validate input
  if (
    !userLocation ||
    userLocation.latitude == null ||
    userLocation.longitude == null
  ) {
    return null;
  }

  // Parse and validate coordinates
  const userLat =
    typeof userLocation.latitude === "number"
      ? userLocation.latitude
      : parseFloat(String(userLocation.latitude));
  const userLng =
    typeof userLocation.longitude === "number"
      ? userLocation.longitude
      : parseFloat(String(userLocation.longitude));

  if (!Number.isFinite(userLat) || !Number.isFinite(userLng)) {
    return null;
  }

  // Find closest region
  let closestRegion: RegionId | null = null;
  let minDistance = Infinity;

  for (const [regionId, coords] of Object.entries(REGION_COORDINATES)) {
    const distance = calculateHaversineDistance(
      userLat,
      userLng,
      coords.lat,
      coords.lng
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestRegion = regionId as RegionId;
    }
  }

  return closestRegion;
}
