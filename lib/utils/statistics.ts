/**
 * Statistics module for victim data analysis
 *
 * This module provides functions to calculate and aggregate statistics
 * about victim data including counts by location, date, source, type,
 * age statistics, and comprehensive reporting.
 */

import { Victim } from '../types/victim';

/**
 * Age statistics including min, max, average, and median
 */
export interface AgeStatistics {
  /** Minimum age in the dataset */
  min: number;
  /** Maximum age in the dataset */
  max: number;
  /** Average (mean) age */
  average: number;
  /** Median age */
  median: number;
}

/**
 * Date range with earliest and latest dates
 */
export interface DateRange {
  /** Earliest date in ISO 8601 format (YYYY-MM-DD) */
  earliest: string;
  /** Latest date in ISO 8601 format (YYYY-MM-DD) */
  latest: string;
}

/**
 * Comprehensive statistics report containing all aggregated data
 */
export interface StatisticsReport {
  /** Total number of victims */
  totalVictims: number;
  /** Count of victims by location (sorted by count descending) */
  victimsByLocation: Map<string, number>;
  /** Count of victims by date (sorted by date ascending) */
  victimsByDate: Map<string, number>;
  /** Count of victims by source (sorted by count descending) */
  victimsBySource: Map<string, number>;
  /** Count of victims by incident type (sorted by count descending) */
  victimsByType: Map<string, number>;
  /** Age statistics (min, max, average, median) */
  ageStatistics: AgeStatistics;
  /** Date range (earliest and latest) */
  dateRange: DateRange;
}

/**
 * Get total count of victims
 *
 * @param victims - Array of victim records
 * @returns Total number of victims
 *
 * @example
 * ```ts
 * const total = getTotalVictims(victims);
 * console.log(`Total victims: ${total}`);
 * ```
 */
export function getTotalVictims(victims: Victim[]): number {
  return victims.length;
}

/**
 * Get count of victims grouped by location
 *
 * @param victims - Array of victim records
 * @returns Map of location names to victim counts, sorted by count descending
 *
 * @example
 * ```ts
 * const byLocation = getVictimsByLocation(victims);
 * for (const [location, count] of byLocation) {
 *   console.log(`${location}: ${count}`);
 * }
 * ```
 */
export function getVictimsByLocation(victims: Victim[]): Map<string, number> {
  if (victims.length === 0) {
    return new Map();
  }

  const counts = new Map<string, number>();

  for (const victim of victims) {
    const location = victim.location;
    counts.set(location, (counts.get(location) || 0) + 1);
  }

  // Sort by count descending
  return new Map(
    Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  );
}

/**
 * Get count of victims grouped by date
 *
 * @param victims - Array of victim records
 * @returns Map of dates (ISO 8601 format) to victim counts, sorted by date ascending
 *
 * @example
 * ```ts
 * const byDate = getVictimsByDate(victims);
 * for (const [date, count] of byDate) {
 *   console.log(`${date}: ${count}`);
 * }
 * ```
 */
export function getVictimsByDate(victims: Victim[]): Map<string, number> {
  if (victims.length === 0) {
    return new Map();
  }

  const counts = new Map<string, number>();

  for (const victim of victims) {
    const date = victim.date;
    counts.set(date, (counts.get(date) || 0) + 1);
  }

  // Sort by date ascending
  return new Map(
    Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  );
}

/**
 * Get count of victims grouped by source of attack
 *
 * @param victims - Array of victim records
 * @returns Map of source names (Hebrew) to victim counts, sorted by count descending
 *
 * @example
 * ```ts
 * const bySource = getVictimsBySource(victims);
 * for (const [source, count] of bySource) {
 *   console.log(`${source}: ${count}`);
 * }
 * ```
 */
export function getVictimsBySource(victims: Victim[]): Map<string, number> {
  if (victims.length === 0) {
    return new Map();
  }

  const counts = new Map<string, number>();

  for (const victim of victims) {
    const source = victim.source;
    counts.set(source, (counts.get(source) || 0) + 1);
  }

  // Sort by count descending
  return new Map(
    Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  );
}

