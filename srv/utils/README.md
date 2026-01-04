# Service Utilities

This directory contains utility modules used by the Analytics Service.

## Modules

### Tree Builders

Financial statement and analytics tree builders that transform flat data into hierarchical structures for UI rendering.

- **[financial-tree-builder.js](financial-tree-builder.js)** - Builds hierarchical trees for P&L and Balance Sheet
  - Classifies revenue accounts (Recurring vs One-off, NOI/WAT/Other)
  - Creates 3-level hierarchy with drill-down support
  - Calculates period comparisons and percentages
  - See: [Tree Builder Pattern](../../.github/copilot-instructions.md#2-tree-builder-pattern-critical)

- **[pivot-tree-builder.js](pivot-tree-builder.js)** - Builds pivot tables with dynamic period columns
  - 3-level hierarchy: L1 (0xxx series) → L2 (00xx group) → L3 (account leaf)
  - Dynamic column generation based on periods
  - Aggregates amounts up the hierarchy
  - Includes Grand Total row

- **[revenue-tree-builder.js](revenue-tree-builder.js)** - Builds revenue analysis pivot tables
  - LTM (Last Twelve Months) period analysis
  - Revenue classification by type and cost center
  - Dynamic monthly columns
  - Sorting and totals calculation

- **[tree-builder-common.js](tree-builder-common.js)** - Shared utilities for tree builders
  - Common tree manipulation functions
  - Reusable node creation helpers

### Core Utilities

- **[logger.js](logger.js)** - Centralized logging utility
  - Creates namespaced loggers (`createLogger(name)`)
  - Supports debug, info, warn, error levels
  - Consistent log formatting across the service
  - Usage: `const logger = createLogger('module-name');`

- **[error-handler.js](error-handler.js)** - Centralized error handling
  - HTTP status code mapping
  - Error formatting for OData responses
  - Prevents internal path exposure in production

- **[period-utils.js](period-utils.js)** - Date and period filtering utilities
  - `isInPeriod(date, year, monthFrom, monthTo)` - Check if date is within period range
  - Period validation and comparison helpers

## Usage Examples

### Tree Builders
```javascript
const FinancialTreeBuilder = require('./utils/financial-tree-builder');
const tree = FinancialTreeBuilder.build(data, 'PL', periodA, periodB);
```

### Logger
```javascript
const { createLogger } = require('./utils/logger');
const logger = createLogger('my-module');
logger.info('Processing request', { userId: 'alice' });
```

### Period Utils
```javascript
const { isInPeriod } = require('./utils/period-utils');
if (isInPeriod(invoice.date, 2024, 1, 12)) {
    // Process invoice
}
```

## Testing

All tree builders have comprehensive unit tests in [../../test/srv/utils/](../../test/srv/utils/):
- `financial-tree-builder.test.js` - Tree structure and classification tests
- `pivot-tree-builder.test.js` - 32 tests covering hierarchies and aggregation
- `revenue-tree-builder.test.js` - 26 tests for pivot tables and periods

Run tests:
```bash
npm test -- financial-tree-builder.test.js
npm test -- pivot-tree-builder.test.js
npm test -- revenue-tree-builder.test.js
```

## Important Notes

⚠️ **Revenue Classification**: The revenue account classification in `financial-tree-builder.js` must stay in sync with the dbt macro `categorize_revenue.sql`. See [srv/config/constants.js](../config/constants.js) for the canonical account code definitions.

⚠️ **Constants**: Always import account codes and classifications from `../config/constants.js` - it's the single source of truth.
