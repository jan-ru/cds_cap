using AnalyticsService from '../srv/analytics-service';

// Fiori preview for SCA Service Agreement
annotate AnalyticsService.SCA_ServiceAgreement with @(
  UI: {
    LineItem: [
      {Value: volg_nr, Label: 'Number'},
      {Value: project_name, Label: 'Project Name'},
      {Value: debtor_name, Label: 'Debtor'},
      {Value: financial_status, Label: 'Status'},
      {Value: start_date, Label: 'Start Date'},
      {Value: end_date, Label: 'End Date'},
      {Value: sla_type, Label: 'SLA Type'}
    ],
    HeaderInfo: {
      TypeName: 'Service Agreement',
      TypeNamePlural: 'Service Agreements',
      Title: {Value: project_name},
      Description: {Value: debtor_name}
    },
    SelectionFields: [debtor_name, financial_status, sla_type],
    Facets: [
      {
        $Type: 'UI.ReferenceFacet',
        Label: 'General Information',
        Target: '@UI.FieldGroup#General'
      },
      {
        $Type: 'UI.ReferenceFacet',
        Label: 'Agreement Details',
        Target: '@UI.FieldGroup#Details'
      },
      {
        $Type: 'UI.ReferenceFacet',
        Label: 'Dates',
        Target: '@UI.FieldGroup#Dates'
      }
    ],
    FieldGroup#General: {
      Data: [
        {Value: volg_nr, Label: 'Agreement Number'},
        {Value: project_name, Label: 'Project Name'},
        {Value: debtor_name, Label: 'Debtor'},
        {Value: financial_status, Label: 'Financial Status'}
      ]
    },
    FieldGroup#Details: {
      Data: [
        {Value: sla_type, Label: 'SLA Type'}
      ]
    },
    FieldGroup#Dates: {
      Data: [
        {Value: start_date, Label: 'Start Date'},
        {Value: end_date, Label: 'End Date'}
      ]
    },
    Identification: [
      {Value: project_name}
    ]
  }
);

// Fiori preview for VFA Sales Invoice
annotate AnalyticsService.VFA_SalesInvoice with @(
  UI: {
    LineItem: [
      {Value: volg_nr, Label: 'Invoice Number'},
      {Value: debtor_name, Label: 'Debtor'},
      {Value: project, Label: 'Project'},
      {Value: invoice_date, Label: 'Invoice Date'},
      {Value: total_ex_vat, Label: 'Total (ex VAT)'},
      {Value: total_incl_vat, Label: 'Total (incl VAT)'},
      {Value: open_amount, Label: 'Open Amount'}
    ],
    HeaderInfo: {
      TypeName: 'Sales Invoice',
      TypeNamePlural: 'Sales Invoices',
      Title: {Value: volg_nr},
      Description: {Value: debtor_name}
    },
    SelectionFields: [debtor_name, invoice_date, project],
    Facets: [
      {
        $Type: 'UI.ReferenceFacet',
        Label: 'Invoice Details',
        Target: '@UI.FieldGroup#Details'
      },
      {
        $Type: 'UI.ReferenceFacet',
        Label: 'Financial Summary',
        Target: '@UI.FieldGroup#Financial'
      },
      {
        $Type: 'UI.ReferenceFacet',
        Label: 'Payment Status',
        Target: '@UI.FieldGroup#Payment'
      }
    ],
    FieldGroup#Details: {
      Data: [
        {Value: volg_nr, Label: 'Invoice Number'},
        {Value: debtor_nr, Label: 'Debtor Number'},
        {Value: debtor_name, Label: 'Debtor Name'},
        {Value: project, Label: 'Project'},
        {Value: reference, Label: 'Reference'},
        {Value: account_manager, Label: 'Account Manager'},
        {Value: invoice_date, Label: 'Invoice Date'},
        {Value: period_start, Label: 'Period Start'}
      ]
    },
    FieldGroup#Financial: {
      Data: [
        {Value: total_ex_vat, Label: 'Total (ex VAT)'},
        {Value: total_incl_vat, Label: 'Total (incl VAT)'}
      ]
    },
    FieldGroup#Payment: {
      Data: [
        {Value: paid_amount, Label: 'Paid Amount'},
        {Value: open_amount, Label: 'Open Amount'}
      ]
    },
    Identification: [
      {Value: volg_nr}
    ]
  }
);

