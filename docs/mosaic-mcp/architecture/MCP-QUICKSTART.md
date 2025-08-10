# MosAIc MCP Quickstart Guide

**Version**: 0.0.2  
**Status**: Getting Started Guide  
**Date**: August 3, 2025  

## Welcome to MosAIc MCP

Get from zero to productive in 5 minutes with MosAIc's Model Context Protocol ecosystem. This guide will have you decomposing tasks, saving tokens, and coordinating agents in no time.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Claude or OpenCode account
- 5 minutes of your time

## Quick Installation

### Option 1: Full Installation (Recommended)

```bash
# Install everything you need
npm install -g @mosaicstack/mcp

# Verify installation
mosaic-mcp --version
# ✓ MosAIc MCP v0.0.2 installed

# Quick setup
mosaic-mcp setup
```

**What you get:**
- ✅ Universal MCP Gateway (works with Claude & OpenCode)
- ✅ UPP Task Decomposition with Sequential Thinking
- ✅ Pattern Library (learn from every decomposition)
- ✅ Natural Language Commands
- ✅ CLI Tools

### Option 2: Try Before You Install

```bash
# Use npx for a test drive
npx @mosaicstack/mcp start --demo

# This starts a demo server with sample patterns
```

## First Steps

### 1. Connect Your AI Tool

#### For Claude Users
Claude connects automatically via stdio - no configuration needed!

#### For OpenCode Users
```bash
# Add to your opencode.json
{
  "mcp": {
    "mosaic": {
      "type": "remote",
      "url": "http://localhost:3456"
    }
  }
}
```

### 2. Start the MCP Server

```bash
# Start all MCP services
mosaic-mcp start

# ✓ MCP Gateway listening on port 3456
# ✓ UPP Decomposer ready
# ✓ Pattern Library loaded (3 demo patterns)
# ✓ Command Router active
# ✓ All 31 tools available
```

### 3. Test Your First Command

In Claude or OpenCode, try:

```
/plan "Build a simple todo app"
```

**What happens:**
1. 🔍 Checks pattern library (finds "crud-app-v2")
2. ⚡ Adapts pattern to your request (500 tokens vs 5,000)
3. 📋 Returns complete UPP decomposition
4. 💾 Saves adapted pattern for next time

**Expected output:**
```
Planning: Simple Todo App (using pattern: crud-app-v2)
✓ Token savings: 4,200 tokens (84% reduction)

Epic: Todo Application (6 weeks)
├── Feature: Task Management (2 weeks)
│   ├── Story: Create tasks
│   ├── Story: Edit tasks  
│   └── Story: Delete tasks
├── Feature: User Interface (2 weeks)
│   ├── Story: Task list view
│   ├── Story: Task form
│   └── Story: Responsive design
└── Feature: Data Persistence (2 weeks)
    ├── Story: Database setup
    ├── Story: API endpoints
    └── Story: Data validation

→ 23 atomic tasks created
→ Estimated: 6 weeks total
→ Assigned to: FS-FULLSTACK-FELIX
→ Pattern saved as: "todo-app-v1"
```

## Core Commands

### Task Planning

```bash
# Basic planning
/plan "User authentication system"

# With options
/plan "Payment processing" --level feature --assign @benjamin

# Natural language
"Break down the shopping cart feature"
"I need to implement user profiles"
```

### View Tasks

```bash
# See all tasks
/tasks

# Filter by assignee  
/tasks @felix

# By status
/tasks in-progress

# Natural language
"What should I work on?"
"Show me what's overdue"
```

### Project Management

```bash
# Switch projects
/project switch backend-api

# Project overview
/project status

# Natural language
"Switch to the mobile app project"
"What projects do we have?"
```

### Pattern Management

```bash
# Save current plan as pattern
/pattern save "auth-system"

# Apply existing pattern
/pattern apply "auth-system" "New API authentication"

# Browse patterns
/pattern list
```

## Your First Real Project

Let's walk through planning a complete feature:

### Step 1: Plan the Epic

```
/plan "E-commerce product catalog with search and filtering"
```

**Result:** Complete epic breakdown with features, stories, tasks, subtasks, and atomic actions.

### Step 2: Save as Pattern

```
/pattern save "ecommerce-catalog" --category ecommerce --share team
```

**Result:** Pattern saved and shared with your team for future use.

### Step 3: Check Token Savings

```
/usage breakdown
```

**Result:** 
```
Token Usage Report:
├── This session: 847 tokens
├── Without patterns: 8,200 tokens  
├── Savings: 7,353 tokens (89.7%)
├── Cost saved: $0.22
└── Time saved: ~15 minutes
```

### Step 4: Start Working

```
/tasks @me todo priority:high limit:1
```

**Result:** Your next highest-priority task, ready to work on.

## Integration Examples

### Claude Workflow

```python
# In your Claude session:

# 1. Plan a feature
"Plan the user notification system"

# 2. Get your work
"What should I work on next?"

# 3. Check progress  
"Show me the notification epic progress"

# 4. Get help
"How do I implement push notifications?" # Uses Context7
```

### OpenCode Workflow

