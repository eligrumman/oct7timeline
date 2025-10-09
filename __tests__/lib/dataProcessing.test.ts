/**
 * Tests for data processing utilities
 */

import {
  convertISODateToDate,
  convertDateToTimestamp,
  ensureHebrewUTF8,
  generateVictimId,
  processVictimData,
  processVictimDataArray,
  processVictimDataArrayStrict,
  sortVictimsByDate,
  sortVictimsByDateDesc,
  DataProcessingError,
} from '@/lib/dataProcessing';
import type { VictimData, ProcessedVictimData } from '@/types/victim';

describe('dataProcessing', () => {
  describe('convertISODateToDate', () => {
    it('should convert valid ISO date string to Date object', () => {
      const dateString = '2023-10-07';
      const date = convertISODateToDate(dateString);

      expect(date).toBeInstanceOf(Date);
      expect(date.getUTCFullYear()).toBe(2023);
      expect(date.getUTCMonth()).toBe(9); // October is month 9 (0-indexed)
      expect(date.getUTCDate()).toBe(7);
    });

    it('should handle different valid dates', () => {
      const dates = ['2023-01-01', '2023-12-31', '2024-02-29']; // 2024 is a leap year

      dates.forEach((dateString) => {
        const date = convertISODateToDate(dateString);
        expect(date).toBeInstanceOf(Date);
        expect(isNaN(date.getTime())).toBe(false);
      });
    });

    it('should throw DataProcessingError for invalid date string', () => {
      const invalidDates = ['invalid', '2023-13-01', '2023-02-30', ''];

      invalidDates.forEach((dateString) => {
        expect(() => convertISODateToDate(dateString)).toThrow(DataProcessingError);
      });
    });
  });

  describe('convertDateToTimestamp', () => {
    it('should convert Date object to Unix timestamp in milliseconds', () => {
      const date = new Date('2023-10-07T12:00:00Z');
      const timestamp = convertDateToTimestamp(date);

      expect(typeof timestamp).toBe('number');
      expect(timestamp).toBe(date.getTime());
      expect(timestamp).toBeGreaterThan(0);
    });

    it('should handle different dates', () => {
      const dates = [
        new Date('2023-01-01'),
        new Date('2023-12-31'),
        new Date('2024-02-29'),
      ];

      dates.forEach((date) => {
        const timestamp = convertDateToTimestamp(date);
        expect(typeof timestamp).toBe('number');
        expect(timestamp).toBe(date.getTime());
      });
    });

    it('should throw DataProcessingError for invalid Date object', () => {
      const invalidDate = new Date('invalid');

      expect(() => convertDateToTimestamp(invalidDate)).toThrow(DataProcessingError);
    });
  });

  describe('ensureHebrewUTF8', () => {
    it('should accept valid Hebrew text', () => {
      const hebrewText = 'ישראל';
      const result = ensureHebrewUTF8(hebrewText, 'testField');

      expect(result).toBe(hebrewText);
    });

    it('should accept mixed Hebrew and English text', () => {
      const mixedText = 'ישראל Israel';
      const result = ensureHebrewUTF8(mixedText, 'testField');

      expect(result).toBe(mixedText);
    });

    it('should accept Hebrew with numbers and punctuation', () => {
      const text = 'תל אביב-יפו 2023';
      const result = ensureHebrewUTF8(text, 'testField');

      expect(result).toBe(text);
    });

    it('should throw DataProcessingError for empty string', () => {
      expect(() => ensureHebrewUTF8('', 'testField')).toThrow(DataProcessingError);
    });

    it('should throw DataProcessingError for non-string input', () => {
      expect(() => ensureHebrewUTF8(null as any, 'testField')).toThrow(DataProcessingError);
      expect(() => ensureHebrewUTF8(undefined as any, 'testField')).toThrow(DataProcessingError);
    });
  });

  describe('generateVictimId', () => {
    it('should generate consistent ID for same input', () => {
      const id1 = generateVictimId('יוסף', 'כהן', '2023-10-07', 'תל אביב');
      const id2 = generateVictimId('יוסף', 'כהן', '2023-10-07', 'תל אביב');

      expect(id1).toBe(id2);
      expect(id1.length).toBe(16);
    });

    it('should generate different IDs for different inputs', () => {
      const id1 = generateVictimId('יוסף', 'כהן', '2023-10-07', 'תל אביב');
      const id2 = generateVictimId('דוד', 'לוי', '2023-10-07', 'תל אביב');
      const id3 = generateVictimId('יוסף', 'כהן', '2023-10-08', 'תל אביב');

      expect(id1).not.toBe(id2);
      expect(id1).not.toBe(id3);
      expect(id2).not.toBe(id3);
    });

    it('should generate valid hex string', () => {
      const id = generateVictimId('יוסף', 'כהן', '2023-10-07', 'תל אביב');

      expect(id).toMatch(/^[a-f0-9]{16}$/);
    });
  });

  describe('processVictimData', () => {
    const validVictim: VictimData = {
      firstName: 'יוסף',
      lastName: 'כהן',
      rank: 'סרן',
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

    it('should successfully process valid victim data', () => {
      const result = processVictimData(validVictim);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(result.validationResult?.valid).toBe(true);
    });

    it('should add all computed fields', () => {
      const result = processVictimData(validVictim);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        id: expect.any(String),
        dateObject: expect.any(Date),
        timestamp: expect.any(Number),
        fullName: 'יוסף כהן',
        isCivilian: false,
        hasUrl: true,
      });
    });

    it('should correctly identify civilian status', () => {
      const civilian = { ...validVictim, rank: '-' };
      const result = processVictimData(civilian);

      expect(result.success).toBe(true);
      expect(result.data?.isCivilian).toBe(true);
    });

    it('should correctly identify URL availability', () => {
      const noUrl = { ...validVictim, url: '-' };
      const result = processVictimData(noUrl);

      expect(result.success).toBe(true);
      expect(result.data?.hasUrl).toBe(false);
    });

    it('should generate consistent ID for same victim', () => {
      const result1 = processVictimData(validVictim);
      const result2 = processVictimData(validVictim);

      expect(result1.data?.id).toBe(result2.data?.id);
    });

    it('should fail for invalid victim data', () => {
      const invalidVictim = {
        ...validVictim,
        age: -5, // Invalid age
      };

      const result = processVictimData(invalidVictim);

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBeInstanceOf(DataProcessingError);
      expect(result.validationResult?.valid).toBe(false);
    });

    it('should fail for missing required fields', () => {
      const incompleteVictim = {
        firstName: 'יוסף',
        // Missing other required fields
      };

      const result = processVictimData(incompleteVictim);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(DataProcessingError);
    });

    it('should handle date conversion correctly', () => {
      const result = processVictimData(validVictim);

      expect(result.success).toBe(true);
      expect(result.data?.dateObject).toBeInstanceOf(Date);
      expect(result.data?.timestamp).toBe(result.data?.dateObject.getTime());
    });
  });

  describe('processVictimDataArray', () => {
    const validVictims: VictimData[] = [
      {
        firstName: 'יוסף',
        lastName: 'כהן',
        rank: 'סרן',
        age: 35,
        location: 'תל אביב',
        date: '2023-10-07',
        source: 'עזה',
        type: 'רקטות וטילים',
        gender: 'זכר',
        url: 'https://example.com/article1',
        latitude: 32.0853,
        longitude: 34.7818,
      },
      {
        firstName: 'שרה',
        lastName: 'לוי',
        rank: '-',
        age: 28,
        location: 'ירושלים',
        date: '2023-10-08',
        source: 'עזה',
        type: 'רקטות וטילים',
        gender: 'נקבה',
        url: '-',
        latitude: 31.7683,
        longitude: 35.2137,
      },
    ];

    it('should successfully process array of valid victims', () => {
      const result = processVictimDataArray(validVictims);

      expect(result.success).toBe(true);
      expect(result.processedData.length).toBe(2);
      expect(result.failedRecords.length).toBe(0);
      expect(result.validationResult.valid).toBe(true);
    });

    it('should process all records and add computed fields', () => {
      const result = processVictimDataArray(validVictims);

      result.processedData.forEach((victim) => {
        expect(victim).toHaveProperty('id');
        expect(victim).toHaveProperty('dateObject');
        expect(victim).toHaveProperty('timestamp');
        expect(victim).toHaveProperty('fullName');
        expect(victim).toHaveProperty('isCivilian');
        expect(victim).toHaveProperty('hasUrl');
      });
    });

    it('should handle mix of valid and invalid records', () => {
      const mixedVictims = [
        validVictims[0],
        { ...validVictims[1], age: -5 }, // Invalid age
        validVictims[1],
      ];

      const result = processVictimDataArray(mixedVictims);

      expect(result.success).toBe(false);
      expect(result.processedData.length).toBe(2); // 2 valid records
      expect(result.failedRecords.length).toBe(1); // 1 failed record
      expect(result.failedRecords[0].recordIndex).toBe(1);
    });

    it('should include record identifiers in failed records', () => {
      const invalidVictims = [
        { ...validVictims[0], age: -5 },
      ];

      const result = processVictimDataArray(invalidVictims);

      expect(result.failedRecords.length).toBe(1);
      expect(result.failedRecords[0].recordIdentifier).toBe('יוסף כהן');
    });

    it('should handle empty array', () => {
      const result = processVictimDataArray([]);

      expect(result.success).toBe(true);
      expect(result.processedData.length).toBe(0);
      expect(result.failedRecords.length).toBe(0);
    });

    it('should validate all records', () => {
      const result = processVictimDataArray(validVictims);

      expect(result.validationResult).toBeDefined();
      expect(result.validationResult.totalRecords).toBe(2);
      expect(result.validationResult.validRecords).toBe(2);
      expect(result.validationResult.invalidRecords).toBe(0);
    });
  });

  describe('processVictimDataArrayStrict', () => {
    const validVictims: VictimData[] = [
      {
        firstName: 'יוסף',
        lastName: 'כהן',
        rank: 'סרן',
        age: 35,
        location: 'תל אביב',
        date: '2023-10-07',
        source: 'עזה',
        type: 'רקטות וטילים',
        gender: 'זכר',
        url: 'https://example.com/article',
        latitude: 32.0853,
        longitude: 34.7818,
      },
    ];

    it('should return processed data for valid victims', () => {
      const result = processVictimDataArrayStrict(validVictims);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('fullName');
    });

    it('should throw DataProcessingError for any invalid record', () => {
      const invalidVictims = [
        validVictims[0],
        { ...validVictims[0], age: -5 },
      ];

      expect(() => processVictimDataArrayStrict(invalidVictims)).toThrow(DataProcessingError);
    });

    it('should include error details in exception message', () => {
      const invalidVictims = [
        { ...validVictims[0], age: -5 },
      ];

      expect(() => processVictimDataArrayStrict(invalidVictims)).toThrow(/Record 0.*יוסף כהן/);
    });
  });

  describe('sortVictimsByDate', () => {
    const victims: ProcessedVictimData[] = [
      {
        firstName: 'יוסף',
        lastName: 'כהן',
        rank: 'סרן',
        age: 35,
        location: 'תל אביב',
        date: '2023-10-08',
        source: 'עזה',
        type: 'רקטות וטילים',
        gender: 'זכר',
        url: 'https://example.com/article',
        latitude: 32.0853,
        longitude: 34.7818,
        id: '1234567890abcdef',
        dateObject: new Date('2023-10-08'),
        timestamp: new Date('2023-10-08').getTime(),
        fullName: 'יוסף כהן',
        isCivilian: false,
        hasUrl: true,
      },
      {
        firstName: 'שרה',
        lastName: 'לוי',
        rank: '-',
        age: 28,
        location: 'ירושלים',
        date: '2023-10-07',
        source: 'עזה',
        type: 'רקטות וטילים',
        gender: 'נקבה',
        url: '-',
        latitude: 31.7683,
        longitude: 35.2137,
        id: 'abcdef1234567890',
        dateObject: new Date('2023-10-07'),
        timestamp: new Date('2023-10-07').getTime(),
        fullName: 'שרה לוי',
        isCivilian: true,
        hasUrl: false,
      },
    ];

    it('should sort victims by date (oldest first)', () => {
      const sorted = sortVictimsByDate(victims);

      expect(sorted[0].date).toBe('2023-10-07');
      expect(sorted[1].date).toBe('2023-10-08');
    });

    it('should not mutate original array', () => {
      const original = [...victims];
      sortVictimsByDate(victims);

      expect(victims).toEqual(original);
    });
  });

  describe('sortVictimsByDateDesc', () => {
    const victims: ProcessedVictimData[] = [
      {
        firstName: 'יוסף',
        lastName: 'כהן',
        rank: 'סרן',
        age: 35,
        location: 'תל אביב',
        date: '2023-10-07',
        source: 'עזה',
        type: 'רקטות וטילים',
        gender: 'זכר',
        url: 'https://example.com/article',
        latitude: 32.0853,
        longitude: 34.7818,
        id: '1234567890abcdef',
        dateObject: new Date('2023-10-07'),
        timestamp: new Date('2023-10-07').getTime(),
        fullName: 'יוסף כהן',
        isCivilian: false,
        hasUrl: true,
      },
      {
        firstName: 'שרה',
        lastName: 'לוי',
        rank: '-',
        age: 28,
        location: 'ירושלים',
        date: '2023-10-08',
        source: 'עזה',
        type: 'רקטות וטילים',
        gender: 'נקבה',
        url: '-',
        latitude: 31.7683,
        longitude: 35.2137,
        id: 'abcdef1234567890',
        dateObject: new Date('2023-10-08'),
        timestamp: new Date('2023-10-08').getTime(),
        fullName: 'שרה לוי',
        isCivilian: true,
        hasUrl: false,
      },
    ];

    it('should sort victims by date (newest first)', () => {
      const sorted = sortVictimsByDateDesc(victims);

      expect(sorted[0].date).toBe('2023-10-08');
      expect(sorted[1].date).toBe('2023-10-07');
    });

    it('should not mutate original array', () => {
      const original = [...victims];
      sortVictimsByDateDesc(victims);

      expect(victims).toEqual(original);
    });
  });

  describe('DataProcessingError', () => {
    it('should create error with message', () => {
      const error = new DataProcessingError('Test error');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DataProcessingError);
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('DataProcessingError');
    });

    it('should store field name', () => {
      const error = new DataProcessingError('Test error', 'testField');

      expect(error.field).toBe('testField');
    });

    it('should store original error', () => {
      const originalError = new Error('Original error');
      const error = new DataProcessingError('Test error', 'testField', originalError);

      expect(error.originalError).toBe(originalError);
    });
  });
});
