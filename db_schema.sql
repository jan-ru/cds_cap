DROP TABLE IF EXISTS SCA_ServiceAgreement;
CREATE TABLE SCA_ServiceAgreement (
  volg_nr        TEXT,
  project_name   TEXT,
  debtor_name    TEXT,
  relatie_nr     TEXT,
  financial_status TEXT,
  start_date     DATE,
  extention_datate DATE,
  end_date       DATE,
  sales_order    TEXT,
  sla_type       TEXT,
  contact_name   TEXT,
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

