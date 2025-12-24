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
