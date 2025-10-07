/**
 * Data loading utilities for victim records
 *
 * Provides functions to load, parse, validate, and enrich victim data from JSON sources.
 * Supports both file-based and string-based data loading with comprehensive validation.
 */

import { readFile } from 'fs/promises';
import { Victim } from '../types/victim';
import { validateVictim, validateVictimArray, ValidationResult } from './validation';
import { geocodeLocation, GeocodingResult } from '../services/geocoding';

/**
 * Victim record extended with Unix timestamp for Kepler.gl
 * Kepler.gl requires Unix timestamps (milliseconds since epoch) for temporal data
 */
export interface VictimWithTimestamp extends Victim {
  /** Unix timestamp in milliseconds (for Kepler.gl temporal filtering) */
  timestamp: number;
}

/**
 * Error thrown when data loading fails
 */
export class DataLoadError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'DataLoadError';
  }
}

/**
 * Error thrown when data validation fails
 */
export class DataValidationError extends Error {
  constructor(
    message: string,
    public readonly validationResult: ValidationResult
  ) {
    super(message);
    this.name = 'DataValidationError';
  }
}

/**
 * Error thrown when data enrichment fails
 */
export class DataEnrichmentError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'DataEnrichmentError';
  }
}

/**
 * Loads victim data from a JSON file
 *
 * Reads a JSON file containing an array of victim records, parses it,
 * and validates all records before returning.
 *
 * @param filePath - Absolute path to the JSON file
 * @returns Promise resolving to an array of validated Victim records
 * @throws {DataLoadError} If file cannot be read or JSON is malformed
 * @throws {DataValidationError} If data validation fails
 *
 * @example
 * ```typescript
 * const victims = await loadVictimsFromJSON('/path/to/victims.json');
 * console.log(`Loaded ${victims.length} victim records`);
 * ```
 */
export async function loadVictimsFromJSON(filePath: string): Promise<Victim[]> {
  try {
    // Read file with UTF-8 encoding to support Hebrew text
    const fileContent = await readFile(filePath, 'utf-8');

    // Parse and validate the data
    return parseVictimsData(fileContent);
  } catch (error) {
    // Re-throw our custom errors as-is
    if (
      error instanceof DataValidationError ||
      error instanceof DataLoadError
    ) {
      throw error;
    }

    // Wrap other errors in DataLoadError
    throw new DataLoadError(
      `Failed to load victims from file "${filePath}": ${error instanceof Error ? error.message : String(error)}`,
      error
    );
  }
}

/**
 * Parses a JSON string into an array of validated Victim records
 *
 * Parses JSON string, validates structure and content of all records.
 * JSON.parse automatically handles UTF-8 encoded Hebrew text.
 *
 * @param jsonString - JSON string containing victim data
 * @returns Array of validated Victim records
 * @throws {DataLoadError} If JSON parsing fails
 * @throws {DataValidationError} If data validation fails
 *
 * @example
 * ```typescript
 * const jsonData = '[{"lastName":"כהן","firstName":"דוד",...}]';
 * const victims = parseVictimsData(jsonData);
 * ```
 */
export function parseVictimsData(jsonString: string): Victim[] {
  let parsedData: unknown;

  try {
    parsedData = JSON.parse(jsonString);
  } catch (error) {
    throw new DataLoadError(
      `Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`,
      error
    );
  }

  // Validate the parsed data
  const validationResult = validateVictimArray(parsedData);

  if (!validationResult.valid) {
    throw new DataValidationError(
      `Data validation failed with ${validationResult.errors.length} error(s):\n${validationResult.errors.join('\n')}`,
      validationResult
    );
  }

  // TypeScript now knows parsedData is Victim[] due to validation
  return parsedData as Victim[];
}

/**
 * Converts victim records to include Unix timestamps for Kepler.gl
 *
 * Kepler.gl requires Unix timestamps (milliseconds since epoch) for temporal
 * visualization. This function converts ISO 8601 date strings to timestamps.
 *
 * @param victims - Array of victim records with ISO 8601 dates
 * @returns Array of victim records with added timestamp field
 *
 * @example
 * ```typescript
 * const victims = await loadVictimsFromJSON('/path/to/data.json');
 * const withTimestamps = convertDatesToTimestamps(victims);
 * // Each record now has a timestamp field for Kepler.gl
 * ```
 */
export function convertDatesToTimestamps(victims: Victim[]): VictimWithTimestamp[] {
  return victims.map((victim) => {
    // Parse ISO 8601 date string to Date object
    const date = new Date(victim.date);

    // Convert to Unix timestamp in milliseconds
    const timestamp = date.getTime();

    // Validate that the timestamp is valid
    if (!Number.isFinite(timestamp) || isNaN(timestamp)) {
      throw new DataLoadError(
        `Invalid date "${victim.date}" for victim ${victim.firstName} ${victim.lastName}: ` +
        `cannot convert to timestamp`
      );
    }

    return {
      ...victim,
      timestamp,
    };
  });
}

