/**
 * Custom React hook for fetching victim data from the API
 * Handles loading states, error states, and data fetching with refetch capability
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ProcessedVictimData, VictimLocation, VictimStatistics } from '@/types/victim';

/**
 * API Response structure matching the /api/victims endpoint
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
 * Hook configuration options
 */
interface UseVictimDataOptions {
  /** Include statistics in the response */
  includeStats?: boolean;
  /** Filter by location (partial match) */
  location?: string;
  /** Automatically fetch on mount */
  autoFetch?: boolean;
}

/**
 * Hook return value
 */
interface UseVictimDataReturn {
  /** Array of processed victim data */
  data: ProcessedVictimData[] | null;
  /** Victim statistics (if includeStats was true) */
  statistics: VictimStatistics | null;
  /** Victim locations grouped (if includeStats was true) */
  locations: VictimLocation[] | null;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Function to manually refetch data */
  refetch: () => Promise<void>;
  /** Metadata about the response */
  metadata: NonNullable<VictimsAPIResponse['data']>['metadata'] | null;
}

/**
 * Custom hook to fetch victim data from the API
 *
 * @param options - Configuration options for the hook
 * @returns Object containing data, loading state, error state, and refetch function
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { data, loading, error, refetch } = useVictimData({
 *     includeStats: true,
 *     autoFetch: true
 *   });
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!data) return null;
 *
 *   return (
 *     <div>
 *       <h1>Victims: {data.length}</h1>
 *       <button onClick={refetch}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useVictimData(options: UseVictimDataOptions = {}): UseVictimDataReturn {
  const { includeStats = false, location, autoFetch = true } = options;

  const [data, setData] = useState<ProcessedVictimData[] | null>(null);
  const [statistics, setStatistics] = useState<VictimStatistics | null>(null);
  const [locations, setLocations] = useState<VictimLocation[] | null>(null);
  const [metadata, setMetadata] = useState<NonNullable<VictimsAPIResponse['data']>['metadata'] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch data from the API
   */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (includeStats) {
        params.append('stats', 'true');
      }
      if (location) {
        params.append('location', location);
      }

      // Construct URL
      const url = `/api/victims${params.toString() ? `?${params.toString()}` : ''}`;

      // Fetch data
      const response = await fetch(url);

      // Check if response is ok
      if (!response.ok) {
        const errorData: VictimsAPIResponse = await response.json();
        throw new Error(
          errorData.error?.message || `HTTP error! status: ${response.status}`
        );
      }

      // Parse response
      const result: VictimsAPIResponse = await response.json();

      // Check if API returned success
      if (!result.success || !result.data) {
        throw new Error(
          result.error?.message || 'API returned unsuccessful response'
        );
      }

      // Update state with successful data
      setData(result.data.victims);
      setStatistics(result.data.statistics || null);
      setLocations(result.data.locations || null);
      setMetadata(result.data.metadata);
      setError(null);

    } catch (err) {
      // Handle errors
      const errorMessage = err instanceof Error
        ? err.message
        : 'An unknown error occurred while fetching victim data';

      const errorObject = new Error(errorMessage);
      setError(errorObject);
      setData(null);
      setStatistics(null);
      setLocations(null);
      setMetadata(null);

      // Log error for debugging
      console.error('useVictimData error:', err);
    } finally {
      setLoading(false);
    }
  }, [includeStats, location]);

  /**
   * Refetch function that can be called manually
   */
  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  /**
   * Auto-fetch on mount and when dependencies change
   */
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch]);

  return {
    data,
    statistics,
    locations,
    loading,
    error,
    refetch,
    metadata,
  };
}
