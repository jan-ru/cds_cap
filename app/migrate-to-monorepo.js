#!/usr/bin/env node
/**
 * Migration Script: Convert multiple UI5 apps to npm workspaces monorepo
 * 
 * This script:
 * 1. Backs up all existing package.json files
 * 2. Analyzes dependencies across all apps
 * 3. Identifies shared dependencies
 * 4. Creates a root package.json with shared dependencies
 * 5. Creates minimal app package.json files with only app-specific deps
 */

const fs = require('fs');
const path = require('path');

// Configuration
const APP_DIR = path.join(process.cwd(), 'app');
const BACKUP_DIR = path.join(process.cwd(), 'backup-package-json');
const EXCLUDE_DIRS = ['shared', 'ui5', 'node_modules'];

// Shared dependencies that should be in root (adjust as needed)
const COMMON_SHARED_DEPS = [
  '@ui5/cli',
  '@sap/ux-ui5-tooling',
  'karma',
  'karma-ui5',
  'karma-chrome-launcher',
  'karma-coverage',
  'karma-junit-reporter',
  '@wdio/cli',
  '@wdio/local-runner',
  '@wdio/mocha-framework',
  '@wdio/spec-reporter',
  '@wdio/utils',
  'eslint',
  'ui5-task-flatten-library'
];

function getAllAppDirs() {
  const items = fs.readdirSync(APP_DIR);
  return items.filter(item => {
    const fullPath = path.join(APP_DIR, item);
    return fs.statSync(fullPath).isDirectory() && 
           !EXCLUDE_DIRS.includes(item) &&
           fs.existsSync(path.join(fullPath, 'package.json'));
  });
}

function backupPackageJsons(apps) {
  console.log('\n📦 Step 1: Backing up package.json files...');
  
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  apps.forEach(app => {
    const src = path.join(APP_DIR, app, 'package.json');
    const dest = path.join(BACKUP_DIR, `${app}-package.json`);
    fs.copyFileSync(src, dest);
    console.log(`  ✓ Backed up ${app}`);
  });

  console.log(`\n  All backups saved to: ${BACKUP_DIR}`);
}

