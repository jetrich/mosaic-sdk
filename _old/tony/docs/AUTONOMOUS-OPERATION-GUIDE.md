# Tony v2.6.0 Autonomous Operation Guide

**Purpose**: Enable Tony to self-manage agent deployment and coordination  
**Status**: Wave 1 Ready for Launch  

## 🤖 Autonomous Agent Management

Tony Framework v2.6.0 implements self-managing agent orchestration. The system can:
- Launch agents autonomously
- Monitor progress in real-time
- Handle failures and recovery
- Chain tasks automatically

## 🚀 Quick Start for Successor

### 1. Check Current Status
```bash
cd /home/jwoltje/src/tony-ng
./tony/scripts/launch-wave1-agents.sh status
./tony/scripts/coordinate-v2.6-implementation.sh monitor
```

### 2. Launch Wave 1 Agents (If Not Running)
```bash
./tony/scripts/launch-wave1-agents.sh launch
```

### 3. Monitor Progress
```bash
# Real-time log monitoring
./tony/scripts/launch-wave1-agents.sh monitor

# Or check individual logs
ls -la tony/.tony/agents/logs/
```

## 📊 Wave 1 Agent Tasks

| Agent | Task | Duration | Files to Create |
|-------|------|----------|-----------------|
| architecture-agent | T.001.01.01.02 - Plugin Loader | 30 min | plugin-loader.ts, dynamic-import.ts |
| version-agent | T.001.02.01.01 - Version Detection | 30 min | version-detector.ts, types.ts |
| command-agent | T.001.03.01.01 - Command Wrapper | 30 min | wrapper-template.sh, generator.sh |

## 🔄 Autonomous Operation Flow

### Phase 1: Parallel Execution
1. All three Wave 1 agents run simultaneously
2. Each works on independent atomic tasks
3. No dependencies between them
4. 30-minute time boxes

### Phase 2: Completion Handling
When agents complete:
1. Check output contexts in `tony/.tony/agents/contexts/*-output.json`
2. Validate implementations
3. Prepare Wave 2 based on results

### Phase 3: Wave 2 Preparation
After Wave 1 completes:
```bash
# Create contexts for next wave
./tony/scripts/prepare-wave2-contexts.sh

# Launch Wave 2 agents
./tony/scripts/launch-wave2-agents.sh launch
```

## 🛠️ Agent Management Commands

### Launch Agents
```bash
# Launch specific agent
./tony/scripts/spawn-agent.sh \
  --context <context-file> \
  --agent-type <agent-name> \
  --model sonnet

# Launch wave
./tony/scripts/launch-wave1-agents.sh launch
```

### Monitor Agents
```bash
# Check status
./tony/scripts/launch-wave1-agents.sh status

# Follow logs
./tony/scripts/launch-wave1-agents.sh monitor

# View specific log
tail -f tony/.tony/agents/logs/<agent>-<task>.log
```

### Handle Failures
```bash
# Check failed agent
cat tony/.tony/agents/logs/<agent>-<task>.log

# Relaunch if needed
./tony/scripts/spawn-agent.sh \
  --context <original-context> \
  --agent-type <agent-name>
```

## 📁 File Structure

```
tony/.tony/agents/
├── contexts/
│   ├── architecture-agent-T.001.01.01.02-context.json
│   ├── version-agent-T.001.02.01.01-context.json
│   ├── command-agent-T.001.03.01.01-context.json
│   └── *-output.json (created after completion)
├── logs/
│   ├── architecture-agent-T.001.01.01.02.log
│   ├── version-agent-T.001.02.01.01.log
│   └── command-agent-T.001.03.01.01.log
├── wave1.pids (tracking file)
└── instructions/ (task details)
```

## 🎯 Success Validation

### For Each Agent
1. **Check Log**: Verify completion message
2. **Validate Output**: Review created files
3. **Run Tests**: Ensure implementations work
4. **Check Context**: Verify output context created

### Overall Wave 1
- [ ] Plugin loader implemented and tested
- [ ] Version detector working cross-platform
- [ ] Command wrapper template functional
- [ ] All tests passing
- [ ] Documentation updated

## 🚦 Autonomous Decision Tree

```
START
  ↓
Check Agent Status
  ↓
All Running? → Monitor Progress
  ↓ No
Any Failed? → Check Logs → Relaunch
  ↓ No
All Complete? → Validate Results
  ↓ Yes
Success? → Prepare Wave 2
  ↓ No
Debug & Fix → Relaunch Failed
```

## 💡 Key Insights for Successor

1. **Parallel Power**: Wave 1 agents work independently - maximize parallelism
2. **Context Chain**: Each task produces output context for next
3. **Atomic Tasks**: 30-minute boundaries keep agents focused
4. **Auto-Recovery**: System designed for failure handling

5. **Model Selection**: Always use Sonnet for implementation tasks
6. **Tool Authorization**: Agents have necessary tools pre-authorized
7. **Progress Tracking**: PID file tracks running agents

## 🔮 Next Session Checklist

1. [ ] Run status check
2. [ ] Verify Wave 1 completion
3. [ ] Validate implementations
4. [ ] Prepare Wave 2 contexts
5. [ ] Launch Wave 2 agents
6. [ ] Update progress tracking

## 📝 Emergency Commands

If everything seems broken:
```bash
# Kill all agents
pkill -f spawn-agent.sh

# Clear state
rm -f tony/.tony/agents/wave1.pids
rm -f tony/.tony/agents/contexts/*-output.json

# Fresh start
./tony/scripts/launch-wave1-agents.sh launch
```

---

Remember: Tony is self-managing. Trust the automation, monitor the progress, and intervene only when necessary. The framework is building itself!