/**
 * Get count of victims grouped by incident type
 *
 * @param victims - Array of victim records
 * @returns Map of type names (Hebrew) to victim counts, sorted by count descending
 *
 * @example
 * ```ts
 * const byType = getVictimsByType(victims);
 * for (const [type, count] of byType) {
 *   console.log(`${type}: ${count}`);
 * }
 * ```
 */
export function getVictimsByType(victims: Victim[]): Map<string, number> {
  if (victims.length === 0) {
    return new Map();
  }

  const counts = new Map<string, number>();

  for (const victim of victims) {
    const type = victim.type;
    counts.set(type, (counts.get(type) || 0) + 1);
  }

  // Sort by count descending
  return new Map(
    Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  );
}

/**
 * Calculate age statistics including min, max, average, and median
 *
 * @param victims - Array of victim records
 * @returns Age statistics object with min, max, average, and median
 * @throws Error if victims array is empty
 *
 * @example
 * ```ts
 * const ageStats = getAgeStatistics(victims);
 * console.log(`Age range: ${ageStats.min}-${ageStats.max}`);
 * console.log(`Average age: ${ageStats.average.toFixed(1)}`);
 * console.log(`Median age: ${ageStats.median}`);
 * ```
 */
export function getAgeStatistics(victims: Victim[]): AgeStatistics {
  if (victims.length === 0) {
    throw new Error('Cannot calculate age statistics for empty array');
  }

  const ages = victims.map((v) => v.age).sort((a, b) => a - b);

  const min = ages[0];
  const max = ages[ages.length - 1];
  const sum = ages.reduce((acc, age) => acc + age, 0);
  const average = sum / ages.length;

  // Calculate median
  let median: number;
  const midIndex = Math.floor(ages.length / 2);
  if (ages.length % 2 === 0) {
    // Even number of elements: average of two middle values
    median = (ages[midIndex - 1] + ages[midIndex]) / 2;
  } else {
    // Odd number of elements: middle value
    median = ages[midIndex];
  }

  return {
    min,
    max,
    average,
    median,
  };
}

/**
 * Get date range with earliest and latest dates
 *
 * @param victims - Array of victim records
 * @returns DateRange object with earliest and latest dates
 * @throws Error if victims array is empty
 *
 * @example
 * ```ts
 * const range = getDateRange(victims);
 * console.log(`Date range: ${range.earliest} to ${range.latest}`);
 * ```
 */
export function getDateRange(victims: Victim[]): DateRange {
  if (victims.length === 0) {
    throw new Error('Cannot calculate date range for empty array');
  }

  const dates = victims.map((v) => v.date).sort();

  return {
    earliest: dates[0],
    latest: dates[dates.length - 1],
  };
}

/**
 * Generate comprehensive statistics report for victim data
 *
 * This function aggregates all statistics into a single report object,
 * providing a complete overview of the dataset.
 *
 * @param victims - Array of victim records
 * @returns Complete statistics report
 * @throws Error if victims array is empty
 *
 * @example
 * ```ts
 * const report = generateStatisticsReport(victims);
 * console.log(`Total victims: ${report.totalVictims}`);
 * console.log(`Date range: ${report.dateRange.earliest} to ${report.dateRange.latest}`);
 * console.log(`Average age: ${report.ageStatistics.average.toFixed(1)}`);
 * ```
 */
export function generateStatisticsReport(
  victims: Victim[]
): StatisticsReport {
  if (victims.length === 0) {
    throw new Error('Cannot generate statistics report for empty array');
  }

  return {
    totalVictims: getTotalVictims(victims),
    victimsByLocation: getVictimsByLocation(victims),
    victimsByDate: getVictimsByDate(victims),
    victimsBySource: getVictimsBySource(victims),
    victimsByType: getVictimsByType(victims),
    ageStatistics: getAgeStatistics(victims),
    dateRange: getDateRange(victims),
  };
}
