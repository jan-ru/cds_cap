# AI Agent Instructions for CDS Analytics Application

## Architecture Overview

This is a **dual-repository financial analytics system**:
- **This repo (cds_cap)**: SAP CAP backend + SAP Fiori Elements UI
- **Sibling repo (../dbt)**: dbt data transformation pipeline

**Data Flow**: Raw CSV/Excel → dbt (DuckDB) → SQLite (`../database/db.sqlite`) → CAP Services → Fiori UI

### Key Components
- **Backend**: SAP Cloud Application Programming Model (CAP/CDS) with OData V4 analytical services
- **Database**: SQLite shared between dbt and CAP (production-ready for embedded scenarios)
- **Frontend**: SAP Fiori Elements apps (Analytical List Page, List Report patterns)
- **Auth**: Mock authentication with user preferences (alice/bob/charlie)

## Critical Development Patterns

### 1. Data Model Architecture

**CDS Entity Types** ([db/schema.cds](../db/schema.cds)):
- `@cds.persistence.table` entities read directly from dbt-generated SQLite tables
- Naming convention: `demo.EntityName` in CDS → `demo_EntityName` table in SQLite
- **Never modify** `db/schema.cds` entities directly - they reflect dbt output
- Update dbt models in `../dbt/models/marts/` instead, then run `../dbt/build.sh`

**Service Layer** ([srv/analytics-service.cds](../srv/analytics-service.cds)):
- Functions return `String` (JSON serialized) for complex hierarchical trees
- Actions for state mutations (e.g., `saveSettings`)
- Standard entities for CRUD and Fiori Elements bindings

### 2. Tree Builder Pattern (Critical!)

Financial statements use **custom hierarchical tree structures** built server-side:

**Key Files**:
- [srv/utils/financial-tree-builder.js](../srv/utils/financial-tree-builder.js) - P&L, Balance Sheet, Sales
- [srv/utils/revenue-tree-builder.js](../srv/utils/revenue-tree-builder.js) - Revenue LTM analysis
- [srv/utils/pivot-tree-builder.js](../srv/utils/pivot-tree-builder.js) - Pivot tables
- [srv/utils/tree-builder-common.js](../srv/utils/tree-builder-common.js) - Shared utilities

**Revenue Classification Logic** (must stay in sync with dbt):
```javascript
// srv/config/constants.js
REVENUE_ACCOUNTS: {
  ONE_OFF: ['84', '85'],      // Account codes starting with 84/85
  RECURRING: ['80', '86', '87', '88']
}
// Matches: dbt/macros/categorize_revenue.sql
```

**Tree Structure**:
- `drillState: "expanded"/"collapsed"/"leaf"` - Controls UI expansion
- `level: 1/2/3` - Hierarchy depth (1=header, 2=group, 3=detail)
- `amountA/amountB` - Period comparison values
- `watA/watB` - Percentages of total

**When modifying trees**:
1. Update both tree builder AND corresponding dbt mart model
2. Test with `npm test` - [test/srv/utils/financial-tree-builder.test.js](../test/srv/utils/financial-tree-builder.test.js)
3. Verify data consistency: compare `srv/config/constants.js` with `dbt/macros/categorize_revenue.sql`

### 3. Testing Strategy

**Backend Testing** (`npm test` - Jest with 80% coverage threshold):
- Unit tests in [test/srv/utils/](../test/srv/utils/) mirror [srv/utils/](../srv/utils/) structure
- Mock CDS service in tests: `cds.service.impl.mockImplementation(...)`
- Focus on business logic (tree builders, calculations), not framework code
- Coverage thresholds: 80% (branches/functions/lines/statements)

**Frontend Testing** (Fiori Elements apps):
- **Unit Tests**: `karma start` - Component and controller tests
- **Integration Tests (OPA5)**: End-to-end user journeys
- **E2E Tests**: `wdio` - WebDriver-based full UI testing
- Test structure: `webapp/test/unit/` and `webapp/test/integration/`

**Test Organization**:
- [test/srv/](../test/srv/) - Backend Jest tests
- [app/*/webapp/test/unit/](../app/financial-statements/webapp/test/unit/) - UI5 unit tests per app
- [app/*/webapp/test/integration/](../app/financial-statements/webapp/test/integration/) - OPA5 integration tests per app
- Legacy custom UI: [app/ui5/test/](../app/ui5/test/) - OPA5 tests for deprecated custom dashboard

**Coverage Thresholds**:
- Backend (Jest): 80% global
- Frontend (Karma): 50% (configurable in karma.conf.js)
- Monitoring middleware: Lower coverage acceptable (complex event handling)

### 4. dbt Integration Workflow

**Making data changes**:
1. Edit dbt models in `../dbt/models/` (staging → intermediate → marts)
2. Run full pipeline: `cd ../dbt && ./build.sh`
3. Restart CAP: `npm start` (reloads SQLite data)
4. No CAP code changes needed unless schema changed

**Pipeline Steps** (automated by `build.sh`):
```bash
./seeds/clean_csvs.sh        # Clean raw CSVs (European numbers, quotes)
dbt run                       # Transform data (staging → marts)
dbt test                      # Data quality checks
python3 export_to_sqlite.py  # Export to ../database/db.sqlite
```