```bash
# In OpenCode terminal:

# 1. Switch context
/project switch notification-service

# 2. Plan feature
/plan "Real-time notifications with WebSocket"

# 3. Start coding
/tasks @me atomic limit:1
# → TASK-123: Set up WebSocket server (30 min)

# 4. Mark complete
/tasks complete TASK-123
```

## Configuration

### Basic Configuration

```yaml
# ~/.mosaic/mcp/config.yaml
mcp:
  gateway:
    port: 3456
    
  upp:
    patterns: true
    sequential_thinking: true
    
  commands:
    natural_language: true
    
  projects:
    default: "current"
    
  team:
    share_patterns: true
```

### Advanced Settings

```yaml
# Enable specific features
features:
  plane_integration: false    # Requires Plane.so API key
  context7_docs: true        # Free documentation access
  token_optimization: true   # Track and optimize usage
  team_collaboration: true   # Share patterns with team
  
# Customize behavior  
behavior:
  auto_assign_agents: true
  prefer_patterns: true
  suggest_improvements: true
  
# Performance tuning
performance:
  cache_patterns: true
  preload_common: true
  batch_operations: true
```

## Troubleshooting

### Common Issues

#### ❌ "MCP server failed to start"
```bash
# Check if port 3456 is in use
lsof -i :3456

# Try a different port
mosaic-mcp start --port 3457

# Update OpenCode config
# "url": "http://localhost:3457"
```

#### ❌ "Pattern not found"
```bash
# Rebuild pattern index
mosaic-mcp patterns rebuild

# Check pattern storage
mosaic-mcp patterns list --verbose
```

#### ❌ "Command not recognized"
```bash
# Enable natural language
mosaic-mcp configure --natural-language true

# Check command registry
mosaic-mcp commands list
```

### Getting Help

```bash
# Built-in help
mosaic-mcp help
mosaic-mcp help patterns

# Health check
mosaic-mcp health

# Debug mode
mosaic-mcp start --debug

# Community
mosaic-mcp community
```

## What's Next?

### Immediate Next Steps

1. **Try More Commands**
   ```bash
   /docs react hooks          # Get documentation
   /pattern search auth       # Find patterns
   /usage weekly             # Usage report
   ```

2. **Create Your First Pattern**
   - Plan something complex
   - Save it as a pattern
   - Use it again tomorrow

3. **Invite Your Team**
   ```bash
   mosaic-mcp team invite alice@company.com
   ```

### Advanced Features to Explore

#### Plane.so Integration
```bash
# Connect to Plane.so for persistent task management
mosaic-mcp configure --plane-api-key YOUR_API_KEY
mosaic-mcp configure --plane-workspace your-workspace
```

#### Custom Agents
```bash
# Create project-specific agent personas
mosaic-mcp agents create "API-EXPERT-ALEX" \
  --skills "REST API design, OpenAPI, rate limiting" \
  --model "claude-3-opus"
```

#### Pattern Marketplace
```bash
# Browse public patterns
mosaic-mcp marketplace browse

# Import popular patterns
mosaic-mcp marketplace import "microservices-starter-v2"
```

## Best Practices

### 1. Start Small
- Use `/plan` for one feature at a time
- Save successful decompositions as patterns
- Build your pattern library gradually

### 2. Use Natural Language
- "What should I work on?" vs `/tasks @me todo`
- "Plan the auth system" vs `/plan "authentication system"`
- MosAIc understands context

### 3. Share Knowledge
- Save patterns for your team
- Use descriptive pattern names
- Add context to your patterns

### 4. Monitor Token Usage
- Check `/usage` regularly
- Celebrate savings milestones
- Share savings with your team

## Success Stories

### Team Alpha: 92% Token Reduction
*"We went from spending $400/month on Claude API to $32/month. The pattern library basically pays for itself after the second use."*

### Team Beta: 10x Faster Planning
*"What used to take us 2 hours of back-and-forth now takes 5 minutes. Our sprint planning went from half a day to 30 minutes."*

### Team Gamma: Perfect Handoffs
*"When developers leave, their knowledge stays in the patterns. New team members are productive on day one."*

## Community & Support

### Get Help
- 📖 **Docs**: https://docs.mosaicstack.dev/mcp
- 💬 **Discord**: https://discord.gg/mosaic
- 🐙 **GitHub**: https://github.com/mosaicstack/mcp
- 📧 **Email**: support@mosaicstack.dev

### Contribute
- 🎯 **Report Issues**: GitHub Issues
- 💡 **Feature Requests**: GitHub Discussions  
- 🔧 **Pull Requests**: Always welcome
- 📝 **Patterns**: Share your successful patterns

### Stay Updated
- 🔔 **Newsletter**: Weekly MCP updates
- 🐦 **Twitter**: @MosAIcStack
- 📰 **Blog**: https://blog.mosaicstack.dev

---

**🎉 Congratulations!** You're now ready to use MosAIc MCP to transform your development workflow. Start with simple planning commands and watch as the system learns from your team's collective intelligence.

*Remember: Every pattern you create makes the entire team more efficient. You're not just saving tokens - you're building institutional knowledge.*