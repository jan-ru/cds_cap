using {managed} from '@sap/cds/common';

namespace demo;


entity Dump {
  key ID                    : UUID;
      CodeGrootboekrekening : String;
      NaamGrootboekrekening : String;
      Code                  : String;
      Boekingsnummer        : Int64;
      Boekdatum             : Timestamp;
      Periode               : String;
      Code1                 : String;
      Omschrijving          : String;
      Debet                 : Double;
      Credit                : Double;
      Saldo                 : Double;
      PeriodYear            : Integer;
      PeriodMonth           : Integer;
      PostingPeriod         : Integer;
      PeriodType            : String;
      PeriodSortKey         : Integer;
}

entity Pivot {
  key ID                    : String(32); // MD5 hash
      CodeGrootboekrekening : String;
      NaamGrootboekrekening : String;
      PeriodSortKey         : Integer;
      Saldo                 : Double;
}

entity Controls {
  key PeriodSortKey   : Integer;
      PeriodYear      : Integer;
      PeriodMonth     : Integer;
      BasTotalDebit   : Double;
      BasTotalCredit  : Double;
      BasTotalBalance : Double;
      PnlTotalDebit   : Double;
      PnlTotalCredit  : Double;
      PnlTotalBalance : Double;
}

entity FinancialStatements {
  key ID                    : UUID;
      CodeGrootboekrekening : String(100);
      NaamGrootboekrekening : String(100);
      Code1                 : String;
      Saldo                 : Double;
      PeriodYear            : Integer;
      PeriodMonth           : Integer;
      ReportingPeriod       : Integer;
      FStype                : String(3);
      DisplayAmount         : Double;
}

@Aggregation.ApplySupported: {
  GroupableProperties   : [
    'RevenueType',
    'CostCenterGroup',
    'PeriodSortKey',
    'PeriodYear',
    'PeriodMonth'
  ],
  AggregatableProperties: [{Property: 'Amount'}]
}
entity RevenueReport {
  key ID              : UUID;
      RevenueType     : String(20);
      CostCenterGroup : String(10);
      PeriodSortKey   : Integer;
      PeriodYear      : Integer;
      PeriodMonth     : Integer;
      Amount          : Double;
}

entity UserSettings : managed {
  key user     : String;
      settings : LargeString;
}
