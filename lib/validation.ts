/**
 * Data validation utilities for victim data
 * Validates required fields, formats, and data integrity
 */

import type { VictimData, Gender, MilitaryRank, Source, IncidentType } from '@/types/victim';

/**
 * Validation error detail
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Validation result for a single record
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validation result for multiple records
 */
export interface BulkValidationResult {
  valid: boolean;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  errors: Array<{
    recordIndex: number;
    recordIdentifier?: string;
    errors: ValidationError[];
  }>;
}

/**
 * Israel geographic boundaries for coordinate validation
 */
const ISRAEL_BOUNDS = {
  latitude: { min: 29.5, max: 33.3 },
  longitude: { min: 34.3, max: 35.9 },
} as const;

/**
 * ISO 8601 date format regex (YYYY-MM-DD)
 */
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Valid gender values
 */
const VALID_GENDERS: readonly Gender[] = ['זכר', 'נקבה'] as const;

/**
 * Validates if a string is valid UTF-8 Hebrew text
 * Checks for Hebrew characters (U+0590 to U+05FF) or basic Latin/punctuation
 */
export function isValidHebrewText(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  // Allow Hebrew, English letters, numbers, spaces, and common punctuation
  const hebrewTextPattern = /^[\u0590-\u05FF\u0020-\u007E\s\-'"().,]+$/;

  try {
    // Check if the text contains valid characters
    if (!hebrewTextPattern.test(text)) {
      return false;
    }

    // Verify UTF-8 encoding by attempting to encode/decode
    // Use global TextEncoder/TextDecoder if available (browser/Node 11+)
    if (typeof TextEncoder !== 'undefined' && typeof TextDecoder !== 'undefined') {
      const encoded = new TextEncoder().encode(text);
      const decoded = new TextDecoder('utf-8', { fatal: true }).decode(encoded);
      return decoded === text;
    }

    // Fallback for older Node.js versions - just check the pattern
    // In Node.js, Buffer handles UTF-8 correctly by default
    if (typeof Buffer !== 'undefined') {
      const buffer = Buffer.from(text, 'utf8');
      const decoded = buffer.toString('utf8');
      return decoded === text;
    }

    // If neither is available, just rely on the regex pattern
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates if a date string is in ISO 8601 format (YYYY-MM-DD) and is a valid date
 */
export function isValidISODate(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }

  // Check format
  if (!ISO_DATE_REGEX.test(dateString)) {
    return false;
  }

  // Check if date is valid
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return false;
  }

  // Verify the date components match (catches invalid dates like 2023-02-30)
  const [year, month, day] = dateString.split('-').map(Number);
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Validates if coordinates are within Israel's geographic boundaries
 */
export function isValidIsraelCoordinates(latitude: number, longitude: number): boolean {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return false;
  }

  if (isNaN(latitude) || isNaN(longitude)) {
    return false;
  }

  return (
    latitude >= ISRAEL_BOUNDS.latitude.min &&
    latitude <= ISRAEL_BOUNDS.latitude.max &&
    longitude >= ISRAEL_BOUNDS.longitude.min &&
    longitude <= ISRAEL_BOUNDS.longitude.max
  );
}

/**
 * Validates if age is a positive number within reasonable range
 */
export function isValidAge(age: number): boolean {
  if (typeof age !== 'number' || isNaN(age)) {
    return false;
  }

  return age > 0 && age <= 120 && Number.isInteger(age);
}

/**
 * Validates if gender is a valid value
 */
export function isValidGender(gender: Gender | string): gender is Gender {
  return VALID_GENDERS.includes(gender as Gender);
}

/**
 * Validates a single victim data record
 */
export function validateVictimData(data: Partial<VictimData>): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate required fields exist
  if (!data.firstName) {
    errors.push({
      field: 'firstName',
      message: 'First name is required',
      value: data.firstName,
    });
  } else if (!isValidHebrewText(data.firstName)) {
    errors.push({
      field: 'firstName',
      message: 'First name contains invalid characters or encoding',
      value: data.firstName,
    });
  }

  if (!data.lastName) {
    errors.push({
      field: 'lastName',
      message: 'Last name is required',
      value: data.lastName,
    });
  } else if (!isValidHebrewText(data.lastName)) {
    errors.push({
      field: 'lastName',
      message: 'Last name contains invalid characters or encoding',
      value: data.lastName,
    });
  }

  // Validate age
  if (data.age === undefined || data.age === null) {
    errors.push({
      field: 'age',
      message: 'Age is required',
      value: data.age,
    });
  } else if (!isValidAge(data.age)) {
    errors.push({
      field: 'age',
      message: 'Age must be a positive integer between 1 and 120',
      value: data.age,
    });
  }

  // Validate location
  if (!data.location) {
    errors.push({
      field: 'location',
      message: 'Location is required',
      value: data.location,
    });
  } else if (!isValidHebrewText(data.location)) {
    errors.push({
      field: 'location',
      message: 'Location contains invalid characters or encoding',
      value: data.location,
    });
  }

  // Validate date
  if (!data.date) {
    errors.push({
      field: 'date',
      message: 'Date is required',
      value: data.date,
    });
  } else if (!isValidISODate(data.date)) {
    errors.push({
      field: 'date',
      message: 'Date must be in ISO 8601 format (YYYY-MM-DD) and be a valid date',
      value: data.date,
    });
  }

  // Validate coordinates
  if (data.latitude === undefined || data.latitude === null) {
    errors.push({
      field: 'latitude',
      message: 'Latitude is required',
      value: data.latitude,
    });
  }

  if (data.longitude === undefined || data.longitude === null) {
    errors.push({
      field: 'longitude',
      message: 'Longitude is required',
      value: data.longitude,
    });
  }

  if (
    data.latitude !== undefined &&
    data.latitude !== null &&
    data.longitude !== undefined &&
    data.longitude !== null
  ) {
    if (!isValidIsraelCoordinates(data.latitude, data.longitude)) {
      errors.push({
        field: 'coordinates',
        message: `Coordinates are outside Israel's boundaries (lat: ${ISRAEL_BOUNDS.latitude.min}-${ISRAEL_BOUNDS.latitude.max}, lng: ${ISRAEL_BOUNDS.longitude.min}-${ISRAEL_BOUNDS.longitude.max})`,
        value: { latitude: data.latitude, longitude: data.longitude },
      });
    }
  }

  // Validate gender
  if (!data.gender) {
    errors.push({
      field: 'gender',
      message: 'Gender is required',
      value: data.gender,
    });
  } else if (!isValidGender(data.gender)) {
    errors.push({
      field: 'gender',
      message: `Gender must be one of: ${VALID_GENDERS.join(', ')}`,
      value: data.gender,
    });
  }

  // Validate rank (required but can be "-")
  if (!data.rank && data.rank !== '-') {
    errors.push({
      field: 'rank',
      message: 'Military rank is required (use "-" for civilians)',
      value: data.rank,
    });
  }

  // Validate source (required)
  if (!data.source) {
    errors.push({
      field: 'source',
      message: 'Source is required',
      value: data.source,
    });
  } else if (!isValidHebrewText(data.source)) {
    errors.push({
      field: 'source',
      message: 'Source contains invalid characters or encoding',
      value: data.source,
    });
  }

  // Validate type (required)
  if (!data.type) {
    errors.push({
      field: 'type',
      message: 'Incident type is required',
      value: data.type,
    });
  } else if (!isValidHebrewText(data.type)) {
    errors.push({
      field: 'type',
      message: 'Incident type contains invalid characters or encoding',
      value: data.type,
    });
  }

  // Validate URL (required but can be "-")
  if (!data.url) {
    errors.push({
      field: 'url',
      message: 'URL is required (use "-" if not available)',
      value: data.url,
    });
  } else if (data.url !== '-') {
    try {
      const url = new URL(data.url);
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.push({
          field: 'url',
          message: 'URL must use http or https protocol',
          value: data.url,
        });
      }
    } catch {
      errors.push({
        field: 'url',
        message: 'URL is not a valid URL (use "-" if not available)',
        value: data.url,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates an array of victim data records
 */
export function validateVictimDataArray(
  dataArray: Array<Partial<VictimData>>
): BulkValidationResult {
  const errors: BulkValidationResult['errors'] = [];
  let validRecords = 0;

  dataArray.forEach((data, index) => {
    const result = validateVictimData(data);

    if (result.valid) {
      validRecords++;
    } else {
      errors.push({
        recordIndex: index,
        recordIdentifier: data.firstName && data.lastName
          ? `${data.firstName} ${data.lastName}`
          : undefined,
        errors: result.errors,
      });
    }
  });

  const invalidRecords = dataArray.length - validRecords;

  return {
    valid: invalidRecords === 0,
    totalRecords: dataArray.length,
    validRecords,
    invalidRecords,
    errors,
  };
}

/**
 * Type guard to check if data is a complete VictimData object
 */
export function isCompleteVictimData(data: Partial<VictimData>): data is VictimData {
  const result = validateVictimData(data);
  return result.valid;
}

/**
 * Formats validation errors into a human-readable string
 */
export function formatValidationErrors(result: ValidationResult | BulkValidationResult): string {
  if ('totalRecords' in result) {
    // Bulk validation result
    if (result.valid) {
      return `All ${result.totalRecords} records are valid`;
    }

    const lines = [
      `Validation failed: ${result.invalidRecords} of ${result.totalRecords} records have errors\n`,
    ];

    result.errors.forEach(({ recordIndex, recordIdentifier, errors }) => {
      const identifier = recordIdentifier ? ` (${recordIdentifier})` : '';
      lines.push(`Record ${recordIndex}${identifier}:`);
      errors.forEach((error) => {
        lines.push(`  - ${error.field}: ${error.message}`);
      });
      lines.push('');
    });

    return lines.join('\n');
  } else {
    // Single validation result
    if (result.valid) {
      return 'Record is valid';
    }

    const lines = ['Validation errors:'];
    result.errors.forEach((error) => {
      lines.push(`  - ${error.field}: ${error.message}`);
    });

    return lines.join('\n');
  }
}
