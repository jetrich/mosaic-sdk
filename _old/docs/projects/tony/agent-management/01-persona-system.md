---
title: "MosAIc Agent Persona System"
slug: "persona-system"
description: "Comprehensive guide to the MosAIc Agent Persona System for consistent, personality-driven agent behaviors"
priority: 1
tags: ["tony", "agents", "personas", "framework"]
---

# MosAIc Agent Persona System

## Overview

The MosAIc Agent Persona System provides consistent, personality-driven agent behaviors across the entire development lifecycle. Each agent is assigned a specific persona that defines their expertise, communication style, tool preferences, and collaboration patterns.

## Why Personas?

1. **Consistency**: Every agent behaves predictably based on their role
2. **Specialization**: Agents excel in their domain with appropriate tools and models
3. **Collaboration**: Clear handoff patterns between complementary personas
4. **Personality**: Agents feel more human and engaging to work with
5. **Quality**: Domain experts ensure best practices in their specialization

## Available Personas

### Executive Level (Strategic Decision Making)
- **CEO-STRATEGIC-SOPHIA**: Chief Executive Officer - Vision, strategy, business planning
- **CTO-TECHNICAL-THOMAS**: Chief Technology Officer - Architecture, technical strategy
- **CPO-PRODUCT-PATRICIA**: Chief Product Officer - Product vision, user experience

### Management (Coordination & Leadership)
- **TL-LEAD-TONY**: Technical Lead - Multi-agent orchestration, task decomposition
- **PM-PROJECT-PAUL**: Project Manager - Timeline management, resource allocation
- **EM-ENGINEERING-EMMA**: Engineering Manager - Team leadership, performance management

### Development (Implementation)
- **BE-BACKEND-BENJAMIN**: Backend Engineer - APIs, server-side logic, databases
- **FE-FRONTEND-FIONA**: Frontend Engineer - React, UI/UX implementation
- **FS-FULLSTACK-FELIX**: Full Stack Engineer - End-to-end feature development
- **ML-LEARNING-MARCUS**: Machine Learning Engineer - ML models, data science

### Quality Assurance (Testing & Validation)
- **QA-QUALITY-QUINN**: QA Engineer - Test strategy, bug verification
- **TEST-AUTOMATION-TARA**: Test Automation Engineer - Automated test suites
- **PERF-PERFORMANCE-PETER**: Performance Engineer - Load testing, optimization

### Security & Compliance
- **SEC-SECURITY-SARAH**: Security Engineer - Vulnerability assessment, threat modeling
- **AUDIT-COMPLIANCE-ALEX**: Compliance Auditor - Regulatory compliance, audits

### Operations (Infrastructure & Reliability)
- **DEVOPS-OPERATIONS-OLIVER**: DevOps Engineer - CI/CD, containerization
- **SRE-RELIABILITY-RACHEL**: Site Reliability Engineer - System reliability, monitoring

### Data (Data Management & Analytics)
- **DB-DATABASE-DIANA**: Database Engineer - Schema design, query optimization
- **DE-ENGINEER-ETHAN**: Data Engineer - ETL pipelines, data warehousing

### Support (Documentation & Design)
- **DOC-DOCUMENTATION-DAVID**: Technical Writer - Documentation, guides
- **UX-EXPERIENCE-URSULA**: UX Designer - User research, interface design

## Using Personas

### Automatic Selection
Tony (Technical Lead) automatically selects appropriate personas based on task keywords:

```bash
# Tony detects "backend API" and assigns BE-BACKEND-BENJAMIN
"Create a REST API for user management"

# Tony detects "security" and assigns SEC-SECURITY-SARAH  
"Review code for security vulnerabilities"
```

### Manual Assignment
Explicitly request a specific persona:

```bash
"Deploy BE-BACKEND-BENJAMIN for the payment service implementation"
"Use QA-QUALITY-QUINN to create comprehensive test plans"
```

### Persona Loader Script
Use the persona loader to work with personas directly:

```bash
# List all available personas
./tony/scripts/operations/agents/persona-loader.sh --list

# Search for personas by keyword
./tony/scripts/operations/agents/persona-loader.sh --search backend

# Validate a persona definition
./tony/scripts/operations/agents/persona-loader.sh --persona BE-BACKEND-BENJAMIN --validate

# Inject persona into agent context
./tony/scripts/operations/agents/persona-loader.sh \
  --persona FE-FRONTEND-FIONA \
  --context input-context.json \
  --output enhanced-context.json
```

## Persona Structure

Each persona is defined by a YAML file with the following structure:

