# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
