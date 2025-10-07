/**
 * Test suite for statistics module
 */

import {
  getTotalVictims,
  getVictimsByLocation,
  getVictimsByDate,
  getVictimsBySource,
  getVictimsByType,
  getAgeStatistics,
  getDateRange,
  generateStatisticsReport,
  AgeStatistics,
  DateRange,
} from '@/lib/utils/statistics';
import { Victim } from '@/lib/types/victim';

describe('getTotalVictims', () => {
  it('should return total count for non-empty array', () => {
    const victims: Victim[] = [
      createVictim({ firstName: 'דוד' }),
      createVictim({ firstName: 'שרה' }),
      createVictim({ firstName: 'מרדכי' }),
    ];
    expect(getTotalVictims(victims)).toBe(3);
  });

  it('should return 0 for empty array', () => {
    expect(getTotalVictims([])).toBe(0);
  });

  it('should return 1 for single victim', () => {
    const victims: Victim[] = [createVictim()];
    expect(getTotalVictims(victims)).toBe(1);
  });
});

describe('getVictimsByLocation', () => {
  describe('grouping by location', () => {
    it('should count victims by location', () => {
      const victims: Victim[] = [
        createVictim({ location: 'ירושלים' }),
        createVictim({ location: 'תל אביב' }),
        createVictim({ location: 'ירושלים' }),
      ];
      const result = getVictimsByLocation(victims);
      expect(result.get('ירושלים')).toBe(2);
      expect(result.get('תל אביב')).toBe(1);
    });

    it('should handle empty array', () => {
      const result = getVictimsByLocation([]);
      expect(result.size).toBe(0);
    });

    it('should handle single location', () => {
      const victims: Victim[] = [
        createVictim({ location: 'ירושלים' }),
        createVictim({ location: 'ירושלים' }),
      ];
      const result = getVictimsByLocation(victims);
      expect(result.size).toBe(1);
      expect(result.get('ירושלים')).toBe(2);
    });
  });

  describe('sorting by count', () => {
    it('should sort locations by count descending', () => {
      const victims: Victim[] = [
        createVictim({ location: 'ירושלים' }),
        createVictim({ location: 'תל אביב' }),
        createVictim({ location: 'חיפה' }),
        createVictim({ location: 'תל אביב' }),
        createVictim({ location: 'תל אביב' }),
      ];
      const result = getVictimsByLocation(victims);
      const entries = Array.from(result.entries());
      expect(entries[0]).toEqual(['תל אביב', 3]);
      expect(entries[1][1]).toBeLessThanOrEqual(entries[0][1]);
      expect(entries[2][1]).toBeLessThanOrEqual(entries[1][1]);
    });

    it('should maintain stable sort for equal counts', () => {
      const victims: Victim[] = [
        createVictim({ location: 'ירושלים' }),
        createVictim({ location: 'תל אביב' }),
      ];
      const result = getVictimsByLocation(victims);
      expect(result.size).toBe(2);
      Array.from(result.values()).forEach((count) => expect(count).toBe(1));
    });
  });
});

describe('getVictimsByDate', () => {
  describe('grouping by date', () => {
    it('should count victims by date', () => {
      const victims: Victim[] = [
        createVictim({ date: '2023-10-07' }),
        createVictim({ date: '2023-10-08' }),
        createVictim({ date: '2023-10-07' }),
      ];
      const result = getVictimsByDate(victims);
      expect(result.get('2023-10-07')).toBe(2);
      expect(result.get('2023-10-08')).toBe(1);
    });

    it('should handle empty array', () => {
      const result = getVictimsByDate([]);
      expect(result.size).toBe(0);
    });

    it('should handle single date', () => {
      const victims: Victim[] = [
        createVictim({ date: '2023-10-07' }),
        createVictim({ date: '2023-10-07' }),
      ];
      const result = getVictimsByDate(victims);
      expect(result.size).toBe(1);
      expect(result.get('2023-10-07')).toBe(2);
    });
  });

  describe('sorting by date', () => {
    it('should sort dates in ascending order', () => {
      const victims: Victim[] = [
        createVictim({ date: '2024-07-28' }),
        createVictim({ date: '2023-10-07' }),
        createVictim({ date: '2024-01-15' }),
      ];
      const result = getVictimsByDate(victims);
      const dates = Array.from(result.keys());
      expect(dates[0]).toBe('2023-10-07');
      expect(dates[1]).toBe('2024-01-15');
      expect(dates[2]).toBe('2024-07-28');
    });

    it('should handle chronological date sequence', () => {
      const victims: Victim[] = [
        createVictim({ date: '2023-10-07' }),
        createVictim({ date: '2023-10-08' }),
        createVictim({ date: '2023-10-09' }),
      ];
      const result = getVictimsByDate(victims);
      const dates = Array.from(result.keys());
      expect(dates).toEqual(['2023-10-07', '2023-10-08', '2023-10-09']);
    });
  });
});

