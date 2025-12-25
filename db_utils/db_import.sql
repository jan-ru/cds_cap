.mode csv
.separator "\t"
.headers on

.import input_clean/ESL_Product.csv ESL_Product
.import input_clean/GUA_DeliveryNote.csv GUA_DeliveryNote
.import input_clean/IOA_PurchaseOrderLine.csv IOA_PurchaseOrderLine
.import input_clean/OFA_StillToFollowUpSalesQuotations.csv OFA_StillToFollowUpSalesQuotations
.import input_clean/PGA_ProductGroup.csv PGA_ProductGroup
.import input_clean/SBA_ServiceRequest.csv SBA_ServiceRequest
.import input_clean/SCA_ServiceAgreement.csv SCA_ServiceAgreement
.import input_clean/VFA_SalesInvoice.csv VFA_SalesInvoice
.import input_clean/VOA_SalesOrder.csv VOA_SalesOrder

-- Remove any duplicate header rows that may have been imported as data
DELETE FROM ESL_Product WHERE prd_code_sku = 'Prd.code (SKU)';
DELETE FROM GUA_DeliveryNote WHERE volg_nr = 'Volgnr.';
DELETE FROM IOA_PurchaseOrderLine WHERE volg_nr = 'Volgnr.';
DELETE FROM OFA_StillToFollowUpSalesQuotations WHERE volg_nr = 'Volgnr.';
DELETE FROM PGA_ProductGroup WHERE volg_nr = 'Volgnr.';
DELETE FROM SBA_ServiceRequest WHERE volg_nr = 'Volgnr.';
DELETE FROM SCA_ServiceAgreement WHERE volg_nr = 'Volgnr.';
DELETE FROM VFA_SalesInvoice WHERE volg_nr = 'Volgnr.';
DELETE FROM VOA_SalesOrder WHERE volg_nr = 'Volgnr.';
