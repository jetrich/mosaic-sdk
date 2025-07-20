#!/usr/bin/env node
/**
 * migrate-packages.js - Migrate package names from Tony to MosAIc namespace
 */

const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Package name mappings
const packageMappings = {
  '@tony-framework/mcp': '@mosaic/mcp',
  '@tony-ai/sdk': '@mosaic/dev',
  '@tony-framework/core': '@tony/core', // Tony keeps its identity
  'tony-mcp': 'mosaic-mcp',
  'tony-dev': 'mosaic-dev',
  'tony-sdk': 'mosaic-sdk'
};

// Repository URL mappings
const repoMappings = {
  'https://github.com/jetrich/tony-mcp': 'https://github.com/jetrich/mosaic-mcp',
  'https://github.com/jetrich/tony-sdk': 'https://github.com/jetrich/mosaic-sdk',
  'github.com/jetrich/tony-mcp': 'github.com/jetrich/mosaic-mcp',
  'github.com/jetrich/tony-sdk': 'github.com/jetrich/mosaic-sdk'
};

// Files to check and update
const filesToCheck = [
  'package.json',
  'tony-mcp/package.json',
  'tony-dev/package.json',
  'README.md',
  '**/*.ts',
  '**/*.js',
  '**/*.json'
];

console.log(`${colors.blue}=== MosAIc Package Migration Tool ===${colors.reset}`);
console.log(`${colors.blue}Migrating packages to MosAIc namespace${colors.reset}\n`);

// Function to update package.json files
function updatePackageJson(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const pkg = JSON.parse(content);
    let updated = false;

    // Update package name
    if (packageMappings[pkg.name]) {
      console.log(`${colors.yellow}Updating package name: ${pkg.name} → ${packageMappings[pkg.name]}${colors.reset}`);
      pkg.name = packageMappings[pkg.name];
      updated = true;
    }

    // Update dependencies
    if (pkg.dependencies) {
      for (const [oldName, newName] of Object.entries(packageMappings)) {
        if (pkg.dependencies[oldName]) {
          console.log(`${colors.yellow}Updating dependency: ${oldName} → ${newName}${colors.reset}`);
          pkg.dependencies[newName] = pkg.dependencies[oldName];
          delete pkg.dependencies[oldName];
          updated = true;
        }
      }
    }

    // Update devDependencies
    if (pkg.devDependencies) {
      for (const [oldName, newName] of Object.entries(packageMappings)) {
        if (pkg.devDependencies[oldName]) {
          console.log(`${colors.yellow}Updating devDependency: ${oldName} → ${newName}${colors.reset}`);
          pkg.devDependencies[newName] = pkg.devDependencies[oldName];
          delete pkg.devDependencies[oldName];
          updated = true;
        }
      }
    }

    // Update repository URLs
    if (pkg.repository && pkg.repository.url) {
      for (const [oldUrl, newUrl] of Object.entries(repoMappings)) {
        if (pkg.repository.url.includes(oldUrl)) {
          console.log(`${colors.yellow}Updating repository URL${colors.reset}`);
          pkg.repository.url = pkg.repository.url.replace(oldUrl, newUrl);
          updated = true;
        }
      }
    }

    // Update bugs URL
    if (pkg.bugs && pkg.bugs.url) {
      for (const [oldUrl, newUrl] of Object.entries(repoMappings)) {
        if (pkg.bugs.url.includes(oldUrl)) {
          console.log(`${colors.yellow}Updating bugs URL${colors.reset}`);
          pkg.bugs.url = pkg.bugs.url.replace(oldUrl, newUrl);
          updated = true;
        }
      }
    }

    // Update homepage
    if (pkg.homepage) {
      for (const [oldUrl, newUrl] of Object.entries(repoMappings)) {
        if (pkg.homepage.includes(oldUrl)) {
          console.log(`${colors.yellow}Updating homepage URL${colors.reset}`);
          pkg.homepage = pkg.homepage.replace(oldUrl, newUrl);
          updated = true;
        }
      }
    }

    // Write updated package.json
    if (updated) {
      fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2) + '\n');
      console.log(`${colors.green}✓ Updated: ${filePath}${colors.reset}\n`);
    } else {
      console.log(`${colors.green}✓ No changes needed: ${filePath}${colors.reset}\n`);
    }

    return updated;
  } catch (error) {
    console.error(`${colors.red}✗ Error updating ${filePath}: ${error.message}${colors.reset}`);
    return false;
  }
}

// Function to update import statements in source files
function updateImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Update import statements
    for (const [oldName, newName] of Object.entries(packageMappings)) {
      const importRegex = new RegExp(`from ['"]${oldName}['"]`, 'g');
      const requireRegex = new RegExp(`require\\(['"]${oldName}['"]\\)`, 'g');
      
      if (importRegex.test(content) || requireRegex.test(content)) {
        content = content.replace(importRegex, `from '${newName}'`);
        content = content.replace(requireRegex, `require('${newName}')`);
        updated = true;
        console.log(`${colors.yellow}Updated imports in: ${filePath}${colors.reset}`);
      }
    }

    if (updated) {
      fs.writeFileSync(filePath, content);
      console.log(`${colors.green}✓ Updated: ${filePath}${colors.reset}`);
    }

    return updated;
  } catch (error) {
    // Ignore errors for non-text files
    return false;
  }
}

// Main migration function
function migrate() {
  const rootDir = process.cwd();
  let filesUpdated = 0;

  // Check if we're in the right directory
  if (!fs.existsSync(path.join(rootDir, 'tony-mcp'))) {
    console.error(`${colors.red}✗ Not in tony-sdk root directory${colors.reset}`);
    process.exit(1);
  }

  // Update package.json files
  console.log(`${colors.blue}Updating package.json files...${colors.reset}\n`);
  
  const packageJsonFiles = [
    'tony-mcp/package.json',
    'tony-dev/package.json'
  ];

  for (const file of packageJsonFiles) {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
      if (updatePackageJson(filePath)) {
        filesUpdated++;
      }
    }
  }

  // Update source files
  console.log(`${colors.blue}Checking source files for import updates...${colors.reset}\n`);
  
  const sourceExtensions = ['.ts', '.js', '.tsx', '.jsx'];
  const dirsToCheck = ['tony-mcp/src', 'tony-dev/src', 'examples', 'scripts'];
  
  for (const dir of dirsToCheck) {
    const dirPath = path.join(rootDir, dir);
    if (fs.existsSync(dirPath)) {
      walkDir(dirPath, (filePath) => {
        if (sourceExtensions.some(ext => filePath.endsWith(ext))) {
          if (updateImports(filePath)) {
            filesUpdated++;
          }
        }
      });
    }
  }

  // Summary
  console.log(`\n${colors.blue}=== Migration Summary ===${colors.reset}`);
  console.log(`Files updated: ${filesUpdated}`);
  console.log(`${colors.green}✓ Package migration complete${colors.reset}`);
  
  // Next steps
  console.log(`\n${colors.blue}=== Next Steps ===${colors.reset}`);
  console.log('1. Review the changes');
  console.log('2. Run: npm install (to update lock files)');
  console.log('3. Run: npm test (to verify everything works)');
  console.log('4. Commit changes with Epic E.055 reference');
}

// Helper function to walk directory tree
function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .git
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        walkDir(filePath, callback);
      }
    } else {
      callback(filePath);
    }
  });
}

// Run migration
migrate();