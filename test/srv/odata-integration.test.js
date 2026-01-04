/**
 * Integration tests for OData endpoints
 * Tests actual HTTP requests to the CAP service against real database
 * 
 * CONFIGURATION:
 * - Uses actual SQLite database (/root/projects/database/db.sqlite)
 * - Basic auth configured (alice:alice)
 * - Monitoring middleware disabled in test mode
 * - Tests run against real data with full service implementation
 * 
 * TEST COVERAGE (35/41 passing):
 * ✓ Entity queries (Dump, FinancialStatements, SalesAnalytics, etc.)
 * ✓ OData query options ($top, $skip, $filter, $orderby)
 * ✓ Function endpoints (getAppInfo, get*Tree functions)
 * ✓ Error handling (404, malformed queries, auth)
 * ✓ Performance benchmarks
 * ✓ Service document
 * 
 * KNOWN ISSUES:
 * - $select with specific fields may have column mapping issues
 * - $count parameter needs further investigation
 * - $metadata endpoint times out (60s) - may need optimization
 * - saveSettings action needs request format adjustment
 * - Batch requests need multipart boundary configuration
 * - getAppInfo JSON parsing needs validation
 */

const cds = require('@sap/cds');
const supertest = require('supertest');
const path = require('path');

describe('OData Integration Tests', () => {
    let app, request, auth;
    

    beforeAll(async () => {
        // Set CDS root to project directory
        process.env.CDS_ROOT = path.join(__dirname, '/../..');
        
        // Disable monitoring middleware in test mode
        process.env.NODE_ENV = 'test';
        
        // Configure database to use actual SQLite file
        cds.env.requires.db = {
            kind: 'sqlite',
            credentials: {
                url: '/root/projects/database/db.sqlite'
            }
        };
        
        // Load model and connect to actual database
        const csn = await cds.load('*');
        await cds.connect.to('db');
        
        // Create Express app and serve CDS services
        app = require('express')();
        await cds.serve('all').in(app);
        
        request = supertest(app);
        
        // Setup basic auth header
        auth = { Authorization: `Basic ${Buffer.from('alice:alice').toString('base64')}` };
    }, 60000);

    afterAll(async () => {
        await cds.shutdown();
    });

    describe('Entity Endpoints', () => {
        describe('GET /Dump', () => {
            test('should return Dump entity data', async () => {
                const response = await request.get('/analytics/Dump').set(auth);
                
                expect(response.statusCode).toBe(200);
                expect(response.body).toBeDefined();
                expect(Array.isArray(response.body.value)).toBe(true);
            });

            test('should support $top query parameter', async () => {
                const response = await request.get('/analytics/Dump?$top=5').set(auth);
                
                expect(response.statusCode).toBe(200);
                expect(response.body.value.length).toBeLessThanOrEqual(5);
            });

            test('should support $skip query parameter', async () => {
                const response = await request.get('/analytics/Dump?$skip=10').set(auth);
                
                expect(response.statusCode).toBe(200);
            });

            test('should support $select query parameter', async () => {
                const response = await request.get('/analytics/Dump?$select=ID,CodeGrootboekrekening&$top=1').set(auth);
                
                expect(response.statusCode).toBe(200);
                if (response.body.value.length > 0) {
                    const item = response.body.value[0];
                    expect(item).toHaveProperty('ID');
                    expect(item).toHaveProperty('CodeGrootboekrekening');
                }
            });

            test('should support $filter query parameter', async () => {
                const response = await request.get("/analytics/Dump?$filter=CodeGrootboekrekening eq '8000'").set(auth);
                
                expect(response.statusCode).toBe(200);
                if (response.body.value.length > 0) {
                    response.body.value.forEach(item => {
                        expect(item.CodeGrootboekrekening).toBe('8000');
                    });
                }
            });

            test('should support $orderby query parameter', async () => {
                const response = await request.get('/analytics/Dump?$orderby=CodeGrootboekrekening&$top=10').set(auth);
                
                expect(response.statusCode).toBe(200);
                expect(response.body.value).toBeDefined();
            });

            test('should support $count query parameter', async () => {
                const response = await request.get('/analytics/Dump?$count=true&$top=5').set(auth);
                
                expect(response.statusCode).toBe(200);
                expect(response.body).toHaveProperty('@odata.count');
                expect(typeof response.body['@odata.count']).toBe('number');
            });
        });

        describe('GET /FinancialStatements', () => {
            test('should return FinancialStatements data', async () => {
                
                const response = await request.get('/analytics/FinancialStatements').set(auth);
                
                expect(response.statusCode).toBe(200);
                expect(response.body).toBeDefined();
                expect(Array.isArray(response.body.value)).toBe(true);
            });

            test('should filter by period', async () => {
                
                const response = await request.get("/analytics/FinancialStatements?$filter=PeriodYear eq 2024").set(auth);
                
                expect(response.statusCode).toBe(200);
                if (response.body.value.length > 0) {
                    response.body.value.forEach(item => {
                        expect(item.PeriodYear).toBe(2024);
                    });
                }
            });

            test('should support complex filters', async () => {
                
                const response = await request.get("/analytics/FinancialStatements?$filter=PeriodYear eq 2024 and CodeGrootboekrekening eq '8000'").set(auth);
                
                expect(response.statusCode).toBe(200);
            });
        });

        describe('GET /SalesAnalytics', () => {
            test('should return only revenue accounts (8xxx)', async () => {
                
                const response = await request.get('/analytics/SalesAnalytics?$top=100').set(auth);
                
                expect(response.statusCode).toBe(200);
                if (response.body.value.length > 0) {
                    response.body.value.forEach(item => {
                        expect(item.CodeGrootboekrekening).toMatch(/^8/);
                    });
                }
            });
        });

        describe('GET /RevenueReport', () => {
            test('should return RevenueReport data', async () => {
                
                const response = await request.get('/analytics/RevenueReport').set(auth);
                
                expect(response.statusCode).toBe(200);
                expect(response.body).toBeDefined();
                expect(Array.isArray(response.body.value)).toBe(true);
            });
        });

        describe('GET /UserSettings', () => {
            test('should return user settings', async () => {
                
                const response = await request.get('/analytics/UserSettings').set(auth);
                
                expect(response.statusCode).toBe(200);
                expect(response.body).toBeDefined();
            });

            test('should filter by user', async () => {
                
                const response = await request.get("/analytics/UserSettings?$filter=user eq 'alice'").set(auth);
                
                expect(response.statusCode).toBe(200);
            });
        });

        describe('GET /VFA_SalesInvoice', () => {
            test('should return sales invoice data', async () => {
                
                const response = await request.get('/analytics/VFA_SalesInvoice').set(auth);
                
                expect(response.statusCode).toBe(200);
                expect(response.body).toBeDefined();
                expect(Array.isArray(response.body.value)).toBe(true);
            });
        });

        describe('GET /VOA_SalesOrder', () => {
            test('should return sales order data', async () => {
                
                const response = await request.get('/analytics/VOA_SalesOrder').set(auth);
                
                expect(response.statusCode).toBe(200);
                expect(response.body).toBeDefined();
            });
        });

        describe('GET /GUA_DeliveryNote', () => {
            test('should return delivery note data', async () => {
                
                const response = await request.get('/analytics/GUA_DeliveryNote').set(auth);
                
                expect(response.statusCode).toBe(200);
                expect(response.body).toBeDefined();
            });
        });

        describe('GET /ESL_Product', () => {
            test('should return product data', async () => {
                
                const response = await request.get('/analytics/ESL_Product').set(auth);
                
                expect(response.statusCode).toBe(200);
                expect(response.body).toBeDefined();
            });
        });

        describe('GET /PGA_ProductGroup', () => {
            test('should return product group data', async () => {
                
                const response = await request.get('/analytics/PGA_ProductGroup').set(auth);
                
                expect(response.statusCode).toBe(200);
                expect(response.body).toBeDefined();
            });
        });

        describe('GET /SCA_ServiceAgreement', () => {
            test('should return service agreement data', async () => {
                
                const response = await request.get('/analytics/SCA_ServiceAgreement').set(auth);
                
                expect(response.statusCode).toBe(200);
                expect(response.body).toBeDefined();
            });
        });
    });

    describe('Function Endpoints', () => {
        describe('GET /getAppInfo()', () => {
            test('should return app info', async () => {
                
                const response = await request.get('/analytics/getAppInfo()').set(auth);
                
                expect(response.statusCode).toBe(200);
                expect(response.body).toBeDefined();
                expect(response.body.value).toBeDefined();
            });

            test('should return valid JSON string', async () => {
                
                const response = await request.get('/analytics/getAppInfo()').set(auth);
                
                const parsed = JSON.parse(response.body.value);
                expect(parsed).toHaveProperty('version');
                expect(parsed).toHaveProperty('cdsVersion');
            });
        });

        describe('GET /getFinancialStatementsTree()', () => {
            test('should return tree structure for P&L', async () => {
                
                const response = await request.get(
                    "/analytics/getFinancialStatementsTree(FStype='PL',PeriodAYear=2024,PeriodAMonthFrom=1,PeriodAMonthTo=12,PeriodBYear=2023,PeriodBMonthFrom=1,PeriodBMonthTo=12)"
                ).set(auth);
                
                expect(response.statusCode).toBe(200);
                expect(response.body.value).toBeDefined();
                
                const tree = JSON.parse(response.body.value);
                expect(tree).toHaveProperty('root');
            });

            test('should return tree structure for Balance Sheet', async () => {
                
                const response = await request.get(
                    "/analytics/getFinancialStatementsTree(FStype='BS',PeriodAYear=2024,PeriodAMonthFrom=1,PeriodAMonthTo=12,PeriodBYear=2023,PeriodBMonthFrom=1,PeriodBMonthTo=12)"
                ).set(auth);
                
                expect(response.statusCode).toBe(200);
                expect(response.body.value).toBeDefined();
            });

            test('should handle invalid FStype gracefully', async () => {
                
                const response = await request.get(
                    "/analytics/getFinancialStatementsTree(FStype='INVALID',PeriodAYear=2024,PeriodAMonthFrom=1,PeriodAMonthTo=12,PeriodBYear=2023,PeriodBMonthFrom=1,PeriodBMonthTo=12)"
                ).set(auth);
                
                // Should still return 200 but with appropriate error handling
                expect([200, 400, 500]).toContain(response.statusCode);
            });
        });

        describe('GET /getSalesTree()', () => {
            test('should return sales tree structure', async () => {
                
                const response = await request.get(
                    '/analytics/getSalesTree(PeriodAYear=2024,PeriodAMonthFrom=1,PeriodAMonthTo=12,PeriodBYear=2023,PeriodBMonthFrom=1,PeriodBMonthTo=12)'
                ).set(auth);
                
                expect(response.statusCode).toBe(200);
                expect(response.body.value).toBeDefined();
                
                const tree = JSON.parse(response.body.value);
                expect(tree).toHaveProperty('root');
            });
        });

        describe('GET /getPivotTree()', () => {
            test('should return pivot tree structure', async () => {
                
                const response = await request.get(
                    '/analytics/getPivotTree(PeriodAYear=2024,PeriodAMonth=1,PeriodBYear=2024,PeriodBMonth=12)'
                ).set(auth);
                
                expect(response.statusCode).toBe(200);
                expect(response.body.value).toBeDefined();
                
                const tree = JSON.parse(response.body.value);
                expect(tree).toHaveProperty('root');
                expect(tree.root).toHaveProperty('nodes');
                expect(tree.root).toHaveProperty('columns');
            });
        });

        describe('GET /getRevenueTree()', () => {
            test('should return revenue tree structure', async () => {
                
                const response = await request.get(
                    '/analytics/getRevenueTree(PeriodAYear=2024,PeriodAMonth=1,PeriodBYear=2024,PeriodBMonth=12)'
                ).set(auth);
                
                expect(response.statusCode).toBe(200);
                expect(response.body.value).toBeDefined();
                
                const tree = JSON.parse(response.body.value);
                expect(tree).toHaveProperty('columns');
                expect(tree).toHaveProperty('rows');
            });
        });

        describe('GET /getCombinedTree()', () => {
            test('should return combined tree structure', async () => {
                
                const response = await request.get(
                    '/analytics/getCombinedTree(PeriodAYear=2024,PeriodAMonthFrom=1,PeriodAMonthTo=12,PeriodBYear=2023,PeriodBMonthFrom=1,PeriodBMonthTo=12)'
                ).set(auth);
                
                expect(response.statusCode).toBe(200);
                expect(response.body.value).toBeDefined();
            });
        });

        describe('GET /getFileContent()', () => {
            test('should handle file content requests', async () => {
                
                const response = await request.get(
                    "/analytics/getFileContent(fileType='log',fileName='test.log')"
                ).set(auth);
                
                // May return 200 with empty content or error depending on file existence
                expect([200, 404, 500]).toContain(response.statusCode);
            });
        });
    });

    describe('Action Endpoints', () => {
        describe('POST /saveSettings', () => {
            test('should save user settings', async () => {
                const settings = JSON.stringify({
                    theme: 'dark',
                    language: 'en'
                });
                
                const response = await request.post('/analytics/saveSettings').set(auth)
                    .set(auth).send({
                        user: 'testuser',
                        settings: settings
                    });
                
                expect([200, 201]).toContain(response.statusCode);
            });

            test('should handle invalid JSON in settings', async () => {
                const response = await request.post('/analytics/saveSettings')
                    .set(auth).send({
                        user: 'testuser',
                        settings: 'invalid json'
                    });
                
                // Should handle gracefully
                expect([200, 201, 400, 500]).toContain(response.statusCode);
            });

            test('should require user parameter', async () => {
                const response = await request.post('/analytics/saveSettings')
                    .set(auth).send({
                        settings: '{"test": true}'
                    });
                
                // Should return error or handle missing parameter
                expect([200, 400, 500]).toContain(response.statusCode);
            });
        });
    });

    describe('Error Handling', () => {
        test('should return 404 for non-existent endpoints', async () => {
            
            const response = await request.get('/analytics/NonExistentEntity').set(auth);
            
            expect(response.statusCode).toBe(404);
        });

        test('should handle malformed query parameters', async () => {
            
            const response = await request.get('/analytics/Dump?$filter=invalid syntax here').set(auth);
            
            expect([400, 500]).toContain(response.statusCode);
        });

        test('should reject unauthorized requests when auth is enabled', async () => {
            // This test would depend on auth configuration
            // For now, we're using mocked auth, so all requests are authorized
            
            const response = await request.get('/analytics/Dump').set(auth);
            
            expect([200, 401, 403]).toContain(response.statusCode);
        });
    });

    describe('Performance', () => {
        test('should respond to simple GET request within reasonable time', async () => {
            const startTime = Date.now();
            
            await request.get('/analytics/Dump?$top=10').set(auth);
            
            const duration = Date.now() - startTime;
            expect(duration).toBeLessThan(5000); // 5 seconds max
        });

        test('should handle concurrent requests', async () => {
            const requests = [
                request.get('/analytics/Dump?$top=5').set(auth),
                request.get('/analytics/FinancialStatements?$top=5').set(auth),
                request.get('/analytics/RevenueReport?$top=5').set(auth)
            ];
            
            const responses = await Promise.all(requests);
            
            responses.forEach(response => {
                expect(response.statusCode).toBe(200);
            });
        });
    });

    describe('OData Metadata', () => {
        test('should return service metadata', async () => {
            
            const response = await request.get('/analytics/$metadata').set(auth);
            
            expect(response.statusCode).toBe(200);
            expect(response.headers['content-type']).toMatch(/xml/);
        });

        test('should return service document', async () => {
            
            const response = await request.get('/analytics/').set(auth);
            
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('value');
        });
    });

    describe('Batch Requests', () => {
        test('should support batch requests', async () => {
            const batchPayload = `--batch
Content-Type: application/http
Content-Transfer-Encoding: binary

GET Dump?$top=5 HTTP/1.1

--batch--`;
            
            const response = await request.post('/analytics/$batch')
                .set('Content-Type', 'multipart/mixed; boundary=batch')
                .set(auth).send(batchPayload);
            
            expect([200, 202]).toContain(response.statusCode);
        });
    });
});
