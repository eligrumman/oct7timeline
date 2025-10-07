/**
 * Test suite for validation utilities
 */

import {
  validateVictim,
  validateVictimArray,
  validateRequiredFields,
  validateDateFormat,
  validateCoordinates,
  ValidationResult,
} from '@/lib/utils/validation';
import { Victim } from '@/lib/types/victim';

describe('validateRequiredFields', () => {
  const completeVictim: Victim = {
    lastName: 'כהן',
    firstName: 'דוד',
    rank: 'סמל',
    age: 25,
    location: 'ירושלים',
    date: '2023-10-07',
    source: 'עזה',
    type: 'לחימה',
    gender: 'זכר',
    url: 'https://example.com',
    latitude: 31.7683,
    longitude: 35.2137,
  };

  it('should return true for complete victim with all required fields', () => {
    expect(validateRequiredFields(completeVictim)).toBe(true);
  });

  it('should return false when firstName is missing', () => {
    const { firstName, ...partial } = completeVictim;
    expect(validateRequiredFields(partial)).toBe(false);
  });

  it('should return false when lastName is missing', () => {
    const { lastName, ...partial } = completeVictim;
    expect(validateRequiredFields(partial)).toBe(false);
  });

  it('should return false when age is missing', () => {
    const { age, ...partial } = completeVictim;
    expect(validateRequiredFields(partial)).toBe(false);
  });

  it('should return false when location is missing', () => {
    const { location, ...partial } = completeVictim;
    expect(validateRequiredFields(partial)).toBe(false);
  });

  it('should return false when date is missing', () => {
    const { date, ...partial } = completeVictim;
    expect(validateRequiredFields(partial)).toBe(false);
  });

  it('should return false when latitude is missing', () => {
    const { latitude, ...partial } = completeVictim;
    expect(validateRequiredFields(partial)).toBe(false);
  });

  it('should return false when longitude is missing', () => {
    const { longitude, ...partial } = completeVictim;
    expect(validateRequiredFields(partial)).toBe(false);
  });

  it('should return false when firstName is empty string', () => {
    const invalid = { ...completeVictim, firstName: '' };
    expect(validateRequiredFields(invalid)).toBe(false);
  });

  it('should return false when firstName is whitespace only', () => {
    const invalid = { ...completeVictim, firstName: '   ' };
    expect(validateRequiredFields(invalid)).toBe(false);
  });

  it('should return false when location is empty string', () => {
    const invalid = { ...completeVictim, location: '' };
    expect(validateRequiredFields(invalid)).toBe(false);
  });

  it('should return false when field is null', () => {
    const invalid = { ...completeVictim, firstName: null as any };
    expect(validateRequiredFields(invalid)).toBe(false);
  });

  it('should return false when field is undefined', () => {
    const invalid = { ...completeVictim, lastName: undefined as any };
    expect(validateRequiredFields(invalid)).toBe(false);
  });

  it('should return true even if optional fields are missing', () => {
    const minimal = {
      firstName: 'דוד',
      lastName: 'כהן',
      age: 25,
      location: 'ירושלים',
      date: '2023-10-07',
      latitude: 31.7683,
      longitude: 35.2137,
    };
    expect(validateRequiredFields(minimal)).toBe(true);
  });
});

