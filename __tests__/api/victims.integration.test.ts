/**
 * Integration tests for /api/victims API route
 * These tests run against actual file system
 */

import { GET, OPTIONS } from '@/app/api/victims/route';
import { NextRequest, NextResponse } from 'next/server';

describe('API Route Integration: /api/victims', () => {
  describe('GET /api/victims', () => {
    it('should successfully return victim data from actual file', async () => {
      const request = {
        nextUrl: {
          searchParams: new URLSearchParams(),
        },
      } as unknown as NextRequest;

      const response = await GET(request);
      const responseData = await response.json();

      // Basic response structure
      expect(responseData).toHaveProperty('success', true);
      expect(responseData).toHaveProperty('data');
      expect(responseData.data).toHaveProperty('victims');
      expect(responseData.data).toHaveProperty('metadata');

      // Check that we have some victims
      expect(Array.isArray(responseData.data.victims)).toBe(true);
      expect(responseData.data.victims.length).toBeGreaterThan(0);

      // Check metadata
      const metadata = responseData.data.metadata;
      expect(metadata).toHaveProperty('total');
      expect(metadata).toHaveProperty('processed');
      expect(metadata).toHaveProperty('failed');
      expect(metadata).toHaveProperty('timestamp');
      expect(metadata).toHaveProperty('filters');

      // Verify first victim has expected fields
      const firstVictim = responseData.data.victims[0];
      expect(firstVictim).toHaveProperty('id');
      expect(firstVictim).toHaveProperty('firstName');
      expect(firstVictim).toHaveProperty('lastName');
      expect(firstVictim).toHaveProperty('fullName');
      expect(firstVictim).toHaveProperty('date');
      expect(firstVictim).toHaveProperty('dateObject');
      expect(firstVictim).toHaveProperty('timestamp');
      expect(firstVictim).toHaveProperty('location');
      expect(firstVictim).toHaveProperty('latitude');
      expect(firstVictim).toHaveProperty('longitude');
      expect(firstVictim).toHaveProperty('isCivilian');
      expect(firstVictim).toHaveProperty('hasUrl');
    });

    it('should include statistics when requested', async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('stats', 'true');

      const request = {
        nextUrl: {
          searchParams,
        },
      } as unknown as NextRequest;

      const response = await GET(request);
      const responseData = await response.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data.statistics).toBeDefined();
      expect(responseData.data.locations).toBeDefined();

      // Check statistics structure
      const stats = responseData.data.statistics;
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('civilians');
      expect(stats).toHaveProperty('military');
      expect(stats).toHaveProperty('bySource');
      expect(stats).toHaveProperty('byType');
      expect(stats).toHaveProperty('byDate');
      expect(stats).toHaveProperty('byLocation');
      expect(stats).toHaveProperty('byGender');
      expect(stats).toHaveProperty('ageStats');

      // Check age stats
      const ageStats = stats.ageStats;
      expect(ageStats).toHaveProperty('min');
      expect(ageStats).toHaveProperty('max');
      expect(ageStats).toHaveProperty('average');
      expect(ageStats).toHaveProperty('median');

      // Check locations array
      expect(Array.isArray(responseData.data.locations)).toBe(true);
      if (responseData.data.locations.length > 0) {
        const firstLocation = responseData.data.locations[0];
        expect(firstLocation).toHaveProperty('location');
        expect(firstLocation).toHaveProperty('latitude');
        expect(firstLocation).toHaveProperty('longitude');
        expect(firstLocation).toHaveProperty('count');
        expect(firstLocation).toHaveProperty('victimIds');
      }
    });

    it('should handle location filtering', async () => {
      // First, get all victims to find a location to filter by
      const allRequest = {
        nextUrl: {
          searchParams: new URLSearchParams(),
        },
      } as unknown as NextRequest;

      const allResponse = await GET(allRequest);
      const allData = await allResponse.json();

      if (allData.data.victims.length > 0) {
        // Get a location from the first victim
        const testLocation = allData.data.victims[0].location;

        // Now test filtering by that location
        const searchParams = new URLSearchParams();
        searchParams.set('location', testLocation);

        const filteredRequest = {
          nextUrl: {
            searchParams,
          },
        } as unknown as NextRequest;

        const filteredResponse = await GET(filteredRequest);
        const filteredData = await filteredResponse.json();

        expect(filteredData.success).toBe(true);
        expect(filteredData.data.metadata.filters.location).toBe(testLocation);

        // All returned victims should have the filtered location
        const matchingVictims = filteredData.data.victims.filter(
          (v: any) => v.location === testLocation
        );
        expect(matchingVictims.length).toBe(filteredData.data.victims.length);
      }
    });

    it('should return sorted victims by date', async () => {
      const request = {
        nextUrl: {
          searchParams: new URLSearchParams(),
        },
      } as unknown as NextRequest;

      const response = await GET(request);
      const responseData = await response.json();

      const victims = responseData.data.victims;

      // Check that victims are sorted by date (oldest to newest)
      for (let i = 1; i < victims.length; i++) {
        const prevDate = new Date(victims[i - 1].date);
        const currDate = new Date(victims[i].date);
        expect(currDate.getTime()).toBeGreaterThanOrEqual(prevDate.getTime());
      }
    });

    it('should include proper CORS headers', async () => {
      const request = {
        nextUrl: {
          searchParams: new URLSearchParams(),
        },
      } as unknown as NextRequest;

      const response = await GET(request);

      // Check CORS headers
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
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
});