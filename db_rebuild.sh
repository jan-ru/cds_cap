#!/bin/bash

# Complete database rebuild script
# This script cleans CSV files, creates schema, and imports data

DB_NAME="test.db"

echo "======================================"
echo "Database Rebuild Script"
echo "======================================"
echo ""

# Step 1: Clean CSV files
echo "Step 1: Cleaning CSV files..."
./db_clean.sh
echo ""

# Step 2: Remove old database
if [ -f "$DB_NAME" ]; then
    echo "Step 2: Removing old database..."
    rm -f "$DB_NAME"
    echo "✓ Removed $DB_NAME"
else
    echo "Step 2: No existing database to remove"
fi
echo ""

# Step 3: Create schema
echo "Step 3: Creating database schema..."
sqlite3 "$DB_NAME" < db_schema.sql
echo "✓ Schema created"
echo ""

# Step 4: Import data
echo "Step 4: Importing data..."
sqlite3 "$DB_NAME" < db_import.sql 2>&1 | tee import_errors.log
echo ""

# Step 5: Show summary
echo "======================================"
echo "Import Summary"
echo "======================================"
sqlite3 "$DB_NAME" << EOF
SELECT 'SCA_ServiceAgreement' as table_name, COUNT(*) as row_count FROM SCA_ServiceAgreement
UNION ALL
SELECT 'VFA_SalesInvoice', COUNT(*) FROM VFA_SalesInvoice
UNION ALL
SELECT 'VOA_SalesOrder', COUNT(*) FROM VOA_SalesOrder;
EOF

echo ""
echo "Database rebuild complete!"
echo "Check import_errors.log for any warnings or errors"
