# Geocoding Script for Oct 7 Timeline

## Overview

This directory contains scripts to geocode location names from the victims dataset using the OpenStreetMap Nominatim API.

## Files

- `geocode_locations.py` - Main geocoding script
- `extract_geocoded.sh` - Helper script to extract only successful geocoding results
- `GEOCODING_README.md` - This file

## Status

- **Total unique locations in CSV**: 498
- **Already geocoded**: 59
- **Remaining to geocode**: 439

## Usage

### Basic Usage

```bash
# Geocode all remaining locations (takes ~8 minutes due to rate limiting)
python3 scripts/geocode_locations.py

# Geocode first 100 locations only
python3 scripts/geocode_locations.py --limit 100

# Extract only successful results (no FAILED entries)
python3 scripts/geocode_locations.py --limit 100 | ./scripts/extract_geocoded.sh
```

### Batch Processing

To avoid timeouts and process in manageable batches:

```bash
# Process 100 at a time, save to file
python3 scripts/geocode_locations.py --limit 100 > batch1.txt

# After adding batch1 results to locationCoordinates.ts, run next batch
python3 scripts/geocode_locations.py --limit 100 > batch2.txt
```

The script automatically skips locations already in `locationCoordinates.ts`, so you can run it multiple times safely.

## How It Works

1. **Reads existing locations** from `/home/dev/oct7timeline/lib/locationCoordinates.ts`
2. **Extracts unique locations** from `/home/dev/oct7timeline/data/victims.csv` (column 5)
3. **Geocodes each location** using Nominatim API with Israel country bias
4. **Outputs TypeScript format** ready to paste into `locationCoordinates.ts`
5. **Respects rate limits** (1.1 second delay between requests)

## Output Format

The script outputs TypeScript code in this format:

```typescript
'תל אביב': { latitude: 32.0853, longitude: 34.7818 },
'ירושלים': { latitude: 31.7683, longitude: 35.2137 },
```

Failed geocoding attempts are marked with `// FAILED` and given default coordinates:

```typescript
// FAILED: 'unknown_location': { latitude: 31.5, longitude: 34.8 }, // DEFAULT - manual review needed
```

## First Batch Results

**Batch 1 (100 locations):**
- Success: 87/100 (87%)
- Failed: 13 locations (mostly foreign countries and disputed territories)

Failed locations include:
- אבו רובייעה (Abu Rubia - small settlement)
- אזרח מקסיקו (Mexican citizen)
- אזרח סין (Chinese citizen)
- אזרח תאילנד (Thai citizen)
- Foreign cities: בולדר- קולורדו, אלכסנדריה- מצרים
- West Bank settlements: אלון שבות, ברוכין, גבע בנימין

## Next Steps

1. Run remaining batches (339 locations left)
2. Review failed locations and manually add coordinates if needed
3. Update `locationCoordinates.ts` with all geocoded results
4. Test the map visualization with new coordinates

## Rate Limiting

The Nominatim API has a usage policy:
- Maximum 1 request per second
- Script uses 1.1 second delay to be safe
- Total time for 439 locations: ~8 minutes

## Error Handling

The script handles:
- HTTP timeouts (10 second timeout per request)
- Network errors
- Invalid responses
- Missing locations (returns default Israel center coordinates)

## Dependencies

Standard library only:
- csv
- time
- pathlib
- urllib
- json
- argparse

No external packages required!
