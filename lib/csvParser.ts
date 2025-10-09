/**
 * CSV parsing utilities for victim data
 * Handles Hebrew UTF-8 encoded CSV files with victim information
 */

import Papa from 'papaparse';
import type { VictimData } from '@/types/victim';

/**
 * Hebrew CSV column mapping to VictimData fields
 */
const CSV_COLUMN_MAP = {
  'שם משפחה': 'lastName',
  'שם פרטי': 'firstName',
  'דרגה': 'rank',
  'גיל': 'age',
  'מקום מגורים': 'location',
  'תאריך נוסף': 'date',
  'קָטֵגוֹרִיָה': 'category',
  'סיבת המוות': 'causeOfDeath',
  'מִין': 'gender',
  'קישור למאמר': 'url',
} as const;

/**
 * Gender mapping from Hebrew to English
 */
const GENDER_MAP: Record<string, 'male' | 'female' | 'unknown'> = {
  'זכר': 'male',
  'נקבה': 'female',
  '-': 'unknown',
  '': 'unknown',
};

/**
 * Type mapping from Hebrew category to English type
 */
const TYPE_MAP: Record<string, string> = {
  'פיגועים בחו"ל': 'terror_attack_abroad',
  'יהודה ושומרון': 'west_bank',
  'עזה': 'gaza',
  'חטופים': 'hostage',
  'לבנון': 'lebanon',
  'צה"ל': 'idf',
  '-': 'unknown',
};

/**
 * Parse date from DD/MM/YYYY format to ISO YYYY-MM-DD
 */
function parseDateToISO(dateStr: string): string {
  if (!dateStr || dateStr === '-') {
    return '2023-10-07'; // Default to Oct 7, 2023
  }

  // Parse DD/MM/YYYY format
  const parts = dateStr.split('/');
  if (parts.length !== 3) {
    return '2023-10-07';
  }

  const day = parts[0].padStart(2, '0');
  const month = parts[1].padStart(2, '0');
  const year = parts[2];

  return `${year}-${month}-${day}`;
}

/**
 * Parse age from string to number
 */
function parseAge(ageStr: string): number | undefined {
  if (!ageStr || ageStr === '-') {
    return undefined;
  }
  const age = parseInt(ageStr, 10);
  return isNaN(age) ? undefined : age;
}

/**
 * Transform CSV row to VictimData
 */
function transformCSVRowToVictimData(row: Record<string, string>): Partial<VictimData> {
  const lastName = row['שם משפחה']?.trim() || '';
  const firstName = row['שם פרטי']?.trim() || '';
  const rank = row['דרגה']?.trim() || '';
  const location = row['מקום מגורים']?.trim() || '';
  const category = row['קָטֵגוֹרִיָה']?.trim() || '';
  const genderHebrew = row['מִין']?.trim() || '';
  const url = row['קישור למאמר']?.trim() || '';

  return {
    firstName,
    lastName,
    age: parseAge(row['גיל']),
    location,
    date: parseDateToISO(row['תאריך נוסף']),
    latitude: 0, // Will be enriched later with geocoding
    longitude: 0, // Will be enriched later with geocoding
    source: url || 'unknown',
    type: TYPE_MAP[category] || category || 'unknown',
    gender: GENDER_MAP[genderHebrew] || 'unknown',
    rank: rank === '-' ? undefined : rank,
    url,
  };
}

/**
 * Parse CSV content to VictimData array
 */
export function parseVictimCSV(csvContent: string): Array<Partial<VictimData>> {
  const parseResult = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    encoding: 'UTF-8',
  });

  if (parseResult.errors.length > 0) {
    console.warn('CSV parsing warnings:', parseResult.errors);
  }

  return parseResult.data.map(transformCSVRowToVictimData);
}

/**
 * Read and parse CSV file
 */
export async function readVictimCSV(filePath: string): Promise<Array<Partial<VictimData>>> {
  const { promises: fs } = await import('fs');
  const csvContent = await fs.readFile(filePath, 'utf-8');
  return parseVictimCSV(csvContent);
}
