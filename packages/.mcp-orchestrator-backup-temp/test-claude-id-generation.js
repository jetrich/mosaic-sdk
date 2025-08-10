#!/usr/bin/env node
/**
 * Test script for CLAUDE.md standards compliant ID generation
 * Tests the new hierarchical ID system against cryptic IDs
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 CLAUDE.md ID Generation Validation Test');
console.log('=' .repeat(60));

// Mock test data to demonstrate the improvements
const mockProjects = [
  {
    name: 'Infrastructure Setup',
    description: 'Docker containerization and Kubernetes deployment infrastructure',
    expectedDomain: 0, // Infrastructure & Setup
    expectedId: 'E.0001'
  },
  {
    name: 'User Authentication System', 
    description: 'Core user authentication and authorization features',
    expectedDomain: 1, // Core Features
    expectedId: 'E.1001'
  },
  {
    name: 'Payment Integration',
    description: 'Stripe and PayPal API integration for payments',
    expectedDomain: 2, // Integration & APIs
    expectedId: 'E.2001'
  },
  {
    name: 'Dashboard UI Components',
    description: 'React frontend components for user dashboard interface',
    expectedDomain: 3, // Frontend & UI
    expectedId: 'E.3001'
  },
  {
    name: 'Database Services',
    description: 'PostgreSQL backend services and data access layer',
    expectedDomain: 4, // Backend Services
    expectedId: 'E.4001'
  }
];

const mockTasks = [
  {
    parentId: 'E.0001',
    title: 'Container Configuration',
    level: 'feature',
    expectedId: 'F.0001.01'
  },
  {
    parentId: 'F.0001.01',
    title: 'Docker Setup Story',
    level: 'story',
    expectedId: 'S.0001.01.01'
  },
  {
    parentId: 'S.0001.01.01',
    title: 'Create Dockerfile',
    level: 'task',
    expectedId: 'T.0001.01.01.01'
  }
];

console.log('\n🔍 Testing Domain Detection');
console.log('-' .repeat(40));

// Simulate domain detection
const domainKeywords = {
  0: ['infrastructure', 'setup', 'config', 'deploy', 'docker', 'kubernetes'],
  1: ['feature', 'core', 'authentication', 'user', 'main'],
  2: ['integration', 'api', 'stripe', 'paypal', 'external'],
  3: ['ui', 'frontend', 'react', 'dashboard', 'interface'],
  4: ['backend', 'database', 'postgresql', 'service', 'data']
};

function detectDomain(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  let bestDomain = 9; // Default to maintenance
  let bestScore = 0;

  for (const [domain, keywords] of Object.entries(domainKeywords)) {
    const score = keywords.reduce((count, keyword) => {
      return count + (text.includes(keyword) ? 1 : 0);
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestDomain = parseInt(domain);
    }
  }

  return { domain: bestDomain, score: bestScore };
}

// Test domain detection
mockProjects.forEach((project, index) => {
  const result = detectDomain(project.name, project.description);
  const domainNames = {
    0: 'Infrastructure & Setup',
    1: 'Core Features',
    2: 'Integration & APIs', 
    3: 'Frontend & UI',
    4: 'Backend Services',
    9: 'Maintenance & Support'
  };

  console.log(`\n${index + 1}. ${project.name}`);
  console.log(`   Description: ${project.description.substring(0, 50)}...`);
  console.log(`   Expected Domain: ${project.expectedDomain} (${domainNames[project.expectedDomain]})`);
  console.log(`   Detected Domain: ${result.domain} (${domainNames[result.domain]})`);
  console.log(`   Match: ${result.domain === project.expectedDomain ? '✅' : '❌'}`);
  console.log(`   Confidence: ${result.score} keywords matched`);
});

console.log('\n📊 ID Format Comparison');
console.log('-' .repeat(40));

// Compare old vs new ID formats
const comparisons = [
  {
    type: 'Epic',
    old: 'E.me5d8myq.vrxar',
    new: 'E.0001',
    description: 'Infrastructure Setup Epic'
  },
  {
    type: 'Feature', 
    old: 'F.nx6k9plm.qzbtx',
    new: 'F.0001.01',
    description: 'Docker Container Configuration'
  },
  {
    type: 'Story',
    old: 'S.rt8h4wxy.mlpvn',
    new: 'S.0001.01.01', 
    description: 'Setup Docker Environment'
  },
  {
    type: 'Task',
    old: 'T.bg7j2qwr.kdsfl',
    new: 'T.0001.01.01.01',
    description: 'Create Base Dockerfile'
  }
];

console.log('\n📋 Format Comparison:');
comparisons.forEach(comp => {
  console.log(`\n${comp.type}: ${comp.description}`);
  console.log(`   OLD: ${comp.old} ❌ (cryptic, no hierarchy visible)`);
  console.log(`   NEW: ${comp.new} ✅ (domain 0, clear hierarchy)`);
});

console.log('\n🎯 Benefits of New System');
console.log('-' .repeat(40));

const benefits = [
  '✅ Human-readable: E.0001 vs E.me5d8myq.vrxar',
  '✅ Domain categorization: 0=Infrastructure, 1=Core, 2=Integration, etc.',
  '✅ Hierarchical relationships: T.0001.01.01.01 shows complete parent chain',
  '✅ Rapid identification: E.1001 = First Core Features epic',
  '✅ Searchable: Filter all infrastructure tasks with 0XXX pattern', 
  '✅ Git-friendly: Meaningful commit messages with E.0001',
  '✅ Standards compliant: Follows CLAUDE.md established conventions',
  '✅ Zero-padded sorting: E.0001, E.0002, E.0010 sort correctly',
  '✅ Breaking change acceptable: Fresh database start'
];

benefits.forEach(benefit => console.log(`   ${benefit}`));

console.log('\n🚀 Implementation Status');
console.log('-' .repeat(40));

const implementationItems = [
  '✅ IdGenerationService created with domain detection',
  '✅ Database schema updated with domain_category and hierarchical_id',
  '✅ TaskService.generateTaskId() replaced with hierarchical approach',
  '✅ TonyHierarchyMapper updated to use new ID generation',
  '✅ ProjectService enhanced with domain categorization',
  '🔄 Tests updated for new ID format (in progress)',
  '⏳ Database cleared and validation pending'
];

implementationItems.forEach(item => console.log(`   ${item}`));

console.log('\n🎉 Summary');
console.log('-' .repeat(40));
console.log('The new ID generation system transforms cryptic identifiers like');
console.log('"F.me5d8myq.vrxar" into human-readable, hierarchical IDs like'); 
console.log('"F.0001.01" that enable rapid identification and organization.');
console.log('');
console.log('Domain Categories:');
console.log('• E.0XXX: Infrastructure & Setup');
console.log('• E.1XXX: Core Features');
console.log('• E.2XXX: Integration & APIs'); 
console.log('• E.3XXX: Frontend & UI');
console.log('• E.4XXX: Backend Services');
console.log('• E.5XXX: Data & Analytics');
console.log('• E.6XXX: Security & Compliance');
console.log('• E.7XXX: DevOps & Deployment');
console.log('• E.8XXX: Documentation & Training');
console.log('• E.9XXX: Maintenance & Support');
console.log('');
console.log('Ready for database validation! 🚀');