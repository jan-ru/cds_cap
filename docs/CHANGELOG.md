# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.9] - 2025-12-25

### Added
- Three new Fiori Elements applications following SAP Fiori Design Guidelines:
  - **Financial Statements** - Analytical List Page for Income Statement & Balance Sheet analysis
  - **Revenue Analysis** - Analytical List Page for LTM analysis and period comparison
  - **Working Capital** - List Report + Object Page for sales invoices, orders, and service agreements
- Fiori Launchpad (launchpad.html) with tile-based navigation organized by functional groups
- Comprehensive UI annotations (@UI.Chart, @UI.PresentationVariant, @UI.DataPoint) for all analytical entities
- Analytical capabilities with chart visualizations (column, bar, line charts)
- Sales Analytics entity with aggregation support

### Changed
- Migrated from custom SAPUI5 implementation to SAP Fiori Elements templates
- Enhanced annotations.cds with analytical chart definitions and presentation variants
- Reorganized database utility scripts into db_utils/ subdirectory
- Updated db_rebuild.sh to reference new db_utils/ paths for schema and import scripts
- Added build and watch scripts to package.json

### Improved
- 80% reduction in custom UI code through use of Fiori Elements templates
- Automatic variant management for saving user filter and layout preferences
- Built-in features: smart filtering, Excel export, flexible column layout, personalization
- Better adherence to Fiori Design Guidelines (responsive breakpoints, consistent UX)
- Separation of concerns: data preparation (db_utils) vs application code

### Documentation
- Created FIORI_MIGRATION.md with comprehensive migration guide
- Documented benefits of Fiori Elements approach
- Added troubleshooting section and migration roadmap
- Included access instructions for new Fiori Launchpad

### Deprecated
- Custom UI5 app (/app/ui5/) marked for future removal in favor of Fiori Elements apps

## [0.2.8] - 2024-12-24

### Added
- Enhanced CSV file support: Added all input CSV files to database rebuild workflow
- Database schema for ESL_Product.csv (11 columns, 1026 rows)
- Database schema for GUA_DeliveryNote.csv (12 columns, 2156 rows)
- Database schema for IOA_PurchaseOrderLine.csv (11 columns, 713 rows)
- Database schema for PGA_ProductGroup.csv (9 columns, 36 rows)
- Database schema for SBA_ServiceRequest.csv (12 columns, 1326 rows)
- Placeholder schemas for OFA_StillToFollowUpSalesQuotations.csv
- Comprehensive data quality analysis documented in db_nonunique.md

### Changed
- db_clean.sh now automatically processes all CSV files in input directory (loop-based approach)
- db_clean.sh output includes count of files cleaned
- db_import.sql now imports all 9 CSV files in alphabetical order
- db_rebuild.sh summary displays all tables dynamically with row counts
- Updated database schema definitions for all new tables with proper column mappings

### Fixed
- Fixed SQL syntax error in db_rebuild.sh (removed invalid 'exists' keyword usage)
- Corrected ESL_Product schema (removed duplicate uursoort field, fixed primary key)
- Fixed GUA_DeliveryNote schema (was duplicated, now properly defined with 12 columns)
- Improved database import process to handle all CSV files consistently

### Documentation
- Created db_nonunique.md analyzing duplicate primary key issues across all CSV files
- Identified data quality issues: 167 empty keys in SBA_ServiceRequest, 100+ duplicates in IOA_PurchaseOrderLine
- Added recommendations for handling files with non-unique primary keys

## [0.2.7] - 2024-12-23

### Added
- Git version control initialized with comprehensive .gitignore
- Frontend table viewer for database tables (Imports view)
- Dynamic column rendering in table viewer
- OData V4 exposure for SCA_ServiceAgreement, VFA_SalesInvoice, VOA_SalesOrder entities

### Changed
- Updated database schemas to match actual CSV structures (12 columns for VFA/VOA)
- Migrated from test.db to CAP-managed db.sqlite with proper CDS schema deployment
- Added @cds.persistence.table annotations for schema alignment

### Fixed
- Resolved table naming conflicts (AnalyticsService_ prefix)
- Fixed schema mismatches between entity definitions and CSV data
- Resolved port 4004 conflicts for server startup

## [0.2.6] - 2024-12-22

### Added
- Database rebuild automation scripts (db_rebuild.sh)
- CSV cleaning scripts (db_clean.sh) to handle double-quote wrapping format
- Import workflow for SCA_ServiceAgreement, VFA_SalesInvoice, VOA_SalesOrder
- Database validation and error logging (import_errors.log)

### Changed
- Improved CSV import process with tab-delimiter handling
- Enhanced database schema definitions in db_schema.sql

## Earlier Versions

### [0.2.0 - 0.2.5]
- Authentication system with mock users
- User settings persistence
- Financial reporting (PNL, Balance Sheet)
- LTM (Last Twelve Months) analysis
- Revenue reporting by cost center
- Excel export functionality
- SAPUI5 frontend with navigation
- OData V4 analytical service
- SQLite database backend
- Docker deployment support
