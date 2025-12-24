.mode csv
.separator "\t"
.headers on

.import input_clean/SCA_ServiceAgreement.csv SCA_ServiceAgreement
.import input_clean/VFA_SalesInvoice.csv     VFA_SalesInvoice
.import input_clean/VOA_SalesOrder.csv       VOA_SalesOrder