**Schema Changes**:
- Update `../../dbt/models/marts/core/*.sql` or `../../dbt/models/marts/finance/*.sql`
- Sync `db/schema.cds` entity definitions with new columns
- Update annotations in [app/annotations.cds](../app/annotations.cds) for UI bindings

### 5. Fiori Elements Conventions

**App Structure**: Each Fiori app in `app/*/` has:
- `webapp/manifest.json` - App configuration (OData binding, routing)
- `webapp/test/unit/` - Karma/QUnit unit tests
- `webapp/test/integration/` - OPA5 integration tests
- `ui5.yaml` - UI5 tooling configuration
- `karma.conf.js` - Unit test runner configuration
- `wdio.conf.js` - E2E test configuration
- No custom controllers - pure Fiori Elements (declarative)
- Annotations in shared [app/annotations.cds](../app/annotations.cds)

**Testing Patterns**:
- Unit tests: Test component initialization and basic functionality
- OPA5 journeys: Test user navigation and interaction flows
- Page objects pattern: Reusable OPA5 page actions/assertions
- Test file naming: `*.qunit.html` for test runners, `*Journey.js` for OPA5 tests

**Common Patterns**:
- Analytical List Page: `@Aggregation.default: #SUM` for measures
- List Report: `@UI.LineItem` for table columns
- Object Page: `@UI.Facets` for detail sections
- Selection Fields: `@UI.SelectionFields` for filter bar

**Launchpad** ([app/launchpad.html](../app/launchpad.html)):
- Central entry point with tile navigation
- Semantic object-action pattern: `#financialstatements-display`

### 6. Error Handling & Logging

**Centralized Logger** ([srv/utils/logger.js](../srv/utils/logger.js)):
```javascript
const { createLogger } = require('./utils/logger');
const logger = createLogger('module-name');
logger.info('message', { context });
logger.error('error', error);
```

**Monitoring** ([srv/middleware/monitoring.js](../srv/middleware/monitoring.js)):
- Automatic performance tracking on all requests
- Slow request threshold: 1000ms
- Metrics logged every 60 seconds
- Use `trackPerformance` middleware in service implementation

**Error Handler** ([srv/utils/error-handler.js](../srv/utils/error-handler.js)):
- Centralized error formatting
- HTTP status code mapping
- Never expose internal paths in production

## Development Commands

```bash
# CAP Development
npm start              # Production server (port 4004)
npm run watch          # Dev server with auto-reload
npm test               # Run backend Jest tests
npm run test:coverage  # Coverage report
npm run test:ui        # Run all Fiori app tests
npm run test:all       # Run backend + frontend tests
npm run lint:fix       # ESLint auto-fix

# Fiori App Testing (run from app/*/ directory)
npm run test:unit         # Run Karma unit tests
npm run test:unit:watch   # Watch mode for unit tests
npm run test:integration  # Run WebDriver E2E tests
npm run test:opa          # Open OPA5 test runner in browser

# Fiori Development (requires npx)
npx fiori generate app # Generate new Fiori Elements app
npx @sap/cds-dk add ...# Add CAP features/plugins

# dbt Pipeline (run from ../dbt/)
cd ../dbt && ./build.sh               # Full pipeline
cd ../dbt && dbt run --select staging # Run specific layer
cd ../dbt && dbt test                 # Data quality tests only

# Docker
docker-compose up      # Run containerized app
```

## Project-Specific Quirks

1. **Database Location**: SQLite at `../database/db.sqlite` (parent of both repos)
2. **Mock Users**: Hardcoded in [package.json](../package.json) `cds.requires.auth.users` - not env vars
3. **User Preferences**: Stored in `UserSettings` entity (database-backed, not localStorage)
4. **No OData Annotations on Functions**: Custom functions return JSON strings, not typed entities
5. **European Number Formats**: Handled by dbt macro `clean_european_numbers()` (comma → decimal)
6. **Period Utilities**: Use [srv/utils/period-utils.js](../srv/utils/period-utils.js) `isInPeriod()` for date filtering
7. **Constants**: Always import from [srv/config/constants.js](../srv/config/constants.js) - single source of truth
8. **No TypeScript**: Pure JavaScript project with JSDoc annotations

## When Things Break

**"No data in UI"**: Check SQLite has data → `cd ../dbt && ./build.sh`
**"Tree structure wrong"**: Compare revenue classification in constants.js vs dbt macro
**"Tests failing"**: Verify coverage thresholds not exceeded (80% backend, 50% frontend)
**"Auth not working"**: Check user exists in package.json or use alice/alice
**"Slow queries"**: Check monitoring logs for slow requests (>1s)
**"OPA5 tests not running"**: Ensure CAP server is running (`npm start`) before running UI tests
**"Karma tests fail"**: Install dependencies with `npm install` in app directory, check ui5.yaml paths

## Related Documentation

- [AUTHENTICATION.md](../AUTHENTICATION.md) - Auth setup and user management
- [README.md](../README.md) - Getting started and app overview
- [../dbt/README.md](../../dbt/README.md) - Data pipeline architecture
- [../dbt/HANDOFF.md](../../dbt/HANDOFF.md) - dbt implementation history
