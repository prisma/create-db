#!/bin/bash

# Test Rate Limits Script
# Usage: ./tests/test-rate-limits.sh [test_count] [create_db_url] [claim_db_url] [agent_id]

# Default values
TEST_COUNT=${1:-110}
CREATE_DB_URL=${2:-"https://create-db-temp.prisma.io"}
CLAIM_DB_URL=${3:-"https://create-db.prisma.io"}
AGENT_ID=${4:-"meow"}

echo "🧪 Testing Rate Limits"
echo "======================"
echo "Test Count: $TEST_COUNT"
echo "Create DB URL: $CREATE_DB_URL"
echo "Claim DB URL: $CLAIM_DB_URL"
echo "Agent Header: X-Agent: $AGENT_ID"
echo "User-Agent: prisma-rate-limit-test/$AGENT_ID"
echo ""

# Function to test a worker
test_worker() {
    local worker_name=$1
    local worker_url=$2
    local endpoint="$worker_url/test"
    
    echo "📊 Testing $worker_name rate limits..."
    echo "Making $TEST_COUNT requests to $endpoint"
    echo ""
    
    success_count=0
    rate_limited_count=0
    error_count=0
    
    for i in $(seq 1 $TEST_COUNT); do
        echo -n "Request $i/$TEST_COUNT: "
        
        # Make the request with unique agent headers and capture body + status code
        response=$(curl -s \
          -H "x-agent: $AGENT_ID" \
          -H "x-Agent: $AGENT_ID" \
          -H "User-Agent: prisma-rate-limit-test/$AGENT_ID" \
          -w "%{http_code}" \
          -o /tmp/response_$i.json \
          "$endpoint" 2>/dev/null)

        status_code=${response: -3}
        
        case $status_code in
            200)
                echo "✅ Success (200)"
                ((success_count++))
                ;;
            429)
                echo "⚠️  Rate Limited (429)"
                ((rate_limited_count++))
                ;;
            *)
                echo "❌ Error ($status_code)"
                ((error_count++))
                ;;
        esac
        
        # Small delay between requests
        #sleep 0.05
    done
    
    echo ""
    echo "📊 $worker_name Results:"
    echo "  Success: $success_count"
    echo "  Rate Limited: $rate_limited_count"
    echo "  Errors: $error_count"
    echo "  Total: $TEST_COUNT"
    echo ""
}

# Test both workers
test_worker "Create DB Worker" "$CREATE_DB_URL"
test_worker "Claim DB Worker" "$CLAIM_DB_URL"

echo "🎯 Rate Limit Testing Complete!"
echo ""
echo "Expected behavior:"
echo "- First few requests should succeed (200)"
echo "- Later requests should be rate limited (429)"
echo "- This confirms rate limiting is working correctly"
echo ""
echo "💡 To test with your actual deployed URLs, run:"
echo "   ./tests/test-rate-limits.sh 110 https://create-db-temp.prisma.io https://create-db.prisma.io my-local-agent"
