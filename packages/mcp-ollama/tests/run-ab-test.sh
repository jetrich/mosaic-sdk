#!/bin/bash

# A/B Testing Script for Ollama vs Claude
# Usage: ./run-ab-test.sh [model]

MODEL=${1:-llama3.2}

echo "🚀 Ollama A/B Testing Suite"
echo "=========================="
echo ""

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/version > /dev/null 2>&1; then
    echo "❌ Ollama is not running. Please start Ollama first:"
    echo "   ollama serve"
    exit 1
fi

echo "✅ Ollama is running"

# Check if the model exists
if ! ollama list | grep -q "$MODEL"; then
    echo "⚠️  Model $MODEL not found. Pulling it now..."
    ollama pull $MODEL
    if [ $? -ne 0 ]; then
        echo "❌ Failed to pull model $MODEL"
        exit 1
    fi
fi

echo "✅ Using model: $MODEL"
echo ""

# Compile TypeScript
echo "📦 Building TypeScript..."
cd "$(dirname "$0")/.."
npx tsc

# Run the A/B test
echo ""
echo "🧪 Starting A/B Test..."
echo "------------------------"
node dist/tests/ab-test.js $MODEL

# Check results
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ A/B Test completed successfully!"
    echo ""
    echo "📊 Results saved to: ab-test-results-*.json"
    
    # Show latest results file
    LATEST_RESULTS=$(ls -t ab-test-results-*.json 2>/dev/null | head -1)
    if [ ! -z "$LATEST_RESULTS" ]; then
        echo "📁 Latest results: $LATEST_RESULTS"
        
        # Extract key metrics using jq if available
        if command -v jq > /dev/null 2>&1; then
            echo ""
            echo "📈 Quick Summary:"
            jq -r '.summary.winner | "   Overall Winner: \(.overall)"' "$LATEST_RESULTS"
            jq -r '.summary.results.ollama | "   Ollama Speed: \(.avgResponseTime | floor)ms"' "$LATEST_RESULTS"
            jq -r '.summary.results.claude | "   Claude Speed: \(.avgResponseTime | floor)ms (simulated)"' "$LATEST_RESULTS"
        fi
    fi
else
    echo ""
    echo "❌ A/B Test failed. Check the error messages above."
    exit 1
fi