describe('getVictimsBySource', () => {
  describe('grouping by source', () => {
    it('should count victims by source', () => {
      const victims: Victim[] = [
        createVictim({ source: 'עזה' }),
        createVictim({ source: 'לבנון' }),
        createVictim({ source: 'עזה' }),
        createVictim({ source: 'עזה' }),
      ];
      const result = getVictimsBySource(victims);
      expect(result.get('עזה')).toBe(3);
      expect(result.get('לבנון')).toBe(1);
    });

    it('should handle empty array', () => {
      const result = getVictimsBySource([]);
      expect(result.size).toBe(0);
    });

    it('should handle single source', () => {
      const victims: Victim[] = [
        createVictim({ source: 'עזה' }),
        createVictim({ source: 'עזה' }),
      ];
      const result = getVictimsBySource(victims);
      expect(result.size).toBe(1);
      expect(result.get('עזה')).toBe(2);
    });
  });

  describe('sorting by count', () => {
    it('should sort sources by count descending', () => {
      const victims: Victim[] = [
        createVictim({ source: 'עזה' }),
        createVictim({ source: 'לבנון' }),
        createVictim({ source: 'תימן' }),
        createVictim({ source: 'עזה' }),
        createVictim({ source: 'עזה' }),
        createVictim({ source: 'לבנון' }),
      ];
      const result = getVictimsBySource(victims);
      const entries = Array.from(result.entries());
      expect(entries[0][0]).toBe('עזה');
      expect(entries[0][1]).toBe(3);
      expect(entries[1][1]).toBeLessThanOrEqual(entries[0][1]);
    });
  });
});

describe('getVictimsByType', () => {
  describe('grouping by type', () => {
    it('should count victims by type', () => {
      const victims: Victim[] = [
        createVictim({ type: 'לחימה' }),
        createVictim({ type: 'רקטות וטילים' }),
        createVictim({ type: 'לחימה' }),
        createVictim({ type: 'פיגוע' }),
        createVictim({ type: 'לחימה' }),
      ];
      const result = getVictimsByType(victims);
      expect(result.get('לחימה')).toBe(3);
      expect(result.get('רקטות וטילים')).toBe(1);
      expect(result.get('פיגוע')).toBe(1);
    });

    it('should handle empty array', () => {
      const result = getVictimsByType([]);
      expect(result.size).toBe(0);
    });

    it('should handle single type', () => {
      const victims: Victim[] = [
        createVictim({ type: 'לחימה' }),
        createVictim({ type: 'לחימה' }),
      ];
      const result = getVictimsByType(victims);
      expect(result.size).toBe(1);
      expect(result.get('לחימה')).toBe(2);
    });
  });

  describe('sorting by count', () => {
    it('should sort types by count descending', () => {
      const victims: Victim[] = [
        createVictim({ type: 'לחימה' }),
        createVictim({ type: 'רקטות וטילים' }),
        createVictim({ type: 'פיגוע' }),
        createVictim({ type: 'לחימה' }),
        createVictim({ type: 'לחימה' }),
        createVictim({ type: 'רקטות וטילים' }),
      ];
      const result = getVictimsByType(victims);
      const entries = Array.from(result.entries());
      expect(entries[0][0]).toBe('לחימה');
      expect(entries[0][1]).toBe(3);
      expect(entries[1][1]).toBeLessThanOrEqual(entries[0][1]);
    });
  });
});

