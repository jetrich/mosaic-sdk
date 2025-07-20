#!/bin/bash
# Monitor automated recovery progress

echo "🔄 RECOVERY PROGRESS MONITOR"
echo "========================="

# Check each agent status
for agent in environment typescript-fix implementation docker-cleanup qa-verification; do
  if [ -f "logs/agent-tasks/recovery/$agent/status.txt" ]; then
    status=$(cat "logs/agent-tasks/recovery/$agent/status.txt")
    echo "$agent: $status"
  else
    echo "$agent: NOT STARTED"
  fi
done

# Check iteration count
if [ -f "logs/agent-tasks/recovery/iteration.txt" ]; then
  iteration=$(cat "logs/agent-tasks/recovery/iteration.txt")
  echo ""
  echo "Current Iteration: $iteration/5"
fi