```yaml
id: DOMAIN-ROLE-NAME        # Unique identifier
version: 1.0.0              # Persona version

identity:
  domain: DEVELOPMENT       # Primary domain
  role: BACKEND            # Specific role
  name: Benjamin           # Human name
  title: Senior Backend Engineer
  pronouns: he/him

expertise:
  primary: [API design, Database optimization]
  technologies: [Node.js, PostgreSQL, Redis]
  methodologies: [RESTful design, TDD]

personality:
  traits: [Analytical, Thorough, Reliable]
  communication_style: technical
  work_style: detail-oriented
  values: [Code quality, Performance, Testing]

tools:
  required: [Read, Write, Edit, Bash]
  preferred: [MultiEdit, Grep]
  authorized: [full tool list]
  restrictions: [No frontend modifications]

model_preferences:
  default: sonnet          # For implementation
  task_overrides:
    architecture: opus     # For complex design

interaction_patterns:
  collaborates_with: [FE-FRONTEND-FIONA, DB-DATABASE-DIANA]
  reports_to: [TL-LEAD-TONY]
  handoff_style: "Detailed API docs with examples"

task_affinities:
  primary_tasks: [API development, Backend services]
  avoid_tasks: [Frontend, UI design]
  task_keywords: [backend, API, server]
```

## Model Selection Guidelines

Personas use specific models based on task complexity:

### Opus Model Users (Complex Reasoning)
- Executive personas (CEO, CTO, CPO)
- Tech Lead Tony (orchestration)
- Security Sarah (threat analysis)
- UX Ursula (design thinking)
- SRE Rachel (reliability analysis)

### Sonnet Model Users (Implementation)
- Development engineers (Backend, Frontend, Full Stack)
- QA and test automation
- DevOps and operations
- Documentation and support

### Dynamic Selection
Some personas switch models based on task type:
```yaml
model_preferences:
  default: sonnet
  task_overrides:
    architecture_design: opus
    complex_analysis: opus
```

## Collaboration Patterns

### Typical Workflows

1. **Feature Development**
   ```
   PM-PROJECT-PAUL → TL-LEAD-TONY → BE-BACKEND-BENJAMIN + FE-FRONTEND-FIONA
                                   ↓
                     QA-QUALITY-QUINN → TEST-AUTOMATION-TARA
   ```

2. **Security Review**
   ```
   TL-LEAD-TONY → SEC-SECURITY-SARAH → AUDIT-COMPLIANCE-ALEX
                ↓
   BE-BACKEND-BENJAMIN (fixes)
   ```

3. **Performance Optimization**
   ```
   PERF-PERFORMANCE-PETER → BE-BACKEND-BENJAMIN + DB-DATABASE-DIANA
                         ↓
           SRE-RELIABILITY-RACHEL (monitoring)
   ```

## Enforcement Rules

1. **Mandatory Assignment**: Every agent MUST use a persona
2. **Domain Matching**: Persona must match task domain
3. **Tool Restrictions**: Respect persona's tool authorizations
4. **Communication Style**: Maintain persona's personality
5. **Model Preferences**: Use persona's preferred model
6. **Handoff Patterns**: Follow defined collaboration flows

## Integration with Tony Framework

The persona system integrates seamlessly with Tony's spawn-agent.sh:

```bash
# Tony automatically selects appropriate persona
./scripts/spawn-agent.sh \
  --context task-context.json \
  --agent-type implementation-agent
  # Persona selected based on task analysis

# Manual persona override
./scripts/spawn-agent.sh \
  --context task-context.json \
  --agent-type implementation-agent \
  --persona BE-BACKEND-BENJAMIN
```

## Creating Custom Personas

While the system provides comprehensive coverage, you can extend it:

1. Copy `base-persona-template.yaml` to new persona file
2. Follow naming convention: `DOMAIN-ROLE-NAME.yaml`
3. Define all required fields per `persona-schema.json`
4. Validate with persona loader script
5. Update CLAUDE.md with new triggers

## Best Practices

1. **Let Tony Choose**: Default to automatic persona selection
2. **Domain Expertise**: Use domain-specific personas for best results
3. **Respect Boundaries**: Don't force personas outside their expertise
4. **Collaboration**: Leverage natural handoff patterns
5. **Personality Consistency**: Maintain persona traits throughout session

## Quick Reference

| Task Type | Keywords | Assigned Persona |
|-----------|----------|------------------|
| Backend Development | API, server, endpoint | BE-BACKEND-BENJAMIN |
| Frontend Development | UI, React, component | FE-FRONTEND-FIONA |
| Database Work | SQL, schema, query | DB-DATABASE-DIANA |
| Testing | QA, test, quality | QA-QUALITY-QUINN |
| Security | vulnerability, security | SEC-SECURITY-SARAH |
| DevOps | deployment, CI/CD | DEVOPS-OPERATIONS-OLIVER |
| Documentation | docs, guide, README | DOC-DOCUMENTATION-DAVID |
| Architecture | system design, architecture | CTO-TECHNICAL-THOMAS |
| Coordination | plan, orchestrate | TL-LEAD-TONY |

## File Locations

- **Personas**: `tony/personas/{domain}/`
- **Schema**: `tony/personas/schemas/persona-schema.json`
- **Base Template**: `tony/templates/personas/base-persona-template.yaml`
- **Loader Script**: `tony/scripts/operations/agents/persona-loader.sh`
- **Context Schema**: `tony/personas/schemas/agent-context-schema.json`

---

The MosAIc Agent Persona System ensures every agent interaction is consistent, specialized, and engaging. By embodying specific roles and personalities, agents provide a more human and effective development experience.