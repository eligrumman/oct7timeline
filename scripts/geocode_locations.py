#!/usr/bin/env python3
"""
Geocode unique locations from victims.csv using Nominatim API.
Outputs TypeScript format for locationCoordinates.ts

Usage:
    python3 scripts/geocode_locations.py              # Process all new locations
    python3 scripts/geocode_locations.py --limit 50   # Process only first 50
"""
import csv
import time
import argparse
from pathlib import Path
from typing import Dict, Set, Tuple, Optional
from urllib.parse import quote
from urllib.request import urlopen, Request
import json


def read_existing_locations(ts_file: Path) -> Set[str]:
    """Extract already-geocoded location names from TypeScript file."""
    existing = set()
    if not ts_file.exists():
        return existing

    with open(ts_file, 'r', encoding='utf-8') as f:
        for line in f:
            # Match lines like: 'ירושלים': { latitude: 31.7683, longitude: 35.2137 },
            if '{' in line and 'latitude' in line:
                parts = line.strip().split("'")
                if len(parts) >= 2:
                    location = parts[1]
                    existing.add(location)

    return existing


def extract_unique_locations(csv_file: Path, column_index: int = 4) -> Set[str]:
    """Extract unique location names from CSV file (column 5 = index 4)."""
    locations = set()

    with open(csv_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        next(reader)  # Skip header

        for row in reader:
            if len(row) > column_index:
                location = row[column_index].strip()
                if location and location != '-':
                    locations.add(location)

    return locations


def geocode_location(location: str) -> Optional[Tuple[float, float]]:
    """
    Geocode a location using Nominatim API with Israel country bias.
    Returns (latitude, longitude) or None if not found.
    """
    # Add Israel to query for better accuracy
    query = f"{location}, Israel"
    encoded_query = quote(query)

    url = f"https://nominatim.openstreetmap.org/search?q={encoded_query}&format=json&limit=1&addressdetails=1"

    headers = {
        'User-Agent': 'Oct7Timeline-Geocoder/1.0'
    }

    try:
        req = Request(url, headers=headers)
        with urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))

            if data and len(data) > 0:
                result = data[0]
                lat = float(result['lat'])
                lon = float(result['lon'])
                return (lat, lon)
    except Exception as e:
        print(f"// Error geocoding '{location}': {e}", flush=True)

    return None


def main():
    parser = argparse.ArgumentParser(description='Geocode locations from victims.csv')
    parser.add_argument('--limit', type=int, help='Limit number of locations to geocode')
    parser.add_argument('--batch-size', type=int, default=100, help='Process in batches (default: 100)')
    args = parser.parse_args()

    # File paths
    project_root = Path(__file__).parent.parent
    csv_file = project_root / 'data' / 'victims.csv'
    ts_file = project_root / 'lib' / 'locationCoordinates.ts'

    # Read existing locations to skip
    existing_locations = read_existing_locations(ts_file)
    print(f"// Found {len(existing_locations)} existing locations in {ts_file.name}", flush=True)

    # Extract unique locations from CSV
    all_locations = extract_unique_locations(csv_file)
    print(f"// Found {len(all_locations)} total unique locations in CSV", flush=True)

    # Filter out already-geocoded locations
    new_locations = sorted(all_locations - existing_locations)

    if args.limit:
        new_locations = new_locations[:args.limit]

    print(f"// {len(new_locations)} locations to geocode", flush=True)
    print(f"//", flush=True)

    if not new_locations:
        print("// All locations already geocoded!", flush=True)
        return

    # Geocode new locations
    print("// Add these entries to ISRAEL_LOCATION_COORDINATES:", flush=True)
    print("", flush=True)

    success_count = 0
    failed_locations = []

    for i, location in enumerate(new_locations, 1):
        print(f"// [{i}/{len(new_locations)}] Geocoding: {location}...", flush=True)

        coords = geocode_location(location)

        if coords:
            lat, lon = coords
            print(f"  '{location}': {{ latitude: {lat:.4f}, longitude: {lon:.4f} }},")
            success_count += 1
        else:
            failed_locations.append(location)
            print(f"  // FAILED: '{location}': {{ latitude: 31.5, longitude: 34.8 }}, // DEFAULT - manual review needed")

        # Respect Nominatim rate limit (1 request per second)
        if i < len(new_locations):
            time.sleep(1.1)

    # Summary
    print("", flush=True)
    print(f"// ========================================", flush=True)
    print(f"// Geocoding complete!", flush=True)
    print(f"// Success: {success_count}/{len(new_locations)}", flush=True)

    if failed_locations:
        print(f"// Failed ({len(failed_locations)}): {', '.join(failed_locations[:10])}", flush=True)
        if len(failed_locations) > 10:
            print(f"//   ... and {len(failed_locations) - 10} more", flush=True)
    print(f"// ========================================", flush=True)


if __name__ == '__main__':
    main()
