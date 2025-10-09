/**
 * Data processing utilities for transforming victim data
 * Converts raw VictimData to ProcessedVictimData with computed fields
 */

import { createHash } from 'crypto';
import type { VictimData, ProcessedVictimData } from '@/types/victim';
import { validateVictimData, validateVictimDataArray, isCompleteVictimData } from '@/lib/validation';
import type { ValidationResult, BulkValidationResult } from '@/lib/validation';

/**
 * Error thrown when data processing fails
 */
export class DataProcessingError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'DataProcessingError';
    Object.setPrototypeOf(this, DataProcessingError.prototype);
  }
}

/**
 * Result of processing operation with validation information
 */
export interface ProcessingResult<T> {
  success: boolean;
  data?: T;
  validationResult?: ValidationResult;
  error?: DataProcessingError;
}

/**
 * Result of bulk processing operation
 */
export interface BulkProcessingResult {
  success: boolean;
  processedData: ProcessedVictimData[];
  validationResult: BulkValidationResult;
  failedRecords: Array<{
    recordIndex: number;
    recordIdentifier?: string;
    error: DataProcessingError;
  }>;
}

/**
 * Converts an ISO 8601 date string to a JavaScript Date object
 *
 * @param isoDateString - Date string in YYYY-MM-DD format
 * @returns Date object
 * @throws DataProcessingError if the date string is invalid
 */
