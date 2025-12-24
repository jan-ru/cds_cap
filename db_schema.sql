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
  volg_nr          INTEGER,
  debtor_nr        TEXT,
  debtor_name      TEXT,
  invoice_date     DATE,
  total_incl_vat   REAL,
  paid_amount      REAL,
  open_amount      REAL,
  PRIMARY KEY (volg_nr)
);

DROP TABLE IF EXISTS VOA_SalesOrder;
CREATE TABLE VOA_SalesOrder (
  volg_nr          INTEGER,
  organisation     TEXT,
  relation_name    TEXT,
  order_date       DATE,
  account_manager  TEXT,
  total_ex_vat     REAL,
  source           TEXT,
  PRIMARY KEY (volg_nr)
);

