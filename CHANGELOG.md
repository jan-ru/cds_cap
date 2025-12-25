# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