describe('getAgeStatistics', () => {
  describe('basic statistics', () => {
    it('should calculate min, max, average, and median', () => {
      const victims: Victim[] = [
        createVictim({ age: 25 }),
        createVictim({ age: 30 }),
        createVictim({ age: 20 }),
        createVictim({ age: 35 }),
        createVictim({ age: 28 }),
      ];
      const stats = getAgeStatistics(victims);
      expect(stats.min).toBe(20);
      expect(stats.max).toBe(35);
      expect(stats.average).toBe(27.6);
      expect(stats.median).toBe(28);
    });

    it('should calculate median for even number of elements', () => {
      const victims: Victim[] = [
        createVictim({ age: 20 }),
        createVictim({ age: 25 }),
        createVictim({ age: 30 }),
        createVictim({ age: 35 }),
      ];
      const stats = getAgeStatistics(victims);
      expect(stats.median).toBe(27.5); // Average of 25 and 30
    });

    it('should calculate median for odd number of elements', () => {
      const victims: Victim[] = [
        createVictim({ age: 20 }),
        createVictim({ age: 25 }),
        createVictim({ age: 30 }),
      ];
      const stats = getAgeStatistics(victims);
      expect(stats.median).toBe(25);
    });

    it('should handle single victim', () => {
      const victims: Victim[] = [createVictim({ age: 25 })];
      const stats = getAgeStatistics(victims);
      expect(stats.min).toBe(25);
      expect(stats.max).toBe(25);
      expect(stats.average).toBe(25);
      expect(stats.median).toBe(25);
    });
  });

  describe('edge cases', () => {
    it('should throw error for empty array', () => {
      expect(() => getAgeStatistics([])).toThrow('Cannot calculate age statistics for empty array');
    });

    it('should handle identical ages', () => {
      const victims: Victim[] = [
        createVictim({ age: 25 }),
        createVictim({ age: 25 }),
        createVictim({ age: 25 }),
      ];
      const stats = getAgeStatistics(victims);
      expect(stats.min).toBe(25);
      expect(stats.max).toBe(25);
      expect(stats.average).toBe(25);
      expect(stats.median).toBe(25);
    });

    it('should handle wide age range', () => {
      const victims: Victim[] = [
        createVictim({ age: 15 }),
        createVictim({ age: 76 }),
      ];
      const stats = getAgeStatistics(victims);
      expect(stats.min).toBe(15);
      expect(stats.max).toBe(76);
      expect(stats.average).toBe(45.5);
      expect(stats.median).toBe(45.5);
    });
  });

  describe('calculation accuracy', () => {
    it('should calculate average correctly for various ages', () => {
      const victims: Victim[] = [
        createVictim({ age: 15 }),
        createVictim({ age: 16 }),
        createVictim({ age: 16 }),
        createVictim({ age: 19 }),
        createVictim({ age: 37 }),
      ];
      const stats = getAgeStatistics(victims);
      const expectedAverage = (15 + 16 + 16 + 19 + 37) / 5;
      expect(stats.average).toBe(expectedAverage);
    });

    it('should sort ages correctly before calculating median', () => {
      const victims: Victim[] = [
        createVictim({ age: 50 }),
        createVictim({ age: 15 }),
        createVictim({ age: 35 }),
        createVictim({ age: 25 }),
        createVictim({ age: 20 }),
      ];
      const stats = getAgeStatistics(victims);
      expect(stats.median).toBe(25); // Middle value when sorted: 15, 20, 25, 35, 50
    });
  });
});

