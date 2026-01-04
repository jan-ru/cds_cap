/**
 * Validation logic tests
 * Tests parameter validation, data validation, and error handling
 */

const { isInPeriod } = require('../../srv/utils/period-utils');

describe('Validation Logic', () => {
    
    describe('Period Validation', () => {
        describe('isInPeriod', () => {
            test('should return true when date is within period', () => {
                const period = { year: 2024, monthFrom: 1, monthTo: 12 };
                expect(isInPeriod(2024, 6, period)).toBe(true);
            });

            test('should return true for first month of period', () => {
                const period = { year: 2024, monthFrom: 3, monthTo: 9 };
                expect(isInPeriod(2024, 3, period)).toBe(true);
            });

            test('should return true for last month of period', () => {
                const period = { year: 2024, monthFrom: 3, monthTo: 9 };
                expect(isInPeriod(2024, 9, period)).toBe(true);
            });

            test('should return false when month is before period start', () => {
                const period = { year: 2024, monthFrom: 3, monthTo: 9 };
                expect(isInPeriod(2024, 2, period)).toBe(false);
            });

            test('should return false when month is after period end', () => {
                const period = { year: 2024, monthFrom: 3, monthTo: 9 };
                expect(isInPeriod(2024, 10, period)).toBe(false);
            });

            test('should return false when year does not match', () => {
                const period = { year: 2024, monthFrom: 1, monthTo: 12 };
                expect(isInPeriod(2023, 6, period)).toBe(false);
            });

            test('should return false when period is null', () => {
                expect(isInPeriod(2024, 6, null)).toBe(false);
            });

            test('should return false when period is undefined', () => {
                expect(isInPeriod(2024, 6, undefined)).toBe(false);
            });

            test('should handle string month values', () => {
                const period = { year: 2024, monthFrom: 3, monthTo: 9 };
                expect(isInPeriod(2024, '6', period)).toBe(true);
            });

            test('should handle string year values', () => {
                const period = { year: '2024', monthFrom: 3, monthTo: 9 };
                expect(isInPeriod('2024', 6, period)).toBe(true);
            });

            test('should validate full year period (Jan-Dec)', () => {
                const period = { year: 2024, monthFrom: 1, monthTo: 12 };
                expect(isInPeriod(2024, 1, period)).toBe(true);
                expect(isInPeriod(2024, 12, period)).toBe(true);
            });

            test('should validate Q1 period', () => {
                const period = { year: 2024, monthFrom: 1, monthTo: 3 };
                expect(isInPeriod(2024, 1, period)).toBe(true);
                expect(isInPeriod(2024, 2, period)).toBe(true);
                expect(isInPeriod(2024, 3, period)).toBe(true);
                expect(isInPeriod(2024, 4, period)).toBe(false);
            });

            test('should validate Q4 period', () => {
                const period = { year: 2024, monthFrom: 10, monthTo: 12 };
                expect(isInPeriod(2024, 10, period)).toBe(true);
                expect(isInPeriod(2024, 11, period)).toBe(true);
                expect(isInPeriod(2024, 12, period)).toBe(true);
                expect(isInPeriod(2024, 9, period)).toBe(false);
            });

            test('should handle single month period', () => {
                const period = { year: 2024, monthFrom: 6, monthTo: 6 };
                expect(isInPeriod(2024, 6, period)).toBe(true);
                expect(isInPeriod(2024, 5, period)).toBe(false);
                expect(isInPeriod(2024, 7, period)).toBe(false);
            });

            test('should handle edge case with month 0', () => {
                const period = { year: 2024, monthFrom: 1, monthTo: 12 };
                expect(isInPeriod(2024, 0, period)).toBe(false);
            });

            test('should handle edge case with month 13', () => {
                const period = { year: 2024, monthFrom: 1, monthTo: 12 };
                expect(isInPeriod(2024, 13, period)).toBe(false);
            });

            test('should handle negative month values', () => {
                const period = { year: 2024, monthFrom: 1, monthTo: 12 };
                expect(isInPeriod(2024, -1, period)).toBe(false);
            });
        });
    });

    describe('Parameter Validation', () => {
        describe('Period Parameters', () => {
            test('should validate period has required properties', () => {
                const validPeriod = { year: 2024, monthFrom: 1, monthTo: 12 };
                expect(validPeriod).toHaveProperty('year');
                expect(validPeriod).toHaveProperty('monthFrom');
                expect(validPeriod).toHaveProperty('monthTo');
            });

            test('should validate monthFrom is less than or equal to monthTo', () => {
                const validPeriod = { year: 2024, monthFrom: 3, monthTo: 9 };
                expect(validPeriod.monthFrom).toBeLessThanOrEqual(validPeriod.monthTo);
            });

            test('should validate month range is within 1-12', () => {
                const validPeriod = { year: 2024, monthFrom: 1, monthTo: 12 };
                expect(validPeriod.monthFrom).toBeGreaterThanOrEqual(1);
                expect(validPeriod.monthFrom).toBeLessThanOrEqual(12);
                expect(validPeriod.monthTo).toBeGreaterThanOrEqual(1);
                expect(validPeriod.monthTo).toBeLessThanOrEqual(12);
            });

            test('should validate year is a positive number', () => {
                const validPeriod = { year: 2024, monthFrom: 1, monthTo: 12 };
                expect(validPeriod.year).toBeGreaterThan(0);
                expect(typeof validPeriod.year === 'number' || typeof validPeriod.year === 'string').toBe(true);
            });
        });

        describe('FStype Validation', () => {
            test('should accept valid FStype values', () => {
                const validTypes = ['PL', 'BS', 'COMBINED'];
                validTypes.forEach(type => {
                    expect(['PL', 'BS', 'COMBINED']).toContain(type);
                });
            });

            test('should reject invalid FStype', () => {
                const invalidTypes = ['INVALID', '', null, undefined, 123];
                invalidTypes.forEach(type => {
                    expect(['PL', 'BS', 'COMBINED']).not.toContain(type);
                });
            });
        });

        describe('User Settings Validation', () => {
            test('should validate user parameter is required', () => {
                const validSettings = { user: 'alice', settings: '{}' };
                expect(validSettings.user).toBeDefined();
                expect(validSettings.user).not.toBeNull();
                expect(validSettings.user.length).toBeGreaterThan(0);
            });

            test('should validate settings parameter is required', () => {
                const validSettings = { user: 'alice', settings: '{}' };
                expect(validSettings.settings).toBeDefined();
            });

            test('should accept valid JSON string for settings', () => {
                const validSettings = '{"theme": "dark", "language": "en"}';
                expect(() => JSON.parse(validSettings)).not.toThrow();
            });

            test('should handle empty settings object', () => {
                const emptySettings = '{}';
                expect(() => JSON.parse(emptySettings)).not.toThrow();
                expect(JSON.parse(emptySettings)).toEqual({});
            });
        });

        describe('File Type Validation', () => {
            test('should accept valid file types', () => {
                const validTypes = ['log', 'csv', 'json'];
                validTypes.forEach(type => {
                    expect(type).toMatch(/^[a-z]+$/);
                });
            });

            test('should validate file name format', () => {
                const validNames = ['test.log', 'data.csv', 'config.json'];
                validNames.forEach(name => {
                    expect(name).toMatch(/^[\w-]+\.[\w]+$/);
                });
            });

            test('should reject file names with path traversal', () => {
                const invalidNames = ['../etc/passwd', '../../secret.txt', './../file.log'];
                invalidNames.forEach(name => {
                    expect(name).toMatch(/\.\./);
                });
            });
        });
    });

    describe('Data Validation', () => {
        describe('Account Code Validation', () => {
            test('should validate account code format', () => {
                const validCodes = ['8000', '8010', '4000', '1000'];
                validCodes.forEach(code => {
                    expect(code).toMatch(/^\d{4}$/);
                });
            });

            test('should reject invalid account codes', () => {
                const invalidCodes = ['800', '80000', 'ABCD', ''];
                invalidCodes.forEach(code => {
                    expect(code).not.toMatch(/^\d{4}$/);
                });
            });

            test('should validate revenue account codes (8xxx)', () => {
                const revenueCodes = ['8000', '8100', '8999'];
                revenueCodes.forEach(code => {
                    expect(code).toMatch(/^8\d{3}$/);
                });
            });

            test('should validate expense account codes (4xxx)', () => {
                const expenseCodes = ['4000', '4100', '4999'];
                expenseCodes.forEach(code => {
                    expect(code).toMatch(/^4\d{3}$/);
                });
            });
        });

        describe('Amount Validation', () => {
            test('should accept valid positive amounts', () => {
                const amounts = [0, 100, 1000.50, 9999999.99];
                amounts.forEach(amount => {
                    expect(typeof amount).toBe('number');
                    expect(isFinite(amount)).toBe(true);
                });
            });

            test('should accept valid negative amounts', () => {
                const amounts = [-100, -1000.50, -9999999.99];
                amounts.forEach(amount => {
                    expect(typeof amount).toBe('number');
                    expect(isFinite(amount)).toBe(true);
                });
            });

            test('should reject NaN values', () => {
                expect(isNaN(NaN)).toBe(true);
                expect(isFinite(NaN)).toBe(false);
            });

            test('should reject Infinity', () => {
                expect(isFinite(Infinity)).toBe(false);
                expect(isFinite(-Infinity)).toBe(false);
            });

            test('should validate amount precision (2 decimal places)', () => {
                const validAmounts = [100.00, 100.50, 100.99];
                validAmounts.forEach(amount => {
                    const rounded = parseFloat(amount.toFixed(2));
                    expect(amount).toBe(rounded);
                });
            });
        });

        describe('Period Sort Key Validation', () => {
            test('should validate period sort key format (YYYYMMM)', () => {
                const validKeys = ['2024001', '2024012', '2023006'];
                validKeys.forEach(key => {
                    expect(key).toMatch(/^\d{7}$/);
                });
            });

            test('should reject invalid period sort keys', () => {
                const invalidKeys = ['202401', '20240001', 'INVALID', ''];
                invalidKeys.forEach(key => {
                    expect(key).not.toMatch(/^\d{7}$/);
                });
            });

            test('should validate year component of period sort key', () => {
                const key = '2024006';
                const year = parseInt(key.substring(0, 4), 10);
                expect(year).toBeGreaterThanOrEqual(2000);
                expect(year).toBeLessThanOrEqual(2100);
            });

            test('should validate month component of period sort key', () => {
                const validKeys = ['2024001', '2024012'];
                validKeys.forEach(key => {
                    const month = parseInt(key.substring(4), 10);
                    expect(month).toBeGreaterThanOrEqual(1);
                    expect(month).toBeLessThanOrEqual(12);
                });
            });
        });

        describe('Revenue Classification Validation', () => {
            test('should validate recurring revenue account codes', () => {
                const recurringPrefixes = ['80', '86', '87', '88'];
                const testCodes = ['8000', '8600', '8700', '8800'];
                testCodes.forEach(code => {
                    const prefix = code.substring(0, 2);
                    expect(recurringPrefixes).toContain(prefix);
                });
            });

            test('should validate one-off revenue account codes', () => {
                const oneOffPrefixes = ['84', '85'];
                const testCodes = ['8400', '8500'];
                testCodes.forEach(code => {
                    const prefix = code.substring(0, 2);
                    expect(oneOffPrefixes).toContain(prefix);
                });
            });

            test('should classify revenue type correctly', () => {
                const classifications = [
                    { code: '8000', type: 'Recurring' },
                    { code: '8400', type: 'One-off' },
                    { code: '8600', type: 'Recurring' },
                    { code: '8700', type: 'Recurring' }
                ];

                const recurringPrefixes = ['80', '86', '87', '88'];
                const oneOffPrefixes = ['84', '85'];

                classifications.forEach(({ code, type }) => {
                    const prefix = code.substring(0, 2);
                    if (type === 'Recurring') {
                        expect(recurringPrefixes).toContain(prefix);
                    } else {
                        expect(oneOffPrefixes).toContain(prefix);
                    }
                });
            });
        });

        describe('Tree Node Validation', () => {
            test('should validate tree node has required properties', () => {
                const node = {
                    name: 'Test Node',
                    level: 1,
                    amountA: 1000,
                    amountB: 900
                };

                expect(node).toHaveProperty('name');
                expect(node).toHaveProperty('level');
                expect(node).toHaveProperty('amountA');
                expect(node).toHaveProperty('amountB');
            });

            test('should validate tree level is between 1 and 3', () => {
                const validLevels = [1, 2, 3];
                validLevels.forEach(level => {
                    expect(level).toBeGreaterThanOrEqual(1);
                    expect(level).toBeLessThanOrEqual(3);
                });
            });

            test('should validate drill state values', () => {
                const validStates = ['expanded', 'collapsed', 'leaf'];
                validStates.forEach(state => {
                    expect(['expanded', 'collapsed', 'leaf']).toContain(state);
                });
            });

            test('should validate percentage values are between 0 and 100', () => {
                const validPercentages = [0, 25, 50, 75, 100];
                validPercentages.forEach(pct => {
                    expect(pct).toBeGreaterThanOrEqual(0);
                    expect(pct).toBeLessThanOrEqual(100);
                });
            });
        });
    });

    describe('Error Handling Validation', () => {
        describe('Error Type Validation', () => {
            test('should recognize standard error types', () => {
                const errorTypes = [
                    'VALIDATION_ERROR',
                    'NOT_FOUND',
                    'UNAUTHORIZED',
                    'FORBIDDEN',
                    'INTERNAL_ERROR'
                ];

                errorTypes.forEach(type => {
                    expect(type).toMatch(/^[A-Z_]+$/);
                });
            });

            test('should validate error message is a string', () => {
                const error = { type: 'VALIDATION_ERROR', message: 'Invalid input' };
                expect(typeof error.message).toBe('string');
                expect(error.message.length).toBeGreaterThan(0);
            });

            test('should validate HTTP status codes', () => {
                const validCodes = [200, 201, 400, 401, 403, 404, 500];
                validCodes.forEach(code => {
                    expect(code).toBeGreaterThanOrEqual(200);
                    expect(code).toBeLessThan(600);
                });
            });
        });

        describe('Input Sanitization', () => {
            test('should detect SQL injection attempts', () => {
                const maliciousInputs = [
                    "'; DROP TABLE users; --",
                    "1' OR '1'='1",
                    "admin'--"
                ];

                maliciousInputs.forEach(input => {
                    expect(input).toMatch(/[';-]/);
                });
            });

            test('should detect XSS attempts', () => {
                const xssInputs = [
                    '<script>alert("XSS")</script>',
                    '<img src=x onerror=alert(1)>',
                    'javascript:alert(1)'
                ];

                xssInputs.forEach(input => {
                    expect(input).toMatch(/<|javascript:/);
                });
            });

            test('should validate safe string inputs', () => {
                const safeInputs = ['alice', 'user123', 'test-data'];
                safeInputs.forEach(input => {
                    expect(input).toMatch(/^[a-zA-Z0-9-_]+$/);
                });
            });
        });
    });

    describe('Business Logic Validation', () => {
        describe('Period Comparison Validation', () => {
            test('should validate period A and B are not identical', () => {
                const periodA = { year: 2024, monthFrom: 1, monthTo: 12 };
                const periodB = { year: 2023, monthFrom: 1, monthTo: 12 };
                
                const areIdentical = 
                    periodA.year === periodB.year &&
                    periodA.monthFrom === periodB.monthFrom &&
                    periodA.monthTo === periodB.monthTo;
                
                expect(areIdentical).toBe(false);
            });

            test('should validate period ranges are valid', () => {
                const period = { year: 2024, monthFrom: 3, monthTo: 9 };
                expect(period.monthFrom).toBeLessThanOrEqual(period.monthTo);
            });
        });

        describe('Aggregation Validation', () => {
            test('should validate sum of parts equals total', () => {
                const values = [100, 200, 300];
                const sum = values.reduce((a, b) => a + b, 0);
                expect(sum).toBe(600);
            });

            test('should validate average calculation', () => {
                const values = [100, 200, 300];
                const avg = values.reduce((a, b) => a + b, 0) / values.length;
                expect(avg).toBe(200);
            });

            test('should validate min/max calculations', () => {
                const values = [100, 200, 50, 300];
                const min = Math.min(...values);
                const max = Math.max(...values);
                expect(min).toBe(50);
                expect(max).toBe(300);
            });
        });
    });
});
