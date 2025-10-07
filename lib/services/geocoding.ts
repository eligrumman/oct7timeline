/**
 * Geocoding service for Israeli locations
 *
 * Converts Hebrew city names to latitude/longitude coordinates.
 * Uses a hybrid approach:
 * 1. Primary: Lookup table of major Israeli cities
 * 2. Fallback: Nominatim/OpenStreetMap API
 * 3. Caching: In-memory cache to avoid repeated API calls
 */

/**
 * Geocoding result containing latitude and longitude
 */
export interface GeocodingResult {
  latitude: number;
  longitude: number;
}

/**
 * Israel boundary validation constants
 * Approximate boundaries for Israel:
 * - Latitude: 29.5° to 33.3° N
 * - Longitude: 34.3° to 35.9° E
 */
const ISRAEL_BOUNDS = {
  minLatitude: 29.5,
  maxLatitude: 33.3,
  minLongitude: 34.3,
  maxLongitude: 35.9,
} as const;

/**
 * Lookup table of major Israeli cities with their coordinates
 * Source: OpenStreetMap data
 */
const ISRAELI_CITIES: Record<string, GeocodingResult> = {
  // Major Cities
  ירושלים: { latitude: 31.7683, longitude: 35.2137 },
  "תל אביב": { latitude: 32.0853, longitude: 34.7818 },
  "תל אביב-יפו": { latitude: 32.0853, longitude: 34.7818 },
  חיפה: { latitude: 32.794, longitude: 34.9896 },
  "ראשון לציון": { latitude: 31.973, longitude: 34.7925 },
  "פתח תקווה": { latitude: 32.0878, longitude: 34.8878 },
  אשדוד: { latitude: 31.8044, longitude: 34.6553 },
  נתניה: { latitude: 32.3215, longitude: 34.8532 },
  "באר שבע": { latitude: 31.2518, longitude: 34.7913 },
  "בני ברק": { latitude: 32.0809, longitude: 34.8338 },
  חולון: { latitude: 32.011, longitude: 34.7748 },
  "רמת גן": { latitude: 32.0679, longitude: 34.8237 },
  אשקלון: { latitude: 31.6688, longitude: 34.5742 },
  רחובות: { latitude: 31.8914, longitude: 34.8078 },
  "בת ים": { latitude: 32.0178, longitude: 34.7506 },
  "כפר סבא": { latitude: 32.1764, longitude: 34.9076 },
  הרצליה: { latitude: 32.1624, longitude: 34.8443 },
  חדרה: { latitude: 32.4339, longitude: 34.9189 },
  מודיעין: { latitude: 31.8969, longitude: 35.0095 },
  נצרת: { latitude: 32.7009, longitude: 35.298 },
  רעננה: { latitude: 32.1848, longitude: 34.8706 },
  רמלה: { latitude: 31.9297, longitude: 34.8668 },
  לוד: { latitude: 31.9522, longitude: 34.8885 },
  "קריית אתא": { latitude: 32.8076, longitude: 35.1053 },
  "קריית גת": { latitude: 31.61, longitude: 34.7642 },
  "קריית מוצקין": { latitude: 32.8369, longitude: 35.0751 },
  "קריית ים": { latitude: 32.8395, longitude: 35.0663 },
  "קריית ביאליק": { latitude: 32.8396, longitude: 35.089 },
  "קריית שמונה": { latitude: 33.2074, longitude: 35.5694 },
  טבריה: { latitude: 32.7913, longitude: 35.531 },
  עפולה: { latitude: 32.6078, longitude: 35.2897 },
  עכו: { latitude: 32.9266, longitude: 35.0838 },
  צפת: { latitude: 32.9658, longitude: 35.4983 },
  אילת: { latitude: 29.5569, longitude: 34.9517 },
  אריאל: { latitude: 32.1057, longitude: 35.1816 },

  // Kibbutzim and settlements affected by October 7th
  "כפר עזה": { latitude: 31.4433, longitude: 34.4758 },
  "נחל עוז": { latitude: 31.3872, longitude: 34.4647 },
  בארי: { latitude: 31.45, longitude: 34.45 },
  "ניר עוז": { latitude: 31.3886, longitude: 34.4611 },
  כיסופים: { latitude: 31.3842, longitude: 34.4025 },
  סעד: { latitude: 31.4744, longitude: 34.4542 },
  רעים: { latitude: 31.41, longitude: 34.3969 },
  "נתיב העשרה": { latitude: 31.4653, longitude: 34.4372 },
  מפלסים: { latitude: 31.4017, longitude: 34.4478 },
  זיקים: { latitude: 31.5797, longitude: 34.4967 },
  "יד מרדכי": { latitude: 31.5833, longitude: 34.5167 },
  מבטחים: { latitude: 31.4167, longitude: 34.4833 },
  אופקים: { latitude: 31.315, longitude: 34.6172 },
  שדרות: { latitude: 31.5244, longitude: 34.5964 },
  נתיבות: { latitude: 31.4239, longitude: 34.5947 },
  אשכול: { latitude: 31.0, longitude: 34.5 },
  אלומים: { latitude: 31.4644, longitude: 34.4239 },
  הודיה: { latitude: 31.2833, longitude: 34.3167 },

  // Northern settlements
  מטולה: { latitude: 33.2778, longitude: 35.5728 },
  "מעלות תרשיחא": { latitude: 33.0167, longitude: 35.2667 },

  // Alternative spellings and common variations
  "י-ם": { latitude: 31.7683, longitude: 35.2137 },
  'ת"א': { latitude: 32.0853, longitude: 34.7818 },
  'ב"ש': { latitude: 31.2518, longitude: 34.7913 },
};