describe('getDateRange', () => {
  describe('date range calculation', () => {
    it('should find earliest and latest dates', () => {
      const victims: Victim[] = [
        createVictim({ date: '2024-07-28' }),
        createVictim({ date: '2023-10-07' }),
        createVictim({ date: '2024-01-15' }),
      ];
      const range = getDateRange(victims);
      expect(range.earliest).toBe('2023-10-07');
      expect(range.latest).toBe('2024-07-28');
    });

    it('should handle single date', () => {
      const victims: Victim[] = [createVictim({ date: '2023-10-07' })];
      const range = getDateRange(victims);
      expect(range.earliest).toBe('2023-10-07');
      expect(range.latest).toBe('2023-10-07');
    });

    it('should handle identical dates', () => {
      const victims: Victim[] = [
        createVictim({ date: '2023-10-07' }),
        createVictim({ date: '2023-10-07' }),
        createVictim({ date: '2023-10-07' }),
      ];
      const range = getDateRange(victims);
      expect(range.earliest).toBe('2023-10-07');
      expect(range.latest).toBe('2023-10-07');
    });
  });

  describe('edge cases', () => {
    it('should throw error for empty array', () => {
      expect(() => getDateRange([])).toThrow('Cannot calculate date range for empty array');
    });

    it('should handle dates in chronological order', () => {
      const victims: Victim[] = [
        createVictim({ date: '2023-10-07' }),
        createVictim({ date: '2023-10-08' }),
        createVictim({ date: '2023-10-09' }),
      ];
      const range = getDateRange(victims);
      expect(range.earliest).toBe('2023-10-07');
      expect(range.latest).toBe('2023-10-09');
    });

    it('should handle dates in reverse chronological order', () => {
      const victims: Victim[] = [
        createVictim({ date: '2023-10-09' }),
        createVictim({ date: '2023-10-08' }),
        createVictim({ date: '2023-10-07' }),
      ];
      const range = getDateRange(victims);
      expect(range.earliest).toBe('2023-10-07');
      expect(range.latest).toBe('2023-10-09');
    });
  });

  describe('ISO date sorting', () => {
    it('should sort ISO dates correctly', () => {
      const victims: Victim[] = [
        createVictim({ date: '2024-12-31' }),
        createVictim({ date: '2023-01-01' }),
        createVictim({ date: '2024-01-01' }),
      ];
      const range = getDateRange(victims);
      expect(range.earliest).toBe('2023-01-01');
      expect(range.latest).toBe('2024-12-31');
    });
  });
});

