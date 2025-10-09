/**
 * TypeScript types for victim data schema
 * Based on the October 7th timeline victim data structure
 */

/**
 * Gender types in Hebrew
 */
export type Gender = 'זכר' | 'נקבה';

/**
 * Source of incident in Hebrew
 */
export type Source = 'עזה' | 'לבנון' | 'תימן' | 'פיגועים בארץ' | string;

/**
 * Type of incident in Hebrew
 */
export type IncidentType =
  | 'רקטות וטילים'
  | 'לחימה'
  | 'פיגוע'
  | 'תאונה מבצעית'
  | 'חטיפה ושבי'
  | 'כטב"מים'
  | string;

/**
 * Military rank in Hebrew (or "-" for civilians)
 */
export type MilitaryRank =
  | 'סמ"ר'
  | 'סמ"ר (מיל\')'
  | 'סמל'
  | 'סרן'
  | 'סגן'
  | 'רס"ל (מיל\')'
  | '-'
  | string;

/**
 * Raw victim data structure from JSON source
 * All text fields are in Hebrew
 */
export interface VictimData {
  /** Last name in Hebrew */
  lastName: string;

  /** First name (and sometimes middle name) in Hebrew */
  firstName: string;

  /** Military rank or "-" for civilians */
  rank: MilitaryRank;

  /** Age in years */
  age: number;

  /** Location/city name in Hebrew */
  location: string;

  /** Date of incident in ISO 8601 format (YYYY-MM-DD) */
  date: string;

  /** Source of incident in Hebrew */
  source: Source;

  /** Type of incident in Hebrew */
  type: IncidentType;

  /** Gender in Hebrew */
  gender: Gender;

  /** URL to news article or "-" if not available */
  url: string;

  /** Latitude coordinate in decimal degrees */
  latitude: number;

  /** Longitude coordinate in decimal degrees */
  longitude: number;
}

/**
 * Processed victim data with additional computed fields
 * Used for map visualization and timeline features
 */
export interface ProcessedVictimData extends VictimData {
  /** Unique identifier generated from victim data */
  id: string;

  /** Parsed Date object for easier manipulation */
  dateObject: Date;

  /** Unix timestamp in milliseconds */
  timestamp: number;

  /** Full name (firstName + lastName) */
  fullName: string;

  /** Whether the victim is a civilian (rank === "-") */
  isCivilian: boolean;

  /** Whether a news URL is available */
  hasUrl: boolean;
}

/**
 * Geographic coordinates
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Victim location data for map rendering
 */
export interface VictimLocation extends Coordinates {
  /** City/location name in Hebrew */
  location: string;

  /** Number of victims at this location */
  count: number;

  /** Array of victim IDs at this location */
  victimIds: string[];
}

/**
 * Statistics aggregated from victim data
 */
export interface VictimStatistics {
  /** Total number of victims */
  total: number;

  /** Number of civilian victims */
  civilians: number;

  /** Number of military personnel */
  military: number;

  /** Victims grouped by source */
  bySource: Record<string, number>;

  /** Victims grouped by incident type */
  byType: Record<string, number>;

  /** Victims grouped by date */
  byDate: Record<string, number>;

  /** Victims grouped by location */
  byLocation: Record<string, number>;

  /** Victims grouped by gender */
  byGender: Record<Gender, number>;

  /** Age statistics */
  ageStats: {
    min: number;
    max: number;
    average: number;
    median: number;
  };
}

/**
 * Filter options for victim data queries
 */
export interface VictimFilter {
  /** Filter by date range */
  dateRange?: {
    start: string;
    end: string;
  };

  /** Filter by source */
  sources?: Source[];

  /** Filter by incident type */
  types?: IncidentType[];

  /** Filter by gender */
  gender?: Gender;

  /** Filter by age range */
  ageRange?: {
    min: number;
    max: number;
  };

  /** Filter by location */
  locations?: string[];

  /** Include only civilians */
  civiliansOnly?: boolean;

  /** Include only military personnel */
  militaryOnly?: boolean;
}

/**
 * Type guard to check if a victim has a valid URL
 */
export function hasValidUrl(victim: VictimData): boolean {
  return victim.url !== '-' && victim.url.startsWith('http');
}

/**
 * Type guard to check if a victim is a civilian
 */
export function isCivilian(victim: VictimData): boolean {
  return victim.rank === '-';
}
