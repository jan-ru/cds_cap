sap.ui.define([], function() {
    "use strict";

    return {
        // Financial Statement Types
        FSType: {
            PNL: "PNL",
            BAS: "BAS"
        },

        // Sorting Configurations
        SortConfig: {
            PNL: ["8", "7", "4", "9"], // Custom order for Income Statement
            BAS: "ASC",                // Default alphanumeric for Balance Sheet
            Controls: "PeriodSortKey", // Sort by generated key
            Pivot: ["CodeGrootboekrekening", "PeriodSortKey"] 
        },

        // Header Labels
        Headers: {
            NetIncome: "Net Income",
            BalanceSheet: "Balance sheet",
            IncomeStatement: "Income statement",
            CashFlow: "Cash Flow",
            GrossMargin: "Gross Margin (8000 + 7000)",
            GrandTotal: "Grand Total"
        },

        // Spacer Configuration
        Spacers: {
            PNL: ["7"] // Insert spacer after 7xxx series
        },

        // Technical Information Metadata
        TechInfo: {
            Controls: {
                dbTable: "AnalyticsService_Controls",
                odataEntity: "Controls",
                filters: "Sorted by PeriodSortKey"
            },
            IncomeStatement: {
                dbTable: "AnalyticsService_FinancialStatements",
                odataEntity: "FinancialStatements",
                filters: "FStype = PNL"
            },
            BalanceSheet: {
                dbTable: "AnalyticsService_FinancialStatements",
                odataEntity: "FinancialStatements",
                filters: "FStype = BAS"
            },
            CashFlow: {
                dbTable: "demo_Dump",
                odataEntity: "Dump",
                filters: "Grouped by Account, Year, Month (Sum Saldo)"
            },
            GL: {
                dbTable: "demo_Dump",
                odataEntity: "Dump",
                filters: "None (Raw Data)"
            },
            Pivot: {
                dbTable: "demo_Pivot",
                odataEntity: "Pivot",
                filters: "Order by CodeGrootboekrekening, PeriodSortKey"
            }
        },

        // GL View Configurations (Column Visibility)
        GLViewModes: {
            Details: {
                colGLAccount: true, colGLName: true, colJournal: true, colDocNr: true, 
                colPostingDate: true, colDesc: true, colCostCenter: true, 
                colPeriodYear: true, colPeriodSortKey: true, colPeriod: true 
            },
            Account: {
                colGLAccount: true, colGLName: true, colJournal: false, colDocNr: false, 
                colPostingDate: false, colDesc: false, colCostCenter: false, 
                colPeriodYear: false, colPeriodSortKey: false, colPeriod: false 
            },
            Journal: {
                colGLAccount: false, colGLName: false, colJournal: true, colDocNr: true, 
                colPostingDate: true, colDesc: false, colCostCenter: false, 
                colPeriodYear: false, colPeriodSortKey: false, colPeriod: false 
            },
            CostCenter: {
                colGLAccount: false, colGLName: false, colJournal: false, colDocNr: false, 
                colPostingDate: false, colDesc: false, colCostCenter: true, 
                colPeriodYear: false, colPeriodSortKey: false, colPeriod: false 
            },
            Period: {
                colGLAccount: false, colGLName: false, colJournal: false, colDocNr: false, 
                colPostingDate: false, colDesc: false, colCostCenter: false, 
                colPeriodYear: true, colPeriodSortKey: true, colPeriod: true 
            }
        },

        // Export Column Configurations
        ExportConfig: {
            GL: [
                { id: "colGLAccount", label: "GL Account", property: "CodeGrootboekrekening", type: "String" },
                { id: "colGLName", label: "GL Name", property: "NaamGrootboekrekening", type: "String" },
                { id: "colJournal", label: "Journal", property: "Code", type: "String" },
                { id: "colDesc", label: "Description", property: "Omschrijving", type: "String" },
                { id: "colCostCenter", label: "Cost Center", property: "Code1", type: "String" },
                { id: "colPeriodYear", label: "Year", property: "PeriodYear", type: "Number" },
                { id: "colPeriodSortKey", label: "Sort Key", property: "PeriodSortKey", type: "Number" },
                { id: "colPeriod", label: "Period", property: "Periode", type: "String" },
                { id: "colDebit", label: "Debit", property: "Debet", type: "Number", scale: 2 },
                { id: "colCredit", label: "Credit", property: "Credit", type: "Number", scale: 2 },
                { id: "colSaldo", label: "Balance", property: "Saldo", type: "Number", scale: 2 }
            ],
            Pivot: {
                Fixed: [
                    { label: "Account", property: "name", type: "String" }
                ]
            }
        },

        // OData Paths
        EntityPaths: {
            Controls: "/Controls",
            FinancialStatements: "/FinancialStatements",
            Dump: "/Dump",
            Pivot: "/Pivot",
            AppInfo: "/getAppInfo(...)"
        }
    };
});
