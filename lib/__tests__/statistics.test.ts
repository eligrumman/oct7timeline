/**
 * Tests for data statistics utilities
 */

import { describe, it, expect } from '@jest/globals';
import type { ProcessedVictimData } from '@/types/victim';
import {
  calculateVictimStatistics,
  groupByLocation,
  groupByDate,
  groupBySource,
  groupByType,
  getVictimsByDateRange,
  calculateDailyVictimCounts,
  calculateCumulativeVictimCounts,
  getTopLocationsByCount,
  calculatePercentages,
} from '../statistics';

// Mock victim data for testing
const createMockVictim = (
  overrides: Partial<ProcessedVictimData> = {}
): ProcessedVictimData => ({
  id: overrides.id || 'victim-1',
  lastName: 'כהן',
  firstName: 'דוד',
  fullName: 'דוד כהן',
  rank: overrides.rank || '-',
  age: overrides.age || 25,
  location: overrides.location || 'תל אביב',
  date: overrides.date || '2023-10-07',
  dateObject: new Date(overrides.date || '2023-10-07'),
  timestamp: new Date(overrides.date || '2023-10-07').getTime(),
  source: overrides.source || 'עזה',
  type: overrides.type || 'רקטות וטילים',
  gender: overrides.gender || 'זכר',
  url: overrides.url || 'https://example.com',
  latitude: overrides.latitude || 32.0853,
  longitude: overrides.longitude || 34.7818,
  isCivilian: overrides.rank === '-' || !overrides.rank,
  hasUrl: overrides.url !== '-',
  ...overrides,
});

describe('calculateVictimStatistics', () => {
  it('should return zero statistics for empty array', () => {
    const stats = calculateVictimStatistics([]);

    expect(stats.total).toBe(0);
    expect(stats.civilians).toBe(0);
    expect(stats.military).toBe(0);
    expect(stats.bySource).toEqual({});
    expect(stats.byType).toEqual({});
    expect(stats.byDate).toEqual({});
    expect(stats.ageStats).toEqual({
      min: 0,
      max: 0,
      average: 0,
      median: 0,
    });
  });

  it('should calculate total counts correctly', () => {
    const victims = [
      createMockVictim({ id: '1', rank: '-' }),
      createMockVictim({ id: '2', rank: 'סמל' }),
      createMockVictim({ id: '3', rank: '-' }),
    ];

    const stats = calculateVictimStatistics(victims);

    expect(stats.total).toBe(3);
    expect(stats.civilians).toBe(2);
    expect(stats.military).toBe(1);
  });

  it('should group by source correctly', () => {
    const victims = [
      createMockVictim({ id: '1', source: 'עזה' }),
      createMockVictim({ id: '2', source: 'עזה' }),
      createMockVictim({ id: '3', source: 'לבנון' }),
    ];

    const stats = calculateVictimStatistics(victims);

    expect(stats.bySource['עזה']).toBe(2);
    expect(stats.bySource['לבנון']).toBe(1);
  });

  it('should group by type correctly', () => {
    const victims = [
      createMockVictim({ id: '1', type: 'רקטות וטילים' }),
      createMockVictim({ id: '2', type: 'לחימה' }),
      createMockVictim({ id: '3', type: 'רקטות וטילים' }),
    ];

    const stats = calculateVictimStatistics(victims);

    expect(stats.byType['רקטות וטילים']).toBe(2);
    expect(stats.byType['לחימה']).toBe(1);
  });

  it('should group by date correctly', () => {
    const victims = [
      createMockVictim({ id: '1', date: '2023-10-07' }),
      createMockVictim({ id: '2', date: '2023-10-07' }),
      createMockVictim({ id: '3', date: '2023-10-08' }),
    ];

    const stats = calculateVictimStatistics(victims);

    expect(stats.byDate['2023-10-07']).toBe(2);
    expect(stats.byDate['2023-10-08']).toBe(1);
  });

  it('should group by location correctly', () => {
    const victims = [
      createMockVictim({ id: '1', location: 'תל אביב' }),
      createMockVictim({ id: '2', location: 'ירושלים' }),
      createMockVictim({ id: '3', location: 'תל אביב' }),
    ];

    const stats = calculateVictimStatistics(victims);

    expect(stats.byLocation['תל אביב']).toBe(2);
    expect(stats.byLocation['ירושלים']).toBe(1);
  });

  it('should group by gender correctly', () => {
    const victims = [
      createMockVictim({ id: '1', gender: 'זכר' }),
      createMockVictim({ id: '2', gender: 'נקבה' }),
      createMockVictim({ id: '3', gender: 'זכר' }),
    ];

    const stats = calculateVictimStatistics(victims);

    expect(stats.byGender['זכר']).toBe(2);
    expect(stats.byGender['נקבה']).toBe(1);
  });

  it('should calculate age statistics correctly', () => {
    const victims = [
      createMockVictim({ id: '1', age: 20 }),
      createMockVictim({ id: '2', age: 30 }),
      createMockVictim({ id: '3', age: 40 }),
    ];

    const stats = calculateVictimStatistics(victims);

    expect(stats.ageStats.min).toBe(20);
    expect(stats.ageStats.max).toBe(40);
    expect(stats.ageStats.average).toBe(30);
    expect(stats.ageStats.median).toBe(30);
  });

  it('should calculate median correctly for even number of items', () => {
    const victims = [
      createMockVictim({ id: '1', age: 20 }),
      createMockVictim({ id: '2', age: 25 }),
      createMockVictim({ id: '3', age: 30 }),
      createMockVictim({ id: '4', age: 35 }),
    ];

    const stats = calculateVictimStatistics(victims);

    expect(stats.ageStats.median).toBe(27.5);
  });

  it('should calculate median correctly for odd number of items', () => {
    const victims = [
      createMockVictim({ id: '1', age: 20 }),
      createMockVictim({ id: '2', age: 25 }),
      createMockVictim({ id: '3', age: 30 }),
    ];

    const stats = calculateVictimStatistics(victims);

    expect(stats.ageStats.median).toBe(25);
  });
});

