#!/usr/bin/env node
/**
 * DRY RUN Migration Script: Preview npm workspaces monorepo changes
 *
 * This script:
 * 1. Analyzes dependencies across all apps
 * 2. Generates preview files in migration-preview/ directory
 * 3. Shows what would be changed WITHOUT modifying anything
 * 4. Creates a detailed migration report
 *
 * Usage: node app/migrate-to-monorepo-dryrun.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const APP_DIR = path.join(process.cwd(), 'app');
const PREVIEW_DIR = path.join(process.cwd(), 'migration-preview');
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
  'ui5-task-flatten-library',
  'chromedriver',
  'wdio-chromedriver-service'
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

function analyzeSharedDependencies(apps) {
  console.log('\n🔍 Analyzing dependencies across all apps...');

  const depCounts = {};
  const allDeps = {};
  const appDeps = {}; // Track which apps use which deps

  apps.forEach(app => {
    const pkgPath = path.join(APP_DIR, app, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    appDeps[app] = { dependencies: {}, devDependencies: {} };

    // Check both dependencies and devDependencies
    ['dependencies', 'devDependencies'].forEach(depType => {
      if (pkg[depType]) {
        Object.keys(pkg[depType]).forEach(dep => {
          if (!depCounts[dep]) {
            depCounts[dep] = 0;
            allDeps[dep] = { versions: new Set(), depType, apps: [] };
          }
          depCounts[dep]++;
          allDeps[dep].versions.add(pkg[depType][dep]);
          allDeps[dep].apps.push(app);
          appDeps[app][depType][dep] = pkg[depType][dep];
        });
      }
    });
  });

  // Identify shared dependencies (used by 2+ apps or in COMMON_SHARED_DEPS)
  const sharedDeps = {};
  const conflicts = [];

  Object.keys(depCounts).forEach(dep => {
    if (depCounts[dep] >= 2 || COMMON_SHARED_DEPS.includes(dep)) {
      const versions = Array.from(allDeps[dep].versions);

      // Check for version conflicts
      if (versions.length > 1) {
        conflicts.push({
          dep,
          versions,
          apps: allDeps[dep].apps,
          count: depCounts[dep]
        });
      }

      sharedDeps[dep] = versions[0]; // Take first version
    }
  });

  console.log(`  ✓ Found ${Object.keys(sharedDeps).length} shared dependencies`);
  console.log(`  ✓ Commonly shared: ${COMMON_SHARED_DEPS.filter(d => sharedDeps[d]).length}/${COMMON_SHARED_DEPS.length}`);

  if (conflicts.length > 0) {
    console.log(`  ⚠️  Found ${conflicts.length} version conflicts (will use first version)`);
  }

  return { sharedDeps, depCounts, allDeps, conflicts, appDeps };
}

function previewRootPackageJson(sharedDeps) {
  console.log('\n📝 Generating root package.json preview...');

  const rootPath = path.join(process.cwd(), 'package.json');
  let existingPkg = {};

  // Read existing package.json
  if (fs.existsSync(rootPath)) {
    existingPkg = JSON.parse(fs.readFileSync(rootPath, 'utf8'));
  }

  // Merge dependencies (preserve existing backend deps, add UI deps)
  const mergedDependencies = {
    ...(existingPkg.dependencies || {}),
  };

  const mergedDevDependencies = {
    ...(existingPkg.devDependencies || {}),
    ...sharedDeps
  };

  // Merge scripts (preserve existing, add workspace scripts)
  const mergedScripts = {
    ...(existingPkg.scripts || {}),
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
    ...(existingPkg.cds && { cds: existingPkg.cds })
  };

  // Save preview
  const previewPath = path.join(PREVIEW_DIR, 'package.json');
  fs.writeFileSync(previewPath, JSON.stringify(rootPkg, null, 2));

  console.log(`  ✓ Preview saved to: ${previewPath}`);
  console.log(`  ✓ Preserved ${Object.keys(existingPkg.dependencies || {}).length} backend dependencies`);
  console.log(`  ✓ Will add ${Object.keys(sharedDeps).length} shared UI dependencies`);
  console.log(`  ✓ Preserved CAP configuration: ${existingPkg.cds ? 'Yes' : 'No'}`);

  return { existingPkg, rootPkg };
}

function previewAppPackageJsons(apps, sharedDeps) {
  console.log('\n✂️  Generating app package.json previews...');

  const appPreviews = [];
  const appPreviewDir = path.join(PREVIEW_DIR, 'apps');

  if (!fs.existsSync(appPreviewDir)) {
    fs.mkdirSync(appPreviewDir, { recursive: true });
  }

  apps.forEach(app => {
    const pkgPath = path.join(APP_DIR, app, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    const originalDepCount = Object.keys({
      ...(pkg.dependencies || {}),
      ...(pkg.devDependencies || {})
    }).length;

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
    let removedCount = 0;
    ['dependencies', 'devDependencies'].forEach(depType => {
      if (pkg[depType]) {
        Object.keys(pkg[depType]).forEach(dep => {
          if (!sharedDeps[dep]) {
            newPkg[depType][dep] = pkg[depType][dep];
          } else {
            removedCount++;
          }
        });
      }
      if (Object.keys(newPkg[depType]).length === 0) {
        delete newPkg[depType];
      }
    });

    const newDepCount = Object.keys({
      ...(newPkg.dependencies || {}),
      ...(newPkg.devDependencies || {})
    }).length;

    // Save preview
    const previewPath = path.join(appPreviewDir, `${app}.json`);
    fs.writeFileSync(previewPath, JSON.stringify(newPkg, null, 2));

    appPreviews.push({
      app,
      originalDepCount,
      newDepCount,
      removedCount,
      previewPath
    });
  });

  console.log(`  ✓ Generated ${appPreviews.length} app previews in ${appPreviewDir}`);

  return appPreviews;
}

function generateDetailedReport(apps, analysis, rootPreview, appPreviews) {
  const { sharedDeps, conflicts, depCounts, allDeps } = analysis;
  const reportPath = path.join(PREVIEW_DIR, 'MIGRATION_REPORT.md');

  let report = `# Migration Preview Report\n\n`;
  report += `**Generated**: ${new Date().toISOString()}\n\n`;
  report += `---\n\n`;

  // Summary
  report += `## Summary\n\n`;
  report += `- **Total apps**: ${apps.length}\n`;
  report += `- **Shared dependencies to extract**: ${Object.keys(sharedDeps).length}\n`;
  report += `- **Version conflicts**: ${conflicts.length}\n`;
  report += `- **CAP backend config preserved**: Yes\n\n`;

  // Changes overview
  report += `## Changes Overview\n\n`;
  report += `### Root package.json\n\n`;
  report += `- Will add \`workspaces: ["app/*"]\`\n`;
  report += `- Will add ${Object.keys(sharedDeps).length} UI dependencies to devDependencies\n`;
  report += `- Will preserve ${Object.keys(rootPreview.existingPkg.dependencies || {}).length} backend dependencies\n`;
  report += `- Will add 5 new workspace scripts: test:ui, build:ui, start:ui, lint:ui, upgrade-wdio\n\n`;

  // App changes
  report += `### App package.json Files\n\n`;
  report += `| App | Before | After | Removed |\n`;
  report += `|-----|--------|-------|--------|\n`;
  appPreviews.forEach(preview => {
    report += `| ${preview.app} | ${preview.originalDepCount} | ${preview.newDepCount} | ${preview.removedCount} |\n`;
  });
  report += `\n`;

  // Version conflicts
  if (conflicts.length > 0) {
    report += `## ⚠️  Version Conflicts\n\n`;
    report += `The following dependencies have multiple versions across apps. The migration will use the first version found:\n\n`;
    conflicts.forEach(conflict => {
      report += `### ${conflict.dep}\n`;
      report += `- **Versions found**: ${conflict.versions.join(', ')}\n`;
      report += `- **Used by**: ${conflict.apps.join(', ')}\n`;
      report += `- **Will use**: ${conflict.versions[0]}\n\n`;
    });
  }

  // Shared dependencies list
  report += `## Shared Dependencies (${Object.keys(sharedDeps).length})\n\n`;
  report += `These will be moved to root package.json:\n\n`;
  Object.keys(sharedDeps).sort().forEach(dep => {
    const info = allDeps[dep];
    report += `- \`${dep}@${sharedDeps[dep]}\` - used by ${depCounts[dep]} apps\n`;
  });
  report += `\n`;

  // App-specific dependencies
  report += `## App-Specific Dependencies\n\n`;
  const appSpecificDeps = {};
  appPreviews.forEach(preview => {
    const pkgPath = path.join(APP_DIR, preview.app, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const specific = [];

    ['dependencies', 'devDependencies'].forEach(depType => {
      if (pkg[depType]) {
        Object.keys(pkg[depType]).forEach(dep => {
          if (!sharedDeps[dep]) {
            specific.push(`${dep}@${pkg[depType][dep]}`);
          }
        });
      }
    });

    if (specific.length > 0) {
      appSpecificDeps[preview.app] = specific;
    }
  });

  if (Object.keys(appSpecificDeps).length > 0) {
    report += `These dependencies are unique to specific apps and will remain:\n\n`;
    Object.keys(appSpecificDeps).sort().forEach(app => {
      report += `### ${app}\n`;
      appSpecificDeps[app].forEach(dep => {
        report += `- \`${dep}\`\n`;
      });
      report += `\n`;
    });
  } else {
    report += `No app-specific dependencies found. All dependencies are shared.\n\n`;
  }

  // Next steps
  report += `## Next Steps\n\n`;
  report += `### To proceed with migration:\n\n`;
  report += `1. Review this report and preview files in \`${PREVIEW_DIR}/\`\n`;
  report += `2. Commit current state: \`git add . && git commit -m "Pre-migration snapshot"\`\n`;
  report += `3. Run actual migration: \`node app/migrate-to-monorepo.js\`\n`;
  report += `4. Install dependencies: \`npm install\`\n`;
  report += `5. Test: \`npm test --workspace=app/financial-statements\`\n\n`;

  report += `### To review changes:\n\n`;
  report += `\`\`\`bash\n`;
  report += `# Compare root package.json\n`;
  report += `diff package.json migration-preview/package.json\n\n`;
  report += `# Compare an app's package.json\n`;
  report += `diff app/financial-statements/package.json migration-preview/apps/financial-statements.json\n`;
  report += `\`\`\`\n\n`;

  report += `### Files that will be modified:\n\n`;
  report += `- \`package.json\` (root)\n`;
  apps.forEach(app => {
    report += `- \`app/${app}/package.json\`\n`;
  });
  report += `\n`;

  report += `### Files that will be created:\n\n`;
  report += `- \`backup-package-json/\` (directory with backups)\n`;

  fs.writeFileSync(reportPath, report);

  return reportPath;
}

function printConsoleSummary(reportPath, conflicts) {
  console.log('\n📊 DRY RUN COMPLETE - No files were modified');
  console.log('═'.repeat(70));
  console.log(`\n  Preview files generated in: ${PREVIEW_DIR}/`);
  console.log(`  Detailed report: ${reportPath}`);

  if (conflicts.length > 0) {
    console.log(`\n  ⚠️  WARNING: ${conflicts.length} version conflict(s) detected`);
    console.log(`     Review ${reportPath} for details`);
  }

  console.log('\n  To proceed:');
  console.log('  1. Review the migration report');
  console.log('  2. Check preview files in migration-preview/');
  console.log('  3. Commit current state to git');
  console.log('  4. Run: node app/migrate-to-monorepo.js');

  console.log('\n  To abort:');
  console.log('  - Simply delete the migration-preview/ directory');
  console.log('═'.repeat(70));
}

// Main execution
function main() {
  console.log('\n🔍 DRY RUN: Previewing npm workspaces migration...\n');
  console.log('   This will NOT modify any files\n');

  try {
    // Create preview directory
    if (fs.existsSync(PREVIEW_DIR)) {
      console.log(`  Cleaning existing preview directory...`);
      fs.rmSync(PREVIEW_DIR, { recursive: true });
    }
    fs.mkdirSync(PREVIEW_DIR, { recursive: true });

    const apps = getAllAppDirs();
    console.log(`  Found ${apps.length} apps in ${APP_DIR}`);

    const analysis = analyzeSharedDependencies(apps);
    const rootPreview = previewRootPackageJson(analysis.sharedDeps);
    const appPreviews = previewAppPackageJsons(apps, analysis.sharedDeps);
    const reportPath = generateDetailedReport(apps, analysis, rootPreview, appPreviews);

    printConsoleSummary(reportPath, analysis.conflicts);

    console.log('\n✅ Dry run complete!\n');
  } catch (error) {
    console.error('\n❌ Dry run failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