// Fiori preview for VOA Sales Order
annotate AnalyticsService.VOA_SalesOrder with @(
  UI: {
    LineItem: [
      {Value: volg_nr, Label: 'Order Number'},
      {Value: relation_name, Label: 'Customer'},
      {Value: order_date, Label: 'Order Date'},
      {Value: sca_description, Label: 'Description'},
      {Value: phase, Label: 'Phase'},
      {Value: delivery_date, Label: 'Delivery Date'},
      {Value: total_ex_vat, Label: 'Total (ex VAT)'}
    ],
    HeaderInfo: {
      TypeName: 'Sales Order',
      TypeNamePlural: 'Sales Orders',
      Title: {Value: volg_nr},
      Description: {Value: relation_name}
    },
    SelectionFields: [relation_name, phase, order_date],
    Facets: [
      {
        $Type: 'UI.ReferenceFacet',
        Label: 'Order Information',
        Target: '@UI.FieldGroup#OrderInfo'
      },
      {
        $Type: 'UI.ReferenceFacet',
        Label: 'Customer Details',
        Target: '@UI.FieldGroup#Customer'
      },
      {
        $Type: 'UI.ReferenceFacet',
        Label: 'Financial Information',
        Target: '@UI.FieldGroup#Financial'
      },
      {
        $Type: 'UI.ReferenceFacet',
        Label: 'Timeline',
        Target: '@UI.FieldGroup#Timeline'
      }
    ],
    FieldGroup#OrderInfo: {
      Data: [
        {Value: volg_nr, Label: 'Order Number'},
        {Value: sca_description, Label: 'Description'},
        {Value: phase, Label: 'Phase'}
      ]
    },
    FieldGroup#Customer: {
      Data: [
        {Value: relation_name, Label: 'Customer Name'}
      ]
    },
    FieldGroup#Financial: {
      Data: [
        {Value: total_ex_vat, Label: 'Total (ex VAT)'}
      ]
    },
    FieldGroup#Timeline: {
      Data: [
        {Value: order_date, Label: 'Order Date'},
        {Value: delivery_date, Label: 'Delivery Date'}
      ]
    },
    Identification: [
      {Value: volg_nr}
    ]
  }
);

// Fiori preview for Financial Statements - Analytical List Page
annotate AnalyticsService.FinancialStatements with @(
  UI: {
    LineItem: [
      {Value: CodeGrootboekrekening, Label: 'Account Code'},
      {Value: NaamGrootboekrekening, Label: 'Account Name'},
      {Value: FStype, Label: 'Statement Type'},
      {Value: PeriodYear, Label: 'Year'},
      {Value: PeriodMonth, Label: 'Month'},
      {Value: DisplayAmount, Label: 'Amount'}
    ],
    HeaderInfo: {
      TypeName: 'Financial Statement',
      TypeNamePlural: 'Financial Statements',
      Title: {Value: NaamGrootboekrekening},
      Description: {Value: CodeGrootboekrekening}
    },
    SelectionFields: [FStype, PeriodYear, PeriodMonth, CodeGrootboekrekening],
    Chart: {
      Title: 'Financial Position',
      ChartType: #Column,
      Dimensions: [FStype, PeriodYear],
      Measures: [DisplayAmount],
      MeasureAttributes: [{
        Measure: DisplayAmount,
        Role: #Axis1,
        DataPoint: '@UI.DataPoint#Amount'
      }]
    },
    DataPoint#Amount: {
      Value: DisplayAmount,
      Title: 'Amount',
      CriticalityCalculation: {
        ImprovementDirection: #Maximize,
        DeviationRangeLowValue: -50000,
        ToleranceRangeLowValue: 0
      }
    },
    PresentationVariant: {
      Text: 'Default',
      SortOrder: [{
        Property: PeriodYear,
        Descending: false
      }],
      Visualizations: ['@UI.LineItem', '@UI.Chart']
    },
    Facets: [
      {
        $Type: 'UI.ReferenceFacet',
        Label: 'Account Information',
        Target: '@UI.FieldGroup#Account'
      },
      {
        $Type: 'UI.ReferenceFacet',
        Label: 'Financial Details',
        Target: '@UI.FieldGroup#Financial'
      },
      {
        $Type: 'UI.ReferenceFacet',
        Label: 'Period Information',
        Target: '@UI.FieldGroup#Period'
      }
    ],
    FieldGroup#Account: {
      Data: [
        {Value: CodeGrootboekrekening, Label: 'Account Code'},
        {Value: NaamGrootboekrekening, Label: 'Account Name'}
      ]
    },
    FieldGroup#Financial: {
      Data: [
        {Value: FStype, Label: 'Statement Type'},
        {Value: DisplayAmount, Label: 'Amount'}
      ]
    },
    FieldGroup#Period: {
      Data: [
        {Value: PeriodYear, Label: 'Year'},
        {Value: PeriodMonth, Label: 'Month'}
      ]
    },
    Identification: [
      {Value: NaamGrootboekrekening}
    ]
  },
  Aggregation.ApplySupported: {
    GroupableProperties: [
      'CodeGrootboekrekening',
      'NaamGrootboekrekening',
      'FStype',
      'PeriodYear',
      'PeriodMonth'
    ],
    AggregatableProperties: [{Property: DisplayAmount}]
  }
);

