/**
 * Israeli location name to coordinates mapping
 * Used for geocoding Hebrew location names to lat/lng
 */

export const ISRAEL_LOCATION_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  // Major cities
  'ירושלים': { latitude: 31.7683, longitude: 35.2137 },
  'תל אביב': { latitude: 32.0853, longitude: 34.7818 },
  'חיפה': { latitude: 32.7940, longitude: 34.9896 },
  'באר שבע': { latitude: 31.2518, longitude: 34.7913 },
  'ראשון לציון': { latitude: 31.9730, longitude: 34.7925 },
  'פתח תקווה': { latitude: 32.0878, longitude: 34.8878 },
  'אשדוד': { latitude: 31.8044, longitude: 34.6553 },
  'נתניה': { latitude: 32.3215, longitude: 34.8532 },
  'חולון': { latitude: 32.0117, longitude: 34.7750 },
  'בני ברק': { latitude: 32.0814, longitude: 34.8338 },
  'רמת גן': { latitude: 32.0700, longitude: 34.8244 },
  'אשקלון': { latitude: 31.6688, longitude: 34.5742 },
  'רחובות': { latitude: 31.8969, longitude: 34.8186 },
  'בת ים': { latitude: 32.0192, longitude: 34.7500 },
  'הרצליה': { latitude: 32.1667, longitude: 34.8333 },
  'כפר סבא': { latitude: 32.1844, longitude: 34.9077 },
  'חדרה': { latitude: 32.4344, longitude: 34.9181 },
  'מודיעין': { latitude: 31.8969, longitude: 35.0072 },
  'נצרת': { latitude: 32.7028, longitude: 35.2972 },
  'רעננה': { latitude: 32.1847, longitude: 34.8708 },
  'לוד': { latitude: 31.9514, longitude: 34.8897 },
  'רמלה': { latitude: 31.9297, longitude: 34.8672 },
  'קריית אתא': { latitude: 32.8092, longitude: 35.1031 },
  'עכו': { latitude: 32.9333, longitude: 35.0833 },
  'אילת': { latitude: 29.5577, longitude: 34.9519 },
  'קריית גת': { latitude: 31.6100, longitude: 34.7642 },
  'גבעתיים': { latitude: 32.0708, longitude: 34.8119 },
  'קריית מוצקין': { latitude: 32.8369, longitude: 35.0747 },
  'נס ציונה': { latitude: 31.9308, longitude: 34.7992 },
  'יבנה': { latitude: 31.8778, longitude: 34.7400 },
  'דימונה': { latitude: 31.0686, longitude: 35.0328 },

  // Border communities / Kibbutzim near Gaza
  'בארי': { latitude: 31.3319, longitude: 34.4558 },
  'כפר עזה': { latitude: 31.4475, longitude: 34.4786 },
  'ניר עוז': { latitude: 31.3475, longitude: 34.3994 },
  'נחל עוז': { latitude: 31.3544, longitude: 34.4303 },
  'ניר יצחק': { latitude: 31.3186, longitude: 34.4036 },
  'מגן': { latitude: 31.3722, longitude: 34.5214 },
  'כיסופים': { latitude: 31.3733, longitude: 34.4503 },
  'נירים': { latitude: 31.3306, longitude: 34.4072 },
  'רעים': { latitude: 31.4219, longitude: 34.4697 },
  'עלומים': { latitude: 31.3544, longitude: 34.4478 },
  'כרם שלום': { latitude: 31.2456, longitude: 34.3083 },
  'אופקים': { latitude: 31.3167, longitude: 34.6194 },
  'שדרות': { latitude: 31.5244, longitude: 34.5961 },
  'נתיבות': { latitude: 31.4239, longitude: 34.5917 },

  // Other locations
  'אשכול': { latitude: 31.2000, longitude: 34.5000 },
  'באר טוביה': { latitude: 31.7006, longitude: 34.7292 },
  'גן יבנה': { latitude: 31.7881, longitude: 34.7039 },
  'קריית ביאליק': { latitude: 32.8369, longitude: 35.0747 },
  'מג\'דל שמס': { latitude: 33.2667, longitude: 35.7672 },
  'צפת': { latitude: 32.9650, longitude: 35.4983 },
  'טבריה': { latitude: 32.7917, longitude: 35.5308 },
  'בית שאן': { latitude: 32.5006, longitude: 35.4981 },

  // Foreign locations (approximate)
  'תאילנד': { latitude: 13.7563, longitude: 100.5018 }, // Bangkok
  'ארה"ב': { latitude: 40.7128, longitude: -74.0060 }, // New York
  'קנדה': { latitude: 43.6532, longitude: -79.3832 }, // Toronto
  'מנצ\'סטר- בריטניה': { latitude: 53.4808, longitude: -2.2426 }, // Manchester
  'ארגנטינה': { latitude: -34.6037, longitude: -58.3816 }, // Buenos Aires
  'אוקראינה': { latitude: 50.4501, longitude: 30.5234 }, // Kyiv
};

/**
 * Get coordinates for a location name
 * Returns center of Israel if location not found
 */
export function getLocationCoordinates(location: string): { latitude: number; longitude: number } {
  const normalizedLocation = location.trim();

  // Try exact match
  if (ISRAEL_LOCATION_COORDINATES[normalizedLocation]) {
    return ISRAEL_LOCATION_COORDINATES[normalizedLocation];
  }

  // Try partial match (e.g., "תל אביב - יפו" matches "תל אביב")
  for (const [key, coords] of Object.entries(ISRAEL_LOCATION_COORDINATES)) {
    if (normalizedLocation.includes(key) || key.includes(normalizedLocation)) {
      return coords;
    }
  }

  // Default to center of Israel
  return { latitude: 31.5, longitude: 34.8 };
}
