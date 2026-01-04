# Project Structure

This document outlines the complete directory structure of the CDS Analytics application and its related dbt data pipeline.

## Overview

```
/root/projects/
├── database/                         # Shared database directory
│   └── db.sqlite                     # SQLite database (shared between dbt and CAP)
│
├── dbt/                              # dbt data transformation pipeline
│   ├── dbt_project.yml               # dbt project configuration
│   ├── build.sh                      # Full pipeline execution script
│   ├── export_to_sqlite.py           # Export DuckDB to SQLite
│   ├── README.md
│   ├── HANDOFF.md
│   ├── CHANGELOG.md
│   ├── dbt.duckdb                    # DuckDB database (dbt working storage)
│   ├── models/
│   │   ├── staging/                  # Raw data ingestion and cleaning
│   │   │   ├── _sources.yml          # Source definitions
│   │   │   ├── _staging.yml          # Model documentation
│   │   │   ├── stg_chart_of_accounts.sql
│   │   │   ├── stg_sales_orders.sql
│   │   │   ├── stg_sales_invoices.sql
│   │   │   ├── stg_delivery_notes.sql
│   │   │   ├── stg_service_agreements.sql
│   │   │   ├── stg_products.sql
│   │   │   └── stg_product_groups.sql
│   │   ├── intermediate/             # Business logic transformations
│   │   │   ├── _intermediate.yml
│   │   │   ├── int_financial_statements.sql
│   │   │   └── int_sales_invoices.sql
│   │   └── marts/                    # Analytics-ready datasets
│   │       ├── core/                 # Operational data
│   │       │   ├── products.sql
│   │       │   ├── product_groups.sql
│   │       │   ├── sales_orders.sql
│   │       │   ├── sales_invoices.sql
│   │       │   ├── delivery_notes.sql
│   │       │   └── service_agreements.sql
│   │       └── finance/              # Financial analytics
│   │           ├── financial_statements.sql
│   │           ├── revenue_analysis.sql
│   │           ├── working_capital.sql
│   │           └── general_ledger.sql
│   ├── seeds/                        # Source data files
│   │   ├── clean_csvs.sh             # CSV cleaning script
│   │   ├── raw/                      # Raw CSV files
│   │   │   ├── ESL_Product.csv
│   │   │   ├── GUA_DeliveryNote.csv
│   │   │   ├── PGA_ProductGroup.csv
│   │   │   ├── RAL_SalesInvoice.csv
│   │   │   ├── RDL_SalesInvoice.csv
│   │   │   ├── SOA_SalesOrder.csv
│   │   │   └── SOH_ServiceAgreement.csv
│   │   └── excel/
│   │       └── Auditfile2025-0-55.xaf  # XAF file for GL data
│   ├── macros/                       # Reusable SQL functions
│   │   ├── categorize_revenue.sql    # Revenue classification logic
│   │   ├── clean_european_numbers.sql
│   │   ├── generate_uuid.sql
│   │   ├── read_csv_source.sql
│   │   ├── remove_double_quotes.sql
│   │   └── unpivot_monthly_balances.sql
│   ├── snapshots/                    # Historical data tracking
│   ├── tests/                        # Data quality tests
│   ├── target/                       # dbt build artifacts
│   ├── logs/                         # dbt execution logs
│   └── analyses/                     # Ad-hoc SQL queries
│
└── cds_cap/                          # SAP CAP application (this repository)
    ├── .github/
    │   └── copilot-instructions.md   # AI agent guidance
    ├── app/                          # Frontend applications
    │   ├── annotations.cds           # Shared UI annotations
    │   ├── launchpad.html            # Fiori launchpad
    │   ├── login.html                # Login page
    │   ├── wdio.conf.base.js         # wdi5 base configuration
    │   ├── package.json
    │   │
    │   ├── financial-statements/     # Fiori Elements app (Analytical List Page)
    │   │   ├── webapp/
    │   │   │   ├── manifest.json
    │   │   │   ├── test/
    │   │   │   │   ├── e2e/          # wdi5 E2E tests
    │   │   │   │   └── integration/  # OPA5 tests
    │   │   ├── ui5.yaml
    │   │   ├── wdio.conf.js
    │   │   └── package.json
    │   │
    │   ├── revenue-analysis/         # Fiori Elements app (Analytical List Page)
    │   │   └── [same structure as financial-statements]
    │   │
    │   ├── working-capital/          # Fiori Elements app (List Report)
    │   │   └── [same structure as financial-statements]
    │   │
    │   ├── ltm-revenue/              # Fiori Elements app
    │   ├── sales-invoices/           # Fiori Elements app
    │   ├── sales-orders/             # Fiori Elements app
    │   ├── service-agreements/       # Fiori Elements app
    │   ├── delivery-notes/           # Fiori Elements app
    │   ├── products/                 # Fiori Elements app
    │   ├── product-groups/           # Fiori Elements app
    │   ├── general-ledger/           # Fiori Elements app
    │   │
    │   ├── ui5/                      # Legacy custom UI5 app (deprecated)
    │   │   └── webapp/
    │   │
    │   └── *-custom/                 # Custom UI5 apps (legacy)
    │       ├── balance-sheet-custom/
    │       ├── income-statement-custom/
    │       ├── revenue-ltm-custom/
    │       └── [other custom apps]
    │
    ├── srv/                          # CAP service layer
    │   ├── analytics-service.cds     # Service definitions
    │   ├── analytics-service.js      # Service implementation
    │   ├── config/
    │   │   └── constants.js          # Business constants (revenue classification)
    │   ├── utils/                    # Utility modules
    │   │   ├── README.md             # Utils documentation
    │   │   ├── financial-tree-builder.js
    │   │   ├── revenue-tree-builder.js
    │   │   ├── pivot-tree-builder.js
    │   │   ├── tree-builder-common.js
    │   │   ├── period-utils.js
    │   │   ├── logger.js
    │   │   ├── error-handler.js
    │   │   └── validation.js
    │   └── middleware/
    │       └── monitoring.js         # Performance monitoring
    │
    ├── db/                           # Data model
    │   ├── schema.cds                # CDS entity definitions (mirrors dbt tables)
    │   └── data/                     # CSV seed data (optional)
    │
    ├── test/                         # Backend tests
    │   ├── README.md                 # Testing documentation
    │   └── srv/
    │       ├── analytics-service.test.js      # Service handler tests
    │       ├── odata-integration.test.js      # OData endpoint tests
    │       ├── validation.test.js             # Validation tests
    │       └── utils/
    │           ├── financial-tree-builder.test.js
    │           ├── revenue-tree-builder.test.js
    │           └── pivot-tree-builder.test.js
    │
    ├── docs/                         # Project documentation
    │   ├── ARCHITECTURE.md           # System architecture
    │   ├── DEPLOYMENT.md             # Deployment guide (Coolify + Caddy)
    │   ├── TROUBLESHOOTING.md        # Troubleshooting guide
    │   ├── API_REFERENCE.md          # API documentation (to be created)
    │   └── STRUCTURE.md              # This file
    │
    ├── coverage/                     # Test coverage reports
    ├── logs/                         # Application logs
    ├── xlsx/                         # Excel file processing
    ├── backup-package-json/          # Backup of app package.json files
    │
    ├── package.json                  # Project dependencies and scripts
    ├── jest.config.js                # Jest test configuration
    ├── .eslintrc.json                # ESLint configuration
    ├── .prettierrc                   # Prettier configuration
    ├── Dockerfile                    # Docker image definition
    ├── docker-compose.yml            # Docker Compose configuration
    ├── cds.env.json                  # CDS environment settings
    ├── README.md                     # Getting started guide
    ├── CHANGELOG.md                  # Version history
    └── AUTHENTICATION.md             # Authentication setup guide
```

