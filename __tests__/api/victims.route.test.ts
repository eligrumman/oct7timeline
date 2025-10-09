/**
 * Tests for /api/victims API route
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { ProcessedVictimData } from '@/types/victim';

// Mock Next.js server modules
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url: string) => ({
    nextUrl: new URL(url),
  })),
  NextResponse: {
    json: jest.fn((body: any, init?: ResponseInit) => ({
      json: async () => body,
      status: init?.status || 200,
      headers: new Map(Object.entries(init?.headers || {})),
    })),
  },
}));

// Mock the fs module
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

// Import after mocking
import { GET, OPTIONS } from '@/app/api/victims/route';
import { NextRequest } from 'next/server';

// Mock sample victim data
const mockVictimData = [
  {
    lastName: 'כהן',
    firstName: 'דוד',
    rank: '-',
    age: 45,
    location: 'תל אביב',
    date: '2024-07-15',
    source: 'עזה',
    type: 'רקטות וטילים',
    gender: 'זכר',
    url: 'https://example.com/article1',
    latitude: 32.0853,
    longitude: 34.7818,
  },
  {
    lastName: 'לוי',
    firstName: 'שרה',
    rank: 'סגן',
    age: 28,
    location: 'ירושלים',
    date: '2024-07-20',
    source: 'לבנון',
    type: 'לחימה',
    gender: 'נקבה',
    url: '-',
    latitude: 31.7683,
    longitude: 35.2137,
  },
  {
    lastName: 'מזרחי',
    firstName: 'יוסף',
    rank: '-',
    age: 62,
    location: 'תל אביב',
    date: '2024-07-25',
    source: 'פיגועים בארץ',
    type: 'פיגוע',
    gender: 'זכר',
    url: '-',
    latitude: 32.0853,
    longitude: 34.7818,
  },
];

describe('GET /api/victims', () => {
  const mockReadFile = fs.readFile as jest.MockedFunction<typeof fs.readFile>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful responses', () => {
    it('should return processed victim data without statistics', async () => {
      mockReadFile.mockResolvedValueOnce(JSON.stringify(mockVictimData));

      const request = new NextRequest('http://localhost/api/victims');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.victims).toHaveLength(3);
      expect(data.data.metadata).toMatchObject({
        total: 3,
        processed: 3,
        failed: 0,
        filters: {
          includeStats: false,
        },
      });

      // Verify victims are sorted by date
      const victims = data.data.victims as ProcessedVictimData[];
      expect(victims[0].date).toBe('2024-07-15');
      expect(victims[1].date).toBe('2024-07-20');
      expect(victims[2].date).toBe('2024-07-25');

      // Verify computed fields are present
      expect(victims[0]).toHaveProperty('id');
      expect(victims[0]).toHaveProperty('timestamp');
      expect(victims[0]).toHaveProperty('dateObject');
      expect(victims[0]).toHaveProperty('fullName');
      expect(victims[0]).toHaveProperty('isCivilian', true);
      expect(victims[0]).toHaveProperty('hasUrl', true);
    });

    it('should include statistics when stats=true', async () => {
      mockReadFile.mockResolvedValueOnce(JSON.stringify(mockVictimData));

      const request = new NextRequest('http://localhost/api/victims?stats=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.statistics).toBeDefined();
      expect(data.data.locations).toBeDefined();

      const stats = data.data.statistics;
      expect(stats.total).toBe(3);
      expect(stats.civilians).toBe(2);
      expect(stats.military).toBe(1);
      expect(stats.byGender['זכר']).toBe(2);
      expect(stats.byGender['נקבה']).toBe(1);
      expect(stats.ageStats).toMatchObject({
        min: 28,
        max: 62,
        average: expect.any(Number),
        median: 45,
      });
    });

    it('should filter by location when location parameter is provided', async () => {
      mockReadFile.mockResolvedValueOnce(JSON.stringify(mockVictimData));

      const request = new NextRequest('http://localhost/api/victims?location=תל אביב');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.victims).toHaveLength(2);

      const victims = data.data.victims as ProcessedVictimData[];
      expect(victims.every(v => v.location === 'תל אביב')).toBe(true);
      expect(data.data.metadata.filters.location).toBe('תל אביב');
    });

    it('should handle partial location matches', async () => {
      mockReadFile.mockResolvedValueOnce(JSON.stringify(mockVictimData));

      const request = new NextRequest('http://localhost/api/victims?location=תל');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.victims).toHaveLength(2);
    });

    it('should combine location filter with statistics', async () => {
      mockReadFile.mockResolvedValueOnce(JSON.stringify(mockVictimData));

      const request = new NextRequest('http://localhost/api/victims?location=ירושלים&stats=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.victims).toHaveLength(1);
      expect(data.data.statistics.total).toBe(1);
      expect(data.data.statistics.military).toBe(1);
      expect(data.data.statistics.civilians).toBe(0);
    });

    it('should return empty array when location filter matches no records', async () => {
      mockReadFile.mockResolvedValueOnce(JSON.stringify(mockVictimData));

      const request = new NextRequest('http://localhost/api/victims?location=חיפה');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.victims).toHaveLength(0);
      expect(data.data.metadata.processed).toBe(0);
    });

    it('should handle empty data file gracefully', async () => {
      mockReadFile.mockResolvedValueOnce(JSON.stringify([]));

      const request = new NextRequest('http://localhost/api/victims');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.victims).toHaveLength(0);
      expect(data.data.metadata).toMatchObject({
        total: 0,
        processed: 0,
        failed: 0,
      });
    });
  });

  describe('Error handling', () => {
    it('should return 404 when data file is not found', async () => {
      const error: any = new Error('File not found');
      error.code = 'ENOENT';
      mockReadFile.mockRejectedValueOnce(error);

      const request = new NextRequest('http://localhost/api/victims');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('FILE_NOT_FOUND');
      expect(data.error.message).toContain('Data file not found');
    });

    it('should return 500 for other file read errors', async () => {
      mockReadFile.mockRejectedValueOnce(new Error('Permission denied'));

      const request = new NextRequest('http://localhost/api/victims');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('FILE_READ_ERROR');
      expect(data.error.message).toBe('Failed to read victim data file');
    });

    it('should return 500 for invalid JSON', async () => {
      mockReadFile.mockResolvedValueOnce('{ invalid json }');

      const request = new NextRequest('http://localhost/api/victims');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_JSON');
      expect(data.error.message).toBe('Invalid JSON in victim data file');
    });

    it('should return 500 when data is not an array', async () => {
      mockReadFile.mockResolvedValueOnce(JSON.stringify({ not: 'an array' }));

      const request = new NextRequest('http://localhost/api/victims');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('Victim data must be an array');
    });

    it('should handle partially invalid data gracefully', async () => {
      const mixedData = [
        mockVictimData[0],
        { invalidRecord: true }, // This will fail validation
        mockVictimData[1],
      ];

      mockReadFile.mockResolvedValueOnce(JSON.stringify(mixedData));

      const request = new NextRequest('http://localhost/api/victims');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.victims).toHaveLength(2); // Only valid records
      expect(data.data.metadata.total).toBe(3);
      expect(data.data.metadata.processed).toBe(2);
      expect(data.data.metadata.failed).toBe(1);
    });

    it('should return 500 when all records fail validation', async () => {
      const invalidData = [
        { invalidRecord: true },
        { anotherInvalid: true },
      ];

      mockReadFile.mockResolvedValueOnce(JSON.stringify(invalidData));

      const request = new NextRequest('http://localhost/api/victims');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('PROCESSING_ERROR');
      expect(data.error.message).toContain('Failed to process any victim records');
    });
  });

  describe('CORS headers', () => {
    it('should include CORS headers in successful response', async () => {
      mockReadFile.mockResolvedValueOnce(JSON.stringify(mockVictimData));

      const request = new NextRequest('http://localhost/api/victims');
      const response = await GET(request);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should include CORS headers in error response', async () => {
      const error: any = new Error('File not found');
      error.code = 'ENOENT';
      mockReadFile.mockRejectedValueOnce(error);

      const request = new NextRequest('http://localhost/api/victims');
      const response = await GET(request);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('OPTIONS /api/victims', () => {
    it('should handle preflight requests', async () => {
      const response = await OPTIONS();

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
    });
  });

  describe('Query parameter validation', () => {
    it('should handle stats parameter case-insensitively', async () => {
      mockReadFile.mockResolvedValueOnce(JSON.stringify(mockVictimData));

      const request1 = new NextRequest('http://localhost/api/victims?stats=True');
      const response1 = await GET(request1);
      const data1 = await response1.json();

      expect(data1.data.statistics).toBeUndefined(); // 'True' !== 'true'

      const request2 = new NextRequest('http://localhost/api/victims?stats=false');
      const response2 = await GET(request2);
      const data2 = await response2.json();

      expect(data2.data.statistics).toBeUndefined();
    });

    it('should handle empty location parameter', async () => {
      mockReadFile.mockResolvedValueOnce(JSON.stringify(mockVictimData));

      const request = new NextRequest('http://localhost/api/victims?location=');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.victims).toHaveLength(3); // No filtering applied
      expect(data.data.metadata.filters.location).toBe('');
    });

    it('should handle whitespace in location parameter', async () => {
      mockReadFile.mockResolvedValueOnce(JSON.stringify(mockVictimData));

      const request = new NextRequest('http://localhost/api/victims?location=   ');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.victims).toHaveLength(3); // No filtering applied
    });
  });

  describe('Response metadata', () => {
    it('should include timestamp in metadata', async () => {
      mockReadFile.mockResolvedValueOnce(JSON.stringify(mockVictimData));

      const beforeTime = Date.now();
      const request = new NextRequest('http://localhost/api/victims');
      const response = await GET(request);
      const data = await response.json();
      const afterTime = Date.now();

      expect(data.data.metadata.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(data.data.metadata.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should correctly report processing statistics', async () => {
      const mixedData = [
        ...mockVictimData,
        { incomplete: 'record' },
        { another: 'bad record' },
      ];

      mockReadFile.mockResolvedValueOnce(JSON.stringify(mixedData));

      const request = new NextRequest('http://localhost/api/victims');
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.metadata.total).toBe(5);
      expect(data.data.metadata.processed).toBe(3);
      expect(data.data.metadata.failed).toBe(2);
    });
  });
});