export function convertISODateToDate(isoDateString: string): Date {
  // Validate input
  if (!isoDateString || typeof isoDateString !== 'string') {
    throw new DataProcessingError(
      'Date string must be a non-empty string',
      'date'
    );
  }

  // Check format (YYYY-MM-DD)
  const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
  if (!ISO_DATE_REGEX.test(isoDateString)) {
    throw new DataProcessingError(
      `Date string must be in ISO 8601 format (YYYY-MM-DD): ${isoDateString}`,
      'date'
    );
  }

  try {
    const date = new Date(isoDateString);

    if (isNaN(date.getTime())) {
      throw new DataProcessingError(
        `Invalid date string: ${isoDateString}`,
        'date'
      );
    }

    // Verify the date components match (catches invalid dates like 2023-02-30)
    const [year, month, day] = isoDateString.split('-').map(Number);
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      throw new DataProcessingError(
        `Invalid date components: ${isoDateString}`,
        'date'
      );
    }

    return date;
  } catch (error) {
    if (error instanceof DataProcessingError) {
      throw error;
    }
    throw new DataProcessingError(
      `Failed to parse date: ${isoDateString}`,
      'date',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Converts a Date object to Unix timestamp in milliseconds
 * This format is compatible with Kepler.gl and other visualization libraries
 *
 * @param date - JavaScript Date object
 * @returns Unix timestamp in milliseconds
 * @throws DataProcessingError if the date is invalid
 */
export function convertDateToTimestamp(date: Date): number {
  try {
    const timestamp = date.getTime();

    if (isNaN(timestamp)) {
      throw new DataProcessingError(
        'Date object is invalid',
        'date'
      );
    }

    return timestamp;
  } catch (error) {
    if (error instanceof DataProcessingError) {
      throw error;
    }
    throw new DataProcessingError(
      'Failed to convert date to timestamp',
      'date',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Ensures proper Hebrew UTF-8 encoding for a string
 * Validates that the text contains valid Hebrew characters and is properly encoded
 *
 * @param text - Text to validate
 * @returns The same text if valid, or throws an error
 * @throws DataProcessingError if the text has invalid encoding
 */
export function ensureHebrewUTF8(text: string, fieldName: string): string {
  if (!text || typeof text !== 'string') {
    throw new DataProcessingError(
      `${fieldName} must be a non-empty string`,
      fieldName
    );
  }

  try {
    // Verify UTF-8 encoding by attempting to encode/decode
    if (typeof TextEncoder !== 'undefined' && typeof TextDecoder !== 'undefined') {
      const encoded = new TextEncoder().encode(text);
      const decoded = new TextDecoder('utf-8', { fatal: true }).decode(encoded);

      if (decoded !== text) {
        throw new DataProcessingError(
          `${fieldName} has invalid UTF-8 encoding`,
          fieldName
        );
      }
    } else if (typeof Buffer !== 'undefined') {
      // Node.js environment
      const buffer = Buffer.from(text, 'utf8');
      const decoded = buffer.toString('utf8');

      if (decoded !== text) {
        throw new DataProcessingError(
          `${fieldName} has invalid UTF-8 encoding`,
          fieldName
        );
      }
    }

    return text;
  } catch (error) {
    if (error instanceof DataProcessingError) {
      throw error;
    }
    throw new DataProcessingError(
      `Failed to validate UTF-8 encoding for ${fieldName}`,
      fieldName,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Generates a unique identifier for a victim based on their data
 * Uses SHA-256 hash of name, date, and location to ensure uniqueness
 *
 * @param firstName - Victim's first name
 * @param lastName - Victim's last name
 * @param date - Date of incident (ISO format)
 * @param location - Location of incident
 * @returns Unique identifier (first 16 characters of SHA-256 hash)
 */
export function generateVictimId(
  firstName: string,
  lastName: string,
  date: string,
  location: string
): string {
  try {
    // Create a deterministic string from victim data
    const dataString = `${firstName}|${lastName}|${date}|${location}`;

    // Generate SHA-256 hash
    const hash = createHash('sha256')
      .update(dataString, 'utf8')
      .digest('hex');

    // Return first 16 characters for a shorter but still unique ID
    return hash.substring(0, 16);
  } catch (error) {
    throw new DataProcessingError(
      'Failed to generate victim ID',
      'id',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Transforms a single VictimData record to ProcessedVictimData
 * Adds computed fields: id, dateObject, timestamp, fullName, isCivilian, hasUrl
 *
 * @param victim - Raw victim data
 * @returns ProcessingResult with processed data or error
 */
export function processVictimData(victim: Partial<VictimData>): ProcessingResult<ProcessedVictimData> {
  // Validate the input data first
  const validationResult = validateVictimData(victim);

  if (!validationResult.valid) {
    return {
      success: false,
      validationResult,
      error: new DataProcessingError(
        'Validation failed: ' + validationResult.errors.map(e => e.message).join(', '),
        validationResult.errors[0]?.field
      ),
    };
  }

  // Type guard ensures victim is complete VictimData
  if (!isCompleteVictimData(victim)) {
    return {
      success: false,
      validationResult,
      error: new DataProcessingError('Data validation passed but type guard failed'),
    };
  }

  try {
    // Ensure Hebrew UTF-8 encoding for text fields
    const firstName = ensureHebrewUTF8(victim.firstName, 'firstName');
    const lastName = ensureHebrewUTF8(victim.lastName, 'lastName');
    const location = ensureHebrewUTF8(victim.location, 'location');
    const source = ensureHebrewUTF8(victim.source, 'source');
    const type = ensureHebrewUTF8(victim.type, 'type');

    // Convert date to Date object and timestamp
    const dateObject = convertISODateToDate(victim.date);
    const timestamp = convertDateToTimestamp(dateObject);

    // Generate unique ID
    const id = generateVictimId(firstName, lastName, victim.date, location);

    // Compute derived fields
    const fullName = `${firstName} ${lastName}`;
    const isCivilian = victim.rank === '-';
    const hasUrl = victim.url !== '-' && victim.url.startsWith('http');

    const processedData: ProcessedVictimData = {
      ...victim,
      firstName,
      lastName,
      location,
      source,
      type,
      id,
      dateObject,
      timestamp,
      fullName,
      isCivilian,
      hasUrl,
    };

    return {
      success: true,
      data: processedData,
      validationResult,
    };
  } catch (error) {
    return {
      success: false,
      validationResult,
      error: error instanceof DataProcessingError
        ? error
        : new DataProcessingError(
            'Failed to process victim data',
            undefined,
            error instanceof Error ? error : undefined
          ),
    };
  }
}

/**
 * Processes an array of victim data records with validation
 * Returns successfully processed records and collects errors for failed records
 *
 * @param victims - Array of raw victim data
 * @returns BulkProcessingResult with processed data and validation details
 */
export function processVictimDataArray(victims: Array<Partial<VictimData>>): BulkProcessingResult {
  // Validate all records first
  const validationResult = validateVictimDataArray(victims);

  const processedData: ProcessedVictimData[] = [];
  const failedRecords: BulkProcessingResult['failedRecords'] = [];

  victims.forEach((victim, index) => {
    const result = processVictimData(victim);

    if (result.success && result.data) {
      processedData.push(result.data);
    } else {
      const recordIdentifier = victim.firstName && victim.lastName
        ? `${victim.firstName} ${victim.lastName}`
        : undefined;

      failedRecords.push({
        recordIndex: index,
        recordIdentifier,
        error: result.error || new DataProcessingError('Unknown processing error'),
      });
    }
  });

  return {
    success: failedRecords.length === 0,
    processedData,
    validationResult,
    failedRecords,
  };
}

/**
 * Convenience function to process victim data array and throw on any errors
 * Use this when you want to fail fast on invalid data
 *
 * @param victims - Array of raw victim data
 * @returns Array of processed victim data
 * @throws DataProcessingError if any record fails validation or processing
 */
export function processVictimDataArrayStrict(victims: Array<Partial<VictimData>>): ProcessedVictimData[] {
  const result = processVictimDataArray(victims);

  if (!result.success) {
    const errorMessages = result.failedRecords.map((record) => {
      const identifier = record.recordIdentifier ? ` (${record.recordIdentifier})` : '';
      return `Record ${record.recordIndex}${identifier}: ${record.error.message}`;
    });

    throw new DataProcessingError(
      `Failed to process ${result.failedRecords.length} of ${victims.length} records:\n${errorMessages.join('\n')}`
    );
  }

  return result.processedData;
}

/**
 * Utility to sort processed victims by timestamp (oldest to newest)
 */
export function sortVictimsByDate(victims: ProcessedVictimData[]): ProcessedVictimData[] {
  return [...victims].sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Utility to sort processed victims by timestamp (newest to oldest)
 */
export function sortVictimsByDateDesc(victims: ProcessedVictimData[]): ProcessedVictimData[] {
  return [...victims].sort((a, b) => b.timestamp - a.timestamp);
}
