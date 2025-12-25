#!/bin/bash

# Clean CSV files by removing double-double quotes and converting European number formats
# This converts the tab-delimited files with ""field"" format to standard tab-delimited format
# Also converts European numbers (1.234,56) to SQL format (1234.56)

echo "Cleaning CSV files..."

# Create clean directory if it doesn't exist
mkdir -p input_clean

# Clean all CSV files in input directory
count=0
for file in input/*.csv; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        
        # Step 1: Remove double-double quotes
        sed 's/^""//; s/""$//; s/""\t""/\t/g' "$file" > "input_clean/${filename}.tmp"
        
        # Step 2: Convert European number format to SQL format for specific files
        if [[ "$filename" == "VFA_SalesInvoice.csv" ]] || \
           [[ "$filename" == "VOA_SalesOrder.csv" ]] || \
           [[ "$filename" == "IOA_PurchaseOrderLine.csv" ]] || \
           [[ "$filename" == "ESL_Product.csv" ]] || \
           [[ "$filename" == "GUA_DeliveryNote.csv" ]]; then
            # Convert numbers: remove dots (thousands separator), replace comma with dot (decimal)
            # This handles patterns like "8.174,70" -> "8174.70" and "-2.095,05" -> "-2095.05"
            awk 'BEGIN {FS=OFS="\t"}
            NR==1 {print; next}  # Keep header unchanged
            {
                for(i=1; i<=NF; i++) {
                    # Match European number format: optional minus, digits, dots, and comma decimal
                    if ($i ~ /^-?[0-9]+(\.[0-9]{3})*(,[0-9]+)?$/) {
                        gsub(/\./, "", $i)  # Remove thousand separators
                        gsub(/,/, ".", $i)  # Replace decimal comma with dot
                    }
                }
                print
            }' "input_clean/${filename}.tmp" > "input_clean/$filename"
            rm "input_clean/${filename}.tmp"
        else
            mv "input_clean/${filename}.tmp" "input_clean/$filename"
        fi
        
        echo "✓ Cleaned $filename"
        ((count++))
    fi
done

echo "CSV cleaning complete! ($count files cleaned with numeric conversion)"

