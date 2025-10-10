# Quick Start - Geocoding Script

## TL;DR

```bash
# Geocode all 439 remaining locations (~8 minutes)
cd /home/dev/oct7timeline
python3 scripts/geocode_locations.py > scripts/all_geocoded.txt

# Extract only successful results
grep -E "^  '[^']+': \{ latitude:" scripts/all_geocoded.txt | grep -v "FAILED" > scripts/to_add.txt

# View results
cat scripts/to_add.txt

# Paste results into lib/locationCoordinates.ts
```

## Files Created

1. **`scripts/geocode_locations.py`** - Main geocoding script
2. **`scripts/extract_geocoded.sh`** - Helper to extract successful results
3. **`scripts/geocoded_batch1_success.txt`** - 86 pre-geocoded locations ready to use
4. **`scripts/GEOCODING_README.md`** - Full documentation
5. **`scripts/GEOCODING_SUMMARY.md`** - Detailed analysis and results
6. **`scripts/QUICK_START.md`** - This file

## Current Status

- ✅ Script created and tested
- ✅ First batch (100 locations) processed: 86 successful, 14 failed
- ✅ 86 locations ready to add to `locationCoordinates.ts`
- ⏳ 339 locations remaining to geocode

## What the Script Does

1. Reads `data/victims.csv` and extracts unique location names (column 5)
2. Checks which locations are already in `lib/locationCoordinates.ts`
3. Geocodes new locations using OpenStreetMap Nominatim API
4. Outputs TypeScript format ready to paste

## Commands

```bash
# Process all remaining locations
python3 scripts/geocode_locations.py

# Process 100 locations
python3 scripts/geocode_locations.py --limit 100

# Check status (shows how many locations left)
python3 scripts/geocode_locations.py --limit 0

# Get help
python3 scripts/geocode_locations.py --help
```

## Example Output

```typescript
'תל אביב': { latitude: 32.0853, longitude: 34.7818 },
'ירושלים': { latitude: 31.7683, longitude: 35.2137 },
'באר שבע': { latitude: 31.2518, longitude: 34.7913 },
```

## Success Rate

- **Batch 1**: 86/100 = 86% success rate
- **Failed**: Mostly foreign locations and non-geographic entities

## Time Estimate

- ~1.1 seconds per location (API rate limit)
- 100 locations = ~2 minutes
- 439 locations = ~8 minutes
- Safe to run in background

## Notes

- Uses only Python standard library (no pip install needed)
- Automatically skips already-geocoded locations
- Safe to run multiple times
- Respects OpenStreetMap rate limits
- Handles Hebrew text correctly (UTF-8)

## Pre-Geocoded Results Available

**86 locations already geocoded** in `scripts/geocoded_batch1_success.txt`

You can use these immediately while the rest processes!
