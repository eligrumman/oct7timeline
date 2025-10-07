/**
 * Test suite for data loading utilities
 */

import {
  loadVictimsFromJSON,
  parseVictimsData,
  convertDatesToTimestamps,
  enrichVictimData,
  batchEnrichVictimData,
  DataLoadError,
  DataValidationError,
  DataEnrichmentError,
  VictimWithTimestamp,
} from '@/lib/utils/dataLoader';
import { Victim } from '@/lib/types/victim';
import * as geocodingService from '@/lib/services/geocoding';
import { readFile } from 'fs/promises';

// Mock the fs/promises module
jest.mock('fs/promises');
const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;

// Mock the geocoding service
jest.mock('@/lib/services/geocoding');
const mockGeocodeLocation = geocodingService.geocodeLocation as jest.MockedFunction<
  typeof geocodingService.geocodeLocation
>;

describe('parseVictimsData', () => {
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

  describe('valid JSON parsing', () => {
    it('should parse valid JSON string with single victim', () => {
      const jsonString = JSON.stringify([validVictim]);
      const result = parseVictimsData(jsonString);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(validVictim);
    });

    it('should parse valid JSON string with multiple victims', () => {
      const victims = [
        validVictim,
        { ...validVictim, firstName: 'שרה', age: 30 },
      ];
      const jsonString = JSON.stringify(victims);
      const result = parseVictimsData(jsonString);
      expect(result).toHaveLength(2);
      expect(result).toEqual(victims);
    });

    it('should handle Hebrew UTF-8 text correctly', () => {
      const hebrewVictim: Victim = {
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
      const jsonString = JSON.stringify([hebrewVictim]);
      const result = parseVictimsData(jsonString);
      expect(result[0].lastName).toBe('אבו סאלח');
      expect(result[0].firstName).toBe('חאזם אכרם');
      expect(result[0].location).toBe("מג'דל שמס");
    });
  });

  describe('invalid JSON parsing', () => {
    it('should throw DataLoadError for invalid JSON syntax', () => {
      const invalidJson = '{ invalid json }';
      expect(() => parseVictimsData(invalidJson)).toThrow(DataLoadError);
      expect(() => parseVictimsData(invalidJson)).toThrow(/Failed to parse JSON/);
    });

    it('should throw DataLoadError for empty string', () => {
      expect(() => parseVictimsData('')).toThrow(DataLoadError);
    });

    it('should throw DataLoadError for non-JSON string', () => {
      expect(() => parseVictimsData('not json')).toThrow(DataLoadError);
    });

    it('should throw DataLoadError for incomplete JSON', () => {
      const incomplete = '[{"lastName":"כהן"';
      expect(() => parseVictimsData(incomplete)).toThrow(DataLoadError);
    });
  });

  describe('validation errors', () => {
    it('should throw DataValidationError for non-array JSON', () => {
      const jsonString = JSON.stringify({ not: 'an array' });
      expect(() => parseVictimsData(jsonString)).toThrow(DataValidationError);
    });

    it('should throw DataValidationError for empty array', () => {
      const jsonString = JSON.stringify([]);
      expect(() => parseVictimsData(jsonString)).toThrow(DataValidationError);
    });

    it('should throw DataValidationError for invalid victim data', () => {
      const invalidVictim = { ...validVictim, age: -1 };
      const jsonString = JSON.stringify([invalidVictim]);
      expect(() => parseVictimsData(jsonString)).toThrow(DataValidationError);
    });

    it('should include validation errors in error message', () => {
      const invalidVictim = { ...validVictim, firstName: '' };
      const jsonString = JSON.stringify([invalidVictim]);
      try {
        parseVictimsData(jsonString);
        fail('Should have thrown DataValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(DataValidationError);
        if (error instanceof DataValidationError) {
          expect(error.validationResult.errors.length).toBeGreaterThan(0);
        }
      }
    });
  });
});

describe('loadVictimsFromJSON', () => {
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

  beforeEach(() => {
    mockReadFile.mockReset();
  });

  describe('successful file loading', () => {
    it('should load victims from valid JSON file', async () => {
      const jsonContent = JSON.stringify([validVictim]);
      mockReadFile.mockResolvedValue(jsonContent);

      const result = await loadVictimsFromJSON('/path/to/victims.json');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(validVictim);
      expect(mockReadFile).toHaveBeenCalledWith('/path/to/victims.json', 'utf-8');
    });

    it('should load multiple victims from file', async () => {
      const victims = [
        validVictim,
        { ...validVictim, firstName: 'שרה', age: 30 },
      ];
      const jsonContent = JSON.stringify(victims);
      mockReadFile.mockResolvedValue(jsonContent);

      const result = await loadVictimsFromJSON('/path/to/victims.json');
      expect(result).toHaveLength(2);
      expect(result).toEqual(victims);
    });

    it('should handle Hebrew UTF-8 encoding correctly', async () => {
      const hebrewVictim: Victim = {
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
      const jsonContent = JSON.stringify([hebrewVictim]);
      mockReadFile.mockResolvedValue(jsonContent);

      const result = await loadVictimsFromJSON('/path/to/victims.json');
      expect(result[0].lastName).toBe('אבו סאלח');
      expect(result[0].location).toBe("מג'דל שמס");
    });
  });

  describe('file system errors', () => {
    it('should throw DataLoadError when file does not exist', async () => {
      const error = new Error('ENOENT: no such file or directory');
      (error as any).code = 'ENOENT';
      mockReadFile.mockRejectedValue(error);

      await expect(loadVictimsFromJSON('/nonexistent/file.json')).rejects.toThrow(
        DataLoadError
      );
    });

    it('should throw DataLoadError on file read permission error', async () => {
      const error = new Error('EACCES: permission denied');
      (error as any).code = 'EACCES';
      mockReadFile.mockRejectedValue(error);

      await expect(loadVictimsFromJSON('/forbidden/file.json')).rejects.toThrow(
        DataLoadError
      );
    });

    it('should include file path in error message', async () => {
      mockReadFile.mockRejectedValue(new Error('File not found'));

      try {
        await loadVictimsFromJSON('/test/path.json');
        fail('Should have thrown DataLoadError');
      } catch (error) {
        expect(error).toBeInstanceOf(DataLoadError);
        if (error instanceof Error) {
          expect(error.message).toContain('/test/path.json');
        }
      }
    });
  });

  describe('invalid file content', () => {
    it('should throw DataLoadError for malformed JSON', async () => {
      mockReadFile.mockResolvedValue('{ invalid json }');

      await expect(loadVictimsFromJSON('/path/to/invalid.json')).rejects.toThrow(
        DataLoadError
      );
    });

    it('should throw DataValidationError for invalid victim data', async () => {
      const invalidVictim = { ...validVictim, age: -1 };
      mockReadFile.mockResolvedValue(JSON.stringify([invalidVictim]));

      await expect(loadVictimsFromJSON('/path/to/invalid.json')).rejects.toThrow(
        DataValidationError
      );
    });

    it('should preserve DataValidationError when re-throwing', async () => {
      const invalidVictim = { ...validVictim, firstName: '' };
      mockReadFile.mockResolvedValue(JSON.stringify([invalidVictim]));

      try {
        await loadVictimsFromJSON('/path/to/invalid.json');
        fail('Should have thrown DataValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(DataValidationError);
      }
    });
  });
});

describe('convertDatesToTimestamps', () => {
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

  describe('successful timestamp conversion', () => {
    it('should convert ISO date to Unix timestamp', () => {
      const result = convertDatesToTimestamps([validVictim]);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('timestamp');
      expect(typeof result[0].timestamp).toBe('number');
      expect(Number.isFinite(result[0].timestamp)).toBe(true);
    });

    it('should preserve all original victim fields', () => {
      const result = convertDatesToTimestamps([validVictim]);
      const { timestamp, ...originalFields } = result[0];
      expect(originalFields).toEqual(validVictim);
    });

    it('should convert multiple victims', () => {
      const victims = [
        validVictim,
        { ...validVictim, date: '2023-10-08', firstName: 'שרה' },
      ];
      const result = convertDatesToTimestamps(victims);
      expect(result).toHaveLength(2);
      expect(result[0].timestamp).toBeLessThan(result[1].timestamp);
    });

    it('should handle empty array', () => {
      const result = convertDatesToTimestamps([]);
      expect(result).toEqual([]);
    });

    it('should generate correct timestamp for October 7, 2023', () => {
      const victim = { ...validVictim, date: '2023-10-07' };
      const result = convertDatesToTimestamps([victim]);
      const expectedTimestamp = new Date('2023-10-07').getTime();
      expect(result[0].timestamp).toBe(expectedTimestamp);
    });

    it('should handle different dates correctly', () => {
      const victim1 = { ...validVictim, date: '2024-07-28' };
      const victim2 = { ...validVictim, date: '2024-01-01' };
      const result = convertDatesToTimestamps([victim1, victim2]);
      expect(result[0].timestamp).toBeGreaterThan(result[1].timestamp);
    });
  });

  describe('invalid date conversion', () => {
    it('should throw DataLoadError for invalid date string', () => {
      const invalidVictim = { ...validVictim, date: 'invalid-date' };
      expect(() => convertDatesToTimestamps([invalidVictim])).toThrow(DataLoadError);
    });

    it('should include victim details in error message', () => {
      const invalidVictim = { ...validVictim, date: 'bad-date' };
      try {
        convertDatesToTimestamps([invalidVictim]);
        fail('Should have thrown DataLoadError');
      } catch (error) {
        expect(error).toBeInstanceOf(DataLoadError);
        if (error instanceof Error) {
          expect(error.message).toContain('דוד');
          expect(error.message).toContain('כהן');
        }
      }
    });
  });

  describe('timestamp type checking', () => {
    it('should generate finite number timestamps', () => {
      const result = convertDatesToTimestamps([validVictim]);
      expect(Number.isFinite(result[0].timestamp)).toBe(true);
      expect(isNaN(result[0].timestamp)).toBe(false);
    });

    it('should generate positive timestamps for modern dates', () => {
      const result = convertDatesToTimestamps([validVictim]);
      expect(result[0].timestamp).toBeGreaterThan(0);
    });
  });
});

describe('enrichVictimData', () => {
  const partialVictim: Partial<Victim> = {
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
  };

  beforeEach(() => {
    mockGeocodeLocation.mockReset();
  });

  describe('successful enrichment', () => {
    it('should enrich victim with missing coordinates', async () => {
      mockGeocodeLocation.mockResolvedValue({
        latitude: 31.7683,
        longitude: 35.2137,
      });

      const result = await enrichVictimData(partialVictim);
      expect(result.latitude).toBe(31.7683);
      expect(result.longitude).toBe(35.2137);
      expect(mockGeocodeLocation).toHaveBeenCalledWith('ירושלים');
    });

    it('should preserve all original fields', async () => {
      mockGeocodeLocation.mockResolvedValue({
        latitude: 31.7683,
        longitude: 35.2137,
      });

      const result = await enrichVictimData(partialVictim);
      expect(result.lastName).toBe('כהן');
      expect(result.firstName).toBe('דוד');
      expect(result.location).toBe('ירושלים');
    });

    it('should not call geocoding if coordinates already exist', async () => {
      const complete: Partial<Victim> = {
        ...partialVictim,
        latitude: 31.7683,
        longitude: 35.2137,
      };

      const result = await enrichVictimData(complete);
      expect(mockGeocodeLocation).not.toHaveBeenCalled();
      expect(result.latitude).toBe(31.7683);
      expect(result.longitude).toBe(35.2137);
    });

    it('should geocode if latitude is missing', async () => {
      const missingLat = { ...partialVictim, longitude: 35.2137 };
      mockGeocodeLocation.mockResolvedValue({
        latitude: 31.7683,
        longitude: 35.2137,
      });

      await enrichVictimData(missingLat);
      expect(mockGeocodeLocation).toHaveBeenCalled();
    });

    it('should geocode if longitude is missing', async () => {
      const missingLon = { ...partialVictim, latitude: 31.7683 };
      mockGeocodeLocation.mockResolvedValue({
        latitude: 31.7683,
        longitude: 35.2137,
      });

      await enrichVictimData(missingLon);
      expect(mockGeocodeLocation).toHaveBeenCalled();
    });

    it('should geocode if coordinates are NaN', async () => {
      const nanCoords = { ...partialVictim, latitude: NaN, longitude: NaN };
      mockGeocodeLocation.mockResolvedValue({
        latitude: 31.7683,
        longitude: 35.2137,
      });

      await enrichVictimData(nanCoords);
      expect(mockGeocodeLocation).toHaveBeenCalled();
    });

    it('should geocode if coordinates are Infinity', async () => {
      const infCoords = { ...partialVictim, latitude: Infinity, longitude: -Infinity };
      mockGeocodeLocation.mockResolvedValue({
        latitude: 31.7683,
        longitude: 35.2137,
      });

      await enrichVictimData(infCoords);
      expect(mockGeocodeLocation).toHaveBeenCalled();
    });
  });

  describe('geocoding failures', () => {
    it('should throw DataEnrichmentError when location is missing', async () => {
      const noLocation = { ...partialVictim };
      delete noLocation.location;

      await expect(enrichVictimData(noLocation)).rejects.toThrow(DataEnrichmentError);
      await expect(enrichVictimData(noLocation)).rejects.toThrow(
        /location field is required/
      );
    });

    it('should throw DataEnrichmentError when geocoding returns null', async () => {
      mockGeocodeLocation.mockResolvedValue(null);

      await expect(enrichVictimData(partialVictim)).rejects.toThrow(DataEnrichmentError);
      await expect(enrichVictimData(partialVictim)).rejects.toThrow(
        /Failed to geocode location/
      );
    });

    it('should include location name in error message', async () => {
      mockGeocodeLocation.mockResolvedValue(null);

      try {
        await enrichVictimData(partialVictim);
        fail('Should have thrown DataEnrichmentError');
      } catch (error) {
        expect(error).toBeInstanceOf(DataEnrichmentError);
        if (error instanceof Error) {
          expect(error.message).toContain('ירושלים');
        }
      }
    });
  });

  describe('validation after enrichment', () => {
    it('should throw DataEnrichmentError if enriched data is invalid', async () => {
      const incomplete = { firstName: 'דוד', location: 'ירושלים' };
      mockGeocodeLocation.mockResolvedValue({
        latitude: 31.7683,
        longitude: 35.2137,
      });

      await expect(enrichVictimData(incomplete)).rejects.toThrow(DataEnrichmentError);
    });

    it('should include validation errors in error message', async () => {
      const incomplete = { firstName: 'דוד', location: 'ירושלים' };
      mockGeocodeLocation.mockResolvedValue({
        latitude: 31.7683,
        longitude: 35.2137,
      });

      try {
        await enrichVictimData(incomplete);
        fail('Should have thrown DataEnrichmentError');
      } catch (error) {
        expect(error).toBeInstanceOf(DataEnrichmentError);
        if (error instanceof Error) {
          expect(error.message).toContain('invalid');
        }
      }
    });
  });
});

describe('batchEnrichVictimData', () => {
  const partial1: Partial<Victim> = {
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
  };

  const partial2: Partial<Victim> = {
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
  };

  beforeEach(() => {
    mockGeocodeLocation.mockReset();
    jest.clearAllTimers();
  });

  describe('successful batch enrichment', () => {
    it('should enrich multiple victims', async () => {
      mockGeocodeLocation
        .mockResolvedValueOnce({ latitude: 31.7683, longitude: 35.2137 })
        .mockResolvedValueOnce({ latitude: 32.0853, longitude: 34.7818 });

      const result = await batchEnrichVictimData([partial1, partial2], {
        delayMs: 0,
      });
      expect(result).toHaveLength(2);
      expect(result[0].location).toBe('ירושלים');
      expect(result[1].location).toBe('תל אביב');
    });

    it('should enrich empty array', async () => {
      const result = await batchEnrichVictimData([], { delayMs: 0 });
      expect(result).toEqual([]);
      expect(mockGeocodeLocation).not.toHaveBeenCalled();
    });

    it('should call geocoding service for each victim', async () => {
      mockGeocodeLocation.mockResolvedValue({ latitude: 31.0, longitude: 35.0 });

      await batchEnrichVictimData([partial1, partial2], { delayMs: 0 });
      expect(mockGeocodeLocation).toHaveBeenCalledTimes(2);
      expect(mockGeocodeLocation).toHaveBeenCalledWith('ירושלים');
      expect(mockGeocodeLocation).toHaveBeenCalledWith('תל אביב');
    });
  });

  describe('error handling with continueOnError=false', () => {
    it('should throw error and stop on first failure', async () => {
      mockGeocodeLocation.mockResolvedValueOnce(null); // First fails

      await expect(
        batchEnrichVictimData([partial1, partial2], { continueOnError: false, delayMs: 0 })
      ).rejects.toThrow(DataEnrichmentError);

      // Should only try the first one
      expect(mockGeocodeLocation).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling with continueOnError=true', () => {
    it('should continue processing after error', async () => {
      mockGeocodeLocation
        .mockResolvedValueOnce(null) // First fails
        .mockResolvedValueOnce({ latitude: 32.0853, longitude: 34.7818 }); // Second succeeds

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await batchEnrichVictimData([partial1, partial2], {
        continueOnError: true,
        delayMs: 0,
      });

      expect(result).toHaveLength(1); // Only second one succeeds
      expect(result[0].location).toBe('תל אביב');
      expect(mockGeocodeLocation).toHaveBeenCalledTimes(2);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should log warning when some enrichments fail', async () => {
      mockGeocodeLocation
        .mockResolvedValueOnce({ latitude: 31.7683, longitude: 35.2137 })
        .mockResolvedValueOnce(null);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await batchEnrichVictimData([partial1, partial2], {
        continueOnError: true,
        delayMs: 0,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('completed with')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Successfully enriched 1 out of 2')
      );

      consoleSpy.mockRestore();
    });
  });
});
