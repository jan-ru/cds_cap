# Step-by-Step Migration Plan

**Project**: cds_cap (CAP Backend + 28 UI5 Apps)
**Goal**: Convert to npm workspaces monorepo while preserving CAP backend
**Date**: 2026-01-03

---

## Pre-Migration Checklist

Before starting, verify:

- [ ] Node.js 20+ and npm 10+ installed (`node -v && npm -v`)
- [ ] Git is configured and working (`git status`)
- [ ] No uncommitted critical changes (`git status` is clean or committed)
- [ ] Understand what apps exist (`ls app/`)
- [ ] Have read MIGRATION_REPORT.md from dry-run

---

## Phase 1: Preparation & Dry Run (30 minutes)

**Objective**: Understand what will change without modifying anything

### Step 1.1: Create Safety Backup

```bash
cd /root/projects/cds_cap

# Create git safety commit
git add .
git status  # Review what will be committed
git commit -m "Pre-monorepo migration snapshot"

# Create git tag for easy rollback
git tag backup-pre-monorepo

# Create tarball backup
cd /root/projects
tar -czf cds_cap_backup_$(date +%Y%m%d_%H%M%S).tar.gz cds_cap/
ls -lh cds_cap_backup_*.tar.gz  # Verify backup created
```

**Verify**: You should have:
- ✅ Git commit created
- ✅ Git tag "backup-pre-monorepo" exists
- ✅ Tarball backup file created

### Step 1.2: Run Dry-Run Preview

```bash
cd /root/projects/cds_cap

# Run dry-run (does NOT modify files)
node app/migrate-to-monorepo-dryrun.js
```

**Expected output**:
- Found X apps in /root/projects/cds_cap/app
- Found Y shared dependencies
- Preview files generated in migration-preview/
- Detailed report: migration-preview/MIGRATION_REPORT.md

### Step 1.3: Review Preview Files

```bash
# Read the detailed migration report
cat migration-preview/MIGRATION_REPORT.md

# Compare root package.json (what will change)
diff package.json migration-preview/package.json

# Check a sample app's changes
diff app/financial-statements/package.json migration-preview/apps/financial-statements.json

# Review version conflicts (if any)
grep -A5 "Version Conflicts" migration-preview/MIGRATION_REPORT.md
```

**Decision Point 1**: ⚠️ **STOP HERE IF:**
- Version conflicts look problematic
- CAP backend config is missing in preview
- Too many unexpected changes

**Proceed if**: Preview looks good and changes make sense

---

## Phase 2: Execute Migration (15 minutes)

**Objective**: Run the actual migration script

### Step 2.1: Verify Current State

```bash
cd /root/projects/cds_cap

# Ensure we're on the right commit
git log -1 --oneline

# Verify we have backups
git tag | grep backup-pre-monorepo
ls ../cds_cap_backup_*.tar.gz
```

### Step 2.2: Run Migration Script

```bash
# Run the actual migration (MODIFIES FILES)
node app/migrate-to-monorepo.js
```

**Expected output**:
```
🚀 Starting npm workspaces migration...

Found 28 apps in /root/projects/cds_cap/app

📦 Step 1: Backing up package.json files...
  ✓ Backed up financial-statements
  ✓ Backed up revenue-analysis
  ... (all apps)
  All backups saved to: /root/projects/cds_cap/backup-package-json

🔍 Step 2: Analyzing dependencies across all apps...
  Found XX shared dependencies
  Commonly shared: XX/XX

📝 Step 3: Creating/updating root package.json...
  ℹ️  Found existing root package.json - will preserve CAP backend config
  ✓ Updated /root/projects/cds_cap/package.json
  ✓ Preserved 3 backend dependencies
  ✓ Added XX shared UI dependencies
  ✓ Preserved CAP configuration: Yes

✂️  Step 4: Creating minimal app package.json files...
  ✓ Updated financial-statements
  ✓ Updated revenue-analysis
  ... (all apps)

📊 Migration Summary Report
══════════════════════════════════════════════════════════
  Total apps: 28
  Shared dependencies: XX
  Backup location: /root/projects/cds_cap/backup-package-json

✅ Migration complete!
```

### Step 2.3: Verify Migration Output

```bash
# Check that backups were created
ls backup-package-json/ | wc -l  # Should show 28 or 29 files

# Verify root package.json has workspaces
grep -A1 "workspaces" package.json

# Verify CAP config preserved
grep -A10 '"cds"' package.json

# Check a sample app has minimal deps
cat app/financial-statements/package.json
```

