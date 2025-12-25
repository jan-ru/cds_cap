DROP TABLE IF EXISTS ESL_Product;
CREATE TABLE ESL_Product (
  prd_code_sku     TEXT PRIMARY KEY,
  company          TEXT,
  name_internal    TEXT,
  vendor           TEXT,
  productgroup     TEXT,
  werksoort        TEXT,
  costcenter       TEXT,
  uursoort         TEXT,
  discountgroup    TEXT,
  currency         TEXT,
  salesprice       REAL
);

DROP TABLE IF EXISTS GUA_DeliveryNote;
CREATE TABLE GUA_DeliveryNote (
  volg_nr          TEXT PRIMARY KEY,
  print_datum      TEXT,
  period           TEXT,
  shipment_date    TEXT,
  debtor_name      TEXT,
  organisation     TEXT,
  relation         TEXT,
  project          TEXT,
  volg_nr_origin   TEXT,
  reference_doc    TEXT,
  transport_via    TEXT,
  tracking_number  TEXT
);

DROP TABLE IF EXISTS PGA_ProductGroup;
CREATE TABLE PGA_ProductGroup (
  nummer           TEXT PRIMARY KEY,
  groupcode        TEXT,
  name             TEXT,
  rounding         TEXT,
  hs_code          TEXT,
  filter1          TEXT,
  filter2          TEXT,
  filter3          TEXT,
  filter4          TEXT
);

DROP TABLE IF EXISTS IOA_PurchaseOrderLine;
CREATE TABLE IOA_PurchaseOrderLine (
  volg_nr          TEXT,
  icon             TEXT,
  creditor         TEXT,
  project          TEXT,
  source_sales     TEXT,
  icon_product     TEXT,
  sku_vendor       TEXT,
  product_descr    TEXT,
  number           REAL,
  purchase_price   REAL,
  total_purchase_excl_vat  REAL,
  PRIMARY KEY (volg_nr)
);

DROP TABLE IF EXISTS OFA_StillToFollowUpSalesQuotations;
CREATE TABLE OFA_StillToFollowUpSalesQuotations (
  volg_nr               TEXT,
  organisation          TEXT,
  relation_name         TEXT,
  project               TEXT,
  forcast_status        TEXT,
  proposal_stage        TEXT,
  internal_reference    TEXT,
  target_date           DATE,
  account_manager       TEXT,
  internal_sales        TEXT,
  comment_type          TEXT,
  total_sales_ex_vat    REAL,
  probability_success   REAL,
  weighted_excl_vat     REAL,
);

DROP TABLE IF EXISTS SBA_ServiceRequest;
CREATE TABLE SBA_ServiceRequest (
  volg_nr          TEXT,
  status           TEXT,
  request_date     DATE,
  organisation     TEXT,
  relation         TEXT,
  project          TEXT,
  request_type     TEXT,
  work_status      TEXT,
  employee         TEXT,
  internal_reference   TEXT,
  problem_description  TEXT,
  feedback         TEXT,
  PRIMARY KEY (volg_nr)
);

DROP TABLE IF EXISTS SCA_ServiceAgreement;
CREATE TABLE SCA_ServiceAgreement (
  volg_nr          TEXT,
  project_name     TEXT,
  debtor_name      TEXT,
  relatie_nr       TEXT,
  financial_status TEXT,
  start_date       DATE,
  extention_date   DATE,
  end_date         DATE,
  sales_order      TEXT,
  sla_type         TEXT,
  contact_name     TEXT,
  PRIMARY KEY (volg_nr)
);

DROP TABLE IF EXISTS VFA_SalesInvoice;
CREATE TABLE VFA_SalesInvoice (
  volg_nr          TEXT,
  debtor_nr        TEXT,
  debtor_name      TEXT,
  project          TEXT,
  reference       TEXT,
  account_manager  TEXT,
  invoice_date     DATE,
  period_start     TEXT,
  total_ex_vat     REAL,
  total_incl_vat   REAL,
  paid_amount      REAL,
  open_amount      REAL,
  PRIMARY KEY (volg_nr)
);

DROP TABLE IF EXISTS VOA_SalesOrder;
CREATE TABLE VOA_SalesOrder (
  volg_nr          TEXT,
  organisation     TEXT,
  relation_name    TEXT,
  order_date       DATE,
  sca_description   TEXT,
  reference        TEXT,
  sca_type         TEXT,
  phase           TEXT,
  delivery_date     DATE,
  account_manager  TEXT,
  total_ex_vat     REAL,
  source           TEXT,
  PRIMARY KEY (volg_nr)
);

