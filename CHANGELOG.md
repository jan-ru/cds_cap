# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.7] - 2026-01-03

### Changed
- **Testing Infrastructure**: Completed migration from Karma to wdi5 for UI5 application testing
  - Replaced karma-ui5 with wdio-ui5-service for native UI5 control access
  - Updated 3 Fiori apps (financial-statements, revenue-analysis, working-capital) to use wdi5
  - All app wdio configs now extend shared base configuration for consistency
  - Test scripts updated: removed karma commands, standardized on wdio integration tests

### Removed
- Karma testing framework and all related dependencies
  - karma, karma-ui5, karma-chrome-launcher, karma-coverage packages
  - karma.conf.base.js and individual app karma.conf.js files
  - "test": "karma start" scripts from 12 app package.json files
- Migration documentation and scripts (migrations complete)
  - MIGRATION-GUIDE.md (monorepo migration completed)
  - migrate-to-monorepo.js and migrate-to-monorepo-dryrun.js scripts
  - QUICK-START-WDIO.md (wdi5 migration completed)

### Added
- wdi5 (wdio-ui5-service ^3.1.0) for UI5-native browser testing
  - Direct access to UI5 controls via browser.asControl()
  - Automatic UI5 waiting and better error messages
  - Cleaner test code compared to plain WebdriverIO
- WDI5-VS-WDIO.md reference documentation for developers
- Shared wdio.conf.base.js with UI5 service configuration

### Technical
- npm workspaces monorepo structure maintained and optimized
- Shared dependencies centralized at root level
- All 27+ UI5 apps benefit from consistent test infrastructure
- Test commands: npm test --workspace=app/{app-name} or npm run test:ui

## [0.3.6] - 2025-12-31

### Fixed
- **CRITICAL**: Fixed inverted RevenueAccounts classification bug (84/85 were labeled "Recurring" instead of "One-Off")
- Revenue classification now consistent between server and client components
- Business logic for revenue categorization corrected across entire application

### Added
- Centralized constants infrastructure in `srv/config/constants.js`
  - Single source of truth for MODEL_SIZE_LIMIT, FS_TYPES, SORT_CONFIG, SPACERS, LABELS, ACCOUNT_LABELS, MONITORING
  - Eliminates 8+ duplications of SIZE_LIMIT constant across codebase
- Tree builder common utilities in `srv/utils/tree-builder-common.js`
  - Shared functions: createNode(), createSpacer(), roundValue(), sortKeys()
  - Eliminates 75% code duplication across tree builder modules
- Period handling utilities in `srv/utils/period-utils.js`
  - Functions: parsePeriod(), isInPeriod(), formatPeriod(), createPeriod()
  - Eliminates 5x duplication of period parsing logic

### Changed
- Refactored `srv/utils/financial-tree-builder.js` to use common utilities
  - createNode: 17 lines → 10 lines (41% reduction)
  - createSpacer: 14 lines → 8 lines (43% reduction)
  - checkPeriod: 13 lines → 1 line (92% reduction)
  - calcDiffs: 27 lines → 19 lines (30% reduction)
  - Overall reduction: 71 lines → 38 lines in key functions (46% reduction)
- All tree builders now import from centralized constants instead of local definitions

### Technical
- Phase 2-3 code quality improvements completed
- Total lines eliminated: 123+ lines of duplicate code
- Infrastructure created: 259 lines of reusable utilities
- Net code reduction with improved maintainability
- All 161 tests passing with zero behavioral changes
- Foundation laid for refactoring remaining tree builders (pivot, revenue)

## [0.3.5] - 2025-12-30

### Changed
- Restructured project to separate database integration layer into dedicated directory
- Moved SQLite database from `cds_cap/db.sqlite` to `database/db.sqlite`
- Moved database utilities from `cds_cap/db_utils/` to `database/utils/`
- Updated dbt profiles configuration to use new database location
- Updated CAP package.json database configuration to reference `../database/db.sqlite`
- Updated all database utility scripts with correct relative paths
- Updated dbt export_marts.sql to use new database path

### Removed
- Deleted redundant `cds_cap/input/` and `cds_cap/input_clean/` directories
- Removed obsolete CSV import utilities (db_clean.sh, db_import.sql, db_rebuild.sh)
- Source CSV files now managed exclusively in `dbt/seeds/raw/`

### Technical
- Improved separation of concerns with dedicated database integration layer
- Clearer architecture: dbt (transforms) → database (integration) ← cds_cap (serves)
- Centralized database management utilities in single location
- All path references updated to work with new structure
- Eliminated data duplication by using dbt as single source of truth for input data

## [0.3.4] - 2025-12-26

### Added
- Income Statement standalone custom app with period comparison (Period A vs Period B)
- Balance Sheet standalone custom app with period comparison
- Combined Statement standalone custom app (P&L + Balance Sheet)
- BaseFinancialController and BaseReportController shared controllers
- FinancialTable and PeriodSelector shared fragments for financial apps
- About menu in Fiori Launchpad user actions with version information
- Exit handlers in all Fiori Elements Component.js files for proper cleanup

### Changed
- Removed Finance group (Income Statement, Balance Sheet) from Analytics Dashboard navigation
- Updated all Fiori Elements apps with unique component IDs to prevent conflicts
- Migrated financial statement functionality from Analytics Dashboard to standalone apps
- Model configuration from "" (default) to "odata" in financial statement custom apps
- Fixed archetype typo from "archeType" to "archetype" in all Fiori Elements manifests
- Removed redundant entitySet properties from Newbase app manifests

