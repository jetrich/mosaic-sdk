# MosAIc Business Planning Framework

This directory contains standardized business planning templates and configurations for the MosAIc Planning Plugin, following CLAUDE.md directory structure requirements.

## Domain-Based Planning Structure

Each permitted domain has its own subdirectory with standardized planning templates:

```
business-plan/
├── README.md (this file)
├── healthcare/
│   ├── README.md
│   ├── planning/
│   └── HEALTHCARE_PLAN.md
├── fintech/
│   ├── README.md  
│   ├── planning/
│   └── FINTECH_PLAN.md
├── saas/
│   ├── README.md
│   ├── planning/
│   └── SAAS_PLAN.md
└── ... (other domains)
```

## Permitted Domains

The following domains are standardized and mapped to Epic Categories (E.CXXX) per CLAUDE.md:

### Category 6 - Security & Compliance
- **healthcare** - Healthcare & Medical Technology (HIPAA, FDA)
- **fintech** - Financial Technology (SOX, PCI-DSS, KYC/AML)

### Category 1 - Core Features  
- **saas** - Software as a Service (B2B/B2C platforms)
- **ecommerce** - E-commerce & Marketplace platforms
- **edtech** - Education Technology (FERPA compliance)
- **media** - Media & Entertainment platforms
- **proptech** - Property & Real Estate Technology

### Category 4 - Backend Services
- **enterprise** - Enterprise Software (ERP, CRM)

### Category 3 - Frontend & UI
- **consumer** - Consumer Applications (Mobile, Social)

### Category 5 - Data & Analytics
- **manufacturing** - Manufacturing & IoT platforms
- **logistics** - Logistics & Supply Chain optimization

## Planning Agent Requirements

All `upp-*-planner` agents MUST:
- Use domains defined in `src/config/domains.ts`
- Follow the Epic Category mapping (E.CXXX format)
- Create domain-specific planning documents in appropriate subdirectories
- Maintain compliance requirements per domain
- Follow standardized business model templates

## Integration with MosAIc Stack

- **MCP Integration**: All planning agents use MosAIc MCP infrastructure (port 3456)
- **Global Configuration**: Respects global routing preferences (local vs remote)
- **Tony Framework**: Follows established persona and agent patterns
- **State Management**: Uses persistent state tracking across sessions

## Domain Detection

The planning plugin automatically detects domains from project descriptions using keyword analysis:
- **Healthcare**: health, medical, hipaa, patient, clinic
- **Fintech**: payment, bank, financial, money, lending
- **E-commerce**: shop, store, marketplace, retail, commerce
- **Enterprise**: enterprise, crm, erp, business, corporate
- **Consumer**: mobile app, social, game, consumer, user
- **Education**: education, learning, school, student, course
- **Media**: media, content, streaming, video, publishing
- **Manufacturing**: manufacturing, iot, industrial, factory
- **PropTech**: real estate, property, housing, rental
- **Logistics**: logistics, shipping, delivery, transport

## Usage

```bash
# Business planning with domain auto-detection
/plan-business --project=my-project --description="Healthcare platform for patient records"

# Explicit domain specification  
/plan-business --project=my-project --domain=fintech --description="Payment processing platform"

# Complete pipeline with domain-aware planning
/plan-all --project=my-project --description="E-commerce marketplace for small businesses"
```

## Compliance Integration

Each domain automatically applies appropriate compliance requirements:
- **HIPAA** for healthcare domains
- **SOX, PCI-DSS** for fintech domains  
- **GDPR** for most domains (global privacy)
- **FERPA** for education domains
- **Industry-specific** requirements per domain

This ensures all planning agents generate compliant architecture and business strategies.