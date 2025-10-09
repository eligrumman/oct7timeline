"use client";

import React, { useEffect, useMemo } from "react";
import KeplerGl from "@kepler.gl/components";
import { addDataToMap } from "@kepler.gl/actions";
import keplerGlReducer from "@kepler.gl/reducers";
import type { ParsedConfig } from "@kepler.gl/types";
import { createStore, combineReducers, applyMiddleware } from "redux";
import { taskMiddleware } from "react-palm/tasks";
import { Provider, useDispatch } from "react-redux";
import styled from "styled-components";
import keplerConfig from "@/data/kepler-config.json";
import { useVictimData } from "@/hooks/useVictimData";

// Styled container for the map
const MapContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;

  .kepler-gl {
    position: absolute;
    width: 100%;
    height: 100%;
  }
`;

// Warning banner for missing Mapbox token
const WarningBanner = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: #ff6b6b;
  color: white;
  padding: 1rem;
  text-align: center;
  z-index: 9999;
  font-weight: 500;
`;

// Loading overlay
const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 10000;
  color: white;
  font-size: 1.25rem;
`;

// Error banner
const ErrorBanner = styled.div`
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  background-color: #dc3545;
  color: white;
  padding: 1rem;
  text-align: center;
  z-index: 9999;
  font-weight: 500;
