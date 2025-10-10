#!/bin/bash
# Extract only the TypeScript geocoded entries from script output
# Usage: python3 scripts/geocode_locations.py --limit 100 | ./scripts/extract_geocoded.sh

grep -E "^  '[^']+': \{ latitude:" | grep -v "FAILED"
