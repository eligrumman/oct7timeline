/**
 * Data validation utilities for victim records
 *
 * Provides validation functions to ensure data integrity for victim records,
 * including field presence, format validation, and geographic bounds checking.
 */

import { Victim, isVictim, isVictimArray } from '../types/victim';

/**
 * Result of a validation operation
 */
export interface ValidationResult {
  /** Whether the data passed all validation checks */
  valid: boolean;

  /** Array of validation error messages (empty if valid) */
  errors: string[];
}

/**
 * Geographic bounds for Israel
 * Used to validate latitude and longitude coordinates
 */
const ISRAEL_BOUNDS = {
  latitude: {
    min: 29.5,
    max: 33.3,
  },
  longitude: {
    min: 34.3,
    max: 35.9,
  },
} as const;

/**
 * ISO 8601 date format regex (YYYY-MM-DD)
 * Validates dates in the format: 2023-10-07
 */
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Basic URL validation regex
 * Allows http/https URLs or the placeholder "-"
 */
const URL_REGEX = /^(https?:\/\/.+|-)$/;

/**
 * Validates that required fields exist in a victim record
 *
 * @param victim - Partial victim object to validate
 * @returns True if all required fields are present and non-empty
 */
export function validateRequiredFields(victim: Partial<Victim>): boolean {
  const requiredFields: (keyof Victim)[] = [
    'firstName',
    'lastName',
    'age',
    'location',
    'date',
    'latitude',
    'longitude',
  ];

  return requiredFields.every((field) => {
    const value = victim[field];
    if (value === undefined || value === null) {
      return false;
    }
    // String fields must not be empty
    if (typeof value === 'string' && value.trim() === '') {
      return false;
    }
    return true;
  });
}

/**
 * Validates date format against ISO 8601 (YYYY-MM-DD)
 *
 * @param date - Date string to validate
 * @returns True if date matches ISO 8601 format and is a valid date
 */
export function validateDateFormat(date: string): boolean {
  if (!ISO_DATE_REGEX.test(date)) {
    return false;
  }

  // Additional check: ensure the date is actually valid (e.g., not 2023-13-45)
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime()) && parsedDate.toISOString().startsWith(date);
}

/**
 * Validates geographic coordinates are within Israel bounds
 *
 * @param lat - Latitude coordinate
 * @param lon - Longitude coordinate
 * @returns True if coordinates fall within Israel's geographic bounds
 */
export function validateCoordinates(lat: number, lon: number): boolean {
  // Check if values are valid numbers
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return false;
  }

  // Check if coordinates are within Israel bounds
  const latValid = lat >= ISRAEL_BOUNDS.latitude.min && lat <= ISRAEL_BOUNDS.latitude.max;
  const lonValid = lon >= ISRAEL_BOUNDS.longitude.min && lon <= ISRAEL_BOUNDS.longitude.max;

  return latValid && lonValid;
}

/**
 * Validates a single victim record
 *
 * Performs comprehensive validation including:
 * - Type checking using type guard
 * - Required fields validation
 * - Date format validation
 * - Age validation (positive number)
 * - Geographic coordinates validation
 * - URL format validation
 *
 * @param data - Unknown data to validate as a Victim record
 * @returns ValidationResult with valid status and any error messages
 */
export function validateVictim(data: unknown): ValidationResult {
  const errors: string[] = [];

  // Type guard check
  if (!isVictim(data)) {
    errors.push('Data does not match Victim type structure');
    return { valid: false, errors };
  }

  // At this point, TypeScript knows data is a Victim
  const victim = data;

  // Validate required fields
  if (!validateRequiredFields(victim)) {
    errors.push('Missing one or more required fields: firstName, lastName, age, location, date, latitude, longitude');
  }

  // Validate firstName
  if (typeof victim.firstName === 'string' && victim.firstName.trim() === '') {
    errors.push('firstName cannot be empty');
  }

  // Validate lastName
  if (typeof victim.lastName === 'string' && victim.lastName.trim() === '') {
    errors.push('lastName cannot be empty');
  }

  // Validate age
  if (typeof victim.age === 'number') {
    if (!Number.isFinite(victim.age)) {
      errors.push('age must be a finite number');
    } else if (victim.age <= 0) {
      errors.push('age must be a positive number');
    } else if (!Number.isInteger(victim.age)) {
      errors.push('age must be an integer');
    }
  }

  // Validate date format
  if (typeof victim.date === 'string' && !validateDateFormat(victim.date)) {
    errors.push(`Invalid date format: "${victim.date}". Expected ISO 8601 format (YYYY-MM-DD)`);
  }

  // Validate coordinates
  if (!validateCoordinates(victim.latitude, victim.longitude)) {
    errors.push(
      `Invalid coordinates: lat=${victim.latitude}, lon=${victim.longitude}. ` +
      `Expected latitude between ${ISRAEL_BOUNDS.latitude.min} and ${ISRAEL_BOUNDS.latitude.max}, ` +
      `longitude between ${ISRAEL_BOUNDS.longitude.min} and ${ISRAEL_BOUNDS.longitude.max}`
    );
  }

  // Validate URL format
  if (typeof victim.url === 'string' && !URL_REGEX.test(victim.url)) {
    errors.push(`Invalid URL format: "${victim.url}". Expected valid http/https URL or "-"`);
  }

  // Validate location
  if (typeof victim.location === 'string' && victim.location.trim() === '') {
    errors.push('location cannot be empty');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates an array of victim records
 *
 * Validates each victim in the array individually and aggregates all errors.
 * Includes array-level validation (e.g., checking if input is an array).
 *
 * @param data - Unknown data to validate as an array of Victim records
 * @returns ValidationResult with valid status and any error messages
 */
export function validateVictimArray(data: unknown): ValidationResult {
  const errors: string[] = [];

  // Check if data is an array
  if (!Array.isArray(data)) {
    errors.push('Data is not an array');
    return { valid: false, errors };
  }

  // Check if array is empty
  if (data.length === 0) {
    errors.push('Array is empty');
    return { valid: false, errors };
  }

  // Validate each victim individually
  data.forEach((item, index) => {
    const result = validateVictim(item);
    if (!result.valid) {
      // Prefix each error with the array index for debugging
      result.errors.forEach((error) => {
        errors.push(`[Index ${index}] ${error}`);
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
