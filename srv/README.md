# Service Layer (Business Logic)

This directory contains the **business logic layer** of the financial analytics application, built on SAP Cloud Application Programming (CAP) model.

## Overview

The `srv/` directory serves as the application's service layer, implementing:
- OData service definitions and implementations
- Custom business logic for financial reporting
- Hierarchical tree-building from already-transformed data
- Period-based comparative analytics
- Middleware for monitoring and request handling
- Utility functions for common operations

**Note**: Data transformation (ETL) is handled by the [dbt layer](../dbt/). This service layer consumes clean, transformed data and applies business logic for reporting.

---

## Directory Structure

```
srv/
├── analytics-service.cds    # Service definitions (entities, functions, actions)
├── analytics-service.js     # Service implementation (business logic)
├── config/                  # Configuration and constants
│   └── constants.js
├── middleware/              # Request/response middleware
│   ├── monitoring.js
│   └── README.md
└── utils/                   # Utility functions and helpers
    ├── error-handler.js
    ├── financial-tree-builder.js
    ├── logger.js
    ├── period-utils.js
    ├── pivot-tree-builder.js
    ├── revenue-tree-builder.js
    └── tree-builder-common.js
```

---

## Core Components

### Service Definition (`analytics-service.cds`)

Defines the OData service contract using CDS (Core Data Services):

- **Entities**: Projections from database schema (read-only views)
  - `FinancialStatements`, `RevenueReport`, `Controls`, `Pivot`
  - Transactional data: `SCA_ServiceAgreement`, `VFA_SalesInvoice`, `VOA_SalesOrder`, etc.
  - User preferences: `UserSettings`

- **Functions**: Custom business operations
  - `getFinancialStatementsTree()` - Hierarchical P&L and balance sheet data
  - `getSalesTree()` - Revenue analytics tree
  - `getPivotTree()` - Pivot table for multi-dimensional analysis
  - `getCombinedTree()` - Integrated financial view
  - `getRevenueTree()` - Revenue breakdown by product/customer
  - `getAppInfo()` - Application metadata
  - `getFileContent()` - File retrieval helper

- **Actions**: State-changing operations
  - `saveSettings()` - Persist user preferences

### Service Implementation (`analytics-service.js`)

The main business logic file that:
- Implements all functions and actions defined in the CDS service
- Fetches already-transformed data from the database
- Orchestrates tree-building algorithms
- Manages period-based calculations (comparative reporting)
- Enforces business rules and validation

**Key Responsibilities:**
1. **Hierarchical Structuring**: Builds trees from flat, transformed data
2. **Period Comparison**: Calculates variances between reporting periods
3. **Business Operations**: User settings, file retrieval, app metadata
4. **Error Handling**: Validates inputs and manages exceptions
5. **Performance**: Optimizes queries and caching strategies

**Not Responsible For:**
- Data transformation (ETL) - handled by dbt
- Data cleaning or validation - dbt ensures data quality
- Raw data ingestion - managed by data pipeline

---

## Supporting Modules

### Configuration (`config/`)

- **constants.js**: Centralized configuration values
  - Account code mappings
  - Report type definitions
  - Default period settings
  - Application-wide constants

### Middleware (`middleware/`)

- **monitoring.js**: Request/response logging and performance tracking
- Provides observability into service operations
- See [middleware/README.md](./middleware/README.md) for details

### Utils (`utils/`)

Reusable utility functions for common operations:

- **financial-tree-builder.js**: Builds hierarchical financial statements (P&L, Balance Sheet)
- **revenue-tree-builder.js**: Constructs revenue analysis trees
- **pivot-tree-builder.js**: Creates pivot table structures
- **tree-builder-common.js**: Shared tree-building logic
- **period-utils.js**: Period calculation and formatting helpers
- **error-handler.js**: Centralized error handling and formatting
- **logger.js**: Structured logging utility

---

## Data Flow

```
Raw Data Sources (CSV, Excel, etc.)
       ↓
dbt (data transformation pipeline)
       ↓
Database (transformed tables)
       ↓
db/schema.cds (CAP data model)
       ↓
analytics-service.cds (OData endpoint)
       ↓
analytics-service.js (business logic)
       ↓
├── utils/*.js (tree building, formatting)
├── config/constants.js (configuration)
└── Frontend (UI5 Apps)
```

**Layer Responsibilities:**
- **dbt**: Transform raw data → analytics-ready tables
- **srv**: Query transformed data → hierarchical reports
- **app**: Display reports → user interaction

---

## Key Concepts

### Tree Building

The service layer specializes in building hierarchical tree structures from flat, transformed data:

1. **Account Hierarchies**: P&L and balance sheet accounts organized by category
2. **Revenue Breakdowns**: Sales data grouped by product, customer, region
3. **Period Comparisons**: Side-by-side reporting with variance calculations

Tree builders consume clean data from dbt, aggregate by hierarchy levels, calculate totals, and format for UI consumption. The data itself is already validated and transformed - this layer focuses on structure and presentation.

### Period-Based Reporting

All reports support dual-period comparison:
- **Period A**: Primary reporting period (year, month from/to)
- **Period B**: Comparison period (prior year, prior month, etc.)
- **Variance**: Automatic calculation of differences and percentages

### OData Integration

The service exposes standard OData endpoints with:
- **$filter, $select, $expand**: Standard OData query operations
- **Custom functions**: Business-specific operations (tree building)
- **Authentication**: Requires `authenticated-user` role

---

## Development Guidelines

### Adding New Business Logic

1. **Define service contract** in `analytics-service.cds`
2. **Implement logic** in `analytics-service.js`
3. **Extract reusable code** to `utils/` if needed
4. **Add constants** to `config/constants.js`
5. **Test** with sample data and edge cases

### Best Practices

- Keep business logic in service layer, not in UI controllers
- Query transformed data from dbt tables - don't transform raw data here
- Use utils for reusable tree-building and formatting logic
- Handle errors gracefully with error-handler.js
- Log important operations with logger.js
- Document complex algorithms with inline comments
- Validate user inputs and parameters before processing

---

## Technology Stack

- **SAP CAP**: Cloud Application Programming model
- **CDS**: Core Data Services for schema and service definitions
- **Node.js**: Runtime environment
- **OData V4**: RESTful API protocol
- **SQLite/SAP HANA**: Database layer (configured via CAP)

---

## Related Documentation

- [dbt Documentation](../dbt/README.md) - Data transformation pipeline (ETL layer)
- [Database Schema](../db/README.md) - CAP data model definitions
- [Middleware Guide](./middleware/README.md) - Request handling details
- [App Documentation](../app/README.md) - Frontend UI5 applications

---

## Troubleshooting

**Issue**: Custom function returns empty data
- Check period parameters are valid
- Verify data exists in database for specified periods
- Review logs for query errors

**Issue**: Tree structure incorrect
- Inspect account code hierarchies in constants.js
- Check tree-builder logic for correct parent-child relationships
- Validate raw data has proper CodeGrootboekrekening values

**Issue**: Performance degradation
- Review query complexity in analytics-service.js
- Consider caching frequently-accessed trees
- Check middleware/monitoring.js for slow operations

---

**Last Updated**: 2026-01-03
