/**
 * Next.js API Route for serving processed victim data
 * GET /api/victims - Returns all processed victims with optional filtering and statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import {
  processVictimDataArray,
  sortVictimsByDate,
  type ProcessingResult,
  type BulkProcessingResult
} from '@/lib/dataProcessing';
import {
  calculateVictimStatistics,
  groupByLocation
} from '@/lib/statistics';
import type { VictimData, ProcessedVictimData, VictimLocation, VictimStatistics } from '@/types/victim';

/**
 * API Response structure
 */
interface VictimsAPIResponse {
  success: boolean;
  data?: {
    victims: ProcessedVictimData[];
    statistics?: VictimStatistics;
    locations?: VictimLocation[];
    metadata: {
      total: number;
      processed: number;
      failed: number;
      timestamp: number;
      filters: {
        location?: string;
        includeStats: boolean;
      };
    };
  };
  error?: {
    message: string;
    code: string;
    details?: unknown;
  };
}

/**
 * Error codes for API responses
 */
const ERROR_CODES = {
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_READ_ERROR: 'FILE_READ_ERROR',
  INVALID_JSON: 'INVALID_JSON',
  PROCESSING_ERROR: 'PROCESSING_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_PARAMETER: 'INVALID_PARAMETER',
} as const;

/**
 * CORS headers for API responses
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
} as const;

/**
 * Create error response with consistent structure
 */
function createErrorResponse(
  message: string,
  code: keyof typeof ERROR_CODES,
  status: number,
  details?: unknown
): NextResponse<VictimsAPIResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
        details,
      },
    },
    {
      status,
      headers: CORS_HEADERS,
    }
  );
}

/**
 * Create success response with consistent structure
 */
function createSuccessResponse(
  data: VictimsAPIResponse['data']
): NextResponse<VictimsAPIResponse> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    {
      status: 200,
      headers: CORS_HEADERS,
    }
  );
}

/**
 * Filter victims by location (case-insensitive, partial match)
 */
function filterByLocation(
  victims: ProcessedVictimData[],
  locationQuery: string
): ProcessedVictimData[] {
  const normalizedQuery = locationQuery.trim().toLowerCase();

  if (!normalizedQuery) {
    return victims;
  }

  return victims.filter(victim =>
    victim.location.toLowerCase().includes(normalizedQuery)
  );
}

/**
 * GET handler for /api/victims
 * Supports query parameters:
 * - stats=true - Include statistics in response
 * - location=<name> - Filter by location (partial match)
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const includeStats = searchParams.get('stats') === 'true';
    const locationFilter = searchParams.get('location');

    // Validate location parameter if provided
    if (locationFilter !== null && typeof locationFilter !== 'string') {
      return createErrorResponse(
        'Invalid location parameter. Must be a string.',
        'INVALID_PARAMETER',
        400
      );
    }

    // Construct path to data file
    const dataFilePath = path.join(process.cwd(), 'data', 'sample-victims.json');

    // Read the JSON file
    let fileContent: string;
    try {
      fileContent = await fs.readFile(dataFilePath, 'utf-8');
    } catch (error) {
      // Check if file doesn't exist
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        return createErrorResponse(
          `Data file not found at: ${dataFilePath}`,
          'FILE_NOT_FOUND',
          404,
          { path: dataFilePath }
        );
      }

      // Other file read errors
      return createErrorResponse(
        'Failed to read victim data file',
        'FILE_READ_ERROR',
        500,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    // Parse JSON data
    let rawVictimData: unknown;
    try {
      rawVictimData = JSON.parse(fileContent);
    } catch (error) {
      return createErrorResponse(
        'Invalid JSON in victim data file',
        'INVALID_JSON',
        500,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    // Validate that parsed data is an array
    if (!Array.isArray(rawVictimData)) {
      return createErrorResponse(
        'Victim data must be an array',
        'VALIDATION_ERROR',
        500,
        { receivedType: typeof rawVictimData }
      );
    }

    // Process victim data with validation
    const processingResult: BulkProcessingResult = processVictimDataArray(
      rawVictimData as Array<Partial<VictimData>>
    );

    // Check if processing succeeded
    if (!processingResult.success && processingResult.failedRecords.length === rawVictimData.length) {
      // All records failed
      return createErrorResponse(
        `Failed to process any victim records. Total errors: ${processingResult.failedRecords.length}`,
        'PROCESSING_ERROR',
        500,
        {
          totalRecords: rawVictimData.length,
          failedCount: processingResult.failedRecords.length,
          errors: processingResult.failedRecords.slice(0, 5).map(record => ({
            index: record.recordIndex,
            identifier: record.recordIdentifier,
            error: record.error.message,
          })),
        }
      );
    }

    // Sort victims by date (oldest to newest)
    let processedVictims = sortVictimsByDate(processingResult.processedData);

    // Apply location filter if provided
    if (locationFilter) {
      processedVictims = filterByLocation(processedVictims, locationFilter);
    }

    // Prepare response data
    const responseData: VictimsAPIResponse['data'] = {
      victims: processedVictims,
      metadata: {
        total: rawVictimData.length,
        processed: processedVictims.length,
        failed: processingResult.failedRecords.length,
        timestamp: Date.now(),
        filters: {
          location: locationFilter || undefined,
          includeStats,
        },
      },
    };

    // Include statistics if requested
    if (includeStats) {
      responseData.statistics = calculateVictimStatistics(processedVictims);
      responseData.locations = groupByLocation(processedVictims);
    }

    // Log warning if some records failed but not all
    if (processingResult.failedRecords.length > 0 && processingResult.failedRecords.length < rawVictimData.length) {
      console.warn(
        `Warning: ${processingResult.failedRecords.length} of ${rawVictimData.length} records failed processing`,
        {
          failedRecords: processingResult.failedRecords.slice(0, 3),
        }
      );
    }

    return createSuccessResponse(responseData);

  } catch (error) {
    // Catch any unexpected errors
    console.error('Unexpected error in /api/victims:', error);

    return createErrorResponse(
      'An unexpected error occurred while processing the request',
      'PROCESSING_ERROR',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}