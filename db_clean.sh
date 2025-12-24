#!/bin/bash

# Clean CSV files by removing double-double quotes
# This converts the tab-delimited files with ""field"" format to standard tab-delimited format

echo "Cleaning CSV files..."

# Create clean directory if it doesn't exist
mkdir -p input_clean

# Clean SCA_ServiceAgreement.csv
if [ -f "input/SCA_ServiceAgreement.csv" ]; then
    sed 's/^""//; s/""$//; s/""\t""/\t/g' input/SCA_ServiceAgreement.csv > input_clean/SCA_ServiceAgreement.csv
    echo "✓ Cleaned SCA_ServiceAgreement.csv"
fi

# Clean VFA_SalesInvoice.csv
if [ -f "input/VFA_SalesInvoice.csv" ]; then
    sed 's/^""//; s/""$//; s/""\t""/\t/g' input/VFA_SalesInvoice.csv > input_clean/VFA_SalesInvoice.csv
    echo "✓ Cleaned VFA_SalesInvoice.csv"
fi

# Clean VOA_SalesOrder.csv
if [ -f "input/VOA_SalesOrder.csv" ]; then
    sed 's/^""//; s/""$//; s/""\t""/\t/g' input/VOA_SalesOrder.csv > input_clean/VOA_SalesOrder.csv
    echo "✓ Cleaned VOA_SalesOrder.csv"
fi

echo "CSV cleaning complete!"
