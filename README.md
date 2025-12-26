# my-analytics-cap (Version 0.3.4)

A SAP Cloud Application Programming Model (CAP) project featuring **SAP Fiori Elements** applications with OData V4 analytical services for comprehensive financial reporting and analysis.

## Architecture

Built following **SAP Fiori Design Guidelines** with:
- **SAP CAP/CDS** - Backend services and data modeling
- **SAP Fiori Elements** - Template-based UI applications
- **OData V4** - RESTful service protocol with analytical capabilities
- **SQLite** - Embedded database (can migrate to PostgreSQL/HANA)

## Features

### 🎯 Fiori Elements Applications

The application provides **three main Fiori Elements apps** accessible via the Fiori Launchpad:

#### 1. **Financial Statements** (Analytical List Page)
- Income Statement (P&L) and Balance Sheet (B/S) analysis
- Interactive charts with period-over-period comparison
- Hierarchical account structure visualization
- Variant management for saving custom views
- **Access**: `#financialstatements-display`

#### 2. **Revenue Analysis** (Analytical List Page)
- Last Twelve Months (LTM) revenue trends
- Revenue breakdown by cost center and type (Recurring vs One-off)
- Dynamic period selection with flexible date ranges
- Chart + Table combined views with drill-down
- **Access**: `#revenueanalysis-display`

#### 3. **Working Capital** (List Report + Object Page)
- Sales Invoices management with open/paid tracking
- Sales Orders overview
- Service Agreements monitoring
- Full search, filter, and export capabilities
- **Access**: `#workingcapital-display`

### 📊 Built-in Fiori Features

All apps include standard Fiori Elements capabilities:
- ✅ **Variant Management** - Save/restore filter and layout preferences
- ✅ **Smart Filtering** - Filter bar with type-ahead and value help
- ✅ **Excel Export** - Standard export with column selection
- ✅ **Flexible Column Layout** - Master-detail-detail navigation
- ✅ **Personalization** - Column sorting, grouping, reordering
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile
- ✅ **Chart Integration** - Interactive visualizations (column, bar, line)
- ✅ **Aggregation** - Dynamic grouping and calculations

### 🔐 Authentication & User Management
- **Secure Access**: All endpoints require authentication
- **Mock Users**: Three demo users (alice, bob, charlie)
- **Custom Login**: SAPUI5-themed login at `/login.html`
- **User Settings**: Preferences saved per user in database
- **Production Ready**: Simple to configure for Ubuntu/cloud deployment

See [AUTHENTICATION.md](./AUTHENTICATION.md) for detailed authentication documentation.

### 🎨 Design Compliance
- Follows **SAP Fiori Design Guidelines**
- Responsive breakpoints (S/M/L/XL)
- Consistent UX patterns across all apps
- Automatic theme support (Horizon, Quartz, etc.)

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm start
# or with live reload
npm run watch
```

### 3. Access Applications

**🚀 Recommended: Fiori Launchpad**
- Open [http://localhost:4004/launchpad.html](http://localhost:4004/launchpad.html)
- Provides tile-based navigation to all apps
- Organized by functional groups (Financial Analytics, Operations)

**Direct App Access:**
- Financial Statements: [http://localhost:4004/financial-statements/webapp/index.html](http://localhost:4004/financial-statements/webapp/index.html)
- Revenue Analysis: [http://localhost:4004/revenue-analysis/webapp/index.html](http://localhost:4004/revenue-analysis/webapp/index.html)
- Working Capital: [http://localhost:4004/working-capital/webapp/index.html](http://localhost:4004/working-capital/webapp/index.html)

**Login Credentials:**
- Username: `alice`, Password: `alice`
- Username: `bob`, Password: `bob`  
- Username: `charlie`, Password: `charlie`

**Legacy Custom UI** (deprecated):
- [http://localhost:4004/ui5/index.html](http://localhost:4004/ui5/index.html)

> 💡 **Migration Note**: The custom UI is being phased out. See [FIORI_MIGRATION.md](./docs/FIORI_MIGRATION.md) for details on the new Fiori Elements approach.

## Project Structure

```
cds_cap/
├── app/                              # Frontend applications
│   ├── launchpad.html               # Fiori Launchpad sandbox
│   ├── annotations.cds              # UI annotations for Fiori Elements
│   ├── financial-statements/        # Analytical List Page (Income/Balance)
│   ├── revenue-analysis/            # Analytical List Page (Revenue/LTM)
│   ├── working-capital/             # List Report (Invoices/Orders)
│   ├── service-agreements/          # List Report (Service Agreements)
│   ├── sales-orders/                # List Report (Sales Orders)
│   ├── sales-invoices/              # List Report (Sales Invoices)
│   └── ui5/                         # Legacy custom UI (deprecated)
├── db/                              # Database layer
│   ├── schema.cds                   # Domain models and entity definitions
│   └── data/                        # Demo data (CSV)
├── srv/                             # Service layer
│   ├── analytics-service.cds        # OData service definitions
│   ├── analytics-service.js         # Custom service implementation
│   └── utils/                       # Business logic utilities
├── db_utils/                        # Database utilities
│   ├── db_clean.sh                  # CSV cleaning script
│   ├── db_rebuild.sh                # Database rebuild script
│   ├── db_schema.sql                # SQL schema definitions
│   └── db_import.sql                # Data import script
├── input/                           # Raw CSV input files
├── input_clean/                     # Cleaned CSV files
└── package.json                     # Project dependencies
```

### Key Technologies
- **@sap/cds** (^9.5.2) - SAP Cloud Application Programming Model
- **@cap-js/sqlite** - Database adapter
- **@sap/cds-dk** - Development tools
- **sap.fe.templates** - Fiori Elements templates
- **sap.m, sap.f** - SAPUI5 libraries

## Deployment

### Docker Deployment (Recommended)

```bash
# Build and run with Docker
docker compose up --build