// Fiori preview for Revenue Report - Analytical List Page
annotate AnalyticsService.RevenueReport with @(
  UI: {
    LineItem: [
      {Value: RevenueType, Label: 'Revenue Type'},
      {Value: CostCenterGroup, Label: 'Cost Center'},
      {Value: PeriodYear, Label: 'Year'},
      {Value: PeriodMonth, Label: 'Month'},
      {Value: Amount, Label: 'Amount'}
    ],
    HeaderInfo: {
      TypeName: 'Revenue Report',
      TypeNamePlural: 'Revenue Reports',
      Title: {Value: RevenueType},
      Description: {Value: CostCenterGroup}
    },
    SelectionFields: [RevenueType, CostCenterGroup, PeriodYear],
    Chart: {
      Title: 'Revenue Trends',
      ChartType: #Column,
      Dimensions: [PeriodYear, PeriodMonth],
      Measures: [Amount],
      MeasureAttributes: [{
        Measure: Amount,
        Role: #Axis1,
        DataPoint: '@UI.DataPoint#RevenueAmount'
      }]
    },
    DataPoint#RevenueAmount: {
      Value: Amount,
      Title: 'Revenue Amount',
      CriticalityCalculation: {
        ImprovementDirection: #Maximize,
        DeviationRangeLowValue: 0,
        ToleranceRangeLowValue: 10000
      }
    },
    PresentationVariant: {
      Text: 'Default',
      Visualizations: ['@UI.LineItem', '@UI.Chart'],
      RequestAtLeast: [RevenueType, CostCenterGroup]
    },
    Facets: [
      {
        $Type: 'UI.ReferenceFacet',
        Label: 'Revenue Details',
        Target: '@UI.FieldGroup#Details'
      },
      {
        $Type: 'UI.ReferenceFacet',
        Label: 'Period Information',
        Target: '@UI.FieldGroup#Period'
      },
      {
        $Type: 'UI.ReferenceFacet',
        Label: 'Breakdown',
        Target: '@UI.FieldGroup#Breakdown'
      }
    ],
    FieldGroup#Details: {
      Data: [
        {Value: RevenueType, Label: 'Revenue Type'},
        {Value: Amount, Label: 'Amount'}
      ]
    },
    FieldGroup#Period: {
      Data: [
        {Value: PeriodYear, Label: 'Year'},
        {Value: PeriodMonth, Label: 'Month'},
        {Value: PeriodSortKey, Label: 'Period Sort Key'}
      ]
    },
    FieldGroup#Breakdown: {
      Data: [
        {Value: CostCenterGroup, Label: 'Cost Center Group'}
      ]
    },
    Identification: [
      {Value: RevenueType}
    ]
  },
  Aggregation.ApplySupported: {
    GroupableProperties: [
      'RevenueType',
      'CostCenterGroup',
      'PeriodSortKey',
      'PeriodYear',
      'PeriodMonth'
    ],
    AggregatableProperties: [{Property: Amount}]
  }
);

// Analytical annotations for Sales Analytics
annotate AnalyticsService.SalesAnalytics with @(
  UI: {
    LineItem: [
      {Value: CodeGrootboekrekening, Label: 'Account Code'},
      {Value: NaamGrootboekrekening, Label: 'Account Name'},
      {Value: ReportingPeriod, Label: 'Period'},
      {Value: PeriodYear, Label: 'Year'},
      {Value: DisplayAmount, Label: 'Amount'}
    ],
    HeaderInfo: {
      TypeName: 'Sales Transaction',
      TypeNamePlural: 'Sales Transactions',
      Title: {Value: NaamGrootboekrekening},
      Description: {Value: CodeGrootboekrekening}
    },
    SelectionFields: [CodeGrootboekrekening, PeriodYear, ReportingPeriod],
    Chart: {
      Title: 'Sales by Account',
      ChartType: #Bar,
      Dimensions: [NaamGrootboekrekening],
      Measures: [DisplayAmount]
    }
  }
);
