#!/usr/bin/env node

import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🔍 Verifying MosAIc SDK structure...\n');

const requiredDirs = [
  '.mosaic',
  'docs',
  'docs/mosaic-stack',
  'docs/migration',
  'scripts',
  'mosaic',
  'mosaic-mcp'
];

const requiredFiles = [
  'README.md',
  'package.json',
  '.gitmodules',
  'scripts/prepare-mosaic.sh',
  'scripts/migrate-packages.js',
  '.mosaic/stack.config.json',
  '.mosaic/version-matrix.json'
];

const optionalComponents = [
  'mosaic-dev',
  'tony'  // Will be added after 2.7.0
];

let allGood = true;

// Check required directories
console.log('📁 Checking required directories:');
for (const dir of requiredDirs) {
  const path = join(rootDir, dir);
  const exists = existsSync(path);
  console.log(`  ${exists ? '✅' : '❌'} ${dir}`);
  if (!exists) allGood = false;
}

// Check required files
console.log('\n📄 Checking required files:');
for (const file of requiredFiles) {
  const path = join(rootDir, file);
  const exists = existsSync(path);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allGood = false;
}

// Check optional components
console.log('\n📦 Checking optional components:');
for (const component of optionalComponents) {
  const path = join(rootDir, component);
  const exists = existsSync(path);
  console.log(`  ${exists ? '✅' : '⏳'} ${component} ${exists ? '' : '(not yet added)'}`);
}

// Summary
console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('✅ MosAIc SDK structure is valid!');
  console.log('\nNext steps:');
  console.log('1. Run: npm install');
  console.log('2. Run: npm run setup');
  console.log('3. Wait for Tony 2.7.0 completion before adding tony submodule');
  process.exit(0);
} else {
  console.log('❌ MosAIc SDK structure has issues');
  console.log('\nPlease run: npm run prepare:mosaic');
  process.exit(1);
}