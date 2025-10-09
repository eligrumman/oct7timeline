/**
 * Tests for data validation utilities
 */

import {
  validateVictimData,
  validateVictimDataArray,
  isValidHebrewText,
  isValidISODate,
  isValidIsraelCoordinates,
  isValidAge,
  isValidGender,
  isCompleteVictimData,
  formatValidationErrors,
  type ValidationResult,
  type BulkValidationResult,
} from '../validation';
import type { VictimData } from '@/types/victim';

describe('Validation Utilities', () => {
  const validVictimData: VictimData = {
    firstName: 'יוסי',
    lastName: 'כהן',
    rank: '-',
    age: 35,
    location: 'תל אביב',
    date: '2023-10-07',
    source: 'עזה',
    type: 'רקטות וטילים',
    gender: 'זכר',
    url: 'https://example.com/article',
    latitude: 32.0853,
    longitude: 34.7818,
  };

  describe('isValidHebrewText', () => {
    it('should accept valid Hebrew text', () => {
      expect(isValidHebrewText('שלום עולם')).toBe(true);
      expect(isValidHebrewText('תל אביב-יפו')).toBe(true);
      expect(isValidHebrewText('יוסי כהן')).toBe(true);
    });

    it('should accept Hebrew text with numbers and punctuation', () => {
      expect(isValidHebrewText('כביש 1')).toBe(true);
      expect(isValidHebrewText('יוסי (בן 35)')).toBe(true);
      expect(isValidHebrewText('תל אביב, ישראל')).toBe(true);
    });

    it('should reject empty or invalid text', () => {
      expect(isValidHebrewText('')).toBe(false);
      expect(isValidHebrewText(null as any)).toBe(false);
      expect(isValidHebrewText(undefined as any)).toBe(false);
    });

    it('should accept mixed Hebrew and English', () => {
      expect(isValidHebrewText('תל אביב Tel Aviv')).toBe(true);
      expect(isValidHebrewText("סמ'ר")).toBe(true);
    });
  });

  describe('isValidISODate', () => {
    it('should accept valid ISO dates', () => {
      expect(isValidISODate('2023-10-07')).toBe(true);
      expect(isValidISODate('2023-01-01')).toBe(true);
      expect(isValidISODate('2023-12-31')).toBe(true);
    });

    it('should reject invalid date formats', () => {
      expect(isValidISODate('07-10-2023')).toBe(false);
      expect(isValidISODate('2023/10/07')).toBe(false);
      expect(isValidISODate('2023-10-7')).toBe(false);
      expect(isValidISODate('2023-1-07')).toBe(false);
    });

    it('should reject invalid dates', () => {
      expect(isValidISODate('2023-02-30')).toBe(false);
      expect(isValidISODate('2023-13-01')).toBe(false);
      expect(isValidISODate('2023-00-01')).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(isValidISODate(null as any)).toBe(false);
      expect(isValidISODate(undefined as any)).toBe(false);
      expect(isValidISODate(20231007 as any)).toBe(false);
    });
  });

  describe('isValidIsraelCoordinates', () => {
    it('should accept coordinates within Israel', () => {
      expect(isValidIsraelCoordinates(32.0853, 34.7818)).toBe(true); // Tel Aviv
      expect(isValidIsraelCoordinates(31.7683, 35.2137)).toBe(true); // Jerusalem
      expect(isValidIsraelCoordinates(29.5, 34.3)).toBe(true); // Southern boundary
      expect(isValidIsraelCoordinates(33.3, 35.9)).toBe(true); // Northern boundary
    });

    it('should reject coordinates outside Israel', () => {
      expect(isValidIsraelCoordinates(29.4, 34.5)).toBe(false); // Too far south
      expect(isValidIsraelCoordinates(33.4, 35.5)).toBe(false); // Too far north
      expect(isValidIsraelCoordinates(32.0, 34.2)).toBe(false); // Too far west
      expect(isValidIsraelCoordinates(32.0, 36.0)).toBe(false); // Too far east
    });

    it('should reject invalid coordinate types', () => {
      expect(isValidIsraelCoordinates(NaN, 34.5)).toBe(false);
      expect(isValidIsraelCoordinates(32.0, NaN)).toBe(false);
      expect(isValidIsraelCoordinates(null as any, 34.5)).toBe(false);
      expect(isValidIsraelCoordinates(32.0, undefined as any)).toBe(false);
    });
  });

  describe('isValidAge', () => {
    it('should accept valid ages', () => {
      expect(isValidAge(1)).toBe(true);
      expect(isValidAge(35)).toBe(true);
      expect(isValidAge(120)).toBe(true);
    });

    it('should reject invalid ages', () => {
      expect(isValidAge(0)).toBe(false);
      expect(isValidAge(-5)).toBe(false);
      expect(isValidAge(121)).toBe(false);
      expect(isValidAge(35.5)).toBe(false); // Decimal
    });

    it('should reject invalid age types', () => {
      expect(isValidAge(NaN)).toBe(false);
      expect(isValidAge(null as any)).toBe(false);
      expect(isValidAge(undefined as any)).toBe(false);
      expect(isValidAge('35' as any)).toBe(false);
    });
  });

  describe('isValidGender', () => {
    it('should accept valid genders', () => {
      expect(isValidGender('זכר')).toBe(true);
      expect(isValidGender('נקבה')).toBe(true);
    });

    it('should reject invalid genders', () => {
      expect(isValidGender('male')).toBe(false);
      expect(isValidGender('female')).toBe(false);
      expect(isValidGender('')).toBe(false);
      expect(isValidGender(null as any)).toBe(false);
    });
  });

  describe('validateVictimData', () => {
    it('should validate complete valid data', () => {
      const result = validateVictimData(validVictimData);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidData: Partial<VictimData> = {
        firstName: 'יוסי',
        // Missing lastName
        age: 35,
        location: 'תל אביב',
        date: '2023-10-07',
        latitude: 32.0853,
        longitude: 34.7818,
      };

      const result = validateVictimData(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'lastName')).toBe(true);
    });

    it('should detect invalid date format', () => {
      const invalidData: Partial<VictimData> = {
        ...validVictimData,
        date: '07-10-2023',
      };

      const result = validateVictimData(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'date')).toBe(true);
    });

    it('should detect invalid coordinates', () => {
      const invalidData: Partial<VictimData> = {
        ...validVictimData,
        latitude: 40.0, // Outside Israel
        longitude: 34.5,
      };

      const result = validateVictimData(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'coordinates')).toBe(true);
    });

    it('should detect invalid age', () => {
      const invalidData: Partial<VictimData> = {
        ...validVictimData,
        age: -5,
      };

      const result = validateVictimData(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'age')).toBe(true);
    });

    it('should detect invalid gender', () => {
      const invalidData: Partial<VictimData> = {
        ...validVictimData,
        gender: 'male' as any,
      };

      const result = validateVictimData(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'gender')).toBe(true);
    });

    it('should allow "-" for url', () => {
      const data: Partial<VictimData> = {
        ...validVictimData,
        url: '-',
      };

      const result = validateVictimData(data);
      expect(result.valid).toBe(true);
    });

    it('should detect invalid url', () => {
      const invalidData: Partial<VictimData> = {
        ...validVictimData,
        url: 'not-a-url',
      };

      const result = validateVictimData(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'url')).toBe(true);
    });

    it('should collect multiple errors', () => {
      const invalidData: Partial<VictimData> = {
        firstName: '',
        lastName: '',
        age: -1,
        location: '',
        date: 'invalid',
        latitude: 100,
        longitude: 100,
      };

      const result = validateVictimData(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('validateVictimDataArray', () => {
    it('should validate array of valid records', () => {
      const data = [validVictimData, validVictimData];
      const result = validateVictimDataArray(data);

      expect(result.valid).toBe(true);
      expect(result.totalRecords).toBe(2);
      expect(result.validRecords).toBe(2);
      expect(result.invalidRecords).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid records in array', () => {
      const data = [
        validVictimData,
        { ...validVictimData, age: -1 },
        { ...validVictimData, date: 'invalid' },
      ];

      const result = validateVictimDataArray(data);

      expect(result.valid).toBe(false);
      expect(result.totalRecords).toBe(3);
      expect(result.validRecords).toBe(1);
      expect(result.invalidRecords).toBe(2);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].recordIndex).toBe(1);
      expect(result.errors[1].recordIndex).toBe(2);
    });

    it('should include record identifiers when available', () => {
      const data = [
        { ...validVictimData, age: -1 },
      ];

      const result = validateVictimDataArray(data);

      expect(result.errors[0].recordIdentifier).toBe('יוסי כהן');
    });
  });

  describe('isCompleteVictimData', () => {
    it('should return true for complete valid data', () => {
      expect(isCompleteVictimData(validVictimData)).toBe(true);
    });

    it('should return false for incomplete data', () => {
      const incompleteData: Partial<VictimData> = {
        firstName: 'יוסי',
        lastName: 'כהן',
      };

      expect(isCompleteVictimData(incompleteData)).toBe(false);
    });
  });

  describe('formatValidationErrors', () => {
    it('should format single validation result', () => {
      const result: ValidationResult = {
        valid: false,
        errors: [
          { field: 'age', message: 'Age must be positive' },
          { field: 'date', message: 'Invalid date format' },
        ],
      };

      const formatted = formatValidationErrors(result);
      expect(formatted).toContain('Validation errors:');
      expect(formatted).toContain('age: Age must be positive');
      expect(formatted).toContain('date: Invalid date format');
    });

    it('should format bulk validation result', () => {
      const result: BulkValidationResult = {
        valid: false,
        totalRecords: 3,
        validRecords: 1,
        invalidRecords: 2,
        errors: [
          {
            recordIndex: 1,
            recordIdentifier: 'יוסי כהן',
            errors: [{ field: 'age', message: 'Invalid age' }],
          },
        ],
      };

      const formatted = formatValidationErrors(result);
      expect(formatted).toContain('2 of 3 records have errors');
      expect(formatted).toContain('Record 1 (יוסי כהן)');
      expect(formatted).toContain('age: Invalid age');
    });

    it('should handle valid results', () => {
      const result: ValidationResult = {
        valid: true,
        errors: [],
      };

      const formatted = formatValidationErrors(result);
      expect(formatted).toBe('Record is valid');
    });
  });
});
