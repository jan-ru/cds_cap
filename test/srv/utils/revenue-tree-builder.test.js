const RevenueTreeBuilder = require('../../../srv/utils/revenue-tree-builder');

describe('Revenue Tree Builder', () => {
    describe('build', () => {
        test('should build tree with single period', () => {
            const data = [
                {
                    RevenueType: 'Recurring',
                    CostCenterGroup: 'Engineering',
                    PeriodYear: 2024,
                    PeriodMonth: 1,
                    Amount: 10000
                }
            ];

            const result = RevenueTreeBuilder.build(data, 2024, 1, 2024, 1);

            expect(result).toHaveProperty('columns');
            expect(result).toHaveProperty('rows');
            expect(result.columns).toHaveLength(1);
            expect(result.columns[0].label).toBe('2024-01');
        });

        test('should build tree with multiple periods', () => {
            const data = [
                { RevenueType: 'Recurring', CostCenterGroup: 'Eng', PeriodYear: 2024, PeriodMonth: 1, Amount: 10000 },
                { RevenueType: 'Recurring', CostCenterGroup: 'Eng', PeriodYear: 2024, PeriodMonth: 2, Amount: 11000 },
                { RevenueType: 'Recurring', CostCenterGroup: 'Eng', PeriodYear: 2024, PeriodMonth: 3, Amount: 12000 }
            ];

            const result = RevenueTreeBuilder.build(data, 2024, 1, 2024, 3);

            expect(result.columns).toHaveLength(3);
            expect(result.columns[0].label).toBe('2024-01');
            expect(result.columns[1].label).toBe('2024-02');
            expect(result.columns[2].label).toBe('2024-03');
        });

        test('should handle multiple revenue types', () => {
            const data = [
                { RevenueType: 'Recurring', CostCenterGroup: 'Eng', PeriodYear: 2024, PeriodMonth: 1, Amount: 10000 },
                { RevenueType: 'One-off', CostCenterGroup: 'Sales', PeriodYear: 2024, PeriodMonth: 1, Amount: 5000 }
            ];

            const result = RevenueTreeBuilder.build(data, 2024, 1, 2024, 1);

            expect(result.rows.length).toBeGreaterThan(0);
            const revenueTypes = result.rows.filter(r => r.RevenueType).map(row => row.RevenueType);
            expect(revenueTypes).toContain('Recurring');
            expect(revenueTypes).toContain('One-off');
        });

        test('should group by revenue type and cost center', () => {
            const data = [
                { RevenueType: 'Recurring', CostCenterGroup: 'Eng', PeriodYear: 2024, PeriodMonth: 1, Amount: 10000 },
                { RevenueType: 'Recurring', CostCenterGroup: 'Eng', PeriodYear: 2024, PeriodMonth: 2, Amount: 11000 },
                { RevenueType: 'Recurring', CostCenterGroup: 'Sales', PeriodYear: 2024, PeriodMonth: 1, Amount: 5000 }
            ];

            const result = RevenueTreeBuilder.build(data, 2024, 1, 2024, 2);

            expect(result.rows.length).toBeGreaterThanOrEqual(2);
            const engRow = result.rows.find(r => r.RevenueType === 'Recurring' && r.CostCenterGroup === 'Eng');
            const salesRow = result.rows.find(r => r.RevenueType === 'Recurring' && r.CostCenterGroup === 'Sales');

            expect(engRow).toBeDefined();
            expect(salesRow).toBeDefined();
        });

        test('should use default values when parameters are missing', () => {
            const data = [
                { RevenueType: 'Recurring', CostCenterGroup: 'Eng', PeriodYear: 2024, PeriodMonth: 1, Amount: 10000 }
            ];

            const result = RevenueTreeBuilder.build(data);

            expect(result).toHaveProperty('rows');
            expect(result.columns.length).toBeGreaterThan(0);
        });

        test('should handle empty data array', () => {
            const result = RevenueTreeBuilder.build([], 2024, 1, 2024, 3);

            expect(result.columns).toHaveLength(3);
            // Empty data still generates spacer rows and total row
            expect(result.rows.length).toBeGreaterThan(0);
            expect(result.rows.some(r => r.RevenueType === 'Total')).toBe(true);
        });

        test('should handle year boundary correctly', () => {
            const data = [
                { RevenueType: 'Recurring', CostCenterGroup: 'Eng', PeriodYear: 2023, PeriodMonth: 12, Amount: 10000 },
                { RevenueType: 'Recurring', CostCenterGroup: 'Eng', PeriodYear: 2024, PeriodMonth: 1, Amount: 11000 }
            ];

            const result = RevenueTreeBuilder.build(data, 2023, 12, 2024, 1);

            expect(result.columns).toHaveLength(2);
            expect(result.columns[0].label).toBe('2023-12');
            expect(result.columns[1].label).toBe('2024-01');
        });

        test('should format month with leading zero', () => {
            const result = RevenueTreeBuilder.build([], 2024, 1, 2024, 9);

            expect(result.columns[0].property).toBe('Amount_202401');
            expect(result.columns[8].property).toBe('Amount_202409');
        });

        test('should handle month without leading zero for Oct-Dec', () => {
            const result = RevenueTreeBuilder.build([], 2024, 10, 2024, 12);

            expect(result.columns[0].property).toBe('Amount_202410');
            expect(result.columns[1].property).toBe('Amount_202411');
            expect(result.columns[2].property).toBe('Amount_202412');
        });

        test('should handle pre-aggregated data for same period and group', () => {
            // Note: Builder expects pre-aggregated data, last value wins for duplicate keys
            const data = [
                { RevenueType: 'Recurring', CostCenterGroup: 'Eng', PeriodYear: 2024, PeriodMonth: 1, Amount: 15000 }
            ];

            const result = RevenueTreeBuilder.build(data, 2024, 1, 2024, 1);

            const engRow = result.rows.find(r => r.RevenueType === 'Recurring' && r.CostCenterGroup === 'Eng');
            expect(engRow).toBeDefined();
            expect(engRow.Amount_202401).toBe(15000);
        });

        test('should handle LTM period (12 months)', () => {
            const data = [];
            for (let month = 1; month <= 12; month++) {
                data.push({
                    RevenueType: 'Recurring',
                    CostCenterGroup: 'Eng',
                    PeriodYear: 2024,
                    PeriodMonth: month,
                    Amount: month * 1000
                });
            }

            const result = RevenueTreeBuilder.build(data, 2024, 1, 2024, 12);

            expect(result.columns).toHaveLength(12);
            expect(result.rows.length).toBeGreaterThan(0);
        });

        test('should handle null or undefined amounts', () => {
            const data = [
                { RevenueType: 'Recurring', CostCenterGroup: 'Eng', PeriodYear: 2024, PeriodMonth: 1, Amount: null },
                { RevenueType: 'Recurring', CostCenterGroup: 'Eng', PeriodYear: 2024, PeriodMonth: 2, Amount: undefined }
            ];

            const result = RevenueTreeBuilder.build(data, 2024, 1, 2024, 2);

            expect(result).toBeDefined();
            expect(result.columns).toHaveLength(2);
        });

        test('should return consistent structure', () => {
            const result = RevenueTreeBuilder.build([], 2024, 1, 2024, 1);

            expect(result).toHaveProperty('rows');
            expect(result).toHaveProperty('columns');
            expect(result).toHaveProperty('rows');
            expect(Array.isArray(result.columns)).toBe(true);
            expect(Array.isArray(result.rows)).toBe(true);
        });
    });
});
