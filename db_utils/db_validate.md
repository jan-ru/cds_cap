sqlite3 db.sqlite <<EOF
SELECT COUNT(*) FROM SCA_ServiceAgreement;
SELECT COUNT(*) FROM VFA_SalesInvoice;
SELECT COUNT(*) FROM VOA_SalesOrder;
EOF