/**
 * In-memory cache for geocoding results
 * Prevents repeated API calls for the same location
 */
const geocodingCache: Map<string, GeocodingResult | null> = new Map();

/**
 * Normalizes a Hebrew city name for consistent lookup
 * Removes extra whitespace, converts to lowercase-equivalent, and standardizes formats
 */
function normalizeHebrewCityName(cityName: string): string {
  return cityName
    .trim()
    .replace(/\s+/g, " ")
    .replace(/־/g, " ") // Replace Hebrew maqaf with space
    .replace(/-/g, " "); // Replace regular hyphen with space
}

/**
 * Validates that coordinates are within Israel's approximate boundaries
 */
function isWithinIsraelBounds(latitude: number, longitude: number): boolean {
  return (
    latitude >= ISRAEL_BOUNDS.minLatitude &&
    latitude <= ISRAEL_BOUNDS.maxLatitude &&
    longitude >= ISRAEL_BOUNDS.minLongitude &&
    longitude <= ISRAEL_BOUNDS.maxLongitude
  );
}

/**
 * Looks up a city in the local lookup table
 */
function lookupInTable(normalizedName: string): GeocodingResult | null {
  // Try exact match first
  if (ISRAELI_CITIES[normalizedName]) {
    return ISRAELI_CITIES[normalizedName];
  }

  // Try partial matches (for cases like "תל אביב יפו" vs "תל אביב-יפו")
  const entries = Object.entries(ISRAELI_CITIES);
  for (const [key, value] of entries) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return value;
    }
  }

  return null;
}

/**
 * Fetches geocoding data from Nominatim/OpenStreetMap API
 * This is a fallback for locations not in the lookup table
 */
async function fetchFromNominatim(cityName: string): Promise<GeocodingResult | null> {
  try {
    // Nominatim requires a User-Agent header
    const url =
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(cityName)},Israel` +
      `&format=json` +
      `&limit=1` +
      `&accept-language=he`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Oct7Timeline/1.0 (https://github.com/yourusername/oct7timeline)",
      },
    });

    if (!response.ok) {
      console.error(`Nominatim API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const result = data[0];
    const latitude = parseFloat(result.lat);
    const longitude = parseFloat(result.lon);

    // Validate coordinates are within Israel
    if (!isWithinIsraelBounds(latitude, longitude)) {
      console.warn(
        `Coordinates for "${cityName}" are outside Israel bounds: ${latitude}, ${longitude}`
      );
      return null;
    }

    return { latitude, longitude };
  } catch (error) {
    console.error(`Error fetching from Nominatim for "${cityName}":`, error);
    return null;
  }
}

/**
 * Main geocoding function
 * Converts a Hebrew city name to latitude/longitude coordinates
 *
 * @param cityName - Hebrew name of the city/location
 * @returns Promise resolving to coordinates or null if location cannot be geocoded
 *
 * @example
 * ```typescript
 * const coords = await geocodeLocation('ירושלים');
 * // { latitude: 31.7683, longitude: 35.2137 }
 *
 * const unknown = await geocodeLocation('unknown-city');
 * // null
 * ```
 */
export async function geocodeLocation(cityName: string): Promise<GeocodingResult | null> {
  // Validate input
  if (!cityName || typeof cityName !== "string") {
    console.error("Invalid city name provided to geocodeLocation");
    return null;
  }

  const trimmedName = cityName.trim();
  if (trimmedName.length === 0) {
    console.error("Empty city name provided to geocodeLocation");
    return null;
  }

  // Check cache first
  if (geocodingCache.has(trimmedName)) {
    return geocodingCache.get(trimmedName) || null;
  }

  // Normalize the city name for consistent lookup
  const normalizedName = normalizeHebrewCityName(trimmedName);

  // Try lookup table first (fastest, most reliable)
  const tableResult = lookupInTable(normalizedName);
  if (tableResult) {
    geocodingCache.set(trimmedName, tableResult);
    return tableResult;
  }

  // Fallback to Nominatim API
  console.log(`Location "${cityName}" not found in lookup table, trying Nominatim API...`);
  const apiResult = await fetchFromNominatim(trimmedName);

  // Cache the result (even if null, to avoid repeated failed lookups)
  geocodingCache.set(trimmedName, apiResult);

  return apiResult;
}

/**
 * Batch geocoding function for multiple locations
 * Includes a delay between API calls to respect rate limits
 *
 * @param cityNames - Array of Hebrew city names
 * @param delayMs - Delay between API calls in milliseconds (default: 1000ms)
 * @returns Promise resolving to a map of city names to their coordinates
 */
export async function geocodeLocations(
  cityNames: string[],
  delayMs: number = 1000
): Promise<Map<string, GeocodingResult | null>> {
  const results = new Map<string, GeocodingResult | null>();

  for (let i = 0; i < cityNames.length; i++) {
    const cityName = cityNames[i];
    const result = await geocodeLocation(cityName);
    results.set(cityName, result);

    // Add delay between API calls to respect rate limits (except for last item)
    if (i < cityNames.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

/**
 * Clears the geocoding cache
 * Useful for testing or when you want to force fresh lookups
 */
export function clearGeocodingCache(): void {
  geocodingCache.clear();
}

/**
 * Gets the current cache size
 * Useful for monitoring and debugging
 */
export function getGeocodingCacheSize(): number {
  return geocodingCache.size;
}

/**
 * Validates if coordinates are within Israel's boundaries
 * Exported for use in other modules
 */
export function validateIsraelCoordinates(latitude: number, longitude: number): boolean {
  return isWithinIsraelBounds(latitude, longitude);
}