/**
 * Enriches a partial victim record with missing geocoding data
 *
 * If latitude/longitude are missing or invalid, attempts to geocode the
 * location name using the geocoding service. Returns a complete Victim record.
 *
 * @param victim - Partial victim record, potentially missing lat/long
 * @returns Promise resolving to a complete Victim record with coordinates
 * @throws {DataEnrichmentError} If geocoding fails or required fields are missing
 *
 * @example
 * ```typescript
 * const partial: Partial<Victim> = {
 *   firstName: 'דוד',
 *   lastName: 'כהן',
 *   location: 'ירושלים',
 *   // ... other fields, but missing latitude/longitude
 * };
 * const enriched = await enrichVictimData(partial);
 * // enriched now has latitude and longitude from geocoding
 * ```
 */
export async function enrichVictimData(victim: Partial<Victim>): Promise<Victim> {
  // Check if enrichment is needed
  const needsGeocoding =
    typeof victim.latitude !== 'number' ||
    typeof victim.longitude !== 'number' ||
    !Number.isFinite(victim.latitude) ||
    !Number.isFinite(victim.longitude);

  let enrichedVictim = { ...victim };

  if (needsGeocoding) {
    // Validate that location field exists
    if (!victim.location || typeof victim.location !== 'string') {
      throw new DataEnrichmentError(
        'Cannot enrich victim data: location field is required for geocoding'
      );
    }

    // Attempt to geocode the location
    const geocodingResult: GeocodingResult | null = await geocodeLocation(
      victim.location
    );

    if (!geocodingResult) {
      throw new DataEnrichmentError(
        `Failed to geocode location "${victim.location}": ` +
        `no coordinates found. Please provide coordinates manually or ensure ` +
        `the location name is valid.`
      );
    }

    // Add geocoding results to the victim record
    enrichedVictim = {
      ...enrichedVictim,
      latitude: geocodingResult.latitude,
      longitude: geocodingResult.longitude,
    };
  }

  // Validate that all required fields are present
  const validationResult = validateVictim(enrichedVictim);

  if (!validationResult.valid) {
    throw new DataEnrichmentError(
      `Enriched victim data is invalid:\n${validationResult.errors.join('\n')}`
    );
  }

  // TypeScript now knows enrichedVictim is a complete Victim
  return enrichedVictim as Victim;
}

/**
 * Batch enrichment function for multiple victim records
 *
 * Enriches multiple partial victim records in parallel, with proper error handling.
 * Failed enrichments are collected and reported together.
 *
 * @param victims - Array of partial victim records
 * @param options - Configuration options
 * @param options.continueOnError - If true, continues processing even if some records fail (default: false)
 * @param options.delayMs - Delay between geocoding API calls in milliseconds (default: 1000)
 * @returns Promise resolving to array of enriched Victim records
 * @throws {DataEnrichmentError} If any enrichment fails and continueOnError is false
 *
 * @example
 * ```typescript
 * const partialVictims = [
 *   { firstName: 'דוד', lastName: 'כהן', location: 'ירושלים', ... },
 *   { firstName: 'שרה', lastName: 'לוי', location: 'תל אביב', ... },
 * ];
 * const enriched = await batchEnrichVictimData(partialVictims, {
 *   continueOnError: true,
 *   delayMs: 1000
 * });
 * ```
 */
export async function batchEnrichVictimData(
  victims: Partial<Victim>[],
  options: { continueOnError?: boolean; delayMs?: number } = {}
): Promise<Victim[]> {
  const { continueOnError = false, delayMs = 1000 } = options;

  const results: Victim[] = [];
  const errors: Array<{ index: number; error: Error }> = [];

  for (let i = 0; i < victims.length; i++) {
    const victim = victims[i];

    try {
      const enriched = await enrichVictimData(victim);
      results.push(enriched);

      // Add delay between API calls to respect rate limits (except for last item)
      if (i < victims.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      const enrichmentError =
        error instanceof DataEnrichmentError
          ? error
          : new DataEnrichmentError(
              `Failed to enrich victim at index ${i}`,
              error
            );

      if (continueOnError) {
        errors.push({ index: i, error: enrichmentError });
        console.error(`[Index ${i}] ${enrichmentError.message}`);
      } else {
        throw enrichmentError;
      }
    }
  }

  if (errors.length > 0 && !continueOnError) {
    throw new DataEnrichmentError(
      `Batch enrichment failed with ${errors.length} error(s):\n` +
      errors.map((e) => `[Index ${e.index}] ${e.error.message}`).join('\n')
    );
  }

  if (errors.length > 0) {
    console.warn(
      `Batch enrichment completed with ${errors.length} error(s). ` +
      `Successfully enriched ${results.length} out of ${victims.length} records.`
    );
  }

  return results;
}
