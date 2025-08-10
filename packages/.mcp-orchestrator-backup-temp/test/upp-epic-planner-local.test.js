#!/usr/bin/env node

/**
 * Test script for upp-epic-planner-local agent
 * 
 * This tests the focused epic planning agent with the Sage PHR project
 * to validate the improved local processing approach.
 */

const UppEpicPlannerLocal = require('../src/agents/upp-epic-planner-local.js');

// Test data - Sage PHR project (from user's session)
const testProject = {
  description: `Sage PHR - HIPAA-compliant collaborative personal health record platform for DPC practices.

CORE REQUIREMENTS:
- MVP Launch: August 21, 2025 (50-100 beta users, 1 DPC practice pilot)
- Revenue Target: $2.5k MRR by August 31, $25k MRR by December 2025
- Full-stack platform with Next.js 15 frontend, NestJS backend, PostgreSQL 17 with field-level encryption
- Key integrations: Atlas.md (DPC focus), SRFax (refill requests), FHIR R4, Direct Messaging
- Core entities: SageGarden (collaboration hub), GardenMember (roles), Vital, Medication, Appointment, Document
- Role-based permissions: Owner, Primary Caregiver, Family Member, Healthcare Provider, Emergency Contact, Viewer
- HIPAA compliance throughout with field-level encryption, audit logging, secure communications
- PWA-first with Capacitor for mobile deployment

TECHNICAL STACK:
Frontend: Next.js 15 (App Router), Tailwind CSS, Radix UI, shadcn/ui, React Query
Backend: NestJS REST API, Prisma ORM, Zod validation, Bull queues, FHIR R4 client libraries
Database: PostgreSQL 17 with field-level encryption, Redis 8 for caching/sessions
Storage: MinIO (S3-compatible) for documents
AI: Local Ollama for PHI processing
Security: OAuth 2.0/OIDC, TLS 1.3, AES-256, OPA policies, comprehensive audit logging

INTEGRATION REQUIREMENTS:
- Healthcare systems: Atlas.md primary, FHIR R4 ready, Direct Messaging capable
- Device integrations: Apple HealthKit, Google Fit, Fitbit, CSV/PDF imports
- External services: Paubox (HIPAA email), SRFax (fax), Twilio (SMS - no PHI), Stripe/PayPal payments
- Development phases: Foundation (Week 1), MVP Development (Weeks 2-3), Provider Integration (Week 4)`,
  
  context: {
    domain: 'healthcare-phr',
    projectId: 'sage-phr',
    constraints: [
      'HIPAA compliance',
      'August 21 MVP deadline', 
      'DPC practice focus',
      'Field-level encryption required'
    ]
  }
};

async function runTest() {
  console.log('🚀 Testing upp-epic-planner-local agent\n');
  
  // Initialize agent
  const agent = new UppEpicPlannerLocal();
  console.log(`📝 Agent: ${agent.name}`);
  console.log(`🎯 Capabilities: ${agent.capabilities.join(', ')}\n`);
  
  // Initialize Ollama connection
  console.log('🔌 Initializing Ollama connection...');
  const initSuccess = await agent.initialize();
  
  if (!initSuccess) {
    console.error('❌ Failed to initialize Ollama connection - using fallback mode');
  } else {
    console.log('✅ Ollama connection successful\n');
  }
  
  // Test epic planning
  console.log('🧠 Running epic planning analysis...');
  const startTime = Date.now();
  
  try {
    const result = await agent.planEpics(testProject.description, testProject.context);
    const duration = Date.now() - startTime;
    
    console.log(`\n⏱️  Analysis completed in ${duration}ms\n`);
    
    if (result.success) {
      console.log('✅ EPIC PLANNING SUCCESSFUL\n');
      
      // Display results
      console.log('📊 DOMAIN ANALYSIS:');
      console.log(`   Type: ${result.domainAnalysis.type}`);
      console.log(`   Complexity: ${result.domainAnalysis.complexity}`);
      console.log(`   Specializations: ${result.domainAnalysis.specializations.join(', ')}`);
      console.log(`   Model Used: ${result.domainAnalysis.model}\n`);
      
      console.log('🎯 GENERATED EPICS:');
      result.epics.forEach((epic, index) => {
        console.log(`   ${index + 1}. ${epic.id} - ${epic.title}`);
        console.log(`      Category: ${epic.category}`);
        console.log(`      Hours: ${epic.estimatedHours}`);
        console.log(`      Description: ${epic.description.slice(0, 80)}...`);
        console.log('');
      });
      
      console.log('📈 METADATA:');
      console.log(`   Total Epics: ${result.metadata.totalEpics}`);
      console.log(`   Processing Mode: ${result.metadata.processingMode}`);
      console.log(`   Model: ${result.metadata.model}`);
      console.log(`   Agent: ${result.metadata.agent}\n`);
      
      // Validate results
      console.log('🔍 VALIDATION:');
      const validationResults = validateResults(result);
      validationResults.forEach(validation => {
        const status = validation.passed ? '✅' : '❌';
        console.log(`   ${status} ${validation.test}: ${validation.message}`);
      });
      
    } else {
      console.log('❌ EPIC PLANNING FAILED\n');
      console.log(`Error: ${result.error}`);
      
      if (result.fallback) {
        console.log('\n📋 FALLBACK EPICS GENERATED:');
        result.fallback.forEach((epic, index) => {
          console.log(`   ${index + 1}. ${epic.id} - ${epic.title} (${epic.estimatedHours}h)`);
        });
      }
    }
    
  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
    console.error(error.stack);
  }
}

function validateResults(result) {
  const validations = [];
  
  // Test 1: Epic count is reasonable
  validations.push({
    test: 'Epic Count',
    passed: result.epics.length >= 3 && result.epics.length <= 8,
    message: `Generated ${result.epics.length} epics (expected 3-8)`
  });
  
  // Test 2: Healthcare domain detected
  validations.push({
    test: 'Domain Detection',
    passed: result.domainAnalysis.type === 'healthcare',
    message: `Detected '${result.domainAnalysis.type}' domain (expected 'healthcare')`
  });
  
  // Test 3: HIPAA compliance specialization
  validations.push({
    test: 'Healthcare Specialization',
    passed: result.domainAnalysis.specializations.includes('compliance'),
    message: `Specializations: ${result.domainAnalysis.specializations.join(', ')}`
  });
  
  // Test 4: Proper epic ID format
  const validEpicIds = result.epics.every(epic => /^E\.\d{4}$/.test(epic.id));
  validations.push({
    test: 'Epic ID Format',
    passed: validEpicIds,
    message: validEpicIds ? 'All epic IDs follow E.XXXX format' : 'Some epic IDs have invalid format'
  });
  
  // Test 5: Local processing mode
  validations.push({
    test: 'Local Processing',
    passed: result.metadata.processingMode === 'local-ollama',
    message: `Processing mode: ${result.metadata.processingMode}`
  });
  
  // Test 6: Security/compliance epic present
  const hasSecurityEpic = result.epics.some(epic => 
    epic.id.startsWith('E.6') || epic.title.toLowerCase().includes('compliance') || epic.title.toLowerCase().includes('security')
  );
  validations.push({
    test: 'Security Epic Present',
    passed: hasSecurityEpic,
    message: hasSecurityEpic ? 'Found security/compliance epic' : 'No security/compliance epic found'
  });
  
  return validations;
}

// Run the test
if (require.main === module) {
  runTest().catch(console.error);
}

module.exports = { runTest, testProject };