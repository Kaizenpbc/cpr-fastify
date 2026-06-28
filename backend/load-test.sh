#!/bin/bash
# Load Test Script for CPR Training Management System
# Uses autocannon (Node.js HTTP benchmarking tool)
# Target: staging environment (to avoid impacting production)
#
# Usage: bash backend/load-test.sh [base_url]
# Default: https://stagecprapp.kpbc.ca/api/v1

set -e

BASE_URL="${1:-https://stagecprapp.kpbc.ca/api/v1}"
RESULTS_DIR="backend/load-test-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p "$RESULTS_DIR"

echo "=========================================="
echo "CPR Load Test Suite"
echo "Target: $BASE_URL"
echo "Time: $(date)"
echo "=========================================="
echo ""

# --- Test 1: Health endpoint (baseline) ---
echo "--- Test 1: Health Endpoint (baseline) ---"
echo "10 connections, 10 seconds"
npx autocannon -c 10 -d 10 -j "$BASE_URL/health" > "$RESULTS_DIR/health_${TIMESTAMP}.json" 2>/dev/null
node -e "
const r = require('./$RESULTS_DIR/health_${TIMESTAMP}.json');
console.log('  Requests/sec: ' + r.requests.average);
console.log('  Latency avg:  ' + r.latency.average + 'ms');
console.log('  Latency p99:  ' + r.latency.p99 + 'ms');
console.log('  Errors:       ' + (r.errors || 0));
console.log('  Timeouts:     ' + (r.timeouts || 0));
"
echo ""

# --- Test 2: Health endpoint (stress) ---
echo "--- Test 2: Health Endpoint (stress) ---"
echo "50 connections, 10 seconds"
npx autocannon -c 50 -d 10 -j "$BASE_URL/health" > "$RESULTS_DIR/health_stress_${TIMESTAMP}.json" 2>/dev/null
node -e "
const r = require('./$RESULTS_DIR/health_stress_${TIMESTAMP}.json');
console.log('  Requests/sec: ' + r.requests.average);
console.log('  Latency avg:  ' + r.latency.average + 'ms');
console.log('  Latency p99:  ' + r.latency.p99 + 'ms');
console.log('  Errors:       ' + (r.errors || 0));
console.log('  Timeouts:     ' + (r.timeouts || 0));
"
echo ""

# --- Test 3: Login endpoint (auth under load) ---
echo "--- Test 3: Login Endpoint (auth load) ---"
echo "10 connections, 10 seconds"
npx autocannon -c 10 -d 10 -j \
  -m POST \
  -H "Content-Type: application/json" \
  -b '{"email":"loadtest@example.com","password":"notarealpassword"}' \
  "$BASE_URL/auth/login" > "$RESULTS_DIR/login_${TIMESTAMP}.json" 2>/dev/null
node -e "
const r = require('./$RESULTS_DIR/login_${TIMESTAMP}.json');
console.log('  Requests/sec: ' + r.requests.average);
console.log('  Latency avg:  ' + r.latency.average + 'ms');
console.log('  Latency p99:  ' + r.latency.p99 + 'ms');
console.log('  Non-2xx:      ' + (r.non2xx || 0));
console.log('  Timeouts:     ' + (r.timeouts || 0));
"
echo ""

# --- Test 4: Health endpoint (peak burst) ---
echo "--- Test 4: Health Endpoint (peak burst) ---"
echo "100 connections, 10 seconds"
npx autocannon -c 100 -d 10 -j "$BASE_URL/health" > "$RESULTS_DIR/health_peak_${TIMESTAMP}.json" 2>/dev/null
node -e "
const r = require('./$RESULTS_DIR/health_peak_${TIMESTAMP}.json');
console.log('  Requests/sec: ' + r.requests.average);
console.log('  Latency avg:  ' + r.latency.average + 'ms');
console.log('  Latency p99:  ' + r.latency.p99 + 'ms');
console.log('  Errors:       ' + (r.errors || 0));
console.log('  Timeouts:     ' + (r.timeouts || 0));
"
echo ""

# --- Test 5: Metrics endpoint ---
echo "--- Test 5: Metrics Endpoint ---"
echo "20 connections, 10 seconds"
npx autocannon -c 20 -d 10 -j "$BASE_URL/../metrics" > "$RESULTS_DIR/metrics_${TIMESTAMP}.json" 2>/dev/null
node -e "
const r = require('./$RESULTS_DIR/metrics_${TIMESTAMP}.json');
console.log('  Requests/sec: ' + r.requests.average);
console.log('  Latency avg:  ' + r.latency.average + 'ms');
console.log('  Latency p99:  ' + r.latency.p99 + 'ms');
console.log('  Errors:       ' + (r.errors || 0));
console.log('  Timeouts:     ' + (r.timeouts || 0));
"
echo ""

# --- Summary ---
echo "=========================================="
echo "Load Test Complete"
echo "Results saved to: $RESULTS_DIR/"
echo ""
echo "Key thresholds for TMD shared hosting (LVE: 100 procs, 2GB RAM, 2 CPU):"
echo "  - Target: >100 req/sec on health at 10 connections"
echo "  - Warning: p99 latency >2000ms"
echo "  - Critical: errors or timeouts under normal load (10-20 connections)"
echo "  - Note: 50+ connections may hit LVE limits (expected on shared hosting)"
echo "=========================================="
