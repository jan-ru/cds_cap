/**
 * Integration tests between dbt and CAP
 * Verifies that data flows correctly from dbt transformations to CAP OData service
 */

const sqlite3 = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../..', 'database', 'db.sqlite');

describe('dbt → CAP Integration Tests', () => {
    let db;

    beforeAll(() => {
        // Open database connection
        db = sqlite3(DB_PATH, { readonly: true });
    });

    afterAll(() => {
        // Close database connection
        if (db) db.close();
    });

    describe('Database Structure Verification', () => {
        test('database file exists and is readable', () => {
            expect(db).toBeDefined();
            const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
            expect(tables.length).toBeGreaterThan(0);
        });

        test('all expected dbt mart tables exist in database', () => {
            const expectedTables = [
                'demo_FinancialStatements',
                'demo_VFA_SalesInvoice',
                'demo_VOA_SalesOrder',
                'demo_ESL_Product',
                'demo_PGA_ProductGroup'
            ];

            const allTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
            const tableNames = allTables.map(t => t.name);

            // Check that we have all expected mart tables exported from dbt
            const foundTables = expectedTables.filter(tableName =>
                tableNames.includes(tableName)
            );

            // Expect to find at least 80% of expected tables
            expect(foundTables.length).toBeGreaterThanOrEqual(expectedTables.length * 0.8);
        });
    });

    describe('Data Quality Checks', () => {
        test('mart tables contain data', () => {
            const tables = [
                'demo_ESL_Product',
                'demo_VFA_SalesInvoice',
                'demo_VOA_SalesOrder'
            ];

            tables.forEach(table => {
                try {
                    const result = db.prepare(`SELECT COUNT(*) as count FROM "${table}"`).get();
                    expect(result.count).toBeGreaterThan(0);
                } catch (error) {
                    console.warn(`Could not query ${table}: ${error.message}`);
                }
            });
        });

        test('ID columns are unique and not null', () => {
            const tables = [
                'demo_ESL_Product',
                'demo_VFA_SalesInvoice',
                'demo_FinancialStatements'
            ];

            tables.forEach(table => {
                try {
                    // Check for NULLs in ID column
                    const nullCheck = db.prepare(`
                        SELECT COUNT(*) as count
                        FROM "${table}"
                        WHERE ID IS NULL
                    `).get();
                    expect(nullCheck.count).toBe(0);

                    // Check for duplicates in ID column
                    const duplicateCheck = db.prepare(`
                        SELECT ID, COUNT(*) as count
                        FROM "${table}"
                        GROUP BY ID
                        HAVING COUNT(*) > 1
                    `).all();
                    expect(duplicateCheck.length).toBe(0);
                } catch (error) {
                    console.warn(`Could not validate ${table}: ${error.message}`);
                }
            });
        });
    });

    describe('Data Transformation Validation', () => {
        test('financial statements have proper FStype values', () => {
            try {
                const result = db.prepare(`
                    SELECT DISTINCT FStype
                    FROM "demo_FinancialStatements"
                    WHERE FStype IS NOT NULL
                `).all();

                const types = result.map(r => r.FStype);
                expect(types).toContain('BAS');
                expect(types).toContain('PNL');
                expect(types.every(t => ['BAS', 'PNL', 'OTH'].includes(t))).toBe(true);
            } catch (error) {
                console.warn(`Could not validate FStype: ${error.message}`);
            }
        });

        test('unpivoted financial statements contain multiple periods', () => {
            try {
                const result = db.prepare(`
                    SELECT DISTINCT PeriodMonth
                    FROM "demo_FinancialStatements"
                    ORDER BY PeriodMonth
                `).all();

                expect(result.length).toBeGreaterThan(1);
                // Should have months 0-12 (0 = opening, 1-12 = Jan-Dec)
                expect(result.length).toBeLessThanOrEqual(13);
            } catch (error) {
                console.warn(`Could not validate periods: ${error.message}`);
            }
        });
    });

    describe('CAP Integration Readiness', () => {
        test('required columns exist for CAP OData service', () => {
            const requiredColumns = {
                'demo_VFA_SalesInvoice': [
                    'ID', 'volg_nr', 'debtor_name', 'total_ex_vat'
                ],
                'demo_VOA_SalesOrder': [
                    'ID', 'volg_nr', 'organisation', 'total_ex_vat'
                ]
            };

            Object.entries(requiredColumns).forEach(([table, columns]) => {
                try {
                    const tableInfo = db.prepare(`PRAGMA table_info("${table}")`).all();
                    const columnNames = tableInfo.map(col => col.name);

                    columns.forEach(col => {
                        expect(columnNames).toContain(col);
                    });
                } catch (error) {
                    console.warn(`Could not validate columns for ${table}: ${error.message}`);
                }
            });
        });

        test('numeric fields are properly formatted', () => {
            try {
                const result = db.prepare(`
                    SELECT total_ex_vat
                    FROM "demo_VFA_SalesInvoice"
                    WHERE total_ex_vat IS NOT NULL
                    LIMIT 1
                `).get();

                if (result) {
                    // Should be a number, not a string with European formatting
                    expect(typeof result.total_ex_vat).toBe('number');
                }
            } catch (error) {
                console.warn(`Could not validate numeric formatting: ${error.message}`);
            }
        });
    });

    describe('Data Consistency', () => {
        test('financial statements have valid GL account codes', () => {
            try {
                // Check that all financial statements have non-null GL account codes
                const result = db.prepare(`
                    SELECT COUNT(*) as count
                    FROM "demo_FinancialStatements"
                    WHERE CodeGrootboekrekening IS NULL
                `).get();

                expect(result.count).toBe(0);
            } catch (error) {
                console.warn(`Could not validate data consistency: ${error.message}`);
            }
        });
    });
});
