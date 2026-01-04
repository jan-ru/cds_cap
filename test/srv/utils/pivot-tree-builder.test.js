const PivotTreeBuilder = require('../../../srv/utils/pivot-tree-builder');

describe('Pivot Tree Builder', () => {
    describe('build', () => {
        test('should build tree with empty data', () => {
            const result = PivotTreeBuilder.build([]);

            expect(result).toHaveProperty('root');
            expect(result.root).toHaveProperty('nodes');
            expect(result.root).toHaveProperty('columns');
            expect(result.root.nodes).toHaveLength(0);
            expect(result.root.columns).toHaveLength(0);
        });

        test('should extract unique periods as columns', () => {
            const data = [
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Revenue', PeriodSortKey: '2024001', Saldo: 1000 },
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Revenue', PeriodSortKey: '2024002', Saldo: 1500 },
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Revenue', PeriodSortKey: '2024003', Saldo: 2000 }
            ];

            const result = PivotTreeBuilder.build(data);

            expect(result.root.columns).toHaveLength(3);
            expect(result.root.columns).toContain('2024001');
            expect(result.root.columns).toContain('2024002');
            expect(result.root.columns).toContain('2024003');
        });

        test('should sort periods correctly', () => {
            const data = [
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Revenue', PeriodSortKey: '2024003', Saldo: 2000 },
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Revenue', PeriodSortKey: '2024001', Saldo: 1000 },
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Revenue', PeriodSortKey: '2024002', Saldo: 1500 }
            ];

            const result = PivotTreeBuilder.build(data);

            expect(result.root.columns[0]).toBe('2024001');
            expect(result.root.columns[1]).toBe('2024002');
            expect(result.root.columns[2]).toBe('2024003');
        });

        test('should create L1 group nodes (0xxx series)', () => {
            const data = [
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Revenue', PeriodSortKey: '2024001', Saldo: 1000 },
                { CodeGrootboekrekening: '4000', NaamGrootboekrekening: 'COGS', PeriodSortKey: '2024001', Saldo: -500 }
            ];

            const result = PivotTreeBuilder.build(data);

            expect(result.root.nodes.length).toBeGreaterThanOrEqual(2);
            const l1Nodes = result.root.nodes.filter(n => n.level === 1);
            expect(l1Nodes.length).toBeGreaterThanOrEqual(2);

            const revenue = l1Nodes.find(n => n.name === '8xxx Series');
            const cogs = l1Nodes.find(n => n.name === '4xxx Series');

            expect(revenue).toBeDefined();
            expect(cogs).toBeDefined();
        });

        test('should create L2 group nodes (00xx series)', () => {
            const data = [
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Revenue A', PeriodSortKey: '2024001', Saldo: 1000 },
                { CodeGrootboekrekening: '8100', NaamGrootboekrekening: 'Revenue B', PeriodSortKey: '2024001', Saldo: 1500 }
            ];

            const result = PivotTreeBuilder.build(data);

            const l1Node = result.root.nodes.find(n => n.name === '8xxx Series');
            expect(l1Node).toBeDefined();
            expect(l1Node.nodes).toBeDefined();
            expect(l1Node.nodes.length).toBeGreaterThanOrEqual(2);

            const l2Nodes = l1Node.nodes.filter(n => n.level === 2);
            expect(l2Nodes.length).toBeGreaterThanOrEqual(2);
            expect(l2Nodes.some(n => n.name === '80xx Group')).toBe(true);
            expect(l2Nodes.some(n => n.name === '81xx Group')).toBe(true);
        });

        test('should create leaf nodes with account details', () => {
            const data = [
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Main Revenue', PeriodSortKey: '2024001', Saldo: 1000 }
            ];

            const result = PivotTreeBuilder.build(data);

            const l1Node = result.root.nodes.find(n => n.name === '8xxx Series');
            const l2Node = l1Node.nodes.find(n => n.name === '80xx Group');
            const leafNode = l2Node.nodes.find(n => n.code === '8000');

            expect(leafNode).toBeDefined();
            expect(leafNode.level).toBe(3);
            expect(leafNode.name).toBe('8000 - Main Revenue');
            expect(leafNode.code).toBe('8000');
        });

        test('should aggregate amounts for same account across periods', () => {
            const data = [
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Revenue', PeriodSortKey: '2024001', Saldo: 1000 },
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Revenue', PeriodSortKey: '2024002', Saldo: 1500 }
            ];

            const result = PivotTreeBuilder.build(data);

            const l1Node = result.root.nodes.find(n => n.name === '8xxx Series');
            const l2Node = l1Node.nodes.find(n => n.name === '80xx Group');
            const leafNode = l2Node.nodes.find(n => n.code === '8000');

            expect(leafNode['2024001']).toBe(1000);
            expect(leafNode['2024002']).toBe(1500);
        });

        test('should aggregate amounts up to L2 nodes', () => {
            const data = [
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Revenue A', PeriodSortKey: '2024001', Saldo: 1000 },
                { CodeGrootboekrekening: '8010', NaamGrootboekrekening: 'Revenue B', PeriodSortKey: '2024001', Saldo: 500 }
            ];

            const result = PivotTreeBuilder.build(data);

            const l1Node = result.root.nodes.find(n => n.name === '8xxx Series');
            const l2Node = l1Node.nodes.find(n => n.name === '80xx Group');

            expect(l2Node['2024001']).toBe(1500); // 1000 + 500
        });

        test('should aggregate amounts up to L1 nodes', () => {
            const data = [
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Revenue A', PeriodSortKey: '2024001', Saldo: 1000 },
                { CodeGrootboekrekening: '8100', NaamGrootboekrekening: 'Revenue B', PeriodSortKey: '2024001', Saldo: 500 }
            ];

            const result = PivotTreeBuilder.build(data);

            const l1Node = result.root.nodes.find(n => n.name === '8xxx Series');

            expect(l1Node['2024001']).toBe(1500); // 1000 + 500
        });

        test('should handle negative amounts (expenses)', () => {
            const data = [
                { CodeGrootboekrekening: '4000', NaamGrootboekrekening: 'COGS', PeriodSortKey: '2024001', Saldo: -500 }
            ];

            const result = PivotTreeBuilder.build(data);

            const l1Node = result.root.nodes.find(n => n.name === '4xxx Series');
            const l2Node = l1Node.nodes.find(n => n.name === '40xx Group');
            const leafNode = l2Node.nodes.find(n => n.code === '4000');

            expect(leafNode['2024001']).toBe(-500);
        });

        test('should handle zero amounts', () => {
            const data = [
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Revenue', PeriodSortKey: '2024001', Saldo: 0 }
            ];

            const result = PivotTreeBuilder.build(data);

            const l1Node = result.root.nodes.find(n => n.name === '8xxx Series');
            const l2Node = l1Node.nodes.find(n => n.name === '80xx Group');
            const leafNode = l2Node.nodes.find(n => n.code === '8000');

            expect(leafNode['2024001']).toBe(0);
        });

        test('should handle null or undefined Saldo', () => {
            const data = [
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Revenue', PeriodSortKey: '2024001', Saldo: null },
                { CodeGrootboekrekening: '8010', NaamGrootboekrekening: 'Revenue', PeriodSortKey: '2024001', Saldo: undefined }
            ];

            const result = PivotTreeBuilder.build(data);

            const l1Node = result.root.nodes.find(n => n.name === '8xxx Series');
            const l2Node = l1Node.nodes.find(n => n.name === '80xx Group');

            expect(result).toBeDefined();
            expect(l2Node['2024001']).toBe(0); // null/undefined treated as 0
        });

        test('should round amounts to 2 decimal places', () => {
            const data = [
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Revenue', PeriodSortKey: '2024001', Saldo: 1000.123456 }
            ];

            const result = PivotTreeBuilder.build(data);

            const l1Node = result.root.nodes.find(n => n.name === '8xxx Series');
            const l2Node = l1Node.nodes.find(n => n.name === '80xx Group');
            const leafNode = l2Node.nodes.find(n => n.code === '8000');

            expect(leafNode['2024001']).toBe(1000.12);
        });

        test('should handle multiple accounts with same L2 prefix', () => {
            const data = [
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Revenue A', PeriodSortKey: '2024001', Saldo: 1000 },
                { CodeGrootboekrekening: '8010', NaamGrootboekrekening: 'Revenue B', PeriodSortKey: '2024001', Saldo: 500 },
                { CodeGrootboekrekening: '8020', NaamGrootboekrekening: 'Revenue C', PeriodSortKey: '2024001', Saldo: 250 }
            ];

            const result = PivotTreeBuilder.build(data);

            const l1Node = result.root.nodes.find(n => n.name === '8xxx Series');
            const l2Node = l1Node.nodes.find(n => n.name === '80xx Group');

            expect(l2Node.nodes).toHaveLength(3);
            expect(l2Node['2024001']).toBe(1750); // 1000 + 500 + 250
        });

        test('should handle account codes as strings', () => {
            const data = [
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Revenue', PeriodSortKey: '2024001', Saldo: 1000 }
            ];

            const result = PivotTreeBuilder.build(data);

            expect(result.root.nodes.length).toBeGreaterThan(0);
        });

        test('should handle account codes as numbers', () => {
            const data = [
                { CodeGrootboekrekening: 8000, NaamGrootboekrekening: 'Revenue', PeriodSortKey: '2024001', Saldo: 1000 }
            ];

            const result = PivotTreeBuilder.build(data);

            expect(result.root.nodes.length).toBeGreaterThan(0);
        });

        test('should maintain hierarchical structure', () => {
            const data = [
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Revenue', PeriodSortKey: '2024001', Saldo: 1000 }
            ];

            const result = PivotTreeBuilder.build(data);

            const l1Node = result.root.nodes.find(n => n.name === '8xxx Series');
            expect(l1Node.level).toBe(1);
            expect(l1Node.nodes).toBeDefined();

            const l2Node = l1Node.nodes.find(n => n.name === '80xx Group');
            expect(l2Node.level).toBe(2);
            expect(l2Node.nodes).toBeDefined();

            const l3Node = l2Node.nodes.find(n => n.code === '8000');
            expect(l3Node.level).toBe(3);
            expect(l3Node.nodes).toBeUndefined(); // Leaf node
        });

        test('should handle multiple periods for complex dataset', () => {
            const data = [];
            const accounts = ['8000', '8100', '4000', '4100'];
            const periods = ['2024001', '2024002', '2024003'];

            accounts.forEach((acc, i) => {
                periods.forEach((period, j) => {
                    data.push({
                        CodeGrootboekrekening: acc,
                        NaamGrootboekrekening: `Account ${acc}`,
                        PeriodSortKey: period,
                        Saldo: (i + 1) * (j + 1) * 1000
                    });
                });
            });

            const result = PivotTreeBuilder.build(data);

            expect(result.root.columns).toHaveLength(3);
            expect(result.root.nodes.length).toBeGreaterThanOrEqual(2);
        });

        test('should create Grand Total node as last L1 node', () => {
            const data = [
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Revenue', PeriodSortKey: '2024001', Saldo: 1000 },
                { CodeGrootboekrekening: '4000', NaamGrootboekrekening: 'COGS', PeriodSortKey: '2024001', Saldo: -500 }
            ];

            const result = PivotTreeBuilder.build(data);

            const grandTotal = result.root.nodes[result.root.nodes.length - 1];
            expect(grandTotal.name).toBe('Grand Total');
            expect(grandTotal.level).toBe(1);
            expect(grandTotal.isBold).toBe(true);
        });

        test('should calculate Grand Total correctly across all L1 nodes', () => {
            const data = [
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Revenue A', PeriodSortKey: '2024001', Saldo: 1000 },
                { CodeGrootboekrekening: '8100', NaamGrootboekrekening: 'Revenue B', PeriodSortKey: '2024001', Saldo: 500 },
                { CodeGrootboekrekening: '4000', NaamGrootboekrekening: 'COGS', PeriodSortKey: '2024001', Saldo: -300 }
            ];

            const result = PivotTreeBuilder.build(data);

            const grandTotal = result.root.nodes[result.root.nodes.length - 1];
            expect(grandTotal['2024001']).toBe(1200); // 1000 + 500 - 300
        });

        test('should calculate Grand Total across multiple periods', () => {
            const data = [
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Revenue', PeriodSortKey: '2024001', Saldo: 1000 },
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Revenue', PeriodSortKey: '2024002', Saldo: 1500 },
                { CodeGrootboekrekening: '4000', NaamGrootboekrekening: 'COGS', PeriodSortKey: '2024001', Saldo: -500 },
                { CodeGrootboekrekening: '4000', NaamGrootboekrekening: 'COGS', PeriodSortKey: '2024002', Saldo: -750 }
            ];

            const result = PivotTreeBuilder.build(data);

            const grandTotal = result.root.nodes[result.root.nodes.length - 1];
            expect(grandTotal['2024001']).toBe(500);  // 1000 - 500
            expect(grandTotal['2024002']).toBe(750);  // 1500 - 750
        });

        test('should round Grand Total amounts to 2 decimal places', () => {
            const data = [
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Revenue', PeriodSortKey: '2024001', Saldo: 1000.123 },
                { CodeGrootboekrekening: '4000', NaamGrootboekrekening: 'COGS', PeriodSortKey: '2024001', Saldo: -500.456 }
            ];

            const result = PivotTreeBuilder.build(data);

            const grandTotal = result.root.nodes[result.root.nodes.length - 1];
            expect(grandTotal['2024001']).toBe(499.66); // 1000.12 - 500.46 = 499.66
        });

        test('should sort L1 nodes alphabetically (excluding Grand Total)', () => {
            const data = [
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Revenue', PeriodSortKey: '2024001', Saldo: 1000 },
                { CodeGrootboekrekening: '4000', NaamGrootboekrekening: 'COGS', PeriodSortKey: '2024001', Saldo: -500 },
                { CodeGrootboekrekening: '6000', NaamGrootboekrekening: 'Expenses', PeriodSortKey: '2024001', Saldo: -300 }
            ];

            const result = PivotTreeBuilder.build(data);

            const l1NodesWithoutTotal = result.root.nodes.slice(0, -1);
            expect(l1NodesWithoutTotal[0].name).toBe('4xxx Series');
            expect(l1NodesWithoutTotal[1].name).toBe('6xxx Series');
            expect(l1NodesWithoutTotal[2].name).toBe('8xxx Series');
        });

        test('should sort L2 nodes within each L1 group', () => {
            const data = [
                { CodeGrootboekrekening: '8200', NaamGrootboekrekening: 'Revenue C', PeriodSortKey: '2024001', Saldo: 1000 },
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Revenue A', PeriodSortKey: '2024001', Saldo: 1500 },
                { CodeGrootboekrekening: '8100', NaamGrootboekrekening: 'Revenue B', PeriodSortKey: '2024001', Saldo: 2000 }
            ];

            const result = PivotTreeBuilder.build(data);

            const l1Node = result.root.nodes.find(n => n.name === '8xxx Series');
            expect(l1Node.nodes[0].name).toBe('80xx Group');
            expect(l1Node.nodes[1].name).toBe('81xx Group');
            expect(l1Node.nodes[2].name).toBe('82xx Group');
        });

        test('should sort leaf nodes within each L2 group', () => {
            const data = [
                { CodeGrootboekrekening: '8020', NaamGrootboekrekening: 'Revenue C', PeriodSortKey: '2024001', Saldo: 1000 },
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Revenue A', PeriodSortKey: '2024001', Saldo: 1500 },
                { CodeGrootboekrekening: '8010', NaamGrootboekrekening: 'Revenue B', PeriodSortKey: '2024001', Saldo: 2000 }
            ];

            const result = PivotTreeBuilder.build(data);

            const l1Node = result.root.nodes.find(n => n.name === '8xxx Series');
            const l2Node = l1Node.nodes.find(n => n.name === '80xx Group');
            expect(l2Node.nodes[0].code).toBe('8000');
            expect(l2Node.nodes[1].code).toBe('8010');
            expect(l2Node.nodes[2].code).toBe('8020');
        });

        test('should handle items with missing PeriodSortKey', () => {
            const data = [
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Revenue', PeriodSortKey: '2024001', Saldo: 1000 },
                { CodeGrootboekrekening: '8010', NaamGrootboekrekening: 'Revenue B', PeriodSortKey: null, Saldo: 500 }
            ];

            const result = PivotTreeBuilder.build(data);

            expect(result.root.columns).toHaveLength(1); // Only 2024001
            expect(result.root.columns).toContain('2024001');
        });

        test('should handle items with empty string PeriodSortKey', () => {
            const data = [
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Revenue', PeriodSortKey: '2024001', Saldo: 1000 },
                { CodeGrootboekrekening: '8010', NaamGrootboekrekening: 'Revenue B', PeriodSortKey: '', Saldo: 500 }
            ];

            const result = PivotTreeBuilder.build(data);

            expect(result.root.columns).toHaveLength(1);
        });

        test('should initialize all period columns with 0 for new nodes', () => {
            const data = [
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Revenue', PeriodSortKey: '2024001', Saldo: 1000 },
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Revenue', PeriodSortKey: '2024003', Saldo: 1500 }
            ];

            const result = PivotTreeBuilder.build(data);

            const l1Node = result.root.nodes.find(n => n.name === '8xxx Series');
            const l2Node = l1Node.nodes.find(n => n.name === '80xx Group');
            const leafNode = l2Node.nodes.find(n => n.code === '8000');

            expect(leafNode['2024001']).toBe(1000);
            expect(leafNode['2024002']).toBeUndefined(); // Only periods with data exist
            expect(leafNode['2024003']).toBe(1500);
        });

        test('should accumulate multiple transactions for same account in same period', () => {
            const data = [
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Revenue', PeriodSortKey: '2024001', Saldo: 1000 },
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Revenue', PeriodSortKey: '2024001', Saldo: 500 },
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Revenue', PeriodSortKey: '2024001', Saldo: 250 }
            ];

            const result = PivotTreeBuilder.build(data);

            const l1Node = result.root.nodes.find(n => n.name === '8xxx Series');
            const l2Node = l1Node.nodes.find(n => n.name === '80xx Group');
            const leafNode = l2Node.nodes.find(n => n.code === '8000');

            expect(leafNode['2024001']).toBe(1750); // 1000 + 500 + 250
        });

        test('should not create Grand Total if no data', () => {
            const result = PivotTreeBuilder.build([]);

            expect(result.root.nodes).toHaveLength(0);
        });

        test('should handle very small decimal amounts', () => {
            const data = [
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Revenue', PeriodSortKey: '2024001', Saldo: 0.001 },
                { CodeGrootboekrekening: '8010', NaamGrootboekrekening: 'Revenue B', PeriodSortKey: '2024001', Saldo: 0.002 }
            ];

            const result = PivotTreeBuilder.build(data);

            const l1Node = result.root.nodes.find(n => n.name === '8xxx Series');
            const l2Node = l1Node.nodes.find(n => n.name === '80xx Group');

            expect(l2Node['2024001']).toBe(0); // 0.001 + 0.002 = 0.003 rounded to 0.00
        });

        test('should handle large amounts', () => {
            const data = [
                { CodeGrootboekrekening: '8000', NaamGrootboekrekening: 'Revenue', PeriodSortKey: '2024001', Saldo: 1000000000.50 },
                { CodeGrootboekrekening: '4000', NaamGrootboekrekening: 'COGS', PeriodSortKey: '2024001', Saldo: -500000000.25 }
            ];

            const result = PivotTreeBuilder.build(data);

            const grandTotal = result.root.nodes[result.root.nodes.length - 1];
            expect(grandTotal['2024001']).toBe(500000000.25);
        });
    });
});