function analyzeSharedDependencies(apps) {
  console.log('\n🔍 Step 2: Analyzing dependencies across all apps...');
  
  const depCounts = {};
  const allDeps = {};
  
  apps.forEach(app => {
    const pkgPath = path.join(APP_DIR, app, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    
    // Check both dependencies and devDependencies
    ['dependencies', 'devDependencies'].forEach(depType => {
      if (pkg[depType]) {
        Object.keys(pkg[depType]).forEach(dep => {
          if (!depCounts[dep]) {
            depCounts[dep] = 0;
            allDeps[dep] = { versions: new Set(), depType };
          }
          depCounts[dep]++;
          allDeps[dep].versions.add(pkg[depType][dep]);
        });
      }
    });
  });

  // Identify shared dependencies (used by 2+ apps or in COMMON_SHARED_DEPS)
  const sharedDeps = {};
  Object.keys(depCounts).forEach(dep => {
    if (depCounts[dep] >= 2 || COMMON_SHARED_DEPS.includes(dep)) {
      // Use the most common version or latest
      const versions = Array.from(allDeps[dep].versions);
      sharedDeps[dep] = versions[0]; // Take first for now, can be refined
    }
  });

  console.log(`\n  Found ${Object.keys(sharedDeps).length} shared dependencies`);
  console.log(`  Commonly shared: ${COMMON_SHARED_DEPS.filter(d => sharedDeps[d]).length}/${COMMON_SHARED_DEPS.length}`);

  return sharedDeps;
}

function createRootPackageJson(sharedDeps) {
  console.log('\n📝 Step 3: Creating/updating root package.json...');

  const rootPath = path.join(process.cwd(), 'package.json');
  let existingPkg = {};

  // Read existing package.json if it exists
  if (fs.existsSync(rootPath)) {
    console.log('  ℹ️  Found existing root package.json - will preserve CAP backend config');
    existingPkg = JSON.parse(fs.readFileSync(rootPath, 'utf8'));
  }

  // Merge dependencies (preserve existing backend deps, add UI deps)
  const mergedDependencies = {
    ...(existingPkg.dependencies || {}),
    // Don't add UI deps to dependencies, they go in devDependencies
  };

  const mergedDevDependencies = {
    ...(existingPkg.devDependencies || {}),
    ...sharedDeps
  };

  // Merge scripts (preserve existing, add workspace scripts)
  const mergedScripts = {
    ...(existingPkg.scripts || {}),
    // Add workspace-level scripts for UI apps (prefixed to avoid conflicts)
    'test:ui': 'npm run test --workspaces --if-present',
    'build:ui': 'npm run build --workspaces --if-present',
    'start:ui': 'npm run start --workspaces --if-present',
    'lint:ui': 'npm run lint --workspaces --if-present',
    'upgrade-wdio': 'npm install --save-dev @wdio/cli@latest @wdio/local-runner@latest @wdio/mocha-framework@latest @wdio/spec-reporter@latest @wdio/utils@latest'
  };

  const rootPkg = {
    name: existingPkg.name || 'cds-cap-financial-apps',
    version: existingPkg.version || '1.0.0',
    private: true,
    description: existingPkg.description || 'Financial Analytics CAP Application with UI5 Apps',
    repository: existingPkg.repository,
    license: existingPkg.license || 'UNLICENSED',
    workspaces: ['app/*'],
    scripts: mergedScripts,
    dependencies: mergedDependencies,
    devDependencies: mergedDevDependencies,
    engines: existingPkg.engines || {
      node: '>=20.0.0',
      npm: '>=10.0.0'
    },
    // Preserve CAP-specific configuration
    ...(existingPkg.cds && { cds: existingPkg.cds })
  };

  fs.writeFileSync(rootPath, JSON.stringify(rootPkg, null, 2));
  console.log(`  ✓ Updated ${rootPath}`);
  console.log(`  ✓ Preserved ${Object.keys(existingPkg.dependencies || {}).length} backend dependencies`);
  console.log(`  ✓ Added ${Object.keys(sharedDeps).length} shared UI dependencies`);
  console.log(`  ✓ Preserved CAP configuration: ${existingPkg.cds ? 'Yes' : 'No'}`);
}

function createMinimalAppPackageJsons(apps, sharedDeps) {
  console.log('\n✂️  Step 4: Creating minimal app package.json files...');
  
  apps.forEach(app => {
    const pkgPath = path.join(APP_DIR, app, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    
    // Remove shared dependencies
    const newPkg = {
      name: app,
      version: pkg.version || '1.0.0',
      description: pkg.description || `${app} UI5 application`,
      scripts: pkg.scripts || {
        start: 'ui5 serve',
        build: 'ui5 build',
        test: 'karma start'
      },
      dependencies: {},
      devDependencies: {}
    };

    // Keep only app-specific dependencies
    ['dependencies', 'devDependencies'].forEach(depType => {
      if (pkg[depType]) {
        Object.keys(pkg[depType]).forEach(dep => {
          if (!sharedDeps[dep]) {
            newPkg[depType][dep] = pkg[depType][dep];
          }
        });
      }
      // Remove empty objects
      if (Object.keys(newPkg[depType]).length === 0) {
        delete newPkg[depType];
      }
    });

    fs.writeFileSync(pkgPath, JSON.stringify(newPkg, null, 2));
    console.log(`  ✓ Updated ${app}`);
  });
}

function generateReport(apps, sharedDeps) {
  console.log('\n📊 Migration Summary Report');
  console.log('═'.repeat(60));
  console.log(`  Total apps: ${apps.length}`);
  console.log(`  Shared dependencies: ${Object.keys(sharedDeps).length}`);
  console.log(`  Backup location: ${BACKUP_DIR}`);
  console.log('\n  Next steps:');
  console.log('  1. Review the generated root package.json');
  console.log('  2. Run: npm install');
  console.log('  3. Test one app: npm test --workspace=app/balance-sheet-custom');
  console.log('  4. Test all apps: npm test');
  console.log('\n  To rollback: restore files from backup directory');
  console.log('═'.repeat(60));
}

// Main execution
function main() {
  console.log('\n🚀 Starting npm workspaces migration...\n');
  
  try {
    const apps = getAllAppDirs();
    console.log(`Found ${apps.length} apps in ${APP_DIR}`);
    
    backupPackageJsons(apps);
    const sharedDeps = analyzeSharedDependencies(apps);
    createRootPackageJson(sharedDeps);
    createMinimalAppPackageJsons(apps, sharedDeps);
    generateReport(apps, sharedDeps);
    
    console.log('\n✅ Migration complete!\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('   Your original files are backed up in:', BACKUP_DIR);
    process.exit(1);
  }
}

main();