describe('groupByLocation', () => {
  it('should group victims by location with coordinates', () => {
    const victims = [
      createMockVictim({
        id: '1',
        location: 'תל אביב',
        latitude: 32.0853,
        longitude: 34.7818,
      }),
      createMockVictim({
        id: '2',
        location: 'תל אביב',
        latitude: 32.0853,
        longitude: 34.7818,
      }),
      createMockVictim({
        id: '3',
        location: 'ירושלים',
        latitude: 31.7683,
        longitude: 35.2137,
      }),
    ];

    const locations = groupByLocation(victims);

    expect(locations).toHaveLength(2);
    expect(locations[0].location).toBe('תל אביב');
    expect(locations[0].count).toBe(2);
    expect(locations[0].victimIds).toEqual(['1', '2']);
    expect(locations[1].location).toBe('ירושלים');
    expect(locations[1].count).toBe(1);
  });

  it('should sort locations by count in descending order', () => {
    const victims = [
      createMockVictim({ id: '1', location: 'תל אביב' }),
      createMockVictim({ id: '2', location: 'ירושלים' }),
      createMockVictim({ id: '3', location: 'ירושלים' }),
      createMockVictim({ id: '4', location: 'ירושלים' }),
    ];

    const locations = groupByLocation(victims);

    expect(locations[0].location).toBe('ירושלים');
    expect(locations[0].count).toBe(3);
    expect(locations[1].location).toBe('תל אביב');
    expect(locations[1].count).toBe(1);
  });

  it('should handle victims at same location with different coordinates', () => {
    const victims = [
      createMockVictim({
        id: '1',
        location: 'תל אביב',
        latitude: 32.0853,
        longitude: 34.7818,
      }),
      createMockVictim({
        id: '2',
        location: 'תל אביב',
        latitude: 32.0854,
        longitude: 34.7819,
      }),
    ];

    const locations = groupByLocation(victims);

    expect(locations).toHaveLength(2);
  });
});

