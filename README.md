# my-analytics-cap (Version 0.2.7)

A SAP Cloud Application Programming Model (CAP) project featuring an OData V4 Analytical Service and a SAPUI5 frontend, capable of detailed financial reporting and analysis.

## Features

### 1. Financial Reporting
- **Multi-View Reporting**:
    - **Income Statement (PNL)**: Hierarchical view of profit and loss accounts.
    - **Balance Sheet (BAS)**: Hierarchical view of asset, liability, and equity accounts.
    - **Sales Analytics**: Detailed revenue breakdown by cost center.

### 2. LTM (Last Twelve Months) & Period Analysis
The application features a dedicated **"LTM"** menu group for advanced period analysis:
- **Revenue LTM**: Analyzes revenue trends over a flexible, user-defined period range (not limited to 12 months). Breaks down revenue by "Recurring" vs "One-off".
- **Financial Statements LTM**: A pivot-style report showing financial statement lines over a dynamic range of periods.
- **Dynamic Columns**: Reports automatically adjust to show columns for every month in the selected range.

### 3. Authentication & User Management
- **Secure Access**: All endpoints require authentication
- **Mock Users**: Three demo users available (alice, bob, charlie) - easily add more users
- **User Display**: Current user shown in top-right avatar with popover details
- **Custom Login Page**: SAPUI5-themed login interface available at `/login.html`
- **Ubuntu Ready**: Simple authentication suitable for self-hosted deployment
- **All users have equal access** - authentication is only for access control, not permission differences

See [AUTHENTICATION.md](./AUTHENTICATION.md) for detailed authentication documentation.

### 4. User Settings Persistence
- **Auto-Save**: Selected Period Start/End dates are automatically saved to the backend database (`UserSettings` entity).
- **Auto-Load**: User preferences are restored immediately upon returning to the application.
- **Per-User Storage**: Each authenticated user has their own isolated settings.

### 5. Excel Export
- High-fidelity Excel export is supported for all grids, preserving hierarchical structures and column layouts.

## Setup & Running Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Start Server**:
   ```bash
   npm start
   ```
3. **Access Application**:
   - Open [http://localhost:4004/ui5/index.html](http://localhost:4004/ui5/index.html) in your browser
   - Or use the custom login page: [http://localhost:4004/login.html](http://localhost:4004/login.html)
   - Login with demo credentials:
     - Username: `alice`, Password: `alice`
     - Username: `bob`, Password: `bob`
     - Username: `charlie`, Password: `charlie`

## Deployment (Ubuntu Server)

The project is configured for deployment on Ubuntu servers using Docker and SQLite for data persistence.

### Quick Deployment Steps

1. **On Ubuntu Server**:
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

2. **Add Production Users**:
   - Edit `package.json` to add real users with strong passwords
   - Restart the application

3. **Enable HTTPS** (Recommended):
   - Use nginx as reverse proxy
   - Get free SSL certificate from Let's Encrypt
   - Configure nginx to forward to `http://localhost:4004`

### Security for Production

- **HTTPS Required**: Always use HTTPS in production to encrypt credentials
- **Firewall**: Use UFW to restrict access
- **Strong Passwords**: Change default passwords in `package.json`
- **File Permissions**: Restrict access to `package.json` (contains passwords)

See [AUTHENTICATION.md](./AUTHENTICATION.md) for more security recommendations.

### Quick Start with Docker
```bash
# Build and run locally
docker compose up --build
```

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
