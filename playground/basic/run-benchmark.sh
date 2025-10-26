#!/bin/bash

echo "🚀 Performance Benchmark: Worker Threads vs No Worker Threads"
echo "=============================================================="
echo ""
echo "System Info:"
CPU_CORES=$(sysctl -n hw.ncpu 2>/dev/null || nproc 2>/dev/null || echo "Unknown")
echo "  - CPU Cores: $CPU_CORES"
FILE_COUNT=$(ls -1 benchmark-files/Component*.tsx 2>/dev/null | wc -l | tr -d ' ')
echo "  - Test Files: $FILE_COUNT TSX files (benchmark-files/)"
echo ""

# Function to get time in milliseconds (cross-platform)
get_time_ms() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    python3 -c 'import time; print(int(time.time() * 1000))'
  else
    date +%s%3N
  fi
}

# Warmup
echo "🔥 Warming up (compiling once to load caches)..."
rm -rf dist
pnpm run build --config vite.config.no-workers.js > /dev/null 2>&1
echo "   Done!"

# Test 1: Without worker threads (run 3 times and take average)
echo ""
echo "📊 Test 1: Building WITHOUT worker threads (3 runs)..."
TOTAL_NO_WORKERS=0
for i in {1..3}; do
  echo "  Run $i/3..."
  rm -rf dist
  START=$(get_time_ms)
  pnpm run build --config vite.config.no-workers.js > /tmp/build_no_workers_$i.log 2>&1
  END=$(get_time_ms)
  TIME=$((END - START))
  TOTAL_NO_WORKERS=$((TOTAL_NO_WORKERS + TIME))
  echo "    ⏱️  ${TIME}ms"
  sleep 1
done
TIME_NO_WORKERS=$((TOTAL_NO_WORKERS / 3))
echo ""
echo "  📊 Average time without workers: ${TIME_NO_WORKERS}ms"

# Small delay between tests
sleep 2

# Test 2: With worker threads (run 3 times and take average)
echo ""
echo "📊 Test 2: Building WITH worker threads (3 runs)..."
TOTAL_WITH_WORKERS=0
for i in {1..3}; do
  echo "  Run $i/3..."
  rm -rf dist
  START=$(get_time_ms)
  pnpm run build --config vite.config.workers.js > /tmp/build_with_workers_$i.log 2>&1
  END=$(get_time_ms)
  TIME=$((END - START))
  TOTAL_WITH_WORKERS=$((TOTAL_WITH_WORKERS + TIME))
  echo "    ⏱️  ${TIME}ms"
  sleep 1
done
TIME_WITH_WORKERS=$((TOTAL_WITH_WORKERS / 3))
echo ""
echo "  📊 Average time with workers: ${TIME_WITH_WORKERS}ms"

# Calculate improvement
echo ""
echo "=============================================================="
echo "📈 Final Results (averaged over 3 runs):"
echo ""
echo "  Without worker threads: ${TIME_NO_WORKERS}ms"
echo "  With worker threads:    ${TIME_WITH_WORKERS}ms"
echo "  CPU cores utilized:     $CPU_CORES cores"
echo ""

if [ $TIME_NO_WORKERS -gt $TIME_WITH_WORKERS ]; then
  DIFF=$((TIME_NO_WORKERS - TIME_WITH_WORKERS))
  PERCENT=$((DIFF * 100 / TIME_NO_WORKERS))
  echo "  🎉 Improvement: ${DIFF}ms faster (${PERCENT}% improvement)"
  echo ""
  echo "✅ Worker threads are FASTER! 🚀"
elif [ $TIME_WITH_WORKERS -gt $TIME_NO_WORKERS ]; then
  DIFF=$((TIME_WITH_WORKERS - TIME_NO_WORKERS))
  PERCENT=$((DIFF * 100 / TIME_NO_WORKERS))
  echo "  ⚠️  Difference: ${DIFF}ms slower (${PERCENT}% slower)"
  echo ""
  echo "Note: Worker threads didn't improve performance for this workload."
  echo "This can happen when:"
  echo "  - Workload is too small (overhead > benefit)"
  echo "  - System is under heavy load"
  echo "  - I/O is the bottleneck, not CPU"
else
  echo "  No significant difference"
fi
echo "=============================================================="
