/root/projects/
├── analytics-data-pipeline/          # dbt project (data layer)
│   ├── dbt_project.yml
│   ├── profiles.yml
│   ├── models/
│   │   ├── staging/                  # Raw data ingestion
│   │   │   ├── stg_sales_orders.sql
│   │   │   ├── stg_invoices.sql
│   │   │   └── stg_service_agreements.sql
│   │   ├── intermediate/             # Business logic transformations
│   │   │   ├── int_revenue_calculations.sql
│   │   │   └── int_financial_statements.sql
│   │   └── marts/                    # Final models consumed by CAP
│   │       ├── fact_revenue.sql
│   │       ├── dim_products.sql
│   │       └── fact_financial_statements.sql
│   ├── seeds/                        # Reference data
│   ├── snapshots/                    # Historical tracking
│   ├── macros/
│   ├── tests/
│   └── data_sources/                 # CSV import scripts
│       ├── input/                    # Your current input folder
│       ├── input_clean/              # Cleaned CSVs
│       └── scripts/
│           ├── clean_csv.sh
│           ├── import_to_db.sh
│           └── validate_data.sh
│
└── cds_cap/                          # SAP CAP application (service layer)
    ├── app/                          # SAPUI5 frontend
    ├── srv/                          # CAP services (read from dbt models)
    ├── db/
    │   └── schema.cds                # Views on dbt tables
    ├── package.json
    └── README.md