### Fixed
- Diff % column not showing data in financial statements (diffPrc → diffPct property name)
- Diff Amount and Diff % columns right alignment in financial tables
- Period initialization issue in BaseFinancialController (added periodA/periodB defaults)
- Duplicate component ID errors in Fiori Elements apps during launchpad navigation
- Component loading errors caused by incorrect archetype spelling
- Delivery Notes app loading error from redundant entitySet property
- Model binding errors in financial statement apps (model name mismatch)

### Technical
- Implemented proper component lifecycle management for all Fiori Elements apps
- Standardized manifest.json configuration across all apps
- Enhanced code reusability with shared controller and fragment architecture
- Added HBox wrappers for proper ObjectStatus alignment in TreeTable columns

## [0.3.3] - 2025-12-26

### Added
- Additional CAP and Fiori build artifacts to .gitignore
- UI5 tooling patterns to .gitignore
- .claude/ directory to .gitignore for IDE files

### Changed
- Enhanced .gitignore with Fiori app-specific patterns (dist/, resources/, Component-preload.js)
- Updated .gitignore with CAP-specific patterns (default-*.json, _out/, @cds-models/)

### Fixed
- Git repository cleanup to remove previously tracked files now in .gitignore

## [0.3.2] - 2025-12-26

### Added
- Financial Statements LTM standalone custom app with Fiori tile
  - Dynamic period range selector (start/end year and month)
  - Hierarchical TreeTable with financial account structure
  - Dynamic column generation for LTM periods
  - Excel export functionality with error handling
  - Integration with getPivotTree backend service
- JSDoc documentation for all controller functions
- Comprehensive error handling in export functionality
- Model size limit constant (ModelConfig.SIZE_LIMIT) in shared Constants.js

### Changed
- Removed Charts menu item from custom UI5 app vertical menu
- Removed Revenue by Cost Center menu item from custom UI5 app vertical menu
- Extracted Financial Statements LTM from custom UI5 app to standalone tile
- Consolidated shared model files across custom apps (FinancialService, formatter, Constants, ExportHelper)
- Updated Revenue Analysis tile subtitle to "Twinfield Revenue Analysis"
- Improved code organization with shared namespace for common utilities

### Fixed
- Financial Statements data loading issue in custom UI5 app (model propagation timing)
- Duplicate ID validation errors in custom UI5 views (pageContainer, toolPage)
- Financial Statements LTM export button functionality (model binding and column definitions)
- OData model initialization in FinancialService for standalone apps
- Magic number replaced with named constant for model size limit

### Technical
- Added busy indicators during export operations
- Implemented try-catch error handling with user-friendly messages
- Standardized model naming conventions across views and controllers
- Enhanced export validation (table existence, data availability, column presence)

## [0.3.1] - 2025-12-26

### Added
- Six new custom UI5 applications in Data group:
  - Data Sources - Browse dbt input files
  - Staging - View dbt staging models
  - Tables - Browse database tables with dynamic columns
  - Data Model - Model visualization placeholder
  - Metrics - View dbt metrics models
  - Log - View dbt.log file
- Chart.js integration in Fiori Launchpad for custom UI5 app charts
- Separate Fiori tiles for all data management functionality

### Changed
- Removed Import tab and vertical menu from custom UI5 app
- Extracted Import functionality into dedicated custom apps
- Reorganized Fiori Launchpad with Data group alongside Twinfield, Newbase, Inventree
- Updated tile subtitles to include "dbt" prefix for data apps
- Removed user avatar and settings button from custom UI5 app
- Removed unused menu items (VG, SCA_ServiceAgreements, Inventree group, Newbase group)
- Removed Tables tab from custom UI5 app

### Fixed
- Chart.js loading issue when apps opened through Fiori Launchpad
- Table viewer template binding error in tables-custom app
- BaseController namespace consistency across all custom apps

### Technical
- Created modular app structure for data management features
- Each data app has independent Component.js, manifest.json, routing
- Shared BaseController pattern across all custom applications
- Resource roots and navigation targets configured in launchpad.html

## [0.3.0] - 2025-12-25

### Added
- SAP Fiori Elements applications with Fiori Launchpad
  - Financial Statements (Analytical List Page)
  - Revenue Analysis (Analytical List Page)
  - Working Capital (List Report + Object Page)
  - Service Agreements (List Report)
  - Sales Orders (List Report)
  - Sales Invoices (List Report)
- OData V4 analytical services with full aggregation support
- UI annotations for Fiori Elements templates
- Variant management and personalization
- Interactive charts and visualizations
- Smart filtering and value help
- Excel export functionality
- Flexible column layout navigation

### Changed
- Migrated from custom SAPUI5 app to SAP Fiori Elements
- Enhanced OData service with analytical capabilities
- Updated database schema with proper annotations
- Improved authentication and user management

### Fixed
- CSV data import with 12-column structure alignment
- SQLite table persistence annotations
- Database configuration for production deployment

### Documentation
- Added FIORI_MIGRATION.md guide
- Added AUTHENTICATION.md documentation
- Enhanced README.md with Fiori Elements information
- Added detailed deployment guides

## [0.2.9] - Previous Release

### Features
- Initial CAP project with custom SAPUI5 interface
- Basic OData service implementation
- SQLite database integration
- Mock authentication