## Key Directories

### `/root/projects/database/`
Shared database directory containing the SQLite database file used by both dbt (write) and CAP (read).

### `/root/projects/dbt/`
Data transformation pipeline using dbt (Data Build Tool). Reads raw CSV/Excel files, transforms data through staging → intermediate → marts layers, and exports to SQLite.

**Key files**:
- `build.sh`: Full pipeline execution (clean CSVs → dbt run → export to SQLite)
- `export_to_sqlite.py`: Exports DuckDB tables to SQLite format
- `macros/categorize_revenue.sql`: Revenue classification logic (must sync with CAP)

### `/root/projects/cds_cap/`
SAP Cloud Application Programming Model (CAP) application. Provides OData V4 services and Fiori Elements UI on top of SQLite database.

**Key directories**:
- `app/`: Fiori Elements applications (Analytical List Page, List Report templates)
- `srv/`: CAP services, tree builders, business logic
- `db/`: CDS schema definitions (read-only views on dbt tables)
- `test/`: Jest unit tests, integration tests, wdi5 E2E tests
- `docs/`: Comprehensive project documentation

## Data Flow

```
Raw CSV/Excel → dbt (DuckDB) → SQLite → CAP Services → Fiori UI
└─────┬────────┘    └───┬───┘    └──┬──┘   └────┬───┘   └───┬───┘
   Source          Transform    Export    Service      Present
```

1. **Source**: Raw data files in `dbt/seeds/raw/` and `dbt/seeds/excel/`
2. **Transform**: dbt models in `dbt/models/` (staging → intermediate → marts)
3. **Export**: `export_to_sqlite.py` writes to `/root/projects/database/db.sqlite`
4. **Service**: CAP reads from SQLite and exposes OData V4 APIs
5. **Present**: Fiori Elements apps consume OData services

## Naming Conventions

### CDS Entities → SQLite Tables
- CDS: `demo.FinancialStatements`
- SQLite: `demo_FinancialStatements`
- Pattern: Namespace dot replaced with underscore

### Fiori Elements Apps
- Directory: Kebab-case (e.g., `revenue-analysis/`)
- Semantic object: Lowercase (e.g., `revenueanalysis`)
- URL: `#revenueanalysis-display`

### Test Files
- Unit tests: `*.test.js` (Jest)
- E2E tests: `*.test.js` in `webapp/test/e2e/` (wdi5)
- Integration tests: `*Journey.js` in `webapp/test/integration/` (OPA5)

## Configuration Files

### Root Level
- `package.json`: CAP dependencies, CDS configuration, npm scripts
- `jest.config.js`: Test coverage thresholds (80%)
- `docker-compose.yml`: Production deployment with Coolify

### App Level
- `manifest.json`: Fiori app configuration (OData binding, routing)
- `ui5.yaml`: UI5 tooling configuration
- `wdio.conf.js`: WebdriverIO test configuration (extends base)
- `package.json`: App-specific dependencies

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed system architecture
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment procedures (Coolify + Caddy)
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions
- [test/README.md](../test/README.md) - Testing documentation
- [srv/utils/README.md](../srv/utils/README.md) - Utility modules documentation
- [../dbt/README.md](../../dbt/README.md) - dbt pipeline documentation
- [../dbt/HANDOFF.md](../../dbt/HANDOFF.md) - dbt implementation history
