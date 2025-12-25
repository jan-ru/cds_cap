# Database Non-Unique Primary Key Analysis

Analysis of duplicate `volg_nr` (first column) values across all CSV files.

## Summary

| File | Duplicate Keys | Empty Values |
|------|----------------|--------------|
| ESL_Product.csv | 13 | 0 |
| GUA_DeliveryNote.csv | Many text fragments | 12 |
| IOA_PurchaseOrderLine.csv | Extensive (100+) | 7 |
| OFA_StillToFollowUpSalesQuotations.csv | None | 0 |
| PGA_ProductGroup.csv | None | 0 |
| SBA_ServiceRequest.csv | Multiple | 167 |
| SCA_ServiceAgreement.csv | None | 0 |
| VFA_SalesInvoice.csv | 1 | 8 |
| VOA_SalesOrder.csv | None | 0 |

## Detailed Findings

### ESL_Product.csv
- TPXMISCRQ appears 2 times
- MSXISPRQ-MISC appears 2 times
- MSWLVLRQ-LND appears 2 times
- MSNOSCRY appears 2 times
- MSNONRRY appears 2 times
- MSNHSMRY-99 appears 2 times
- MSNHSMRY-25 appears 2 times
- MSNHSMRY-05 appears 2 times
- MSGTHEMEN appears 2 times
- MSGSSCAPEN appears 2 times
- MSGMLMAN appears 2 times
- MSGENTRQ-O0010 appears 2 times
- MSGAMQPN appears 2 times

### GUA_DeliveryNote.csv
- Contractduur: appears 20 times
- Contractduur: appears 14 times
- Contractduur: appears 8 times
- Vallei appears 6 times
- -> appears 6 times
- Waalse appears 4 times
- projectnummer appears 4 times
- _v1.0 appears 3 times
- productieve appears 3 times
- Contractduur: appears 3 times
- contractduur: appears 2 times
- (empty) appears 12 times

**Note**: First column contains text fragments, not proper IDs

### IOA_PurchaseOrderLine.csv
**High duplicate count (100+ entries)**

Most frequent duplicates:
- IOA2200131 appears 7 times
- IOA2300161 appears 6 times
- IOA2300153 appears 6 times
- IOA2200144 appears 6 times
- IOA2200130 appears 6 times
- IOA1900066 appears 6 times
- IOA1800052 appears 6 times

Also contains many text fragments like "wire", "mm", "connector", "Voor", etc.
- (empty) appears 7 times

**Note**: This file has significant data quality issues with the primary key

### OFA_StillToFollowUpSalesQuotations.csv
✓ No duplicates found

### PGA_ProductGroup.csv
✓ No duplicates found

### SBA_ServiceRequest.csv
- (empty) appears 167 times (149 + 18)
- 1x appears 13 times
- 3x appears 2 times
- Vandaag appears 2 times
- mszgof70176 appears 2 times
- mszgof70110 appears 2 times
- mszgof70109 appears 2 times
- mslv4f91163 appears 2 times
- mslv4f61116 appears 2 times
- mslv4f41097 appears 2 times
- mslv4f41092 appears 2 times
- mslv4f41006 appears 2 times
- mslv4f10888 appears 2 times
- mslv4f10886 appears 2 times
- mslv4f10747 appears 2 times
- mslv4e40316 appears 2 times
- Met appears 2 times
- Graag appears 2 times
- "-" appears 2 times

**Note**: 167 empty values is significant - these rows lack primary keys

### SCA_ServiceAgreement.csv
✓ No duplicates found

### VFA_SalesInvoice.csv
- VFA2504546 appears 2 times
- (empty) appears 8 times

### VOA_SalesOrder.csv
✓ No duplicates found

## Recommendations

1. **Critical Issues**:
   - SBA_ServiceRequest.csv: 167 rows with empty primary keys need investigation
   - IOA_PurchaseOrderLine.csv: Extensive duplicates suggest data quality issues

2. **Data Quality Issues**:
   - GUA_DeliveryNote.csv: First column contains text fragments, not IDs
   - IOA_PurchaseOrderLine.csv: Mix of proper IDs and text fragments

3. **Import Strategy**:
   - Files with no duplicates (OFA, PGA, SCA, VOA) can use PRIMARY KEY constraints
   - Files with duplicates may need:
     - Composite keys (combine multiple columns)
     - Auto-incrementing IDs
     - Data cleaning before import
     - Remove PRIMARY KEY constraint and add UNIQUE index where appropriate