describe('validateDateFormat', () => {
  describe('valid dates', () => {
    it('should return true for valid ISO 8601 date', () => {
      expect(validateDateFormat('2023-10-07')).toBe(true);
    });

    it('should return true for various valid dates', () => {
      expect(validateDateFormat('2024-01-01')).toBe(true);
      expect(validateDateFormat('2024-12-31')).toBe(true);
      expect(validateDateFormat('2000-06-15')).toBe(true);
    });

    it('should return true for leap year date', () => {
      expect(validateDateFormat('2024-02-29')).toBe(true);
    });
  });

  describe('invalid dates', () => {
    it('should return false for invalid date format', () => {
      expect(validateDateFormat('07-10-2023')).toBe(false);
      expect(validateDateFormat('2023/10/07')).toBe(false);
      expect(validateDateFormat('10-07-2023')).toBe(false);
    });

    it('should return false for date without leading zeros', () => {
      expect(validateDateFormat('2023-1-7')).toBe(false);
      expect(validateDateFormat('2023-10-7')).toBe(false);
    });

    it('should return false for invalid month', () => {
      expect(validateDateFormat('2023-13-01')).toBe(false);
      expect(validateDateFormat('2023-00-01')).toBe(false);
    });

    it('should return false for invalid day', () => {
      expect(validateDateFormat('2023-10-32')).toBe(false);
      expect(validateDateFormat('2023-02-30')).toBe(false);
      expect(validateDateFormat('2023-04-31')).toBe(false);
    });

    it('should return false for invalid leap year date', () => {
      expect(validateDateFormat('2023-02-29')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(validateDateFormat('')).toBe(false);
    });

    it('should return false for non-date strings', () => {
      expect(validateDateFormat('not a date')).toBe(false);
      expect(validateDateFormat('2023-10')).toBe(false);
      expect(validateDateFormat('2023')).toBe(false);
    });

    it('should return false for date with time', () => {
      expect(validateDateFormat('2023-10-07T12:00:00')).toBe(false);
    });
  });
});

describe('validateCoordinates', () => {
  describe('valid coordinates within Israel bounds', () => {
    it('should return true for valid Israel coordinates', () => {
      expect(validateCoordinates(31.7683, 35.2137)).toBe(true); // Jerusalem
      expect(validateCoordinates(32.0853, 34.7818)).toBe(true); // Tel Aviv
      expect(validateCoordinates(33.2667, 35.7672)).toBe(true); // Majdal Shams
    });

    it('should return true for coordinates at the boundary limits', () => {
      expect(validateCoordinates(29.5, 34.3)).toBe(true); // Min values
      expect(validateCoordinates(33.3, 35.9)).toBe(true); // Max values
    });

    it('should return true for coordinates just inside boundaries', () => {
      expect(validateCoordinates(29.6, 34.4)).toBe(true);
      expect(validateCoordinates(33.2, 35.8)).toBe(true);
    });
  });

  describe('invalid coordinates outside Israel bounds', () => {
    it('should return false for latitude below minimum', () => {
      expect(validateCoordinates(29.4, 35.0)).toBe(false);
    });

    it('should return false for latitude above maximum', () => {
      expect(validateCoordinates(33.4, 35.0)).toBe(false);
    });

    it('should return false for longitude below minimum', () => {
      expect(validateCoordinates(31.0, 34.2)).toBe(false);
    });

    it('should return false for longitude above maximum', () => {
      expect(validateCoordinates(31.0, 36.0)).toBe(false);
    });

    it('should return false for coordinates outside Israel entirely', () => {
      expect(validateCoordinates(0, 0)).toBe(false); // Origin
      expect(validateCoordinates(40.7128, -74.006)).toBe(false); // New York
      expect(validateCoordinates(51.5074, -0.1278)).toBe(false); // London
    });
  });

  describe('invalid coordinate values', () => {
    it('should return false for NaN values', () => {
      expect(validateCoordinates(NaN, 35.0)).toBe(false);
      expect(validateCoordinates(31.0, NaN)).toBe(false);
      expect(validateCoordinates(NaN, NaN)).toBe(false);
    });

    it('should return false for Infinity values', () => {
      expect(validateCoordinates(Infinity, 35.0)).toBe(false);
      expect(validateCoordinates(31.0, Infinity)).toBe(false);
      expect(validateCoordinates(-Infinity, 35.0)).toBe(false);
      expect(validateCoordinates(31.0, -Infinity)).toBe(false);
    });

    it('should return false for invalid number types', () => {
      expect(validateCoordinates(null as any, 35.0)).toBe(false);
      expect(validateCoordinates(31.0, undefined as any)).toBe(false);
    });
  });
});

describe('validateVictim', () => {
  const validVictim: Victim = {
    lastName: 'כהן',
    firstName: 'דוד',
    rank: 'סמל',
    age: 25,
    location: 'ירושלים',
    date: '2023-10-07',
    source: 'עזה',
    type: 'לחימה',
    gender: 'זכר',
    url: 'https://example.com',
    latitude: 31.7683,
    longitude: 35.2137,
  };

  describe('valid victims', () => {
    it('should return valid for a complete valid victim', () => {
      const result = validateVictim(validVictim);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return valid for victim with URL placeholder', () => {
      const victim = { ...validVictim, url: '-' };
      const result = validateVictim(victim);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return valid for victim with Hebrew text', () => {
      const victim: Victim = {
        lastName: 'אבו סאלח',
        firstName: 'חאזם אכרם',
        rank: '-',
        age: 15,
        location: "מג'דל שמס",
        date: '2024-07-28',
        source: 'לבנון',
        type: 'רקטות וטילים',
        gender: 'זכר',
        url: '-',
        latitude: 33.2667,
        longitude: 35.7672,
      };
      const result = validateVictim(victim);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('type guard failures', () => {
    it('should fail type guard for non-object', () => {
      const result = validateVictim('not an object');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Data does not match Victim type structure');
    });

    it('should fail type guard for null', () => {
      const result = validateVictim(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Data does not match Victim type structure');
    });

    it('should fail type guard for missing fields', () => {
      const { firstName, ...invalid } = validVictim;
      const result = validateVictim(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Data does not match Victim type structure');
    });
  });

  describe('validation errors - empty strings', () => {
    it('should fail for empty firstName', () => {
      const invalid = { ...validVictim, firstName: '' };
      const result = validateVictim(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('firstName cannot be empty');
    });

    it('should fail for whitespace-only firstName', () => {
      const invalid = { ...validVictim, firstName: '   ' };
      const result = validateVictim(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('firstName cannot be empty');
    });

    it('should fail for empty lastName', () => {
      const invalid = { ...validVictim, lastName: '' };
      const result = validateVictim(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('lastName cannot be empty');
    });

    it('should fail for empty location', () => {
      const invalid = { ...validVictim, location: '' };
      const result = validateVictim(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('location cannot be empty');
    });
  });

  describe('validation errors - age', () => {
    it('should fail for non-finite age', () => {
      const invalid = { ...validVictim, age: Infinity };
      const result = validateVictim(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('finite'))).toBe(true);
    });

    it('should fail for negative age', () => {
      const invalid = { ...validVictim, age: -5 };
      const result = validateVictim(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('positive'))).toBe(true);
    });

    it('should fail for zero age', () => {
      const invalid = { ...validVictim, age: 0 };
      const result = validateVictim(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('positive'))).toBe(true);
    });

    it('should fail for non-integer age', () => {
      const invalid = { ...validVictim, age: 25.5 };
      const result = validateVictim(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('integer'))).toBe(true);
    });
  });

  describe('validation errors - date format', () => {
    it('should fail for invalid date format', () => {
      const invalid = { ...validVictim, date: '07-10-2023' };
      const result = validateVictim(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid date format'))).toBe(true);
    });

    it('should fail for invalid date', () => {
      const invalid = { ...validVictim, date: '2023-13-45' };
      const result = validateVictim(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid date format'))).toBe(true);
    });
  });

  describe('validation errors - coordinates', () => {
    it('should fail for coordinates outside Israel bounds', () => {
      const invalid = { ...validVictim, latitude: 40.0, longitude: -74.0 };
      const result = validateVictim(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid coordinates'))).toBe(true);
    });

    it('should fail for NaN coordinates', () => {
      const invalid = { ...validVictim, latitude: NaN };
      const result = validateVictim(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid coordinates'))).toBe(true);
    });
  });

  describe('validation errors - URL format', () => {
    it('should fail for invalid URL', () => {
      const invalid = { ...validVictim, url: 'not a url' };
      const result = validateVictim(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid URL format'))).toBe(true);
    });

    it('should pass for http URL', () => {
      const valid = { ...validVictim, url: 'http://example.com' };
      const result = validateVictim(valid);
      expect(result.valid).toBe(true);
    });

    it('should pass for https URL', () => {
      const valid = { ...validVictim, url: 'https://example.com' };
      const result = validateVictim(valid);
      expect(result.valid).toBe(true);
    });
  });

  describe('multiple validation errors', () => {
    it('should accumulate multiple errors', () => {
      const invalid = {
        ...validVictim,
        firstName: '',
        age: -1,
        date: 'invalid',
        latitude: 100,
      };
      const result = validateVictim(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});

describe('validateVictimArray', () => {
  const validVictim1: Victim = {
    lastName: 'כהן',
    firstName: 'דוד',
    rank: 'סמל',
    age: 25,
    location: 'ירושלים',
    date: '2023-10-07',
    source: 'עזה',
    type: 'לחימה',
    gender: 'זכר',
    url: 'https://example.com',
    latitude: 31.7683,
    longitude: 35.2137,
  };

  const validVictim2: Victim = {
    lastName: 'לוי',
    firstName: 'שרה',
    rank: '-',
    age: 30,
    location: 'תל אביב',
    date: '2023-10-08',
    source: 'עזה',
    type: 'רקטות וטילים',
    gender: 'נקבה',
    url: '-',
    latitude: 32.0853,
    longitude: 34.7818,
  };

  describe('valid arrays', () => {
    it('should return valid for array of valid victims', () => {
      const result = validateVictimArray([validVictim1, validVictim2]);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return valid for single-element array', () => {
      const result = validateVictimArray([validVictim1]);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('invalid arrays', () => {
    it('should fail for non-array', () => {
      const result = validateVictimArray('not an array');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Data is not an array');
    });

    it('should fail for null', () => {
      const result = validateVictimArray(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Data is not an array');
    });

    it('should fail for empty array', () => {
      const result = validateVictimArray([]);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Array is empty');
    });

    it('should fail for array with invalid victim', () => {
      const invalid = { ...validVictim1, age: -1 };
      const result = validateVictimArray([validVictim1, invalid]);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('[Index 1]');
    });

    it('should prefix errors with array index', () => {
      const invalid1 = { ...validVictim1, firstName: '' };
      const invalid2 = { ...validVictim2, age: 0 };
      const result = validateVictimArray([invalid1, invalid2]);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.startsWith('[Index 0]'))).toBe(true);
      expect(result.errors.some((e) => e.startsWith('[Index 1]'))).toBe(true);
    });
  });

  describe('mixed valid and invalid entries', () => {
    it('should collect all errors from multiple invalid entries', () => {
      const invalid1 = { ...validVictim1, age: -1 };
      const invalid2 = { ...validVictim2, firstName: '' };
      const result = validateVictimArray([invalid1, validVictim1, invalid2]);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      // Should have errors from index 0 and index 2, but not index 1
      expect(result.errors.some((e) => e.includes('[Index 0]'))).toBe(true);
      expect(result.errors.some((e) => e.includes('[Index 2]'))).toBe(true);
    });
  });
});
