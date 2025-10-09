/**
 * Data statistics utilities for aggregating victim data
 * Provides efficient aggregation algorithms for victim statistics
 */

import type {
  ProcessedVictimData,
  VictimStatistics,
  VictimLocation,
  Gender,
} from '@/types/victim';

/**
 * Group by result with count
 */
interface GroupByResult<T> {
  key: string;
  count: number;
  items: T[];
}

/**
 * Location grouping with coordinates
 */
interface LocationGroup {
  location: string;
  latitude: number;
  longitude: number;
  count: number;
  victimIds: string[];
}

/**
 * Calculate all statistics for victim data
 * @param victims Array of processed victim data
 * @returns Comprehensive victim statistics
 */
export function calculateVictimStatistics(
  victims: ProcessedVictimData[]
): VictimStatistics {
  if (victims.length === 0) {
    return {
      total: 0,
      civilians: 0,
      military: 0,
      bySource: {},
      byType: {},
      byDate: {},
      byLocation: {},
      byGender: {},
      ageStats: {
        min: 0,
        max: 0,
        average: 0,
        median: 0,
      },
    };
  }

  // Calculate basic counts
  const total = victims.length;
  const civilians = victims.filter((v) => v.isCivilian).length;
  const military = total - civilians;

  // Group by source
  const bySource = groupByField(victims, 'source');

  // Group by type
  const byType = groupByField(victims, 'type');

  // Group by date
  const byDate = groupByField(victims, 'date');

  // Group by location
  const byLocation = groupByField(victims, 'location');

  // Group by gender
  const byGender = groupByGender(victims);

  // Calculate age statistics
  const ageStats = calculateAgeStatistics(victims);

  return {
    total,
    civilians,
    military,
    bySource,
    byType,
    byDate,
    byLocation,
    byGender,
    ageStats,
  };
}

/**
 * Group victims by a specific field and return counts
 * @param victims Array of processed victim data
 * @param field Field name to group by
 * @returns Record of field values to counts
 */
function groupByField<K extends keyof ProcessedVictimData>(
  victims: ProcessedVictimData[],
  field: K
): Record<string, number> {
  const grouped: Record<string, number> = {};

  for (const victim of victims) {
    const key = String(victim[field]);
    grouped[key] = (grouped[key] || 0) + 1;
  }

  return grouped;
}

/**
 * Group victims by gender with proper typing
 * @param victims Array of processed victim data
 * @returns Record of gender to counts
 */
function groupByGender(
  victims: ProcessedVictimData[]
): Record<Gender, number> {
  const grouped = {
    'זכר': 0,
    'נקבה': 0,
  } as Record<Gender, number>;

  for (const victim of victims) {
    grouped[victim.gender] = (grouped[victim.gender] || 0) + 1;
  }

  return grouped;
}

/**
 * Calculate age statistics (min, max, average, median)
 * @param victims Array of processed victim data
 * @returns Age statistics object
 */
function calculateAgeStatistics(victims: ProcessedVictimData[]): {
  min: number;
  max: number;
  average: number;
  median: number;
} {
  if (victims.length === 0) {
    return { min: 0, max: 0, average: 0, median: 0 };
  }

  const ages = victims.map((v) => v.age).sort((a, b) => a - b);

  const min = ages[0];
  const max = ages[ages.length - 1];
  const sum = ages.reduce((acc, age) => acc + age, 0);
  const average = Math.round((sum / ages.length) * 10) / 10; // Round to 1 decimal

  // Calculate median
  const middleIndex = Math.floor(ages.length / 2);
  const median =
    ages.length % 2 === 0
      ? (ages[middleIndex - 1] + ages[middleIndex]) / 2
      : ages[middleIndex];

  return { min, max, average, median };
}

/**
 * Group victims by location with coordinates for map clustering
 * @param victims Array of processed victim data
 * @returns Array of VictimLocation objects with coordinates and counts
 */