describe('groupByDate', () => {
  it('should group victims by date', () => {
    const victims = [
      createMockVictim({ id: '1', date: '2023-10-07' }),
      createMockVictim({ id: '2', date: '2023-10-07' }),
      createMockVictim({ id: '3', date: '2023-10-08' }),
    ];

    const dateGroups = groupByDate(victims);

    expect(dateGroups).toHaveLength(2);
    expect(dateGroups[0].key).toBe('2023-10-07');
    expect(dateGroups[0].count).toBe(2);
    expect(dateGroups[1].key).toBe('2023-10-08');
    expect(dateGroups[1].count).toBe(1);
  });

  it('should sort date groups chronologically', () => {
    const victims = [
      createMockVictim({ id: '1', date: '2023-10-10' }),
      createMockVictim({ id: '2', date: '2023-10-07' }),
      createMockVictim({ id: '3', date: '2023-10-08' }),
    ];

    const dateGroups = groupByDate(victims);

    expect(dateGroups[0].key).toBe('2023-10-07');
    expect(dateGroups[1].key).toBe('2023-10-08');
    expect(dateGroups[2].key).toBe('2023-10-10');
  });
});

describe('groupBySource', () => {
  it('should group victims by source', () => {
    const victims = [
      createMockVictim({ id: '1', source: 'עזה' }),
      createMockVictim({ id: '2', source: 'עזה' }),
      createMockVictim({ id: '3', source: 'לבנון' }),
    ];

    const sourceGroups = groupBySource(victims);

    expect(sourceGroups).toHaveLength(2);
    expect(sourceGroups[0].key).toBe('עזה');
    expect(sourceGroups[0].count).toBe(2);
    expect(sourceGroups[1].key).toBe('לבנון');
    expect(sourceGroups[1].count).toBe(1);
  });

  it('should sort source groups by count in descending order', () => {
    const victims = [
      createMockVictim({ id: '1', source: 'עזה' }),
      createMockVictim({ id: '2', source: 'לבנון' }),
      createMockVictim({ id: '3', source: 'לבנון' }),
      createMockVictim({ id: '4', source: 'לבנון' }),
    ];

    const sourceGroups = groupBySource(victims);

    expect(sourceGroups[0].key).toBe('לבנון');
    expect(sourceGroups[0].count).toBe(3);
    expect(sourceGroups[1].key).toBe('עזה');
    expect(sourceGroups[1].count).toBe(1);
  });
});

describe('groupByType', () => {
  it('should group victims by incident type', () => {
    const victims = [
      createMockVictim({ id: '1', type: 'רקטות וטילים' }),
      createMockVictim({ id: '2', type: 'לחימה' }),
      createMockVictim({ id: '3', type: 'רקטות וטילים' }),
    ];

    const typeGroups = groupByType(victims);

    expect(typeGroups).toHaveLength(2);
    expect(typeGroups[0].key).toBe('רקטות וטילים');
    expect(typeGroups[0].count).toBe(2);
    expect(typeGroups[1].key).toBe('לחימה');
    expect(typeGroups[1].count).toBe(1);
  });

  it('should sort type groups by count in descending order', () => {
    const victims = [
      createMockVictim({ id: '1', type: 'רקטות וטילים' }),
      createMockVictim({ id: '2', type: 'לחימה' }),
      createMockVictim({ id: '3', type: 'לחימה' }),
      createMockVictim({ id: '4', type: 'לחימה' }),
    ];

    const typeGroups = groupByType(victims);

    expect(typeGroups[0].key).toBe('לחימה');
    expect(typeGroups[0].count).toBe(3);
    expect(typeGroups[1].key).toBe('רקטות וטילים');
    expect(typeGroups[1].count).toBe(1);
  });
});

describe('getVictimsByDateRange', () => {
  it('should filter victims within date range', () => {
    const victims = [
      createMockVictim({ id: '1', date: '2023-10-07' }),
      createMockVictim({ id: '2', date: '2023-10-08' }),
      createMockVictim({ id: '3', date: '2023-10-09' }),
      createMockVictim({ id: '4', date: '2023-10-10' }),
    ];

    const filtered = getVictimsByDateRange(victims, '2023-10-08', '2023-10-09');

    expect(filtered).toHaveLength(2);
    expect(filtered[0].id).toBe('2');
    expect(filtered[1].id).toBe('3');
  });

  it('should include start and end dates', () => {
    const victims = [
      createMockVictim({ id: '1', date: '2023-10-07' }),
      createMockVictim({ id: '2', date: '2023-10-08' }),
      createMockVictim({ id: '3', date: '2023-10-09' }),
    ];

    const filtered = getVictimsByDateRange(victims, '2023-10-07', '2023-10-09');

    expect(filtered).toHaveLength(3);
  });
});

