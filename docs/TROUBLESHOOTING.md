# Troubleshooting Guide

Comprehensive troubleshooting guide for the CDS Analytics application covering common issues, debugging strategies, and solutions.

## Table of Contents

- [General Issues](#general-issues)
- [Database Issues](#database-issues)
- [Authentication & Authorization](#authentication--authorization)
- [Service & API Issues](#service--api-issues)
- [Frontend Issues](#frontend-issues)
- [Data Pipeline Issues](#data-pipeline-issues)
- [Deployment Issues](#deployment-issues)
- [Performance Issues](#performance-issues)

## General Issues

### Application Won't Start

**Symptom**: `npm start` fails or exits immediately

**Diagnostic Steps**:
```bash
# Check Node.js version (should be 20.x)
node --version

# Check for missing dependencies
npm ci

# Check for port conflicts
lsof -i :4004

# Check database file exists
ls -lh /root/projects/database/db.sqlite
```

**Common Fixes**:
1. **Port already in use**:
   ```bash
   # Kill process on port 4004
   kill $(lsof -t -i:4004)
   # Or use a different port
   PORT=4005 npm start
   ```

2. **Missing dependencies**:
   ```bash
   npm ci
   ```

3. **Database not found**:
   ```bash
   # Run dbt pipeline to generate database
   cd ../dbt && ./build.sh
   ```

### Module Not Found Errors

**Symptom**: `Cannot find module '@sap/cds'` or similar

**Fix**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# For specific missing modules
npm install @sap/cds @cap-js/sqlite
```

### CDS Compilation Errors

**Symptom**: Errors during `cds build` or `cds deploy`

**Diagnostic**:
```bash
# Check CDS syntax
npx @sap/cds-dk compile db/schema.cds

# Check service definitions
npx @sap/cds-dk compile srv/analytics-service.cds
```

**Common Issues**:
- Syntax errors in `.cds` files
- Missing namespace declarations
- Circular dependencies in entity definitions

## Database Issues

### SQLite Database Locked

**Symptom**: `Error: SQLITE_BUSY: database is locked`

**Cause**: dbt pipeline is running or has stale lock

**Fix**:
```bash
# Check for running dbt processes
ps aux | grep dbt

# Check who's using the database file
fuser /root/projects/database/db.sqlite

# Kill stale processes (if safe)
fuser -k /root/projects/database/db.sqlite

# Restart CAP server
docker-compose restart cds-cap
```

### Database File Not Found

**Symptom**: `Error: SQLITE_CANTOPEN: unable to open database file`

**Fix**:
```bash
# Verify database path in package.json
cat package.json | grep -A5 '"db"'

# Create database directory if missing
mkdir -p /root/projects/database

# Run dbt pipeline to generate database
cd ../dbt && ./build.sh

# Verify file exists and has correct permissions
ls -lh /root/projects/database/db.sqlite
chmod 644 /root/projects/database/db.sqlite
```

### No Data in Database

**Symptom**: Queries return empty results

**Diagnostic**:
```bash
# Check if tables exist
sqlite3 /root/projects/database/db.sqlite ".tables"

# Check row counts
sqlite3 /root/projects/database/db.sqlite <<EOF
SELECT 'FinancialStatements' as table_name, COUNT(*) as rows FROM demo_FinancialStatements
UNION ALL
SELECT 'RevenueAnalysis', COUNT(*) FROM demo_RevenueAnalysis
UNION ALL
SELECT 'WorkingCapital', COUNT(*) FROM demo_WorkingCapital;
EOF
```

**Expected Output**:
```
FinancialStatements|35246
RevenueAnalysis|8750
WorkingCapital|2400
```

**Fix**:
```bash
# Rebuild database from dbt
cd ../dbt
./seeds/clean_csvs.sh  # Clean source data
dbt run                 # Run transformations
python3 export_to_sqlite.py  # Export to SQLite
```

### Database Schema Mismatch

**Symptom**: `Error: no such column` or `SQLITE_ERROR`

**Cause**: CDS schema doesn't match SQLite tables (after dbt changes)

**Fix**:
```bash
# Check actual table schema
sqlite3 /root/projects/database/db.sqlite ".schema demo_FinancialStatements"

# Update db/schema.cds to match
# Then restart CAP server
npm start
```

**Prevention**: Always sync `db/schema.cds` when changing dbt models

## Authentication & Authorization

### Login Failed / 401 Unauthorized

**Symptom**: Cannot log in or API requests return 401

**Diagnostic**:
```bash
# Check configured users in package.json
cat package.json | grep -A10 '"auth"'

# Test with curl
curl -u alice:alice http://localhost:4004/analytics/
```

**Default Users** (development only):
- alice:alice (Admin role)
- bob:bob (User role)
- charlie:charlie (User role)

**Fix**:
1. **Verify credentials**: Use username:password format
2. **Check auth configuration** in `package.json` → `cds.requires.auth`
3. **Clear browser cookies** and try again

### Mock Authentication Not Working

**Symptom**: All requests return 401 even with correct credentials

**Fix**:
```bash
# Verify auth kind in package.json
# Should be: "kind": "basic" for mock auth

# Restart server
npm start
```

**Production Note**: Replace mock authentication before deploying (see [AUTHENTICATION.md](../AUTHENTICATION.md))

### CORS Errors

**Symptom**: Browser console shows CORS policy errors

**Fix**: Add CORS middleware in `srv/analytics-service.js`:
```javascript
const cors = require('cors');
module.exports = (srv) => {
  srv.on('bootstrap', () => {
    srv.app.use(cors());
  });
};
```

## Service & API Issues

### OData Service Not Responding

**Symptom**: `/analytics/` endpoint returns 404 or 503

**Diagnostic**:
```bash
# Check if server is running
curl http://localhost:4004/

# Check specific service
curl http://localhost:4004/analytics/\$metadata

# Check server logs
docker logs cds-cap-production --tail 50
```

**Fix**:
1. **Service not registered**: Check `srv/analytics-service.cds` is in srv/ directory
2. **Syntax errors**: Run `npx @sap/cds-dk compile srv/analytics-service.cds`
3. **Restart required**: `npm start`

### Function Returns Empty String

**Symptom**: Tree builder functions return `""` instead of JSON

**Cause**: Missing data or incorrect parameters

**Diagnostic**:
```bash
# Enable debug logging
DEBUG=* npm start

# Check function call in browser console:
fetch('/analytics/getFinancialTree(FStype=\'PNL\',PeriodAYear=2025,PeriodAMonthFrom=1,PeriodAMonthTo=12,PeriodBYear=2024,PeriodBMonthFrom=1,PeriodBMonthTo=12)', {
  headers: { 'Authorization': 'Basic ' + btoa('alice:alice') }
}).then(r => r.json()).then(console.log);
```

**Common Fixes**:
1. **Period has no data**: Check available periods in database
2. **Invalid FStype**: Must be 'PNL' or 'BAS'
3. **Invalid date range**: monthFrom must be <= monthTo

### Revenue Classification Mismatch

**Symptom**: Revenue amounts don't match between CAP and dbt

**Cause**: Classification logic out of sync

**Fix**:
```bash
# Compare classifications
# CAP: srv/config/constants.js
cat srv/config/constants.js | grep -A5 "REVENUE_ACCOUNTS"

# dbt: dbt/macros/categorize_revenue.sql
cat ../dbt/macros/categorize_revenue.sql

# Ensure both define same account codes:
# ONE_OFF: ['84', '85']
# RECURRING: ['80', '86', '87', '88']
```

**Update both files** if they differ, then:
```bash
# Rebuild dbt
cd ../dbt && ./build.sh

# Restart CAP
npm start
```

### Slow Query Performance

**Symptom**: API requests take >2 seconds

**Diagnostic**:
```bash
# Check monitoring logs
grep "SLOW REQUEST" logs/application.log

# Profile specific query
sqlite3 /root/projects/database/db.sqlite
> EXPLAIN QUERY PLAN SELECT * FROM demo_FinancialStatements WHERE PeriodYear = 2025;
```

**Fixes**:
1. **Add indexes in dbt models**:
   ```sql
   CREATE INDEX idx_period ON {{ this }} (PeriodYear, PeriodMonth);
   ```

2. **Optimize tree builders**: Cache frequently accessed data

3. **Reduce query complexity**: Use projections (`$select`)

## Frontend Issues

### Fiori Launchpad Not Loading

**Symptom**: Blank page or spinner when accessing `/launchpad.html`

**Diagnostic**:
```bash
# Check browser console (F12)
# Look for:
# - JavaScript errors
# - Failed resource loads (404s)
# - CORS errors

# Verify launchpad.html exists
ls -lh app/launchpad.html
```

**Fix**:
1. **UI5 library not loading**: Check CDN connectivity
2. **App manifest errors**: Validate `app/*/webapp/manifest.json`
3. **Clear browser cache** and reload

### No Data Showing in Fiori Elements Apps

**Symptom**: App loads but tables/charts are empty

**Diagnostic Steps**:

1. **Verify OData binding**:
   ```bash
   # Check manifest.json datasource
   cat app/revenue-analysis/webapp/manifest.json | grep -A5 "dataSources"
   
   # Test OData endpoint directly
   curl -u alice:alice http://localhost:4004/analytics/RevenueAnalysis
   ```

2. **Check browser Network tab**:
   - Look for OData requests
   - Check response status (should be 200)
   - Verify response contains data

3. **Check UI5 console**:
   ```javascript
   // In browser console
   sap.ui.getCore().getModel().read("/RevenueAnalysis", {
     success: (data) => console.log("Data:", data),
     error: (err) => console.error("Error:", err)
   });
   ```

**Common Fixes**:
1. **Wrong OData path**: Check manifest.json `uri` matches service name
2. **Missing annotations**: Verify `app/annotations.cds` has UI.LineItem
3. **Filter restricts all data**: Clear default filters in SelectionFields

### UI5 Control Not Found

**Symptom**: `TypeError: Cannot read property 'getModel' of undefined`

**Cause**: Attempting to access control before it's rendered

**Fix**: Use proper lifecycle methods:
```javascript
// Wrong
onInit: function() {
  this.byId("myTable").getModel(); // May not exist yet
}

// Correct
onAfterRendering: function() {
  this.byId("myTable").getModel(); // Control is rendered
}
```

### UI Flexibility / LREP Errors

**Symptoms**:
- Console errors: `TypeError: s.slice is not a function`
- 404 errors for `/sap/bc/lrep/flex/` endpoints
- 404 errors for `flexibility-bundle.json`
- Apps fail to load with flexibility-related errors

**Cause**: UI5 Flexibility framework trying to access LREP (Layered Repository) backend services that don't exist in standalone CAP applications.

**Solution**: The launchpad is configured to disable LREP and use empty local flexibility bundles.

**Configuration in `app/launchpad.html`**:
```javascript
// Disable UI Flexibility features
window["sap-ui-fl-max-layer"] = [];
window["sap-ui-fl-control-variant-id-support"] = false;
```

```html
<!-- Empty flexibility services array -->
<script src="..."
  data-sap-ui-flexibilityServices='[]'
  ...>
</script>
```

**Empty flexibility bundles** in each app:
- Location: `app/*/webapp/changes/flexibility-bundle.json`
- Content: Empty arrays for all flexibility properties
```json
{
  "changes": [],
  "compVariants": [],
  "variants": [],
  "variantChanges": [],
  "variantDependentControlChanges": [],
  "variantManagementChanges": []
}
```

**If errors persist**:
```javascript
// Clear browser localStorage in console
localStorage.clear();
location.reload();
```

### Missing Sandbox Config File

**Symptom**: `GET /appconfig/fioriSandboxConfig.json 404 (Not Found)`

**Fix**: Empty config file already exists at `app/appconfig/fioriSandboxConfig.json`.

If missing, create it:
```bash
mkdir -p app/appconfig
echo '{}' > app/appconfig/fioriSandboxConfig.json
```

## Data Pipeline Issues

### dbt Build Fails

**Symptom**: `./build.sh` exits with errors

**Diagnostic**:
```bash
cd ../dbt
dbt run --debug
```

**Common Issues**:

1. **CSV parsing errors**:
   ```bash
   # Check for European number formatting
   head -5 seeds/raw/ESL_Product.csv
   
   # Re-run CSV cleaning
   ./seeds/clean_csvs.sh
   ```

2. **SQL syntax errors**:
   ```bash
   # Test specific model
   dbt run --select stg_sales_invoices
   ```

3. **Missing source files**:
   ```bash
   # Verify all CSV files exist
   ls seeds/raw/
   ```

### dbt Test Failures

**Symptom**: `dbt test` reports data quality issues

**Fix**:
```bash
# See which tests failed
dbt test --store-failures

# Check specific test
dbt test --select stg_sales_invoices
```

**Common test failures**:
- `not_null`: Source data has NULL values
- `unique`: Duplicate records in source
- `relationships`: Foreign key violations

### SQLite Export Fails

**Symptom**: `export_to_sqlite.py` throws errors

**Diagnostic**:
```bash
cd ../dbt
python3 export_to_sqlite.py --verbose
```

**Common Issues**:
1. **DuckDB file not found**: Run `dbt run` first
2. **Permission denied**: Check write access to `/root/projects/database/`
3. **Schema mismatch**: Update export script for new dbt models

## Deployment Issues

### Docker Build Fails

**Symptom**: `docker build` exits with errors

**Diagnostic**:
```bash
# Build with verbose output
docker build --progress=plain -t cds-cap-analytics .

# Check Dockerfile syntax
docker run --rm -i hadolint/hadolint < Dockerfile
```

**Common Fixes**:
1. **npm install fails**: Check Node.js version in Dockerfile (should be 20)
2. **COPY fails**: Ensure files exist before COPY command
3. **Missing dependencies**: Add to package.json

### Container Won't Start (Coolify/Docker Compose)

**Symptom**: Container starts then immediately exits

**Diagnostic**:
```bash
# Check container logs
docker logs cds-cap-production

# Check exit code
docker ps -a | grep cds-cap

# Inspect container
docker inspect cds-cap-production
```

**Common Issues**:
1. **Database mount missing**: Verify volume in docker-compose.yml
2. **Port conflict**: Change PORT environment variable
3. **Health check failing**: Check /health endpoint

### Caddy Reverse Proxy Issues (Coolify)

**Symptom**: 502 Bad Gateway or SSL errors

**Diagnostic**:
```bash
# Check Caddy logs in Coolify dashboard
docker logs coolify-proxy

# Test direct connection (bypass Caddy)
curl http://localhost:4004/

# Verify container is accessible
docker exec cds-cap-production wget -q -O- http://localhost:4004/
```

**Common Fixes**:
1. **Container not reachable**: Check Docker network configuration
2. **SSL certificate issues**: Wait for Caddy to provision certificate (can take 1-2 minutes)
3. **Domain misconfigured**: Verify custom domain in Coolify settings

### Environment Variables Not Applied

**Symptom**: Application uses default values instead of configured env vars

**Fix**:
```bash
# In docker-compose.yml, ensure environment section exists:
environment:
  - NODE_ENV=production
  - PORT=4004

# Or use .env file (Coolify automatically loads)
# Restart container
docker-compose restart cds-cap
```

## Performance Issues

### High Memory Usage

**Symptom**: Container using >4GB RAM

**Diagnostic**:
```bash
# Check memory usage
docker stats cds-cap-production

# Check Node.js heap
docker exec cds-cap-production node -e "console.log(process.memoryUsage())"
```

**Fixes**:
1. **Increase Node.js heap**:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm start
   ```

2. **Review tree builder complexity**: Simplify recursive operations

3. **Add resource limits** in docker-compose.yml:
   ```yaml
   deploy:
     resources:
       limits:
         memory: 2G
   ```

### Slow Tree Building

**Symptom**: Financial statement trees take >5 seconds to generate

**Diagnostic**:
```bash
# Add timing to tree builder
# In srv/utils/financial-tree-builder.js:
console.time('buildTree');
// ... tree building logic ...
console.timeEnd('buildTree');
```

**Optimizations**:
1. **Pre-aggregate in dbt**: Move calculations to dbt models
2. **Cache tree results**: Implement Redis caching
3. **Reduce hierarchy depth**: Limit to 3-4 levels

### Database Query Slow

**Symptom**: Individual OData queries take >1 second

**Fix**:
```bash
# Add indexes in dbt
# In dbt/models/marts/finance/financial_statements.sql:
{{ config(
  indexes=[
    {'columns': ['PeriodYear', 'PeriodMonth']},
    {'columns': ['FStype', 'account_code']}
  ]
) }}
```

## Debug Mode & Logging

### Enable Debug Logging

**CAP Server**:
```bash
# Verbose logging
DEBUG=* npm start

# Specific module
DEBUG=cds:serve npm start
```

**Browser Console**:
```javascript
// Enable UI5 debug mode
jQuery.sap.log.setLevel(jQuery.sap.log.Level.DEBUG);

// View all logs
jQuery.sap.log.getLogEntries().forEach(e => console.log(e.message));
```

### Monitoring Middleware

Check monitoring logs for slow requests:
```bash
# View recent logs
tail -f logs/application.log | grep SLOW

# Or if using Docker
docker logs -f cds-cap-production | grep SLOW
```

## Getting Help

### Information to Provide

When reporting issues, include:

1. **Environment**:
   - Node.js version: `node --version`
   - CAP version: `npm list @sap/cds`
   - OS: `uname -a`

2. **Error Details**:
   - Full error message
   - Stack trace (if available)
   - Browser console errors (screenshot)

3. **Steps to Reproduce**:
   - Exact commands run
   - Configuration changes made
   - Sample data (if relevant)

4. **Logs**:
   - Server logs: `docker logs cds-cap-production`
   - Network tab: Failed requests with response
   - Database query results

### Known Limitations

1. **SQLite Concurrency**: Single writer only (dbt has exclusive write access)
2. **Mock Authentication**: Not suitable for production
3. **Deep Tree Hierarchies**: May cause performance issues (>10 levels)
4. **Real-time Updates**: Manual dbt pipeline run required
5. **Timezone Handling**: All dates in UTC (no automatic conversion)

### Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture and data flow
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment procedures
- [AUTHENTICATION.md](../AUTHENTICATION.md) - Authentication setup
- [test/README.md](../test/README.md) - Testing documentation
- [srv/utils/README.md](../srv/utils/README.md) - Utility module documentation
