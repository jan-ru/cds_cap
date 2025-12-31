sap.ui.define([], function() {
    "use strict";

    return {
        // Model Configuration
        ModelConfig: {
            // NOTE: This value must match srv/config/constants.js MODEL_SIZE_LIMIT
            SIZE_LIMIT: 100000 // Maximum number of items in JSON models to prevent browser performance issues
        },

        // Common UI Data
        Months: [
            { key: "1", text: "1" },
            { key: "2", text: "2" },
            { key: "3", text: "3" },
            { key: "4", text: "4" },
            { key: "5", text: "5" },
            { key: "6", text: "6" },
            { key: "7", text: "7" },
            { key: "8", text: "8" },
            { key: "9", text: "9" },
            { key: "10", text: "10" },
            { key: "11", text: "11" },
            { key: "12", text: "12" }
        ],

        // Revenue Classification Account Codes
        // FIXED: Comments were inverted - corrected to match server-side logic
        RevenueAccounts: {
            ONE_OFF_8400: "84",      // One-Off Revenue (8400 series)
            ONE_OFF_8500: "85",      // One-Off Revenue (8500 series)
            RECURRING_8000: "80",    // Recurring Revenue (8000 series)
            RECURRING_8600: "86",    // Recurring Revenue (8600 series)
            RECURRING_8700: "87",    // Recurring Revenue (8700 series)
            RECURRING_8800: "88"     // Recurring Revenue (8800 series)
        },

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
