/**
 * Application-wide constants
 * Single source of truth for configuration values
 */

module.exports = {
    // Model Configuration
    MODEL_SIZE_LIMIT: 100000,

    // Revenue Classification
    // Matches dbt macro categorize_revenue logic
    // This is the CORRECT definition (server-side is authoritative)
    REVENUE_ACCOUNTS: {
        ONE_OFF: ['84', '85'],
        RECURRING: ['80', '86', '87', '88']
    },

    // Financial Statement Types
    FS_TYPES: {
        PNL: 'PNL',
        BAS: 'BAS',
        SALES: 'SALES',
        COMBINED: 'COMBINED'
    },

    // Sort Configurations
    SORT_CONFIG: {
        PNL: ['8-Recurring', '8-OneOff', '7', '4', '9'],
        SALES: ['8-Recurring', '8-OneOff', '7', '4', '9'],
        BAS: 'ASC',
        COMBINED: ['8-Recurring', '8-OneOff', '7', '4', '9']
    },

    // Spacer Configurations
    SPACERS: {
        PNL: ['7'],
        COMBINED: ['9']
    },

    // Display Labels
    LABELS: {
        NetIncome: 'Net Income',
        BalanceSheet: 'Balance sheet',
        IncomeStatement: 'Income statement',
        CashFlow: 'Cash Flow',
        GrossMargin: 'Gross Margin (8000 + 7000)',
        TotalRevenue: 'Total Revenue',
        GrandTotal: 'Grand Total',
        CostOfSales: 'Cost of Sales',
        RevenueRecurring: 'Revenue (Recurring)',
        RevenueOneOff: 'Revenue (One-Off)'
    },

    // Account Label Overrides
    ACCOUNT_LABELS: {
        '02': '02xx Fixed Assets',
        '06': '06xx Equity',
        '11': '11xx Cash & Cash Equivalents',
        '15': '15xx Taxes',
        '30': '30xx Inventories',
        '40': '40xx Operating Costs',
        '41': '41xx Personel Costs',
        '42': '42xx Housing Costs',
        '43': '43xx Office Costs',
        '44': '44xx Car Costs',
        '45': '45xx Sales Costs',
        '46': '46xx General Costs',
        '70': '70xx Cost of Sales',
        '80': '80xx Revenue Recurring',
        '84': '84xx Revenue One-Off',
        '85': '85xx Revenue One-Off',
        '86': '86xx Revenue Recurring',
        '87': '87xx Revenue Recurring',
        '88': '88xx Revenue Recurring',
        '90': '90xx Interest Income',
        '91': '91xx Interest Expense',
        '93': '93xx Exchange Rate Differences'
    },

    // Performance Monitoring
    MONITORING: {
        SLOW_REQUEST_THRESHOLD: 1000,      // 1 second
        MAX_SLOW_REQUESTS_TRACKED: 50,
        METRICS_LOG_INTERVAL: 60000,       // 60 seconds
        ENABLE_DETAILED_LOGGING: false
    }
};
