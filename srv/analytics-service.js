const cds = require('@sap/cds');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const FinancialTreeBuilder = require('./utils/financial-tree-builder');
const PivotTreeBuilder = require('./utils/pivot-tree-builder');
const RevenueTreeBuilder = require('./utils/revenue-tree-builder');
// Package JSON might be cached, which is fine for version info that doesn't change at runtime
const packageJson = require('../package.json');

module.exports = cds.service.impl(async function() {
    this.on('getAppInfo', async (req) => {
        let sqliteVersion = 'Unknown';
        try {
            const db = await cds.connect.to('db');
            const result = await db.run('SELECT sqlite_version() as v');
            if (result && result[0]) {
                sqliteVersion = result[0].v;
            }
        } catch (e) {
            console.error('Failed to get SQLite version', e);
        }

        // Read Input Files
        let excelFiles = [];
        try {
            // Path relative to cap/srv/analytics-service.js -> need to go up to project root then analytics
            // cap/srv/ -> cap/ -> ../dbt/data/xls
            const xlsPath = path.resolve(__dirname, '../../dbt/data/xls');
            // Check existence first? fs.access throws if not exists, but let's try reading directly and handle error
            try {
                 const files = await fs.readdir(xlsPath);
                 excelFiles = files.filter(file => file.endsWith('.xlsx') || file.endsWith('.csv'));
            } catch (err) {
                 if (err.code !== 'ENOENT') throw err;
            }
        } catch (e) {
            console.error('Failed to read excel files', e);
            excelFiles = ['Error reading directory'];
        }

        // Read dbt and DuckDB versions
        let dbtVersion = 'Unknown';
        let duckdbVersion = 'Unknown';
        try {
            const dbtPath = path.resolve(__dirname, '../../.venv/bin/dbt');
            // execSync is still sync, but standard exec requires callback structure or promisification. 
            // For simple version check, sync might be acceptable, but better to keep consistency? 
            // Stick to sync for exec for now as it's not IO bound in same way, or keep it simple.
            // Request was for "file operations". execSync is child_process.
            const output = execSync(`${dbtPath} --version`, { encoding: 'utf8' });
            
            const dbtMatch = output.match(/installed:\s+([\d.]+)/);
            if (dbtMatch) dbtVersion = dbtMatch[1];
            
            const duckdbMatch = output.match(/duckdb:\s+([\d.]+)/);
            if (duckdbMatch) duckdbVersion = duckdbMatch[1];
        } catch (e) {
            console.error('Failed to get dbt version', e);
        }

        // Read Docker Version
        let dockerVersion = 'Unknown';
        try {
            // execSync is suitable here as well
            const output = execSync('docker --version', { encoding: 'utf8' });
            // Output format example: "Docker version 20.10.21, build baeda1f"
            const match = output.match(/Docker version\s+([\d.]+)/);
            if (match) dockerVersion = match[1];
        } catch (e) {
            console.error('Failed to get Docker version', e);
        }

        // Read Database CSV Files
        let dbFiles = [];
        try {
            const dbPath = path.resolve(__dirname, '../db/data');
            try {
                const files = await fs.readdir(dbPath);
                dbFiles = files.filter(file => file.endsWith('.csv'));
            } catch (err) {
                 if (err.code !== 'ENOENT') throw err;
            }
        } catch (e) {
            console.error('Failed to read db data directory', e);
            dbFiles = ['Error reading directory'];
        }

        // List of database tables/entities
        const databaseTables = [
            'SCA_ServiceAgreement',
            'VFA_SalesInvoice',
            'VOA_SalesOrder'
        ];

        // Read Staging Model Files
        let stgFiles = [];
        try {
            const stgPath = path.resolve(__dirname, '../../dbt/models/staging');
             try {
                stgFiles = await fs.readdir(stgPath);
            } catch (err) {
                 if (err.code !== 'ENOENT') throw err;
            }
        } catch (e) {
            console.error('Failed to read staging directory', e);
            stgFiles = ['Error reading directory'];
        }
        
        // Read Metrics Model Files
        let metricFiles = [];
        try {
            const metricPath = path.resolve(__dirname, '../../dbt/models/metrics');
             try {
                metricFiles = await fs.readdir(metricPath);
            } catch (err) {
                 if (err.code !== 'ENOENT') throw err;
            }
        } catch (e) {
            console.error('Failed to read metrics directory', e);
            metricFiles = ['Error reading directory'];
        }

        const info = {
            appVersion: packageJson.version,
            cdsVersion: cds.version,
            nodeVersion: process.version,
            sqliteVersion: sqliteVersion,
            capLevel: "Node.js",
            currentUser: req.user.id,
            userName: req.user.attr?.name || req.user.id,
            dbtVersion: dbtVersion,
            duckdbVersion: duckdbVersion,
            dockerVersion: dockerVersion,
            inputFiles: excelFiles,
            databaseFiles: dbFiles,
            databaseTables: databaseTables,
            stagingFiles: stgFiles,
            metricsFiles: metricFiles
        };
        return JSON.stringify(info);
    });

    this.on('getFinancialStatementsTree', async (req) => {
        const { FStype, PeriodAYear, PeriodAMonthFrom, PeriodAMonthTo, PeriodBYear, PeriodBMonthFrom, PeriodBMonthTo } = req.data;
        
        // Fetch data based on FStype
        console.log("DEBUG: getFinancialStatementsTree called with FStype:", FStype);
        const aData = await cds.read('AnalyticsService.FinancialStatements').where({ FStype: FStype });
        console.log("DEBUG: Fetched rows:", aData.length);

        const oPeriodA = { year: PeriodAYear, monthFrom: PeriodAMonthFrom, monthTo: PeriodAMonthTo };
        const oPeriodB = { year: PeriodBYear, monthFrom: PeriodBMonthFrom, monthTo: PeriodBMonthTo };

        const oRoot = FinancialTreeBuilder.build(aData, FStype, oPeriodA, oPeriodB);
        return JSON.stringify(oRoot);
    });

    this.on('getCombinedTree', async (req) => {
        const {
            PeriodAYear,
            PeriodAMonthFrom,
            PeriodAMonthTo,
            PeriodBYear,
            PeriodBMonthFrom,
            PeriodBMonthTo
        } = req.data;

        const oPeriodA = {
            year: PeriodAYear,
            monthFrom: PeriodAMonthFrom,
            monthTo: PeriodAMonthTo
        };

        const oPeriodB = {
            year: PeriodBYear,
            monthFrom: PeriodBMonthFrom,
            monthTo: PeriodBMonthTo
        };

        const tx = cds.transaction(req);
        const combinedData = await tx.run(
            SELECT.from('AnalyticsService.FinancialStatements')
        );

        return JSON.stringify(FinancialTreeBuilder.build(combinedData, 'COMBINED', oPeriodA, oPeriodB));
    });

    this.on('getSalesTree', async (req) => {
        const { PeriodAYear, PeriodAMonthFrom, PeriodAMonthTo, PeriodBYear, PeriodBMonthFrom, PeriodBMonthTo } = req.data;
        
        // Fetch Sales Data (8xxx)
        const aData = await cds.read('AnalyticsService.SalesAnalytics');

        const oPeriodA = { year: PeriodAYear, monthFrom: PeriodAMonthFrom, monthTo: PeriodAMonthTo };
        const oPeriodB = { year: PeriodBYear, monthFrom: PeriodBMonthFrom, monthTo: PeriodBMonthTo };

        // Reuse 'PNL' logic as Sales is part of PNL structure, but use SALES type for custom Grand Total label
        const oRoot = FinancialTreeBuilder.build(aData, 'SALES', oPeriodA, oPeriodB, { includeGrossMargin: false });
        return JSON.stringify(oRoot);
    });

    this.on('getPivotTree', async (req) => {
        const { PeriodAYear, PeriodAMonth, PeriodBYear, PeriodBMonth } = req.data;
        
        let aData = await cds.read('AnalyticsService.Pivot');

        // Filter if parameters provided
        if (PeriodAYear && PeriodAMonth && PeriodBYear && PeriodBMonth) {
            // Logic: PeriodSortKey >= Start AND PeriodSortKey <= End
            // Construct SortKeys: YYYYMM
            const sStart = parseInt(PeriodAYear) * 100 + parseInt(PeriodAMonth);
            const sEnd = parseInt(PeriodBYear) * 100 + parseInt(PeriodBMonth);

            aData = aData.filter(item => {
                const iKey = parseInt(item.PeriodSortKey);
                return iKey >= sStart && iKey <= sEnd;
            });
        }

        const oRoot = PivotTreeBuilder.build(aData);
        return JSON.stringify(oRoot);
    });

    this.on('getRevenueTree', async (req) => {
        const { PeriodAYear, PeriodAMonth, PeriodBYear, PeriodBMonth } = req.data;
        const { RevenueReport } = this.entities;
        
        // Fetch all relevant data (no database aggregation to avoid syntax errors)
        let query = SELECT.from(RevenueReport);

        if (PeriodAYear && PeriodAMonth && PeriodBYear && PeriodBMonth) {
             const iStartKey = parseInt(PeriodAYear) * 100 + parseInt(PeriodAMonth);
             const iEndKey = parseInt(PeriodBYear) * 100 + parseInt(PeriodBMonth);
             query.where(`PeriodSortKey >= ${iStartKey} and PeriodSortKey <= ${iEndKey}`);
        }

        const aRawData = await cds.run(query);
        
        // Perform aggregation in memory (Reliable fallback)
        const mAggregated = {};
        aRawData.forEach(row => {
            const sKey = [row.RevenueType, row.CostCenterGroup, row.PeriodYear, row.PeriodMonth].join('|');
            if (!mAggregated[sKey]) {
                mAggregated[sKey] = {
                    RevenueType: row.RevenueType,
                    CostCenterGroup: row.CostCenterGroup,
                    PeriodYear: row.PeriodYear,
                    PeriodMonth: row.PeriodMonth,
                    TotalAmount: 0
                };
            }
            mAggregated[sKey].TotalAmount += (row.Amount || 0);
        });

        const aAggregatedData = Object.values(mAggregated);
        
        const oResult = RevenueTreeBuilder.build(aAggregatedData, PeriodAYear, PeriodAMonth, PeriodBYear, PeriodBMonth);
        return JSON.stringify(oResult);
    });

    this.on('saveSettings', async (req) => {
        const { user, settings } = req.data;
        const { UserSettings } = this.entities;
        
        // Upsert logic: Delete existing then Insert, or use database specfic UPSERT if available.
        // Simple standard CDS: 
        const exists = await SELECT.one.from(UserSettings).where({ user });
        if (exists) {
            await UPDATE(UserSettings).set({ settings }).where({ user });
        } else {
            await INSERT.into(UserSettings).entries({ user, settings });
        }
        return "Saved";
    });

    this.on('getFileContent', async (req) => {
        const { fileType, fileName } = req.data;
        let basePath;

        // Security: Whitelist base paths
        switch (fileType) {
            case 'dataSource':
                basePath = path.resolve(__dirname, '../../dbt/data/xls');
                break;
            case 'table':
                basePath = path.resolve(__dirname, '../db/data');
                break;
            case 'staging':
                basePath = path.resolve(__dirname, '../../dbt/models/staging');
                break;
            case 'metrics':
                basePath = path.resolve(__dirname, '../../dbt/models/metrics');
                break;
            case 'log':
                basePath = path.resolve(__dirname, '../../dbt/logs');
                break;
            default:
                return JSON.stringify({ error: 'Invalid file type' });
        }

        if (!basePath || !fileName) {
            return JSON.stringify({ error: 'Missing parameters' });
        }

        // Security: Prevent path traversal
        const fullPath = path.resolve(basePath, fileName);
        if (!fullPath.startsWith(basePath)) {
            return JSON.stringify({ error: 'Access denied' });
        }

        try {
            // Uses async readFile in try/catch block
            const content = await fs.readFile(fullPath, 'utf-8');
            return JSON.stringify({ content: content, type: path.extname(fileName).substring(1) });
        } catch (e) {
            if (e.code === 'ENOENT') {
                 return JSON.stringify({ error: 'File not found' });
            }
            console.error('Failed to read file', e);
            return JSON.stringify({ error: 'Failed to read file' });
        }
    });
});