describe('calculateDailyVictimCounts', () => {
  it('should calculate daily victim counts', () => {
    const victims = [
      createMockVictim({ id: '1', date: '2023-10-07' }),
      createMockVictim({ id: '2', date: '2023-10-07' }),
      createMockVictim({ id: '3', date: '2023-10-08' }),
    ];

    const dailyCounts = calculateDailyVictimCounts(victims);

    expect(dailyCounts).toHaveLength(2);
    expect(dailyCounts[0].date).toBe('2023-10-07');
    expect(dailyCounts[0].count).toBe(2);
    expect(dailyCounts[1].date).toBe('2023-10-08');
    expect(dailyCounts[1].count).toBe(1);
  });

  it('should sort daily counts chronologically', () => {
    const victims = [
      createMockVictim({ id: '1', date: '2023-10-10' }),
      createMockVictim({ id: '2', date: '2023-10-07' }),
      createMockVictim({ id: '3', date: '2023-10-08' }),
    ];

    const dailyCounts = calculateDailyVictimCounts(victims);

    expect(dailyCounts[0].date).toBe('2023-10-07');
    expect(dailyCounts[1].date).toBe('2023-10-08');
    expect(dailyCounts[2].date).toBe('2023-10-10');
  });
});

describe('calculateCumulativeVictimCounts', () => {
  it('should calculate cumulative victim counts over time', () => {
    const victims = [
      createMockVictim({ id: '1', date: '2023-10-07' }),
      createMockVictim({ id: '2', date: '2023-10-07' }),
      createMockVictim({ id: '3', date: '2023-10-08' }),
      createMockVictim({ id: '4', date: '2023-10-09' }),
      createMockVictim({ id: '5', date: '2023-10-09' }),
    ];

    const cumulativeCounts = calculateCumulativeVictimCounts(victims);

    expect(cumulativeCounts).toHaveLength(3);
    expect(cumulativeCounts[0].date).toBe('2023-10-07');
    expect(cumulativeCounts[0].cumulativeCount).toBe(2);
    expect(cumulativeCounts[1].date).toBe('2023-10-08');
    expect(cumulativeCounts[1].cumulativeCount).toBe(3);
    expect(cumulativeCounts[2].date).toBe('2023-10-09');
    expect(cumulativeCounts[2].cumulativeCount).toBe(5);
  });
});

describe('getTopLocationsByCount', () => {
  it('should return top N locations by victim count', () => {
    const victims = [
      createMockVictim({ id: '1', location: 'תל אביב' }),
      createMockVictim({ id: '2', location: 'תל אביב' }),
      createMockVictim({ id: '3', location: 'תל אביב' }),
      createMockVictim({ id: '4', location: 'ירושלים' }),
      createMockVictim({ id: '5', location: 'ירושלים' }),
      createMockVictim({ id: '6', location: 'חיפה' }),
    ];

    const topLocations = getTopLocationsByCount(victims, 2);

    expect(topLocations).toHaveLength(2);
    expect(topLocations[0].location).toBe('תל אביב');
    expect(topLocations[0].count).toBe(3);
    expect(topLocations[1].location).toBe('ירושלים');
    expect(topLocations[1].count).toBe(2);
  });

  it('should default to top 10 locations', () => {
    const victims = Array.from({ length: 15 }, (_, i) =>
      createMockVictim({ id: `${i}`, location: `location-${i}` })
    );

    const topLocations = getTopLocationsByCount(victims);

    expect(topLocations).toHaveLength(10);
  });
});

describe('calculatePercentages', () => {
  it('should calculate percentages correctly', () => {
    const counts = {
      'עזה': 70,
      'לבנון': 20,
      'תימן': 10,
    };

    const percentages = calculatePercentages(counts, 100);

    expect(percentages['עזה']).toBe(70);
    expect(percentages['לבנון']).toBe(20);
    expect(percentages['תימן']).toBe(10);
  });

  it('should round to one decimal place', () => {
    const counts = {
      'עזה': 33,
      'לבנון': 67,
    };

    const percentages = calculatePercentages(counts, 100);

    expect(percentages['עזה']).toBe(33);
    expect(percentages['לבנון']).toBe(67);
  });

  it('should handle zero total', () => {
    const counts = {
      'עזה': 10,
    };

    const percentages = calculatePercentages(counts, 0);

    expect(percentages['עזה']).toBe(0);
  });
});
