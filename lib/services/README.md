# Services

This directory contains reusable service modules for the October 7th Timeline project.

## Geocoding Service

The geocoding service converts Hebrew city names to latitude/longitude coordinates for Israeli locations.

### Files

- `geocoding.ts` - Main geocoding service implementation
- `geocoding.test.ts` - Comprehensive test suite
- `geocoding.example.ts` - Usage examples

### Features

1. **Lookup Table**: Fast, reliable geocoding for 60+ major Israeli cities and October 7th affected locations
2. **API Fallback**: Uses Nominatim/OpenStreetMap API for locations not in the lookup table
3. **Caching**: In-memory cache to prevent repeated API calls
4. **Validation**: Ensures coordinates are within Israel's boundaries (29.5-33.3°N, 34.3-35.9°E)
5. **Hebrew Support**: Properly handles UTF-8 Hebrew text and common name variations

### Usage

#### Single Location

```typescript
import { geocodeLocation } from "./lib/services/geocoding";

const coordinates = await geocodeLocation("ירושלים");
if (coordinates) {
  console.log(coordinates.latitude, coordinates.longitude);
  // Output: 31.7683, 35.2137
}
```

#### Multiple Locations

```typescript
import { geocodeLocations } from "./lib/services/geocoding";

const cities = ["תל אביב", "חיפה", "באר שבע"];
const results = await geocodeLocations(cities);

for (const [cityName, coordinates] of results) {
  if (coordinates) {
    console.log(`${cityName}: ${coordinates.latitude}, ${coordinates.longitude}`);
  }
}
```

#### Coordinate Validation

```typescript
import { validateIsraelCoordinates } from "./lib/services/geocoding";

const isValid = validateIsraelCoordinates(31.7683, 35.2137);
// Returns: true (Jerusalem is within Israel)
```

### API Reference

#### `geocodeLocation(cityName: string): Promise<GeocodingResult | null>`

Converts a Hebrew city name to coordinates.

- **Parameters**: `cityName` - Hebrew name of the city/location
- **Returns**: Promise resolving to `{latitude, longitude}` or `null` if not found
- **Example**: `await geocodeLocation('ירושלים')`

#### `geocodeLocations(cityNames: string[], delayMs?: number): Promise<Map<string, GeocodingResult | null>>`

Batch geocoding for multiple locations with rate limiting.

- **Parameters**:
  - `cityNames` - Array of Hebrew city names
  - `delayMs` - Delay between API calls (default: 1000ms)
- **Returns**: Promise resolving to a Map of city names to coordinates

#### `validateIsraelCoordinates(latitude: number, longitude: number): boolean`

Validates if coordinates are within Israel's boundaries.

#### `clearGeocodingCache(): void`

Clears the in-memory cache.

#### `getGeocodingCacheSize(): number`

Returns the current cache size.

### Supported Locations

The lookup table includes:

- **Major cities**: Jerusalem, Tel Aviv, Haifa, Beer Sheva, etc. (35+ cities)
- **October 7th affected locations**: Kfar Aza, Nahal Oz, Be'eri, Sderot, etc. (20+ locations)
- **Northern settlements**: Metula, Kiryat Shmona, etc.
- **Alternative spellings**: Common abbreviations (י-ם, ת"א, ב"ש)

### Performance

- **Lookup table**: < 1ms (no network calls)
- **API fallback**: 100-500ms (depends on network)
- **Cache hit**: < 1ms

### Rate Limits

The Nominatim API has a rate limit of ~1 request per second. The `geocodeLocations` function automatically adds delays between requests to respect this limit.

### Error Handling

The service returns `null` for:

- Invalid input (empty strings, null, undefined)
- Locations not found in lookup table or API
- Coordinates outside Israel's boundaries
- API errors or network failures

All errors are logged to the console for debugging.

### Testing

Run the test suite:

```bash
npm test -- __tests__/services/geocoding.test.ts
```

The test suite includes:

- Lookup table geocoding (major cities and October 7th locations)
- City name normalization
- Invalid input handling
- Coordinate validation
- Cache management
- Batch geocoding

### Future Enhancements

Potential improvements:

1. Add more cities to the lookup table
2. Support English city names
3. Add persistent caching (localStorage/database)
4. Implement retry logic for API failures
5. Add support for Google Maps Geocoding API (with API key)
