using demo from '../db/schema';

service AnalyticsService @(path: '/analytics', requires: 'authenticated-user') {


  @readonly
  entity Dump                as projection on demo.Dump;

  @readonly
  entity Pivot               as projection on demo.Pivot;

  @readonly
  entity FinancialStatements as projection on demo.FinancialStatements;

  @readonly
  entity Controls            as projection on demo.Controls;

  @readonly
  entity RevenueReport       as projection on demo.RevenueReport;

  entity UserSettings        as projection on demo.UserSettings;

  @readonly
  entity SCA_ServiceAgreement as projection on demo.SCA_ServiceAgreement;

  @readonly
  entity VFA_SalesInvoice     as projection on demo.VFA_SalesInvoice;

  @readonly
  entity VOA_SalesOrder       as projection on demo.VOA_SalesOrder;

  @readonly
  entity GUA_DeliveryNote     as projection on demo.GUA_DeliveryNote;

  @readonly
  entity ESL_Product          as projection on demo.ESL_Product;

  @readonly
  entity PGA_ProductGroup     as projection on demo.PGA_ProductGroup;

  @readonly
  entity SalesAnalytics      as
    select from FinancialStatements {
      key ID,
          CodeGrootboekrekening,
          NaamGrootboekrekening,
          ReportingPeriod,
          PeriodYear,
          DisplayAmount,
          Code1
    }
    where
      CodeGrootboekrekening like '8%';

  function getAppInfo()                                                                                                 returns String;

  function getFinancialStatementsTree(FStype : String,
                                      PeriodAYear : Integer,
                                      PeriodAMonthFrom : Integer,
                                      PeriodAMonthTo : Integer,
                                      PeriodBYear : Integer,
                                      PeriodBMonthFrom : Integer,
                                      PeriodBMonthTo : Integer)                                                         returns String;

  function getSalesTree(PeriodAYear : Integer,
                        PeriodAMonthFrom : Integer,
                        PeriodAMonthTo : Integer,
                        PeriodBYear : Integer,
                        PeriodBMonthFrom : Integer,
                        PeriodBMonthTo : Integer)                                                                       returns String;

  function getPivotTree(PeriodAYear : Integer, PeriodAMonth : Integer, PeriodBYear : Integer, PeriodBMonth : Integer)   returns String;

  function getCombinedTree(PeriodAYear : Integer,
                           PeriodAMonthFrom : Integer,
                           PeriodAMonthTo : Integer,
                           PeriodBYear : Integer,
                           PeriodBMonthFrom : Integer,
                           PeriodBMonthTo : Integer)                                                                    returns String;

  function getRevenueTree(PeriodAYear : Integer, PeriodAMonth : Integer, PeriodBYear : Integer, PeriodBMonth : Integer) returns String;
  action   saveSettings(user : String, settings : LargeString)                                                          returns String;
  function getFileContent(fileType : String, fileName : String)                                                         returns String;
}
