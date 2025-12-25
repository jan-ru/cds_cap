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
./db_utils/db_clean.sh
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
sqlite3 "$DB_NAME" < db_utils/db_schema.sql
echo "✓ Schema created"
echo ""

# Step 4: Import data
echo "Step 4: Importing data..."
sqlite3 "$DB_NAME" < db_utils/db_import.sql 2>&1 | tee import_errors.log
echo ""

# Step 5: Show summary
echo "======================================"
echo "Import Summary"
echo "======================================"
sqlite3 "$DB_NAME" << EOF
SELECT name as table_name, COUNT(*) as row_count 
FROM sqlite_master 
WHERE type='table' AND name NOT LIKE 'sqlite_%' 
GROUP BY name 
ORDER BY name;
EOF
echo ""
sqlite3 "$DB_NAME" << EOF
.mode column
.headers on
SELECT 'ESL_Product' as table_name, COUNT(*) as rows FROM ESL_Product
UNION ALL SELECT 'GUA_DeliveryNote', COUNT(*) FROM GUA_DeliveryNote
UNION ALL SELECT 'IOA_PurchaseOrderLine', COUNT(*) FROM IOA_PurchaseOrderLine
UNION ALL SELECT 'OFA_StillToFollowUpSalesQuotations', COUNT(*) FROM OFA_StillToFollowUpSalesQuotations
UNION ALL SELECT 'PGA_ProductGroup', COUNT(*) FROM PGA_ProductGroup
UNION ALL SELECT 'SBA_ServiceRequest', COUNT(*) FROM SBA_ServiceRequest
UNION ALL SELECT 'SCA_ServiceAgreement', COUNT(*) FROM SCA_ServiceAgreement
UNION ALL SELECT 'VFA_SalesInvoice', COUNT(*) FROM VFA_SalesInvoice
UNION ALL SELECT 'VOA_SalesOrder', COUNT(*) FROM VOA_SalesOrder;
EOF

echo ""
echo "Database rebuild complete!"
echo "Check import_errors.log for any warnings or errors"
