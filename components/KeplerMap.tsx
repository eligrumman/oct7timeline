"use client";

import React, { useEffect } from "react";
import KeplerGl from "@kepler.gl/components";
import { addDataToMap } from "@kepler.gl/actions";
import keplerGlReducer from "@kepler.gl/reducers";
import { createStore, combineReducers, applyMiddleware } from "redux";
import { taskMiddleware } from "react-palm/tasks";
import { Provider, useDispatch } from "react-redux";
import styled from "styled-components";
import keplerConfig from "@/data/kepler-config.json";

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

// Create Redux store
const reducers = combineReducers({
  keplerGl: keplerGlReducer,
});

const store = createStore(reducers, {}, applyMiddleware(taskMiddleware));

interface KeplerMapInnerProps {
  mapboxToken: string | undefined;
}

/**
 * Inner component that uses the Redux store
 * Loads the Kepler.gl configuration and initializes the map
 */
function KeplerMapInner({ mapboxToken }: KeplerMapInnerProps) {
  const dispatch = useDispatch();

  useEffect(() => {
    // Load the configuration when component mounts
    // This applies the pre-configured settings from kepler-config.json
    // including map state (Israel coordinates), theme, layers, and filters
    dispatch(
      addDataToMap({
        datasets: [],
        config: keplerConfig.config as any,
        options: {
          centerMap: true,
        },
      })
    );
  }, [dispatch]);

  return (
    <MapContainer>
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