# Access at http://localhost:4004/launchpad.html
```

### Ubuntu Server Deployment

1. **Install on Ubuntu Server**:
   ```bash
   # Clone repository
   git clone <your-repo-url>
   cd cds_cap

   # Install dependencies
   npm install

   # Start with Docker (if using Docker)
   docker-compose up -d

   # Or start directly
   npm start
   ```

2. **Production Configuration**:
   - Edit `package.json` to add real users with strong passwords
   - Configure HTTPS using nginx reverse proxy
   - Set up SSL certificate with Let's Encrypt
   - Enable firewall (UFW) to restrict access

3. **Security Checklist**:
   - ✅ Use HTTPS in production (nginx + Let's Encrypt)
   - ✅ Change default passwords in `package.json`
   - ✅ Restrict file permissions on `package.json`
   - ✅ Configure firewall rules (UFW)
   - ✅ Regular database backups

See [AUTHENTICATION.md](./AUTHENTICATION.md) for detailed security recommendations.

### Cloud Deployment (Hetzner, AWS, Azure)

For detailed cloud deployment guide, see: [deploy_to_hetzner.md](deploy_to_hetzner.md)

**Quick Summary:**
1. Provision Ubuntu 24.04 server
2. Install Docker and Docker Compose
3. Clone repository and configure
4. Run `docker compose up -d`
5. Configure nginx reverse proxy with SSL

## Database Management

### Rebuild Database from CSV Files

```bash
cd db_utils
./db_rebuild.sh
```

This script:
1. Cleans CSV files (removes double quotes)
2. Drops existing database
3. Creates schema from SQL
4. Imports all CSV data
5. Displays summary with row counts

### CSV Input Files

Place raw CSV files in `input/` directory:
- `VFA_SalesInvoice.csv`
- `VOA_SalesOrder.csv`
- `SCA_ServiceAgreement.csv`
- `ESL_Product.csv`
- And 5 more...

Cleaned files are automatically generated in `input_clean/`.

## Development

### Available Scripts

```bash
npm start           # Start CAP server
npm run watch       # Development mode with live reload
npm run deploy      # Deploy to SQLite database
npm run build       # Production build
```

### OData Service Testing

Access the OData service metadata and entities:
- Service root: http://localhost:4004/analytics/
- Metadata: http://localhost:4004/analytics/$metadata
- Financial Statements: http://localhost:4004/analytics/FinancialStatements
- Revenue Report: http://localhost:4004/analytics/RevenueReport

### Adding New Fiori Elements Apps

1. Create app structure in `app/<app-name>/`
2. Add UI annotations in `app/annotations.cds`
3. Update `app/launchpad.html` with new tile
4. Test with `npm run watch`

See [FIORI_MIGRATION.md](./docs/FIORI_MIGRATION.md) for detailed guidance.

## Documentation

- **[FIORI_MIGRATION.md](./docs/FIORI_MIGRATION.md)** - Migration from custom UI to Fiori Elements
- **[AUTHENTICATION.md](./AUTHENTICATION.md)** - Security and authentication guide
- **[CHANGELOG.md](./docs/CHANGELOG.md)** - Version history and changes
- **[deploy_to_hetzner.md](./deploy_to_hetzner.md)** - Cloud deployment guide

## License

UNLICENSED - Private project

### Deploying to Cloud (e.g., Hetzner)
We have a detailed guide for deploying this application to a Hetzner Cloud VPS.
See: **[deploy_to_hetzner.md](deploy_to_hetzner.md)**

**Summary:**
1. Provision a server (Ubuntu 24.04).
2. Install Docker.
3. Copy project files (excluding `node_modules`).
4. Run `docker compose up -d`.

## Project Structure
- `app/`: SAPUI5 Frontend application.
- `db/`: Domain models and database schema (`schema.cds`).
- `srv/`: Service definitions and backend logic.
    - `analytics-service.js`: Main service implementation (including in-memory aggregation logic).
