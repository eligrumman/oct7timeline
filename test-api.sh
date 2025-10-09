#!/bin/bash

# Test script for /api/victims endpoint
# Run with: bash test-api.sh

set -e

echo "Starting API tests for /api/victims..."
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Counter for tests
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to run a test
run_test() {
    local test_name="$1"
    local url="$2"
    local expected_check="$3"

    echo -n "Testing: $test_name... "

    response=$(curl -s "$url")

    if echo "$response" | jq -e "$expected_check" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗${NC}"
        echo "  Failed check: $expected_check"
        echo "  Response: $(echo "$response" | jq -c '.' | head -c 200)"
        ((TESTS_FAILED++))
    fi
}

# Start the Next.js dev server in background
echo "Starting Next.js development server..."
npm run dev > /dev/null 2>&1 &
SERVER_PID=$!

# Wait for server to start
echo "Waiting for server to start..."
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "Server is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "Server failed to start"
        kill $SERVER_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

echo ""
echo "Running API tests..."
echo "-------------------"

# Test 1: Basic GET request
run_test "Basic GET request" \
    "http://localhost:3000/api/victims" \
    '.success == true and .data.victims != null'

# Test 2: Check victim data structure
run_test "Victim data structure" \
    "http://localhost:3000/api/victims" \
    '.data.victims[0] | has("id") and has("fullName") and has("timestamp")'

# Test 3: Check metadata
run_test "Response metadata" \
    "http://localhost:3000/api/victims" \
    '.data.metadata | has("total") and has("processed") and has("failed")'

# Test 4: Statistics request
run_test "Statistics inclusion" \
    "http://localhost:3000/api/victims?stats=true" \
    '.data.statistics != null and .data.locations != null'

# Test 5: Check statistics structure
run_test "Statistics structure" \
    "http://localhost:3000/api/victims?stats=true" \
    '.data.statistics | has("total") and has("civilians") and has("military")'

# Test 6: Age statistics
run_test "Age statistics" \
    "http://localhost:3000/api/victims?stats=true" \
    '.data.statistics.ageStats | has("min") and has("max") and has("average")'

# Test 7: Location filtering (using a known location)
run_test "Location filter" \
    "http://localhost:3000/api/victims?location=תל%20אביב" \
    '.data.metadata.filters.location != null'

# Test 8: Empty location filter
run_test "Empty location filter" \
    "http://localhost:3000/api/victims?location=" \
    '.data.victims | length > 0'

# Test 9: Non-existent location
run_test "Non-existent location" \
    "http://localhost:3000/api/victims?location=NonExistentCity" \
    '.data.victims | length == 0'

# Test 10: Combined parameters
run_test "Combined parameters" \
    "http://localhost:3000/api/victims?stats=true&location=תל%20אביב" \
    '.data.statistics != null and .data.metadata.filters.location != null'

# Test 11: CORS headers
echo -n "Testing: CORS headers... "
headers=$(curl -s -I "http://localhost:3000/api/victims" 2>/dev/null | grep -i "access-control")
if echo "$headers" | grep -q "Access-Control-Allow-Origin"; then
    echo -e "${GREEN}✓${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗${NC}"
    echo "  Missing CORS headers"
    ((TESTS_FAILED++))
fi

# Test 12: OPTIONS preflight
echo -n "Testing: OPTIONS preflight... "
options_response=$(curl -s -X OPTIONS -I "http://localhost:3000/api/victims" 2>/dev/null)
if echo "$options_response" | grep -q "200"; then
    echo -e "${GREEN}✓${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗${NC}"
    echo "  OPTIONS request failed"
    ((TESTS_FAILED++))
fi

# Test 13: Date sorting
run_test "Date sorting" \
    "http://localhost:3000/api/victims" \
    '[.data.victims[0].date, .data.victims[-1].date] | .[0] <= .[1]'

# Test 14: Processed victims count
run_test "Processed count matches array length" \
    "http://localhost:3000/api/victims" \
    '.data.metadata.processed == (.data.victims | length)'

# Clean up
echo ""
echo "Cleaning up..."
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true

# Summary
echo ""
echo "=================================="
echo "Test Results:"
echo -e "  Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "  Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
fi