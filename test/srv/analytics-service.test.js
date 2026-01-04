/**
 * Unit tests for Analytics Service
 * Tests all OData action handlers and service logic
 */

const path = require('path');

// Setup mocks BEFORE requiring any modules
const mockCdsLog = jest.fn(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
}));

jest.mock('@sap/cds', () => ({
    log: mockCdsLog,
    version: '7.5.0',
    service: {
        impl: jest.fn()
    },
    read: jest.fn(),
    run: jest.fn(),
    transaction: jest.fn(),
    connect: {
        to: jest.fn()
    }
}));

jest.mock('fs', () => ({
    promises: {
        readdir: jest.fn(),
        readFile: jest.fn()
    }
}));

jest.mock('child_process', () => ({
    execSync: jest.fn()
}));

jest.mock('../../srv/utils/financial-tree-builder', () => ({
    build: jest.fn()
}));

jest.mock('../../srv/utils/pivot-tree-builder', () => ({
    build: jest.fn()
}));

jest.mock('../../srv/utils/revenue-tree-builder', () => ({
    build: jest.fn()
}));

jest.mock('../../srv/middleware/monitoring', () => ({
    trackPerformance: jest.fn(),
    getMetrics: jest.fn(),
    resetMetrics: jest.fn(),
    startPeriodicLogging: jest.fn()
}));

