/**
 * Victim data schema for October 7th timeline
 *
 * This type represents individual victim records with personal information,
 * location data, and incident details.
 */

/**
 * Core victim data structure matching the JSON schema
 */
export interface Victim {
  /** Family name in Hebrew */
  lastName: string;

  /** Given name in Hebrew */
  firstName: string;

  /** Military rank or "-" if not applicable */
  rank: string;

  /** Age at time of incident */
  age: number;

  /** Location name in Hebrew (city/settlement) */
  location: string;

  /** Date of incident in ISO 8601 format (YYYY-MM-DD) */
  date: string;

  /** Source of attack in Hebrew (e.g., "עזה", "לבנון", "תימן", "פיגועים בארץ") */
  source: string;

  /** Type of incident in Hebrew (e.g., "לחימה", "רקטות וטילים", "פיגוע", "חטיפה ושבי", "כטב\"מים", "תאונה מבצעית") */
  type: string;

  /** Gender in Hebrew ("זכר" for male, "נקבה" for female) */
  gender: string;

  /** URL to news article or "-" if not available */
  url: string;

  /** Geographic latitude coordinate */
  latitude: number;

  /** Geographic longitude coordinate */
  longitude: number;
}

/**
 * Type guard to check if an unknown value is a valid Victim object
 *
 * @param value - The value to check
 * @returns True if the value matches the Victim interface structure
 */
export function isVictim(value: unknown): value is Victim {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.lastName === 'string' &&
    typeof obj.firstName === 'string' &&
    typeof obj.rank === 'string' &&
    typeof obj.age === 'number' &&
    typeof obj.location === 'string' &&
    typeof obj.date === 'string' &&
    typeof obj.source === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.gender === 'string' &&
    typeof obj.url === 'string' &&
    typeof obj.latitude === 'number' &&
    typeof obj.longitude === 'number'
  );
}

/**
 * Type guard to check if an unknown value is an array of valid Victim objects
 *
 * @param value - The value to check
 * @returns True if the value is an array where all elements are Victim objects
 */
export function isVictimArray(value: unknown): value is Victim[] {
  return Array.isArray(value) && value.every(isVictim);
}

/**
 * Partial victim type for optional fields (useful for forms or updates)
 */
export type PartialVictim = Partial<Victim>;

/**
 * Victim type with required ID field (useful for database operations)
 */
export type VictimWithId = Victim & {
  id: string;
};

/**
 * Readonly victim type (useful for immutable data operations)
 */
export type ReadonlyVictim = Readonly<Victim>;
