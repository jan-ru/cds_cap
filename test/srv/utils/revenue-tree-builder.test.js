/**
 * Unit tests for Revenue Tree Builder
 * Tests pivot table generation, period column creation, grouping, sorting, and aggregation
 */

const RevenueTreeBuilder = require('../../../srv/utils/revenue-tree-builder');

describe('Revenue Tree Builder', () => {
    describe('build - Basic Functionality', () => {
        test('should build structure with empty data', () => {
            const result = RevenueTreeBuilder.build([], 2024, 1, 2024, 12);

            expect(result).toHaveProperty('rows');
            expect(result).toHaveProperty('columns');
            expect(result.rows).toBeDefined();
            expect(result.columns).toBeDefined();
            expect(result.columns.length).toBe(12); // 12 months
        });

        test('should use default dates when parameters are missing', () => {
            const result = RevenueTreeBuilder.build([]);

            expect(result).toHaveProperty('rows');
            expect(result).toHaveProperty('columns');
            expect(result.columns.length).toBeGreaterThan(0);
        });

        test('should build with single revenue entry', () => {
            const data = [{
                RevenueType: 'Recurring',
                CostCenterGroup: 'NOI',
                PeriodYear: 2024,
                PeriodMonth: 1,
                Amount: 10000
            }];

            const result = RevenueTreeBuilder.build(data, 2024, 1, 2024, 12);

            expect(result.rows.length).toBeGreaterThan(0);
            expect(result.columns.length).toBe(12);
        });
    });

    describe('build - Period Column Generation', () => {
        test('should create columns for single month period', () => {
            const result = RevenueTreeBuilder.build([], 2024, 1, 2024, 1);

            expect(result.columns).toHaveLength(1);
            expect(result.columns[0]).toEqual({
                label: '2024-01',
                property: 'Amount_202401'
            });
        });

        test('should create columns for 3-month period', () => {
            const result = RevenueTreeBuilder.build([], 2024, 1, 2024, 3);

            expect(result.columns).toHaveLength(3);
            expect(result.columns[0]).toEqual({
                label: '2024-01',
                property: 'Amount_202401'
            });
            expect(result.columns[1]).toEqual({
                label: '2024-02',
                property: 'Amount_202402'
            });
            expect(result.columns[2]).toEqual({
                label: '2024-03',
                property: 'Amount_202403'
            });
        });

        test('should create columns for full year', () => {
            const result = RevenueTreeBuilder.build([], 2024, 1, 2024, 12);

            expect(result.columns).toHaveLength(12);
            expect(result.columns[0].label).toBe('2024-01');
            expect(result.columns[11].label).toBe('2024-12');
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

        test('should format month numbers with leading zero', () => {
            const result = RevenueTreeBuilder.build([], 2024, 1, 2024, 12);

            result.columns.forEach(col => {
                expect(col.label).toMatch(/\d{4}-\d{2}/);
                expect(col.property).toMatch(/Amount_\d{6}/);
            });
        });
    });

    describe('build - Data Pivoting', () => {
        test('should pivot single row into period columns', () => {
            const data = [{
                RevenueType: 'Recurring',
                CostCenterGroup: 'NOI',
                PeriodYear: 2024,
                PeriodMonth: 1,
                Amount: 10000
            }];

            const result = RevenueTreeBuilder.build(data, 2024, 1, 2024, 3);

            const dataRow = result.rows.find(r => 
                r.RevenueType === 'Recurring' && r.CostCenterGroup === 'NOI'
            );
            
            expect(dataRow).toBeDefined();
            expect(dataRow.Amount_202401).toBe(10000);
            expect(dataRow.Amount_202402).toBeUndefined();
            expect(dataRow.Amount_202403).toBeUndefined();
        });

        test('should pivot multiple months for same revenue type and cost center', () => {
            const data = [
                {
                    RevenueType: 'Recurring',
                    CostCenterGroup: 'NOI',
                    PeriodYear: 2024,
                    PeriodMonth: 1,
                    Amount: 10000
                },
                {
                    RevenueType: 'Recurring',
                    CostCenterGroup: 'NOI',
                    PeriodYear: 2024,
                    PeriodMonth: 2,
                    Amount: 15000
                },
                {
                    RevenueType: 'Recurring',
                    CostCenterGroup: 'NOI',
                    PeriodYear: 2024,
                    PeriodMonth: 3,
                    Amount: 12000
                }
            ];

            const result = RevenueTreeBuilder.build(data, 2024, 1, 2024, 3);

            const dataRow = result.rows.find(r => 
                r.RevenueType === 'Recurring' && r.CostCenterGroup === 'NOI'
            );
            
            expect(dataRow).toBeDefined();
            expect(dataRow.Amount_202401).toBe(10000);
            expect(dataRow.Amount_202402).toBe(15000);
            expect(dataRow.Amount_202403).toBe(12000);
        });

        test('should handle TotalAmount property', () => {
            const data = [{
                RevenueType: 'Recurring',
                CostCenterGroup: 'NOI',
                PeriodYear: 2024,
                PeriodMonth: 1,
                TotalAmount: 20000
            }];

            const result = RevenueTreeBuilder.build(data, 2024, 1, 2024, 1);

            const dataRow = result.rows.find(r => 
                r.RevenueType === 'Recurring' && r.CostCenterGroup === 'NOI'
            );
            
            expect(dataRow.Amount_202401).toBe(20000);
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
    });

    describe('build - Sorting', () => {
        test('should sort Recurring before One-off', () => {
            const data = [
                {
                    RevenueType: 'One-off',
                    CostCenterGroup: 'NOI',
                    PeriodYear: 2024,
                    PeriodMonth: 1,
                    Amount: 5000
                },
                {
                    RevenueType: 'Recurring',
                    CostCenterGroup: 'NOI',
                    PeriodYear: 2024,
                    PeriodMonth: 1,
                    Amount: 10000
                }
            ];

            const result = RevenueTreeBuilder.build(data, 2024, 1, 2024, 1);

            const dataRows = result.rows.filter(r => 
                r.CostCenterGroup && r.CostCenterGroup !== 'Total' && r.CostCenterGroup !== ''
            );

            expect(dataRows.length).toBeGreaterThanOrEqual(2);
            const recurringIndex = dataRows.findIndex(r => r.RevenueType === 'Recurring');
            const oneOffIndex = dataRows.findIndex(r => r.RevenueType === 'One-off');
            
            expect(recurringIndex).toBeLessThan(oneOffIndex);
        });

        test('should sort cost centers: NOI > WAT > Other', () => {
            const data = [
                {
                    RevenueType: 'Recurring',
                    CostCenterGroup: 'Other',
                    PeriodYear: 2024,
                    PeriodMonth: 1,
                    Amount: 3000
                },
                {
                    RevenueType: 'Recurring',
                    CostCenterGroup: 'WAT',
                    PeriodYear: 2024,
                    PeriodMonth: 1,
                    Amount: 8000
                },
                {
                    RevenueType: 'Recurring',
                    CostCenterGroup: 'NOI',
                    PeriodYear: 2024,
                    PeriodMonth: 1,
                    Amount: 10000
                }
            ];

            const result = RevenueTreeBuilder.build(data, 2024, 1, 2024, 1);

            const dataRows = result.rows.filter(r => 
                r.RevenueType === 'Recurring' && r.CostCenterGroup && 
                r.CostCenterGroup !== 'Total' && r.CostCenterGroup !== ''
            );

            expect(dataRows.length).toBe(3);
            expect(dataRows[0].CostCenterGroup).toBe('NOI');
            expect(dataRows[1].CostCenterGroup).toBe('WAT');
            expect(dataRows[2].CostCenterGroup).toBe('Other');
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
    });

    describe('build - Group Totals', () => {
        test('should add total row for Recurring revenue group', () => {
            const data = [
                {
                    RevenueType: 'Recurring',
                    CostCenterGroup: 'NOI',
                    PeriodYear: 2024,
                    PeriodMonth: 1,
                    Amount: 10000
                },
                {
                    RevenueType: 'Recurring',
                    CostCenterGroup: 'WAT',
                    PeriodYear: 2024,
                    PeriodMonth: 1,
                    Amount: 8000
                }
            ];

            const result = RevenueTreeBuilder.build(data, 2024, 1, 2024, 1);

            const recurringTotal = result.rows.find(r => 
                r.RevenueType === 'Recurring' && r.CostCenterGroup === 'Total'
            );
            
            expect(recurringTotal).toBeDefined();
            expect(recurringTotal.Amount_202401).toBe(18000);
        });

        test('should add total row for One-off revenue group', () => {
            const data = [
                {
                    RevenueType: 'One-off',
                    CostCenterGroup: 'NOI',
                    PeriodYear: 2024,
                    PeriodMonth: 1,
                    Amount: 5000
                },
                {
                    RevenueType: 'One-off',
                    CostCenterGroup: 'WAT',
                    PeriodYear: 2024,
                    PeriodMonth: 1,
                    Amount: 3000
                }
            ];

            const result = RevenueTreeBuilder.build(data, 2024, 1, 2024, 1);

            const oneOffTotal = result.rows.find(r => 
                r.RevenueType === 'One-off' && r.CostCenterGroup === 'Total'
            );
            
            expect(oneOffTotal).toBeDefined();
            expect(oneOffTotal.Amount_202401).toBe(8000);
        });

        test('should calculate totals across multiple months', () => {
            const data = [
                {
                    RevenueType: 'Recurring',
                    CostCenterGroup: 'NOI',
                    PeriodYear: 2024,
                    PeriodMonth: 1,
                    Amount: 10000
                },
                {
                    RevenueType: 'Recurring',
                    CostCenterGroup: 'NOI',
                    PeriodYear: 2024,
                    PeriodMonth: 2,
                    Amount: 12000
                },
                {
                    RevenueType: 'Recurring',
                    CostCenterGroup: 'WAT',
                    PeriodYear: 2024,
                    PeriodMonth: 1,
                    Amount: 8000
                },
                {
                    RevenueType: 'Recurring',
                    CostCenterGroup: 'WAT',
                    PeriodYear: 2024,
                    PeriodMonth: 2,
                    Amount: 9000
                }
            ];

            const result = RevenueTreeBuilder.build(data, 2024, 1, 2024, 2);

            const recurringTotal = result.rows.find(r => 
                r.RevenueType === 'Recurring' && r.CostCenterGroup === 'Total'
            );
            
            expect(recurringTotal).toBeDefined();
            expect(recurringTotal.Amount_202401).toBe(18000);
            expect(recurringTotal.Amount_202402).toBe(21000);
        });
    });

    describe('build - Grand Total', () => {
        test('should calculate grand total across all revenue types', () => {
            const data = [
                {
                    RevenueType: 'Recurring',
                    CostCenterGroup: 'NOI',
                    PeriodYear: 2024,
                    PeriodMonth: 1,
                    Amount: 10000
                },
                {
                    RevenueType: 'One-off',
                    CostCenterGroup: 'NOI',
                    PeriodYear: 2024,
                    PeriodMonth: 1,
                    Amount: 5000
                }
            ];

            const result = RevenueTreeBuilder.build(data, 2024, 1, 2024, 1);

            const grandTotal = result.rows.find(r => 
                r.RevenueType === 'Total' && r.CostCenterGroup === 'Revenue'
            );
            
            expect(grandTotal).toBeDefined();
            expect(grandTotal.Amount_202401).toBe(15000);
        });

        test('should calculate grand total across multiple months', () => {
            const data = [
                {
                    RevenueType: 'Recurring',
                    CostCenterGroup: 'NOI',
                    PeriodYear: 2024,
                    PeriodMonth: 1,
                    Amount: 10000
                },
                {
                    RevenueType: 'Recurring',
                    CostCenterGroup: 'NOI',
                    PeriodYear: 2024,
                    PeriodMonth: 2,
                    Amount: 12000
                },
                {
                    RevenueType: 'One-off',
                    CostCenterGroup: 'WAT',
                    PeriodYear: 2024,
                    PeriodMonth: 1,
                    Amount: 5000
                },
                {
                    RevenueType: 'One-off',
                    CostCenterGroup: 'WAT',
                    PeriodYear: 2024,
                    PeriodMonth: 2,
                    Amount: 6000
                }
            ];

            const result = RevenueTreeBuilder.build(data, 2024, 1, 2024, 2);

            const grandTotal = result.rows.find(r => 
                r.RevenueType === 'Total' && r.CostCenterGroup === 'Revenue'
            );
            
            expect(grandTotal).toBeDefined();
            expect(grandTotal.Amount_202401).toBe(15000);
            expect(grandTotal.Amount_202402).toBe(18000);
        });
    });

    describe('build - Edge Cases', () => {
        test('should handle empty data array', () => {
            const result = RevenueTreeBuilder.build([], 2024, 1, 2024, 3);

            expect(result.columns).toHaveLength(3);
            expect(result.rows.length).toBeGreaterThan(0);
            expect(result.rows.some(r => r.RevenueType === 'Total')).toBe(true);
        });

        test('should handle zero amounts', () => {
            const data = [{
                RevenueType: 'Recurring',
                CostCenterGroup: 'NOI',
                PeriodYear: 2024,
                PeriodMonth: 1,
                Amount: 0
            }];

            const result = RevenueTreeBuilder.build(data, 2024, 1, 2024, 1);

            const dataRow = result.rows.find(r => 
                r.RevenueType === 'Recurring' && r.CostCenterGroup === 'NOI'
            );
            
            expect(dataRow.Amount_202401).toBe(0);
        });

        test('should handle negative amounts', () => {
            const data = [{
                RevenueType: 'Recurring',
                CostCenterGroup: 'NOI',
                PeriodYear: 2024,
                PeriodMonth: 1,
                Amount: -5000
            }];

            const result = RevenueTreeBuilder.build(data, 2024, 1, 2024, 1);

            const dataRow = result.rows.find(r => 
                r.RevenueType === 'Recurring' && r.CostCenterGroup === 'NOI'
            );
            
            expect(dataRow.Amount_202401).toBe(-5000);
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

        test('should return consistent structure', () => {
            const result = RevenueTreeBuilder.build([], 2024, 1, 2024, 1);

            expect(result).toHaveProperty('rows');
            expect(result).toHaveProperty('columns');
            expect(Array.isArray(result.columns)).toBe(true);
            expect(Array.isArray(result.rows)).toBe(true);
        });
    });
});
