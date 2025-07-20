#!/usr/bin/env node

// Tony Framework Installation Check
// Verifies the installation is successful

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0]);
  
  if (majorVersion < 16) {
    console.warn('⚠️  Warning: Node.js 16+ recommended, current:', nodeVersion);
  } else {
    console.log('✅ Node.js version check passed:', nodeVersion);
  }
  
  // Read version info
  const versionPath = join(__dirname, '..', 'VERSION');
  const versionInfo = readFileSync(versionPath, 'utf8').split('\n');
  console.log('📦 Tony Framework', versionInfo[0], '-', versionInfo[1]);
  
  console.log('🎉 Tony Framework installation successful!');
  console.log('📚 Documentation: https://github.com/jetrich/tony-ng');
  
} catch (error) {
  console.error('❌ Installation check failed:', error.message);
  process.exit(1);
}