describe('Analytics Service', () => {
    let service;
    let handlers;
    let cds;
    let fs;
    let execSync;
    let FinancialTreeBuilder;
    let PivotTreeBuilder;
    let RevenueTreeBuilder;

    beforeEach(() => {
        // Clear all mocks and module cache
        jest.clearAllMocks();
        jest.resetModules();

        // Re-require all modules after reset
        cds = require('@sap/cds');
        fs = require('fs').promises;
        execSync = require('child_process').execSync;
        FinancialTreeBuilder = require('../../srv/utils/financial-tree-builder');
        PivotTreeBuilder = require('../../srv/utils/pivot-tree-builder');
        RevenueTreeBuilder = require('../../srv/utils/revenue-tree-builder');

        // Setup service mock structure
        handlers = {};
        service = {
            on: jest.fn((event, handler) => {
                handlers[event] = handler;
            }),
            before: jest.fn(),
            entities: {
                RevenueReport: 'AnalyticsService.RevenueReport',
                UserSettings: 'AnalyticsService.UserSettings'
            }
        };

        // Configure cds.service.impl to capture handlers
        cds.service.impl.mockImplementation((fn) => fn.call(service));

        // Configure mock return values
        cds.read.mockReturnValue({
            where: jest.fn().mockResolvedValue([])
        });
        cds.run.mockResolvedValue([]);
        cds.transaction.mockImplementation((req) => ({
            run: jest.fn().mockResolvedValue([])
        }));
        cds.connect.to.mockResolvedValue({
            run: jest.fn().mockResolvedValue([{ v: '3.40.0' }])
        });

        // Mock global CDS query builders
        global.SELECT = {
            from: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            one: {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockResolvedValue(null)
            }
        };
        global.UPDATE = jest.fn().mockReturnValue({
            set: jest.fn().mockReturnValue({
                where: jest.fn().mockResolvedValue({})
            })
        });
        global.INSERT = {
            into: jest.fn().mockReturnThis(),
            entries: jest.fn().mockResolvedValue({})
        };

        // Configure tree builder mocks
        FinancialTreeBuilder.build.mockReturnValue({ root: { nodes: [] } });
        PivotTreeBuilder.build.mockReturnValue({ root: { nodes: [], columns: [] } });
        RevenueTreeBuilder.build.mockReturnValue({ rows: [], columns: [] });

        // Configure fs mocks
        fs.readdir.mockResolvedValue([]);
        fs.readFile.mockResolvedValue('file content');

        // Configure execSync mock
        execSync.mockReturnValue('');

        // Load the service (this will call cds.service.impl with the implementation)
        require('../../srv/analytics-service');
    });

    describe('Service Initialization', () => {
        test('should register all event handlers', () => {
            expect(service.on).toHaveBeenCalledWith('getAppInfo', expect.any(Function));
            expect(service.on).toHaveBeenCalledWith('getFinancialStatementsTree', expect.any(Function));
            expect(service.on).toHaveBeenCalledWith('getCombinedTree', expect.any(Function));
            expect(service.on).toHaveBeenCalledWith('getSalesTree', expect.any(Function));
            expect(service.on).toHaveBeenCalledWith('getPivotTree', expect.any(Function));
            expect(service.on).toHaveBeenCalledWith('getRevenueTree', expect.any(Function));
            expect(service.on).toHaveBeenCalledWith('saveSettings', expect.any(Function));
            expect(service.on).toHaveBeenCalledWith('getMetrics', expect.any(Function));
            expect(service.on).toHaveBeenCalledWith('resetMetrics', expect.any(Function));
            expect(service.on).toHaveBeenCalledWith('getFileContent', expect.any(Function));
        });

        test('should skip performance tracking middleware in test mode', () => {
            // Performance tracking is disabled when NODE_ENV=test
            // This is to prevent "next is not a function" errors in integration tests
            expect(service.before).not.toHaveBeenCalled();
        });
    });

    describe('getAppInfo', () => {
        test('should return app info with all versions', async () => {
            const mockReq = {
                user: {
                    id: 'test-user',
                    attr: { name: 'Test User' }
                }
            };

            fs.readdir.mockResolvedValue(['file1.xlsx', 'file2.csv', 'ignored.txt']);
            execSync
                .mockReturnValueOnce('installed: 1.6.0\nduckdb: 0.9.0')  // dbt version
                .mockReturnValueOnce('Docker version 24.0.0, build abc');  // docker version

            const result = await handlers.getAppInfo(mockReq);
            const info = JSON.parse(result);

            expect(info).toHaveProperty('appVersion');
            expect(info).toHaveProperty('cdsVersion', '7.5.0');
            expect(info).toHaveProperty('nodeVersion');
            expect(info).toHaveProperty('sqliteVersion', '3.40.0');
            expect(info).toHaveProperty('currentUser', 'test-user');
            expect(info).toHaveProperty('userName', 'Test User');
            expect(info).toHaveProperty('dbtVersion', '1.6.0');
            expect(info).toHaveProperty('duckdbVersion', '0.9.0');
            expect(info).toHaveProperty('dockerVersion', '24.0.0');
            expect(info.inputFiles).toEqual(['file1.xlsx', 'file2.csv']);
        });

        test('should handle SQLite connection error', async () => {
            cds.connect.to.mockRejectedValue(new Error('Connection failed'));

            const mockReq = {
                user: { id: 'test-user', attr: {} }
            };

            const result = await handlers.getAppInfo(mockReq);
            const info = JSON.parse(result);

            expect(info.sqliteVersion).toBe('Unknown');
        });

        test('should handle missing directories gracefully', async () => {
            fs.readdir.mockRejectedValue({ code: 'ENOENT' });

            const mockReq = {
                user: { id: 'test-user', attr: {} }
            };

            const result = await handlers.getAppInfo(mockReq);
            const info = JSON.parse(result);

            expect(info.inputFiles).toEqual([]);
            expect(info.databaseFiles).toEqual([]);
        });

        test('should handle command execution errors', async () => {
            execSync.mockImplementation(() => {
                throw new Error('Command not found');
            });

            const mockReq = {
                user: { id: 'test-user', attr: {} }
            };

            const result = await handlers.getAppInfo(mockReq);
            const info = JSON.parse(result);

            expect(info.dbtVersion).toBe('Unknown');
            expect(info.dockerVersion).toBe('Unknown');
        });
    });

    describe('getFinancialStatementsTree', () => {
        test('should fetch data and build tree', async () => {
            const mockData = [
                { CodeGrootboekrekening: '8000', DisplayAmount: 1000, FStype: 'PNL' }
            ];
            cds.read.mockReturnValue({
                where: jest.fn().mockResolvedValue(mockData)
            });

            const mockReq = {
                data: {
                    FStype: 'PNL',
                    PeriodAYear: 2024,
                    PeriodAMonthFrom: 1,
                    PeriodAMonthTo: 12,
                    PeriodBYear: 2023,
                    PeriodBMonthFrom: 1,
                    PeriodBMonthTo: 12
                }
            };

            const result = await handlers.getFinancialStatementsTree(mockReq);

            expect(cds.read).toHaveBeenCalledWith('AnalyticsService.FinancialStatements');
            expect(FinancialTreeBuilder.build).toHaveBeenCalledWith(
                mockData,
                'PNL',
                { year: 2024, monthFrom: 1, monthTo: 12 },
                { year: 2023, monthFrom: 1, monthTo: 12 }
            );
            expect(result).toBeTruthy();
        });

        test('should handle different statement types', async () => {
            const mockReq = {
                data: {
                    FStype: 'BAS',
                    PeriodAYear: 2024,
                    PeriodAMonthFrom: 1,
                    PeriodAMonthTo: 3,
                    PeriodBYear: 2023,
                    PeriodBMonthFrom: 1,
                    PeriodBMonthTo: 3
                }
            };

            await handlers.getFinancialStatementsTree(mockReq);

            expect(FinancialTreeBuilder.build).toHaveBeenCalled();
            const buildCall = FinancialTreeBuilder.build.mock.calls[0];
            expect(buildCall[1]).toBe('BAS');
        });
    });

    describe('getCombinedTree', () => {
        test('should fetch combined data and build tree', async () => {
            const mockData = [
                { CodeGrootboekrekening: '8000', DisplayAmount: 1000 },
                { CodeGrootboekrekening: '1000', DisplayAmount: 5000 }
            ];

            const mockTx = {
                run: jest.fn().mockResolvedValue(mockData)
            };
            cds.transaction.mockReturnValue(mockTx);

            const mockReq = {
                data: {
                    PeriodAYear: 2024,
                    PeriodAMonthFrom: 1,
                    PeriodAMonthTo: 12,
                    PeriodBYear: 2023,
                    PeriodBMonthFrom: 1,
                    PeriodBMonthTo: 12
                }
            };

            const result = await handlers.getCombinedTree(mockReq);

            expect(mockTx.run).toHaveBeenCalled();
            expect(FinancialTreeBuilder.build).toHaveBeenCalledWith(
                mockData,
                'COMBINED',
                expect.objectContaining({ year: 2024 }),
                expect.objectContaining({ year: 2023 })
            );
            expect(result).toBeTruthy();
        });
    });

    describe('getSalesTree', () => {
        test('should fetch sales data and build tree without gross margin', async () => {
            const mockData = [
                { CodeGrootboekrekening: '8000', DisplayAmount: 1000 }
            ];
            cds.read.mockResolvedValue(mockData);

            const mockReq = {
                data: {
                    PeriodAYear: 2024,
                    PeriodAMonthFrom: 1,
                    PeriodAMonthTo: 12,
                    PeriodBYear: 2023,
                    PeriodBMonthFrom: 1,
                    PeriodBMonthTo: 12
                }
            };

            await handlers.getSalesTree(mockReq);

            expect(cds.read).toHaveBeenCalledWith('AnalyticsService.SalesAnalytics');
            expect(FinancialTreeBuilder.build).toHaveBeenCalledWith(
                mockData,
                'SALES',
                expect.any(Object),
                expect.any(Object),
                { includeGrossMargin: false }
            );
        });
    });

    describe('getPivotTree', () => {
        test('should fetch pivot data and build tree', async () => {
            const mockData = [
                { CodeGrootboekrekening: '8000', PeriodSortKey: '202401', Saldo: 1000 }
            ];
            cds.read.mockResolvedValue(mockData);

            const mockReq = {
                data: {}
            };

            await handlers.getPivotTree(mockReq);

            expect(cds.read).toHaveBeenCalledWith('AnalyticsService.Pivot');
            expect(PivotTreeBuilder.build).toHaveBeenCalledWith(mockData);
        });

        test('should filter by period when parameters provided', async () => {
            const mockData = [
                { CodeGrootboekrekening: '8000', PeriodSortKey: '202401', Saldo: 1000 },
                { CodeGrootboekrekening: '8000', PeriodSortKey: '202402', Saldo: 1500 },
                { CodeGrootboekrekening: '8000', PeriodSortKey: '202403', Saldo: 2000 }
            ];
            cds.read.mockResolvedValue(mockData);

            const mockReq = {
                data: {
                    PeriodAYear: 2024,
                    PeriodAMonth: 1,
                    PeriodBYear: 2024,
                    PeriodBMonth: 2
                }
            };

            await handlers.getPivotTree(mockReq);

            const buildCall = PivotTreeBuilder.build.mock.calls[0];
            const filteredData = buildCall[0];

            // Should only include periods 202401 and 202402
            expect(filteredData.length).toBe(2);
        });
    });

    describe('getRevenueTree', () => {
        test('should aggregate revenue data and build tree', async () => {
            const mockData = [
                { RevenueType: 'Recurring', CostCenterGroup: 'Eng', PeriodYear: 2024, PeriodMonth: 1, Amount: 5000 },
                { RevenueType: 'Recurring', CostCenterGroup: 'Eng', PeriodYear: 2024, PeriodMonth: 1, Amount: 3000 }
            ];
            cds.run.mockResolvedValue(mockData);

            const mockReq = {
                data: {
                    PeriodAYear: 2024,
                    PeriodAMonth: 1,
                    PeriodBYear: 2024,
                    PeriodBMonth: 12
                }
            };

            await handlers.getRevenueTree(mockReq);

            expect(cds.run).toHaveBeenCalled();
            expect(RevenueTreeBuilder.build).toHaveBeenCalled();

            // Check aggregation: two amounts for same key should be summed
            const buildCall = RevenueTreeBuilder.build.mock.calls[0];
            const aggregatedData = buildCall[0];
            expect(aggregatedData).toHaveLength(1);
            expect(aggregatedData[0].TotalAmount).toBe(8000);
        });

        test('should handle empty data', async () => {
            cds.run.mockResolvedValue([]);

            const mockReq = {
                data: {
                    PeriodAYear: 2024,
                    PeriodAMonth: 1,
                    PeriodBYear: 2024,
                    PeriodBMonth: 12
                }
            };

            await handlers.getRevenueTree(mockReq);

            const buildCall = RevenueTreeBuilder.build.mock.calls[0];
            expect(buildCall[0]).toEqual([]);
        });
    });

    describe('saveSettings', () => {
        test('should update existing settings', async () => {
            SELECT.one.from().where.mockResolvedValue({ user: 'test-user', settings: '{}' });
            const updateMock = jest.fn().mockResolvedValue({});
            global.UPDATE.mockReturnValue({
                set: jest.fn().mockReturnValue({
                    where: updateMock
                })
            });

            const mockReq = {
                data: {
                    user: 'test-user',
                    settings: '{"theme": "dark"}'
                }
            };

            const result = await handlers.saveSettings(mockReq);

            expect(result).toBe('Saved');
            expect(updateMock).toHaveBeenCalled();
        });

        test('should insert new settings when user does not exist', async () => {
            SELECT.one.from().where.mockResolvedValue(null);

            const mockReq = {
                data: {
                    user: 'new-user',
                    settings: '{"theme": "light"}'
                }
            };

            const result = await handlers.saveSettings(mockReq);

            expect(result).toBe('Saved');
            expect(INSERT.into).toHaveBeenCalled();
        });
    });

    describe('getMetrics', () => {
        test('should return performance metrics', async () => {
            const { getMetrics } = require('../../srv/middleware/monitoring');
            const mockMetrics = {
                totalRequests: 100,
                averageResponseTime: 150,
                endpoints: {}
            };
            getMetrics.mockReturnValue(mockMetrics);

            const result = await handlers.getMetrics({});
            const metrics = JSON.parse(result);

            expect(getMetrics).toHaveBeenCalled();
            expect(metrics).toEqual(mockMetrics);
        });
    });

    describe('resetMetrics', () => {
        test('should reset performance metrics', async () => {
            const { resetMetrics } = require('../../srv/middleware/monitoring');

            const result = await handlers.resetMetrics({});
            const response = JSON.parse(result);

            expect(resetMetrics).toHaveBeenCalled();
            expect(response.success).toBe(true);
        });
    });

    describe('getFileContent', () => {
        test('should read file content from valid path', async () => {
            fs.readFile.mockResolvedValue('test content');

            const mockReq = {
                data: {
                    fileType: 'dataSource',
                    fileName: 'test.xlsx'
                }
            };

            const result = await handlers.getFileContent(mockReq);
            const response = JSON.parse(result);

            expect(fs.readFile).toHaveBeenCalled();
            expect(response.content).toBe('test content');
            expect(response.type).toBe('xlsx');
        });

        test('should reject invalid file types', async () => {
            const mockReq = {
                data: {
                    fileType: 'invalid',
                    fileName: 'test.txt'
                }
            };

            const result = await handlers.getFileContent(mockReq);
            const response = JSON.parse(result);

            expect(response.error).toBe('Invalid file type');
            expect(fs.readFile).not.toHaveBeenCalled();
        });

        test('should prevent path traversal attacks', async () => {
            const mockReq = {
                data: {
                    fileType: 'dataSource',
                    fileName: '../../../etc/passwd'
                }
            };

            const result = await handlers.getFileContent(mockReq);
            const response = JSON.parse(result);

            expect(response.error).toBe('Access denied');
            expect(fs.readFile).not.toHaveBeenCalled();
        });

        test('should handle file not found error', async () => {
            fs.readFile.mockRejectedValue({ code: 'ENOENT' });

            const mockReq = {
                data: {
                    fileType: 'dataSource',
                    fileName: 'missing.xlsx'
                }
            };

            const result = await handlers.getFileContent(mockReq);
            const response = JSON.parse(result);

            expect(response.error).toBe('File not found');
        });

        test('should handle other read errors', async () => {
            fs.readFile.mockRejectedValue(new Error('Permission denied'));

            const mockReq = {
                data: {
                    fileType: 'table',
                    fileName: 'test.csv'
                }
            };

            const result = await handlers.getFileContent(mockReq);
            const response = JSON.parse(result);

            expect(response.error).toBe('Failed to read file');
        });

        test('should handle missing parameters', async () => {
            const mockReq = {
                data: {
                    fileType: 'dataSource'
                }
            };

            const result = await handlers.getFileContent(mockReq);
            const response = JSON.parse(result);

            expect(response.error).toBe('Missing parameters');
        });

        test('should support all valid file types', async () => {
            fs.readFile.mockResolvedValue('content');

            const fileTypes = ['dataSource', 'table', 'staging', 'metrics', 'log'];

            for (const fileType of fileTypes) {
                const mockReq = {
                    data: { fileType, fileName: 'test.txt' }
                };

                const result = await handlers.getFileContent(mockReq);
                const response = JSON.parse(result);

                expect(response.content).toBe('content');
            }
        });
    });
});