**Decision Point 2**: ⚠️ **ROLLBACK IF:**
- Backups directory is empty
- CAP config is missing from root package.json
- Apps still have all dependencies (migration didn't work)

**Proceed if**: Files look correct based on dry-run preview

---

## Phase 3: Install & Initial Testing (20 minutes)

**Objective**: Install dependencies and verify basic functionality

### Step 3.1: Clean Install

```bash
cd /root/projects/cds_cap

# Remove any existing node_modules
rm -rf node_modules app/*/node_modules

# Install all dependencies (this may take 5-10 minutes)
npm install

# Expected: Single node_modules at root, none in app directories
```

**Expected output**:
- npm install completes without errors
- Single `node_modules/` directory at root
- No `node_modules/` in app directories

### Step 3.2: Verify Workspace Setup

```bash
# List all workspaces
npm ls --workspaces --depth=0

# Should show ~28 apps listed
```

**Expected**: Each app listed as a workspace

### Step 3.3: Test CAP Backend (Critical)

```bash
# Test that CAP backend still works
npm start &
BACKEND_PID=$!

# Wait for server to start
sleep 5

# Test OData endpoint
curl -s http://localhost:4004/analytics | head -20

# Stop backend
kill $BACKEND_PID
```

**Expected**:
- `cds serve` starts without errors
- OData service responds
- No missing module errors

**Decision Point 3**: ⚠️ **ROLLBACK IF:**
- Backend fails to start
- Missing @sap/cds or other backend dependencies
- OData service not accessible

### Step 3.4: Test One UI App

```bash
# Test the simplest app first
npm test --workspace=app/financial-statements
```

**Expected outcomes**:

**✅ Success case**:
- Tests run (even if some fail due to test setup)
- No "module not found" errors
- Karma/WDIO tools are found

**⚠️ Acceptable issues**:
- Some tests fail (test logic issues, not dependency issues)
- Chrome headless warnings (environment issue, not migration issue)

**❌ Critical failures (ROLLBACK)**:
- Cannot find module 'karma'
- Cannot find module '@ui5/cli'
- Cannot find module '@wdio/cli'

### Step 3.5: Test Multiple Apps

```bash
# Test 3 different apps to verify pattern
npm test --workspace=app/revenue-analysis
npm test --workspace=app/working-capital

# Or test all (may take time)
npm run test:ui
```

---

## Phase 4: Validation & Commit (15 minutes)

**Objective**: Comprehensive verification and commit changes

### Step 4.1: Run Full Test Suite

```bash
# Test backend
npm test

# Test UI apps
npm run test:ui

# Or combined
npm run test:all
```

### Step 4.2: Verify Build Works

```bash
# Build one app
npm run build --workspace=app/financial-statements

# If successful, build all
npm run build:ui
```

### Step 4.3: Check for Issues

```bash
# Check for any lingering node_modules in apps
find app -name node_modules -type d

# Should return empty or only shared/node_modules

# Verify workspace commands work
npm run lint:ui
```

### Step 4.4: Review Changes

```bash
# See what was changed
git status

# Review package.json diff
git diff package.json

# Review a sample app diff
git diff app/financial-statements/package.json
```

### Step 4.5: Commit Migration

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Migrate to npm workspaces monorepo

- Convert 28 UI5 apps to use shared dependencies
- Preserve CAP backend configuration
- Add workspace-level scripts (test:ui, build:ui, etc.)
- Extract shared dependencies: karma, wdio, @ui5/cli, etc.
- Create backups in backup-package-json/

Migration performed with app/migrate-to-monorepo.js"

# Tag successful migration
git tag monorepo-migration-success
```

---

## Phase 5: Cleanup & Documentation (10 minutes)

**Objective**: Clean up migration artifacts and update docs

### Step 5.1: Clean Up Migration Files

```bash
# Remove dry-run preview (no longer needed)
rm -rf migration-preview/

# Keep backup-package-json/ for safety (can remove later)

# Migration scripts can be moved to docs or removed
mkdir -p docs/migration
mv app/migrate-to-monorepo.js docs/migration/
mv app/migrate-to-monorepo-dryrun.js docs/migration/
mv app/MIGRATION-GUIDE.md docs/migration/
```

### Step 5.2: Update Project README

Add to main README.md:

```markdown
## Development Setup

This project uses npm workspaces to manage multiple UI5 applications.

### Installation

bash
npm install  # Installs all dependencies for backend and UI apps


### Testing

bash
# Test backend
npm test

# Test UI apps
npm run test:ui

# Test specific app
npm test --workspace=app/financial-statements


### Building

bash
# Build all UI apps
npm run build:ui

# Build specific app
npm run build --workspace=app/financial-statements

```

### Step 5.3: Document New Workflow

Create docs/WORKSPACE_GUIDE.md with common commands and patterns.

---

## Rollback Procedures

### Immediate Rollback (Before npm install)

If you catch issues before `npm install`:

```bash
# Restore from git
git reset --hard backup-pre-monorepo

# Or restore individual files
git checkout HEAD package.json
git checkout HEAD app/*/package.json
```

### Rollback After npm install

If you've already run `npm install`:

```bash
# Option 1: Git reset
git reset --hard backup-pre-monorepo
rm -rf node_modules

# Option 2: Manual restoration
cp -r backup-package-json/* app/
rm package.json

# Restore root package.json from git
git checkout backup-pre-monorepo -- package.json

# Clean up
rm -rf node_modules app/*/node_modules
npm install  # Reinstall old way
```

### Nuclear Option (Complete Restoration)

If everything is broken:

```bash
cd /root/projects
rm -rf cds_cap/
tar -xzf cds_cap_backup_YYYYMMDD_HHMMSS.tar.gz
cd cds_cap/
```

---

## Post-Migration Workflow

### Adding Dependencies

**Add to all apps**:
```bash
npm install some-package --save-dev --workspaces
```

**Add to one app**:
```bash
npm install some-package --workspace=app/financial-statements
```

**Add to backend**:
```bash
npm install some-package  # Adds to root, not workspaces
```

### Upgrading Dependencies

**Upgrade WDIO across all apps**:
```bash
npm run upgrade-wdio
```

**Upgrade specific package**:
```bash
npm update @ui5/cli --workspaces
```

### Running Commands

**Backend**:
```bash
npm start        # Start CAP server
npm test         # Test backend
npm run watch    # Watch mode
```

**UI Apps**:
```bash
npm run start:ui              # Start all UI apps (probably don't want this)
npm run test:ui               # Test all UI apps
npm run build:ui              # Build all UI apps
npm run lint:ui               # Lint all UI apps

# Specific app
npm test --workspace=app/financial-statements
npm run start --workspace=app/financial-statements
```

---

## Troubleshooting

### Issue: "Cannot find module 'X'"

**Cause**: Dependency not in shared list or app-specific deps

**Fix**:
```bash
# Add to root if used by multiple apps
npm install X --save-dev

# Add to specific app if unique
npm install X --workspace=app/your-app --save-dev
```

### Issue: Tests fail with "Chrome not found"

**Cause**: Environment issue, not migration issue

**Fix**: Already configured for headless Chrome in karma.conf.base.js

### Issue: Workspace not found

**Fix**:
```bash
# Verify workspace name
npm ls --workspaces

# Use exact name from package.json
npm test --workspace=app/financial-statements  # Not financialstatements
```

### Issue: Backend dependencies missing

**Cause**: Migration script bug or manual edit error

**Fix**:
```bash
# Restore backend deps from backup tag
git show backup-pre-monorepo:package.json | grep -A20 '"dependencies"'

# Manually add missing deps
npm install @sap/cds @cap-js/sqlite express
```

---

## Success Criteria

Migration is successful when:

- [x] `npm install` completes without errors
- [x] `npm start` starts CAP backend
- [x] OData endpoints respond correctly
- [x] `npm test` (backend) passes
- [x] `npm test --workspace=app/financial-statements` runs (even if some tests fail)
- [x] `npm run build:ui` builds all apps
- [x] No `node_modules/` directories in `app/*/`
- [x] Single `node_modules/` at root
- [x] CAP config preserved in root package.json
- [x] Git commit created and tagged

---

## Timeline Estimate

- **Phase 1** (Preparation & Dry Run): 30 minutes
- **Phase 2** (Execute Migration): 15 minutes
- **Phase 3** (Install & Testing): 20 minutes
- **Phase 4** (Validation & Commit): 15 minutes
- **Phase 5** (Cleanup): 10 minutes

**Total**: ~90 minutes (1.5 hours)

**Recommendation**: Allocate 2 hours to account for unexpected issues.

---

## Contact & Support

If you encounter issues:

1. Check troubleshooting section above
2. Review migration-preview/MIGRATION_REPORT.md
3. Compare with backup-package-json/ files
4. Use git diff to see exactly what changed

**Remember**: You have 3 safety nets:
1. Git tag: `backup-pre-monorepo`
2. Backup directory: `backup-package-json/`
3. Tarball: `cds_cap_backup_*.tar.gz`

---

**Ready to start?** Begin with Phase 1, Step 1.1 above.