describe('generateStatisticsReport', () => {
  const sampleVictims: Victim[] = [
    createVictim({
      firstName: 'חאזם אכרם',
      lastName: 'אבו סאלח',
      age: 15,
      location: "מג'דל שמס",
      date: '2024-07-28',
      source: 'לבנון',
      type: 'רקטות וטילים',
    }),
    createVictim({
      firstName: 'אמיר רביע',
      lastName: 'אבו סאלח',
      age: 16,
      location: "מג'דל שמס",
      date: '2024-07-28',
      source: 'לבנון',
      type: 'רקטות וטילים',
    }),
    createVictim({
      firstName: 'נועם',
      lastName: 'דואק',
      age: 19,
      location: 'קריית מוצקין',
      date: '2024-07-28',
      source: 'עזה',
      type: 'לחימה',
    }),
    createVictim({
      firstName: 'מוטי',
      lastName: 'רווה',
      age: 37,
      location: 'שני',
      date: '2024-07-28',
      source: 'עזה',
      type: 'לחימה',
    }),
    createVictim({
      firstName: 'אריאל',
      lastName: 'טופז',
      age: 24,
      location: 'פרדס חנה',
      date: '2024-07-25',
      source: 'פיגועים בארץ',
      type: 'פיגוע',
    }),
  ];

  describe('complete report generation', () => {
    it('should generate complete statistics report', () => {
      const report = generateStatisticsReport(sampleVictims);

      expect(report.totalVictims).toBe(5);
      expect(report.victimsByLocation).toBeInstanceOf(Map);
      expect(report.victimsByDate).toBeInstanceOf(Map);
      expect(report.victimsBySource).toBeInstanceOf(Map);
      expect(report.victimsByType).toBeInstanceOf(Map);
      expect(report.ageStatistics).toBeDefined();
      expect(report.dateRange).toBeDefined();
    });

    it('should have correct totalVictims', () => {
      const report = generateStatisticsReport(sampleVictims);
      expect(report.totalVictims).toBe(5);
    });

    it('should have correct victimsByLocation', () => {
      const report = generateStatisticsReport(sampleVictims);
      expect(report.victimsByLocation.get("מג'דל שמס")).toBe(2);
      expect(report.victimsByLocation.get('קריית מוצקין')).toBe(1);
    });

    it('should have correct victimsByDate', () => {
      const report = generateStatisticsReport(sampleVictims);
      expect(report.victimsByDate.get('2024-07-28')).toBe(4);
      expect(report.victimsByDate.get('2024-07-25')).toBe(1);
    });

    it('should have correct victimsBySource', () => {
      const report = generateStatisticsReport(sampleVictims);
      expect(report.victimsBySource.get('עזה')).toBe(2);
      expect(report.victimsBySource.get('לבנון')).toBe(2);
      expect(report.victimsBySource.get('פיגועים בארץ')).toBe(1);
    });

    it('should have correct victimsByType', () => {
      const report = generateStatisticsReport(sampleVictims);
      expect(report.victimsByType.get('רקטות וטילים')).toBe(2);
      expect(report.victimsByType.get('לחימה')).toBe(2);
      expect(report.victimsByType.get('פיגוע')).toBe(1);
    });

    it('should have correct ageStatistics', () => {
      const report = generateStatisticsReport(sampleVictims);
      expect(report.ageStatistics.min).toBe(15);
      expect(report.ageStatistics.max).toBe(37);
      expect(report.ageStatistics.average).toBe(22.2);
      expect(report.ageStatistics.median).toBe(19);
    });

    it('should have correct dateRange', () => {
      const report = generateStatisticsReport(sampleVictims);
      expect(report.dateRange.earliest).toBe('2024-07-25');
      expect(report.dateRange.latest).toBe('2024-07-28');
    });
  });

  describe('edge cases', () => {
    it('should throw error for empty array', () => {
      expect(() => generateStatisticsReport([])).toThrow(
        'Cannot generate statistics report for empty array'
      );
    });

    it('should handle single victim', () => {
      const singleVictim = [createVictim()];
      const report = generateStatisticsReport(singleVictim);

      expect(report.totalVictims).toBe(1);
      expect(report.victimsByLocation.size).toBe(1);
      expect(report.victimsByDate.size).toBe(1);
      expect(report.victimsBySource.size).toBe(1);
      expect(report.victimsByType.size).toBe(1);
      expect(report.ageStatistics.min).toBe(report.ageStatistics.max);
      expect(report.dateRange.earliest).toBe(report.dateRange.latest);
    });
  });

  describe('aggregation consistency', () => {
    it('should have consistent totals across all aggregations', () => {
      const report = generateStatisticsReport(sampleVictims);

      // Sum of location counts should equal total
      const locationTotal = Array.from(report.victimsByLocation.values()).reduce(
        (sum, count) => sum + count,
        0
      );
      expect(locationTotal).toBe(report.totalVictims);

      // Sum of date counts should equal total
      const dateTotal = Array.from(report.victimsByDate.values()).reduce(
        (sum, count) => sum + count,
        0
      );
      expect(dateTotal).toBe(report.totalVictims);

      // Sum of source counts should equal total
      const sourceTotal = Array.from(report.victimsBySource.values()).reduce(
        (sum, count) => sum + count,
        0
      );
      expect(sourceTotal).toBe(report.totalVictims);

      // Sum of type counts should equal total
      const typeTotal = Array.from(report.victimsByType.values()).reduce(
        (sum, count) => sum + count,
        0
      );
      expect(typeTotal).toBe(report.totalVictims);
    });
  });
});

// Helper function to create victim with default values
function createVictim(overrides: Partial<Victim> = {}): Victim {
  return {
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
    ...overrides,
  };
}