`;

// Create Redux store factory (per-component instance)
const createKeplerStore = () => {
  // Initialize Kepler reducer with side panel hidden for full screen map
  const customKeplerReducer = keplerGlReducer.initialState({
    uiState: {
      activeSidePanel: null, // Hide side panel for full screen view
      currentModal: null,    // Hide any modals
      mapControls: {
        visibleLayers: { show: false },
        mapLegend: { show: false, active: false },
        toggle3d: { show: true },
        splitMap: { show: false },
        mapDraw: { show: false },
        mapLocale: { show: false },
      },
    }
  });

  const reducers = combineReducers({
    keplerGl: customKeplerReducer,
  });
  return createStore(reducers, {}, applyMiddleware(taskMiddleware));
};

interface KeplerMapInnerProps {
  mapboxToken: string | undefined;
}

/**
 * Inner component that uses the Redux store
 * Loads the Kepler.gl configuration and initializes the map with victim data
 */
function KeplerMapInner({ mapboxToken }: KeplerMapInnerProps) {
  const dispatch = useDispatch();
  const { data, loading, error } = useVictimData({
    includeStats: false,
    autoFetch: true
  });

  useEffect(() => {
    // Load the configuration and data when component mounts
    // This applies the pre-configured settings from kepler-config.json
    // including map state (Israel coordinates), theme, layers, and filters
    // and adds the victim data to the map
    try {
      if (!keplerConfig?.config) {
        console.error('Invalid Kepler.gl configuration');
        return;
      }

      // If we have data, add it to the map
      if (data && data.length > 0) {
        // Transform victim data to Kepler.gl dataset format
        const dataset = {
          info: {
            id: 'victims',
            label: 'October 7th Victims',
          },
          data: {
            fields: [
              { name: 'id', type: 'string' },
              { name: 'fullName', type: 'string' },
              { name: 'firstName', type: 'string' },
              { name: 'lastName', type: 'string' },
              { name: 'age', type: 'integer' },
              { name: 'gender', type: 'string' },
              { name: 'location', type: 'string' },
              { name: 'latitude', type: 'real' },
              { name: 'longitude', type: 'real' },
              { name: 'date', type: 'date' },
              { name: 'timestamp', type: 'timestamp' },
              { name: 'source', type: 'string' },
              { name: 'type', type: 'string' },
              { name: 'rank', type: 'string' },
              { name: 'isCivilian', type: 'boolean' },
              { name: 'url', type: 'string' },
            ],
            rows: data.map(victim => [
              victim.id,
              victim.fullName,
              victim.firstName,
              victim.lastName,
              victim.age,
              victim.gender,
              victim.location,
              victim.latitude,
              victim.longitude,
              victim.date,
              victim.timestamp,
              victim.source,
              victim.type,
              victim.rank,
              victim.isCivilian,
              victim.url,
            ]),
          },
        };

        // Configure the point layer and timeline filter
        const config = {
          ...(keplerConfig.config as unknown as ParsedConfig),
          visState: {
            ...(keplerConfig.config as any).visState,
            filters: [
              {
                dataId: ['victims'],
                id: 'timeline',
                name: ['timestamp'],
                type: 'timeRange',
                value: [1696636800000, 1728259200000],
                plotType: {
                  interval: '1-month',
                  defaultTimeFormat: 'YYYY-MM-DD',
                  type: 'histogram',
                  aggregation: 'sum'
                },
                animationWindow: 'free',
                yAxis: null,
                view: 'enlarged',
                speed: 1,
                enabled: true
              }
            ],
            layers: [
              {
                id: 'victims-layer',
                type: 'point',
                config: {
                  dataId: 'victims',
                  label: 'Victims',
                  color: [230, 0, 0], // Red color #E60000
                  columns: {
                    lat: 'latitude',
                    lng: 'longitude',
                  },
                  isVisible: true,
                  visConfig: {
                    radius: 22,
                    fixedRadius: false,
                    opacity: 0.8,
                    outline: true,
                    thickness: 2,
                    strokeColor: [255, 255, 255],
                    colorRange: {
                      name: 'Red Memorial Scale',
                      type: 'sequential',
                      category: 'Custom',
                      colors: ['#FF0000', '#E60000', '#CC0000', '#B30000', '#990000'],
                    },
                    strokeColorRange: {
                      name: 'Global Warming',
                      type: 'sequential',
                      category: 'Uber',
                      colors: ['#E60000', '#FF0000', '#FF4444'],
                    },
                    radiusRange: [10, 30],
                    filled: true,
                  },
                  hidden: false,
                  textLabel: [
                    {
                      field: null,
                      color: [255, 255, 255],
                      size: 18,
                      offset: [0, 0],
                      anchor: 'start',
                      alignment: 'center',
                    },
                  ],
                },
                visualChannels: {
                  colorField: {
                    name: 'type',
                    type: 'string',
                  },
                  colorScale: 'ordinal',
                  strokeColorField: null,
                  strokeColorScale: 'quantile',
                  sizeField: null,
                  sizeScale: 'linear',
                },
              },
            ],
          },
        };

        dispatch(
          addDataToMap({
            datasets: [dataset],
            config: config,
            options: {
              centerMap: true,
              readOnly: false,
            },
          })
        );
      } else if (!loading && !error) {
        // No data yet, just load the config
        dispatch(
          addDataToMap({
            datasets: [],
            config: keplerConfig.config as unknown as ParsedConfig,
            options: {
              centerMap: true,
            },
          })
        );
      }
    } catch (error) {
      console.error('Failed to initialize Kepler.gl:', error);
    }
  }, [dispatch, data, loading, error]);

  return (
    <MapContainer>
      {loading && (
        <LoadingOverlay>
          <div>Loading victim data...</div>
        </LoadingOverlay>
      )}
      {error && (
        <ErrorBanner>
          Error loading victim data: {error.message}
        </ErrorBanner>
      )}
      <KeplerGl
        id="map"
        mapboxApiAccessToken={mapboxToken || ""}
        width={undefined}
        height={undefined}
      />
    </MapContainer>
  );
}

/**
 * KeplerMap Component
 *
 * A full-screen map component using Kepler.gl for geospatial data visualization.
 *
 * Features:
 * - Pre-configured for Israel map (lat: 31.5, lng: 34.9, zoom: 7)
 * - Dark theme styling from kepler-config.json
 * - Timeline filter and victim layer configuration
 * - Interactive tooltips and controls
 *
 * Environment Variables Required:
 * - NEXT_PUBLIC_MAPBOX_TOKEN: Mapbox API access token
 *
 * Usage:
 * ```tsx
 * import KeplerMap from '@/components/KeplerMap';
 *
 * export default function Page() {
 *   return <KeplerMap />;
 * }
 * ```
 */
export default function KeplerMap() {
  // Create store per component instance to prevent state leakage in Next.js App Router
  const store = useMemo(() => createKeplerStore(), []);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Show warning if Mapbox token is missing
  const showWarning = !mapboxToken;

  return (
    <Provider store={store}>
      {showWarning && (
        <WarningBanner>
          Warning: NEXT_PUBLIC_MAPBOX_TOKEN is not set. The map may not display properly. Please add
          your Mapbox token to the .env.local file.
        </WarningBanner>
      )}
      <KeplerMapInner mapboxToken={mapboxToken} />
    </Provider>
  );
}
