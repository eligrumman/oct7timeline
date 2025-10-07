/**
 * Test suite for victim type guards and type utilities
 */

import { isVictim, isVictimArray, Victim } from '@/lib/types/victim';

describe('isVictim', () => {
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

  describe('valid victim objects', () => {
    it('should return true for a valid victim object', () => {
      expect(isVictim(validVictim)).toBe(true);
    });

    it('should return true for victim with URL placeholder', () => {
      const victim = { ...validVictim, url: '-' };
      expect(isVictim(victim)).toBe(true);
    });

    it('should return true for victim with Hebrew text in all string fields', () => {
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
      expect(isVictim(victim)).toBe(true);
    });
  });

  describe('invalid victim objects - null and undefined', () => {
    it('should return false for null', () => {
      expect(isVictim(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isVictim(undefined)).toBe(false);
    });
  });

  describe('invalid victim objects - wrong types', () => {
    it('should return false for non-object values', () => {
      expect(isVictim('string')).toBe(false);
      expect(isVictim(123)).toBe(false);
      expect(isVictim(true)).toBe(false);
      expect(isVictim([])).toBe(false);
    });

    it('should return false when lastName is not a string', () => {
      const invalid = { ...validVictim, lastName: 123 };
      expect(isVictim(invalid)).toBe(false);
    });

    it('should return false when firstName is not a string', () => {
      const invalid = { ...validVictim, firstName: null };
      expect(isVictim(invalid)).toBe(false);
    });

    it('should return false when rank is not a string', () => {
      const invalid = { ...validVictim, rank: {} };
      expect(isVictim(invalid)).toBe(false);
    });

    it('should return false when age is not a number', () => {
      const invalid = { ...validVictim, age: '25' };
      expect(isVictim(invalid)).toBe(false);
    });

    it('should return false when location is not a string', () => {
      const invalid = { ...validVictim, location: [] };
      expect(isVictim(invalid)).toBe(false);
    });

    it('should return false when date is not a string', () => {
      const invalid = { ...validVictim, date: new Date() };
      expect(isVictim(invalid)).toBe(false);
    });

    it('should return false when source is not a string', () => {
      const invalid = { ...validVictim, source: undefined };
      expect(isVictim(invalid)).toBe(false);
    });

    it('should return false when type is not a string', () => {
      const invalid = { ...validVictim, type: 123 };
      expect(isVictim(invalid)).toBe(false);
    });

    it('should return false when gender is not a string', () => {
      const invalid = { ...validVictim, gender: true };
      expect(isVictim(invalid)).toBe(false);
    });

    it('should return false when url is not a string', () => {
      const invalid = { ...validVictim, url: null };
      expect(isVictim(invalid)).toBe(false);
    });

    it('should return false when latitude is not a number', () => {
      const invalid = { ...validVictim, latitude: '31.7683' };
      expect(isVictim(invalid)).toBe(false);
    });

    it('should return false when longitude is not a number', () => {
      const invalid = { ...validVictim, longitude: '35.2137' };
      expect(isVictim(invalid)).toBe(false);
    });
  });

  describe('invalid victim objects - missing fields', () => {
    it('should return false when lastName is missing', () => {
      const { lastName, ...invalid } = validVictim;
      expect(isVictim(invalid)).toBe(false);
    });

    it('should return false when firstName is missing', () => {
      const { firstName, ...invalid } = validVictim;
      expect(isVictim(invalid)).toBe(false);
    });

    it('should return false when age is missing', () => {
      const { age, ...invalid } = validVictim;
      expect(isVictim(invalid)).toBe(false);
    });

    it('should return false when latitude is missing', () => {
      const { latitude, ...invalid } = validVictim;
      expect(isVictim(invalid)).toBe(false);
    });

    it('should return false when longitude is missing', () => {
      const { longitude, ...invalid } = validVictim;
      expect(isVictim(invalid)).toBe(false);
    });

    it('should return false for empty object', () => {
      expect(isVictim({})).toBe(false);
    });
  });
});

describe('isVictimArray', () => {
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

  describe('valid victim arrays', () => {
    it('should return true for an array of valid victims', () => {
      expect(isVictimArray([validVictim1, validVictim2])).toBe(true);
    });

    it('should return true for a single-element array', () => {
      expect(isVictimArray([validVictim1])).toBe(true);
    });

    it('should return true for an empty array', () => {
      expect(isVictimArray([])).toBe(true);
    });
  });

  describe('invalid victim arrays', () => {
    it('should return false for non-array values', () => {
      expect(isVictimArray(null)).toBe(false);
      expect(isVictimArray(undefined)).toBe(false);
      expect(isVictimArray('string')).toBe(false);
      expect(isVictimArray(123)).toBe(false);
      expect(isVictimArray({})).toBe(false);
      expect(isVictimArray(validVictim1)).toBe(false);
    });

    it('should return false when array contains invalid victim', () => {
      const invalidVictim = { ...validVictim1, age: '25' };
      expect(isVictimArray([validVictim1, invalidVictim])).toBe(false);
    });

    it('should return false when array contains non-victim object', () => {
      expect(isVictimArray([validVictim1, { invalid: 'object' }])).toBe(false);
    });

    it('should return false when array contains null', () => {
      expect(isVictimArray([validVictim1, null])).toBe(false);
    });

    it('should return false when array contains undefined', () => {
      expect(isVictimArray([validVictim1, undefined])).toBe(false);
    });

    it('should return false when array contains primitive values', () => {
      expect(isVictimArray([validVictim1, 'string'])).toBe(false);
      expect(isVictimArray([validVictim1, 123])).toBe(false);
    });

    it('should return false for array with mixed valid and invalid entries', () => {
      const partialVictim = {
        lastName: 'כהן',
        firstName: 'דוד',
        // Missing required fields
      };
      expect(isVictimArray([validVictim1, partialVictim])).toBe(false);
    });
  });
});