export function groupByLocation(
  victims: ProcessedVictimData[]
): VictimLocation[] {
  // Group by location key (location name + coordinates)
  const locationMap = new Map<string, LocationGroup>();

  for (const victim of victims) {
    const key = `${victim.location}-${victim.latitude}-${victim.longitude}`;

    if (!locationMap.has(key)) {
      locationMap.set(key, {
        location: victim.location,
        latitude: victim.latitude,
        longitude: victim.longitude,
        count: 0,
        victimIds: [],
      });
    }

    const group = locationMap.get(key)!;
    group.count += 1;
    group.victimIds.push(victim.id);
  }

  // Convert to array and sort by count (descending)
  return Array.from(locationMap.values())
    .map((group) => ({
      location: group.location,
      latitude: group.latitude,
      longitude: group.longitude,
      count: group.count,
      victimIds: group.victimIds,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Group victims by date with detailed information
 * @param victims Array of processed victim data
 * @returns Array of date groups sorted chronologically
 */
export function groupByDate(
  victims: ProcessedVictimData[]
): Array<GroupByResult<ProcessedVictimData>> {
  const dateMap = new Map<string, ProcessedVictimData[]>();

  for (const victim of victims) {
    if (!dateMap.has(victim.date)) {
      dateMap.set(victim.date, []);
    }
    dateMap.get(victim.date)!.push(victim);
  }

  // Convert to array and sort chronologically
  return Array.from(dateMap.entries())
    .map(([date, items]) => ({
      key: date,
      count: items.length,
      items,
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * Group victims by source with detailed information
 * @param victims Array of processed victim data
 * @returns Array of source groups sorted by count
 */
export function groupBySource(
  victims: ProcessedVictimData[]
): Array<GroupByResult<ProcessedVictimData>> {
  const sourceMap = new Map<string, ProcessedVictimData[]>();

  for (const victim of victims) {
    if (!sourceMap.has(victim.source)) {
      sourceMap.set(victim.source, []);
    }
    sourceMap.get(victim.source)!.push(victim);
  }

  // Convert to array and sort by count (descending)
  return Array.from(sourceMap.entries())
    .map(([source, items]) => ({
      key: source,
      count: items.length,
      items,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Group victims by incident type with detailed information
 * @param victims Array of processed victim data
 * @returns Array of type groups sorted by count
 */
export function groupByType(
  victims: ProcessedVictimData[]
): Array<GroupByResult<ProcessedVictimData>> {
  const typeMap = new Map<string, ProcessedVictimData[]>();

  for (const victim of victims) {
    if (!typeMap.has(victim.type)) {
      typeMap.set(victim.type, []);
    }
    typeMap.get(victim.type)!.push(victim);
  }

  // Convert to array and sort by count (descending)
  return Array.from(typeMap.entries())
    .map(([type, items]) => ({
      key: type,
      count: items.length,
      items,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get victims within a specific date range
 * @param victims Array of processed victim data
 * @param startDate Start date (ISO format YYYY-MM-DD)
 * @param endDate End date (ISO format YYYY-MM-DD)
 * @returns Filtered array of victims
 */
export function getVictimsByDateRange(
  victims: ProcessedVictimData[],
  startDate: string,
  endDate: string
): ProcessedVictimData[] {
  return victims.filter(
    (victim) => victim.date >= startDate && victim.date <= endDate
  );
}

/**
 * Calculate daily victim counts for time series visualization
 * @param victims Array of processed victim data
 * @returns Array of objects with date and count
 */
export function calculateDailyVictimCounts(
  victims: ProcessedVictimData[]
): Array<{ date: string; count: number }> {
  const dateGroups = groupByDate(victims);
  return dateGroups.map((group) => ({
    date: group.key,
    count: group.count,
  }));
}

/**
 * Calculate cumulative victim counts over time
 * @param victims Array of processed victim data
 * @returns Array of objects with date and cumulative count
 */
export function calculateCumulativeVictimCounts(
  victims: ProcessedVictimData[]
): Array<{ date: string; cumulativeCount: number }> {
  const dailyCounts = calculateDailyVictimCounts(victims);

  let cumulative = 0;
  return dailyCounts.map((day) => {
    cumulative += day.count;
    return {
      date: day.date,
      cumulativeCount: cumulative,
    };
  });
}

/**
 * Get top N locations by victim count
 * @param victims Array of processed victim data
 * @param topN Number of top locations to return (default: 10)
 * @returns Array of VictimLocation objects sorted by count
 */
export function getTopLocationsByCount(
  victims: ProcessedVictimData[],
  topN: number = 10
): VictimLocation[] {
  const locations = groupByLocation(victims);
  return locations.slice(0, topN);
}

/**
 * Calculate percentage breakdown for categorical data
 * @param counts Record of category to count
 * @param total Total number of items
 * @returns Record of category to percentage
 */
export function calculatePercentages(
  counts: Record<string, number>,
  total: number
): Record<string, number> {
  const percentages: Record<string, number> = {};

  for (const [key, count] of Object.entries(counts)) {
    percentages[key] = total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
  }

  return percentages;
}
