#!/bin/bash

# Test script for autonomous Tony agent handoffs

set -e

echo "=== AUTONOMOUS TONY TEST ==="
echo "Testing context-based agent handoffs..."
echo

# Step 1: Deploy Tony to analyze PRD and create plan
echo "Step 1: Deploying Tech Lead Tony..."
claude --model opus --allowedTools Bash,Read,Write,Edit,Grep,Glob,LS,TodoWrite,Task "You are Tech Lead Tony. Read initial-context.json for your session context and PRD.md for requirements. Create a UPP task decomposition and save it as task-decomposition.md. Then create a context file at implementation-context.json for the next agent to implement the first atomic task. Show how autonomous handoffs work."

# Check if Tony created the expected files
echo
echo "Checking Tony's output..."
if [ -f "task-decomposition.md" ]; then
    echo "✓ Task decomposition created"
fi
if [ -f "implementation-context.json" ]; then
    echo "✓ Implementation context created"
fi

# Step 2: If context exists, spawn implementation agent
if [ -f "implementation-context.json" ]; then
    echo
    echo "Step 2: Spawning implementation agent with context..."
    ./scripts/spawn-agent.sh --context implementation-context.json --agent-type implementation-agent --output-context qa-context.json
fi

# Step 3: If QA context exists, spawn QA agent
if [ -f "qa-context.json" ]; then
    echo
    echo "Step 3: Spawning QA agent with context..."
    ./scripts/spawn-agent.sh --context qa-context.json --agent-type qa-agent --output-context final-context.json
fi

echo
echo "=== TEST COMPLETE ==="
echo "Check the following for results:"
echo "- task-decomposition.md - Tony's planning"
echo "- implementation-context.json - First handoff"
echo "- qa-context.json - Second handoff (if created)"
echo "- Agent outputs and any created files"