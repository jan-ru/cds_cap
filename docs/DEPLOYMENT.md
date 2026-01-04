# Deployment Guide

This guide covers deploying the CDS Analytics application to production environments using Docker, as well as alternative deployment options.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Deployment Architecture](#deployment-architecture)
- [Docker Deployment](#docker-deployment)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Production Checklist](#production-checklist)
- [Monitoring & Health Checks](#monitoring--health-checks)
- [Backup & Recovery](#backup--recovery)
- [Scaling Considerations](#scaling-considerations)
- [Alternative Deployment Options](#alternative-deployment-options)

## Prerequisites

### System Requirements

**Minimum Hardware**:
- CPU: 2 cores
- RAM: 4 GB
- Disk: 10 GB (plus space for database growth)

**Recommended Hardware**:
- CPU: 4+ cores
- RAM: 8+ GB
- Disk: 50+ GB SSD

### Software Dependencies

**Required**:
- Docker 20.10+ and Docker Compose 2.0+
- Git (for deployment from repository)
- Access to `/root/projects/database/db.sqlite` (or configure alternative path)

**Optional**:
- Node.js 20.x (for non-Docker deployment)
- Caddy (for reverse proxy - automatically configured by Coolify)
- PostgreSQL/HANA Cloud (for SQLite replacement)

### Network Requirements

**Inbound**:
- Port 4004: CAP application server (HTTP)
- Port 443: HTTPS (if using reverse proxy)

**Outbound**:
- None required (unless using external authentication)

## Deployment Architecture

### Production Topology

```
┌─────────────────────────────────────────────────────────────┐
│                     Reverse Proxy (Caddy)                   │
│              Managed by Coolify PAAS                        │
│                        HTTPS (443)                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Docker Container (CAP)                    │
│                       HTTP (4004)                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Node.js 20 (Alpine)                                 │  │
│  │  └─→ CAP Runtime (cds serve)                         │  │
│  │      └─→ OData V4 Services                           │  │
│  │          └─→ SQLite Database (mounted volume)        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Shared Database Volume                         │
│       /root/projects/database/db.sqlite                     │
│  (Also accessed by dbt pipeline for updates)                │
└─────────────────────────────────────────────────────────────┘
```

### File System Layout

```
/opt/cds_cap/                      # Application root
├── app/                           # Fiori Elements apps
├── srv/                           # CAP services
├── db/                            # CDS schema definitions
├── package.json
├── Dockerfile
├── docker-compose.yml
└── .env                           # Environment variables (not in git)

/root/projects/database/           # Shared data directory
└── db.sqlite                      # Production database

/var/log/cds_cap/                  # Application logs (optional)
└── application.log
```

## Docker Deployment

**Note**: This application is deployed using **Coolify** (self-hosted PAAS). Coolify automatically handles Docker builds, deployments, and reverse proxy configuration with Caddy.

### Step 1: Prepare Environment

```bash
# Clone repository
git clone https://github.com/yourorg/cds_cap.git /opt/cds_cap
cd /opt/cds_cap

# Create environment file
cat > .env <<EOF
NODE_ENV=production
PORT=4004
LOG_LEVEL=info
DATABASE_PATH=/app/db.sqlite
EOF

# Ensure database directory exists
mkdir -p /root/projects/database
```

### Step 2: Build Docker Image

```bash
# Build the image
docker build -t cds-cap-analytics:latest .

# Verify image
docker images | grep cds-cap-analytics
```

**Dockerfile Overview**:
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies (production only)
COPY package*.json ./
RUN npm ci --production

# Copy application code
COPY . .

# Expose port
EXPOSE 4004

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4004/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["npm", "start"]
```

### Step 3: Deploy with Docker Compose

**Production docker-compose.yml**:
```yaml
version: '3.8'

services:
  cds-cap:
    image: cds-cap-analytics:latest
    container_name: cds-cap-production
    restart: unless-stopped
    
    ports:
      - "4004:4004"
    
    volumes:
      # Mount shared database (read-only for CAP, write access for dbt)
      - /root/projects/database/db.sqlite:/app/db.sqlite:ro
      
      # Optional: Mount logs directory
      - /var/log/cds_cap:/app/logs
    
    environment:
      - NODE_ENV=production
      - PORT=4004
      - LOG_LEVEL=info
    
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:4004/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    
    # Resource limits
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
    
    # Logging configuration
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

**Start the application**:
```bash
# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### Step 4: Verify Deployment

```bash
# Check container health
docker ps

# Test application endpoint
curl http://localhost:4004/

# Test OData service
curl http://localhost:4004/analytics/

# Check logs for errors
docker logs cds-cap-production --tail 100
```

## Environment Configuration

### Environment Variables

**Required**:
```bash
NODE_ENV=production          # Enables production optimizations
PORT=4004                    # HTTP server port
```

**Optional**:
```bash
LOG_LEVEL=info              # error | warn | info | debug
DATABASE_PATH=/app/db.sqlite # Path to SQLite database inside container
CDS_FEATURES_ASSERT_INTEGRITY=production # CAP runtime mode
```

### Configuration Files

**package.json** (CDS configuration):
```json
{
  "cds": {
    "requires": {
      "db": {
        "kind": "sqlite",
        "credentials": {
          "url": "/root/projects/database/db.sqlite"
        }
      },
      "auth": {
        "kind": "basic",
        "users": {
          "alice": { "password": "alice", "roles": ["Admin"] },
          "bob": { "password": "bob", "roles": ["User"] }
        }
      }
    }
  }
}
```

**⚠️ IMPORTANT FOR PRODUCTION**:
- Replace mock authentication with SAP BTP or OAuth2
- Use environment variables for sensitive credentials
- Never commit `.env` file to version control

## Database Setup

### SQLite Database Location

**Shared Database Path**: `/root/projects/database/db.sqlite`

**Access Patterns**:
- **dbt** (write): Exclusive access during pipeline execution
- **CAP** (read): Mounted as read-only volume in Docker

### Database Initialization

```bash
# Ensure database exists (run dbt pipeline)
cd /root/projects/dbt
./build.sh

# Verify database file
ls -lh /root/projects/database/db.sqlite

# Check database integrity
sqlite3 /root/projects/database/db.sqlite "PRAGMA integrity_check;"
```

### Database Volume Mount

**Docker Volume Options**:

1. **Read-only mount** (recommended for CAP):
   ```yaml
   volumes:
     - /root/projects/database/db.sqlite:/app/db.sqlite:ro
   ```

2. **Read-write mount** (only if CAP needs write access):
   ```yaml
   volumes:
     - /root/projects/database/db.sqlite:/app/db.sqlite:rw
   ```

3. **Named volume** (for isolated database):
   ```yaml
   volumes:
     - cds_data:/app/data
   
   volumes:
     cds_data:
       driver: local
   ```

### Database Updates

**Pipeline Execution**:
```bash
# Stop CAP application (to prevent read locks)
docker-compose stop cds-cap

# Run dbt pipeline
cd /root/projects/dbt
./build.sh

# Restart CAP application
docker-compose start cds-cap
```

**Automated Updates** (cron example):
```bash
# /etc/cron.d/dbt-pipeline
0 2 * * * root /opt/scripts/update-database.sh
```

**Update Script** (`/opt/scripts/update-database.sh`):
```bash
#!/bin/bash
set -e

# Stop CAP
docker-compose -f /opt/cds_cap/docker-compose.yml stop cds-cap

# Run dbt pipeline
cd /root/projects/dbt
./build.sh

# Restart CAP
docker-compose -f /opt/cds_cap/docker-compose.yml start cds-cap

# Log completion
echo "$(date): Database updated successfully" >> /var/log/dbt-updates.log
```

## Production Checklist

### Pre-Deployment

- [ ] Replace mock authentication with production auth (SAP BTP/OAuth2)
- [ ] Configure HTTPS with valid SSL certificates
- [ ] Set `NODE_ENV=production`
- [ ] Review and adjust resource limits (CPU, memory)
- [ ] Configure log rotation (max-size, max-file)
- [ ] Set up monitoring and alerting
- [ ] Document runbook for common issues
- [ ] Test database backup and restore procedures
- [ ] Verify firewall rules and network security
- [ ] Review CDS annotations for sensitive data exposure

### Security Hardening

- [ ] Remove default users (alice, bob, charlie)
- [ ] Implement rate limiting (e.g., via Nginx)
- [ ] Enable CORS restrictions in CAP
- [ ] Disable unnecessary OData endpoints
- [ ] Implement API key authentication
- [ ] Configure Content Security Policy headers
- [ ] Enable HSTS (HTTP Strict Transport Security)
- [ ] Scan Docker image for vulnerabilities (`docker scan`)
- [ ] Use secrets management (Docker Secrets, Vault)

### Post-Deployment

- [ ] Verify all endpoints return expected data
- [ ] Test Fiori launchpad loads correctly
- [ ] Confirm database connection is read-only
- [ ] Check application logs for errors
- [ ] Validate health check endpoint (`/health`)
- [ ] Test authentication and authorization
- [ ] Monitor resource usage (CPU, memory, disk)
- [ ] Set up automated backups
- [ ] Document deployed version and configuration

## Monitoring & Health Checks

### Health Check Endpoint

**Implementation** (add to `srv/analytics-service.js`):
```javascript
// Health check endpoint
const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  // Check database connection
  try {
    const db = cds.db;
    const result = await db.run('SELECT 1');
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'Database connection failed'
    });
  }
});
```

### Monitoring Metrics

**Application Metrics** (via `srv/middleware/monitoring.js`):
- Request count per endpoint
- Average response time
- Error rate (4xx, 5xx)
- Slow requests (>1000ms)

**System Metrics**:
```bash
# CPU and memory usage
docker stats cds-cap-production

# Disk usage
df -h /root/projects/database/

# Container logs
docker logs cds-cap-production --since 1h
```

### Log Aggregation

**Docker Logging Drivers**:
```yaml
logging:
  driver: "syslog"
  options:
    syslog-address: "udp://logs.example.com:514"
    tag: "cds-cap"
```

**Log Rotation** (already configured in docker-compose.yml):
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### Alerting

**Sample Prometheus Alerts**:
```yaml
groups:
  - name: cds-cap
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        annotations:
          summary: "High error rate detected"
      
      - alert: SlowResponseTime
        expr: http_request_duration_seconds > 2
        annotations:
          summary: "Slow response time detected"
```

## Backup & Recovery

### Database Backup

**Automated Backup Script**:
```bash
#!/bin/bash
# /opt/scripts/backup-database.sh

BACKUP_DIR=/var/backups/cds_cap
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_FILE=/root/projects/database/db.sqlite

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup (SQLite requires no special locking)
cp $DB_FILE "$BACKUP_DIR/db_backup_$TIMESTAMP.sqlite"

# Compress backup
gzip "$BACKUP_DIR/db_backup_$TIMESTAMP.sqlite"

# Retain only last 7 days of backups
find $BACKUP_DIR -name "db_backup_*.sqlite.gz" -mtime +7 -delete

echo "$(date): Backup completed - db_backup_$TIMESTAMP.sqlite.gz" >> /var/log/db-backups.log
```

**Cron Schedule**:
```bash
# Daily backup at 3 AM
0 3 * * * /opt/scripts/backup-database.sh
```

### Application Backup

**Configuration and Code**:
```bash
# Backup docker-compose and environment
tar -czf /var/backups/cds_cap/config_$(date +%Y%m%d).tar.gz \
  /opt/cds_cap/docker-compose.yml \
  /opt/cds_cap/.env \
  /opt/cds_cap/package.json
```

### Recovery Procedure

**Database Recovery**:
```bash
# Stop application
docker-compose stop cds-cap

# Restore database from backup
gunzip -c /var/backups/cds_cap/db_backup_20260103_030000.sqlite.gz > /root/projects/database/db.sqlite

# Verify integrity
sqlite3 /root/projects/database/db.sqlite "PRAGMA integrity_check;"

# Restart application
docker-compose start cds-cap
```

**Application Recovery**:
```bash
# Pull latest code
cd /opt/cds_cap
git pull origin main

# Rebuild image
docker-compose build

# Restart with new image
docker-compose up -d
```

## Scaling Considerations

### Horizontal Scaling

**Load Balancer Configuration** (Caddy):
```caddy
analytics.example.com {
    reverse_proxy cds_cap_backend {
        lb_policy least_conn
        to 192.168.1.10:4004
        to 192.168.1.11:4004
        to 192.168.1.12:4004
        
        header_up Host {host}
        header_up X-Real-IP {remote_host}
    }
}
```

**Note**: When using Coolify, load balancing is handled automatically across multiple container instances.

**Docker Swarm** (alternative to docker-compose):
```yaml
version: '3.8'

services:
  cds-cap:
    image: cds-cap-analytics:latest
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
```

### Vertical Scaling

**Increase Container Resources**:
```yaml
deploy:
  resources:
    limits:
      cpus: '4'      # Increase from 2
      memory: 4G     # Increase from 2G
```

### Database Scaling

**Limitations with SQLite**:
- Single-writer (dbt has exclusive write access)
- Read-only scaling via multiple CAP instances is supported
- For high-concurrency writes, migrate to PostgreSQL or HANA Cloud

**PostgreSQL Migration** (future enhancement):
```json
{
  "cds": {
    "requires": {
      "db": {
        "kind": "postgres",
        "credentials": {
          "host": "db.example.com",
          "port": 5432,
          "database": "analytics",
          "user": "cds_user",
          "password": "${DB_PASSWORD}"
        }
      }
    }
  }
}
```

## Alternative Deployment Options

### Coolify PAAS Deployment (Recommended)

**Coolify** is a self-hosted, open-source PAAS that simplifies deployment with automatic:
- Docker builds from Git repositories
- SSL certificate management via Caddy
- Zero-downtime deployments
- Environment variable management
- Health checks and auto-restart

**Setup in Coolify**:
1. Connect your Git repository (GitHub, GitLab, Bitbucket)
2. Configure build settings:
   - Build Pack: Dockerfile
   - Dockerfile Location: `./Dockerfile`
3. Set environment variables:
   ```
   NODE_ENV=production
   PORT=4004
   LOG_LEVEL=info
   ```
4. Configure volume mounts:
   - Source: `/root/projects/database/db.sqlite`
   - Destination: `/app/db.sqlite`
   - Read-only: Yes
5. Set custom domain and enable HTTPS (automatic via Caddy)
6. Deploy!

**Coolify Benefits**:
- Automatic Caddy reverse proxy with SSL
- Git-based deployments (push to deploy)
- Built-in monitoring and logs
- Resource usage tracking
- Easy rollback to previous deployments

### Direct Node.js Deployment

**Without Docker**:
```bash
# Install dependencies
cd /opt/cds_cap
npm ci --production

# Start with PM2 (process manager)
pm2 start npm --name "cds-cap" -- start
pm2 save

# Enable startup script
pm2 startup systemd
```

### SAP BTP Cloud Foundry

**Manifest** (`manifest.yml`):
```yaml
applications:
  - name: cds-cap-analytics
    memory: 2G
    instances: 2
    buildpack: nodejs_buildpack
    command: npm start
    services:
      - cds-hana-db
    env:
      NODE_ENV: production
```

**Deploy**:
```bash
cf push -f manifest.yml
```

### Kubernetes Deployment

**Deployment** (`k8s-deployment.yaml`):
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cds-cap-analytics
spec:
  replicas: 3
  selector:
    matchLabels:
      app: cds-cap
  template:
    metadata:
      labels:
        app: cds-cap
    spec:
      containers:
      - name: cds-cap
        image: cds-cap-analytics:latest
        ports:
        - containerPort: 4004
        env:
        - name: NODE_ENV
          value: "production"
        volumeMounts:
        - name: database
          mountPath: /app/db.sqlite
          readOnly: true
      volumes:
      - name: database
        hostPath:
          path: /root/projects/database/db.sqlite
```

## Troubleshooting Deployment

### Common Issues

**Container won't start**:
```bash
# Check logs
docker logs cds-cap-production

# Verify database file exists
ls -lh /root/projects/database/db.sqlite

# Test database connection manually
docker exec -it cds-cap-production sh
sqlite3 /app/db.sqlite "SELECT COUNT(*) FROM demo_FinancialStatements;"
```

**502 Bad Gateway** (via Caddy proxy):
```bash
# Verify container is running
docker ps

# Check container health
docker inspect cds-cap-production | grep Health

# Test direct connection (bypass proxy)
curl http://localhost:4004/

# Check Caddy logs (if using Coolify, view in dashboard)
docker logs coolify-proxy
```

**Database locked errors**:
```bash
# Check if dbt pipeline is running
ps aux | grep dbt

# Check for stale locks
fuser /root/projects/database/db.sqlite
```

For more troubleshooting scenarios, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture overview
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions
- [README.md](../README.md) - Getting started guide
- [AUTHENTICATION.md](../AUTHENTICATION.md) - Authentication configuration
