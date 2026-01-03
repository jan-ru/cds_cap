# Migration Guide: Converting to npm Workspaces Monorepo

## Overview

This guide will help you convert your 27+ UI5 apps from individual package.json files to a centralized npm workspaces monorepo structure.

**Benefits:**
- ✅ Single `npm install` for all apps
- ✅ Consistent dependency versions across all apps
- ✅ Easy upgrade of shared dependencies (karma, wdio, etc.)
- ✅ Reduced disk space (single node_modules)
- ✅ Test individual apps or all apps together
- ✅ Maintains existing directory structure

---

## Before You Start

### Prerequisites

1. **Node.js 20+ and npm 10+** installed
2. **Git** (recommended for tracking changes)
3. **Backup** your current project

### Safety First

```bash
# Create a backup of your entire project
cd /root/projects
tar -czf cds_cap_backup_$(date +%Y%m%d).tar.gz cds_cap/

# Or use git
cd /root/projects/cds_cap
git add .
git commit -m "Before monorepo migration"
git branch backup-pre-monorepo
```

---

## Migration Steps

### Step 1: Prepare Files

Copy the provided files to your project root:

```bash
cd /root/projects/cds_cap

# Copy migration script
# (upload migrate-to-monorepo.js to project root)

# Copy base configs
# (upload karma.conf.base.js and wdio.conf.base.js to project root)

# Make migration script executable
chmod +x migrate-to-monorepo.js
```

### Step 2: Run Automated Migration

```bash
# Run the migration script
node migrate-to-monorepo.js
```

The script will:
1. ✅ Backup all package.json files to `backup-package-json/`
2. ✅ Analyze dependencies across all 27+ apps
3. ✅ Create root `package.json` with shared dependencies
4. ✅ Update each app's `package.json` to remove shared deps
5. ✅ Generate a migration report

### Step 3: Review Generated Files

**Check root package.json:**
```bash
cat package.json
```

Verify it contains:
- All shared dependencies (@ui5/cli, karma, wdio, etc.)
- Workspaces: ["app/*"]
- Test scripts for individual apps

**Check an app's package.json:**
```bash
cat app/balance-sheet-custom/package.json
```

Should only contain app-specific dependencies (if any).

### Step 4: Install Dependencies

```bash
# Install all dependencies (this may take a few minutes)
npm install

# Verify workspace setup
npm ls --workspaces
```

### Step 5: Update App Karma Configs (Optional but Recommended)

Each app can now extend the base karma config:

**Before (app/your-app/karma.conf.js):**
```javascript
module.exports = function(config) {
  config.set({
    frameworks: ["ui5"],
    browsers: ["ChromeHeadless"],
    // ... lots of config ...
  });
};
```

**After:**
```javascript
const baseConfig = require('../../karma.conf.base.js');

module.exports = function(config) {
  baseConfig(config);
  config.set({
    // Only app-specific overrides here
  });
};
```

### Step 6: Test Individual Apps

```bash
# Test a single app
npm test --workspace=app/balance-sheet-custom

# Test another app
npm test --workspace=app/financial-statements
```

### Step 7: Test All Apps Together

```bash
# Run tests for all apps
npm test

# Build all apps
npm build
```

---

## Common Commands

### Testing

```bash
# Test all apps
npm test

# Test specific app
npm test --workspace=app/balance-sheet-custom

# Test multiple apps
npm test --workspace=app/balance-sheet-custom --workspace=app/charts-custom

# Watch mode for development
npm test --workspace=app/your-app -- --single-run=false
```

### Dependency Management

```bash
# Upgrade WDIO packages across all apps
npm run upgrade-wdio

# Add dependency to ALL apps
npm install --save-dev some-package --workspaces

# Add dependency to ONE app
npm install some-package --workspace=app/balance-sheet-custom

# Update all dependencies
npm update --workspaces
```

### Building

```bash
# Build all apps
npm run build

# Build specific app
npm run build --workspace=app/balance-sheet-custom
```

---

## Rollback Instructions

If something goes wrong:

```bash
# Option 1: Restore from backup
cd /root/projects/cds_cap
rm package.json karma.conf.base.js wdio.conf.base.js
cp -r backup-package-json/* app/

# Rename back
cd app
for dir in */; do
    if [ -f "../backup-package-json/${dir%/}-package.json" ]; then
        cp "../backup-package-json/${dir%/}-package.json" "$dir/package.json"
    fi
done

# Option 2: Restore from git
git checkout package.json
git checkout app/*/package.json
```

---

## Coolify Deployment Considerations

### If deploying all apps together:

Update your Coolify build settings:

**Install Command:**
```bash
npm install
```

**Build Command:**
```bash
npm run build
```

### If deploying apps individually:

You can still deploy specific apps from the monorepo:

**Install Command:**
```bash
npm install
```

**Build Command:**
```bash
npm run build --workspace=app/balance-sheet-custom
```

**Start Command:**
```bash
npm start --workspace=app/balance-sheet-custom
```

---

## Troubleshooting

### Issue 1: "Cannot find module" after migration

**Solution:**
```bash
# Clear all node_modules and reinstall
rm -rf node_modules app/*/node_modules
npm install
```

### Issue 2: Tests fail after migration

**Cause:** Karma/WDIO configs may need adjustment

**Solution:**
1. Check that configs extend base configs correctly
2. Verify test paths in wdio.conf.js
3. Run individual app test to isolate issue

### Issue 3: Workspace not found

**Solution:**
```bash
# Verify workspace name matches directory
npm ls --workspaces

# Use exact name from package.json
npm test --workspace=app/balance-sheet-custom
```

### Issue 4: Dependency version conflicts

**Solution:**
```bash
# Use legacy peer deps if needed
npm install --legacy-peer-deps

# Or update root package.json to specific versions
```

---

## Verification Checklist

After migration, verify:

- [ ] Root `package.json` exists with workspaces config
- [ ] All apps listed in `npm ls --workspaces`
- [ ] `npm install` completes without errors
- [ ] At least one app's tests pass
- [ ] Shared library still accessible (`/shared` resource root)
- [ ] Backup exists at `backup-package-json/`
- [ ] Original functionality preserved

---

## Next Steps

Once migration is complete:

1. **Add workspace-specific test scripts** to root package.json
2. **Update CI/CD pipelines** to use workspace commands
3. **Document the new structure** for your team
4. **Consider adding linting** at workspace level
5. **Update Coolify** deployment configurations

---

## Questions?

**Structure Questions:**
- Where is the shared library? → Still at `app/shared/`
- Can I add more apps? → Yes, just add to `app/` directory
- How to add new dependency? → See "Dependency Management" section

**Testing Questions:**
- How to test just one app? → `npm test --workspace=app/your-app`
- Why are tests failing? → Check karma/wdio config extensions

**Deployment Questions:**
- Does this work with Coolify? → Yes, see "Coolify Deployment" section
- Can I deploy apps separately? → Yes, use workspace commands

---

## Summary

Your structure before:
```
cds_cap/
├── app/
│   ├── app1/ (package.json with all deps)
│   ├── app2/ (package.json with all deps)
│   └── app3/ (package.json with all deps)
```

Your structure after:
```
cds_cap/
├── package.json (shared deps for all apps)
├── karma.conf.base.js (shared config)
├── wdio.conf.base.js (shared config)
├── app/
│   ├── app1/ (package.json with minimal/no deps)
│   ├── app2/ (package.json with minimal/no deps)
│   └── app3/ (package.json with minimal/no deps)
└── node_modules/ (single, shared)
```

**Key benefit:** Change WDIO version once, affects all 27+ apps! 🎉
