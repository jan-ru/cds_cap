/**
 * Unit tests for Logger utility
 * Tests all logging methods and correlation ID functionality
 */

const { createLogger } = require('../../../srv/utils/logger');

// Mock the CAP logger
jest.mock('@sap/cds', () => ({
    log: jest.fn((moduleName) => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }))
}));

const cds = require('@sap/cds');

describe('Logger', () => {
    let logger;
    let mockCdsLogger;

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();

        // Create a fresh logger instance
        logger = createLogger('test-module');

        // Get the mock CDS logger instance
        mockCdsLogger = cds.log.mock.results[cds.log.mock.results.length - 1].value;
    });

    describe('createLogger', () => {
        test('should create logger with module name', () => {
            const customLogger = createLogger('custom-module');

            expect(cds.log).toHaveBeenCalledWith('custom-module');
            expect(customLogger).toHaveProperty('debug');
            expect(customLogger).toHaveProperty('info');
            expect(customLogger).toHaveProperty('warn');
            expect(customLogger).toHaveProperty('error');
            expect(customLogger).toHaveProperty('withCorrelation');
        });

        test('should create multiple independent logger instances', () => {
            const logger1 = createLogger('module-1');
            const logger2 = createLogger('module-2');

            expect(cds.log).toHaveBeenCalledWith('module-1');
            expect(cds.log).toHaveBeenCalledWith('module-2');
            expect(logger1).not.toBe(logger2);
        });
    });

    describe('debug()', () => {
        test('should log debug message without data', () => {
            logger.debug('Debug message');

            expect(mockCdsLogger.debug).toHaveBeenCalledWith('Debug message');
            expect(mockCdsLogger.debug).toHaveBeenCalledTimes(1);
        });

        test('should log debug message with data', () => {
            const data = { userId: 123, action: 'test' };
            logger.debug('Debug with data', data);

            expect(mockCdsLogger.debug).toHaveBeenCalledWith('Debug with data', data);
            expect(mockCdsLogger.debug).toHaveBeenCalledTimes(1);
        });

        test('should log debug message with string data', () => {
            logger.debug('Debug message', 'additional info');

            expect(mockCdsLogger.debug).toHaveBeenCalledWith('Debug message', 'additional info');
        });

        test('should log debug message with number data', () => {
            logger.debug('Debug message', 42);

            expect(mockCdsLogger.debug).toHaveBeenCalledWith('Debug message', 42);
        });
    });

    describe('info()', () => {
        test('should log info message without data', () => {
            logger.info('Info message');

            expect(mockCdsLogger.info).toHaveBeenCalledWith('Info message');
            expect(mockCdsLogger.info).toHaveBeenCalledTimes(1);
        });

        test('should log info message with data', () => {
            const data = { status: 'success', count: 5 };
            logger.info('Info with data', data);

            expect(mockCdsLogger.info).toHaveBeenCalledWith('Info with data', data);
            expect(mockCdsLogger.info).toHaveBeenCalledTimes(1);
        });

        test('should log info message with array data', () => {
            const data = [1, 2, 3];
            logger.info('Info message', data);

            expect(mockCdsLogger.info).toHaveBeenCalledWith('Info message', data);
        });
    });

    describe('warn()', () => {
        test('should log warning message without data', () => {
            logger.warn('Warning message');

            expect(mockCdsLogger.warn).toHaveBeenCalledWith('Warning message');
            expect(mockCdsLogger.warn).toHaveBeenCalledTimes(1);
        });

        test('should log warning message with data', () => {
            const data = { reason: 'deprecated', alternative: 'newMethod' };
            logger.warn('Warning with data', data);

            expect(mockCdsLogger.warn).toHaveBeenCalledWith('Warning with data', data);
            expect(mockCdsLogger.warn).toHaveBeenCalledTimes(1);
        });

        test('should log warning message with string data', () => {
            logger.warn('Warning message', 'additional context');

            expect(mockCdsLogger.warn).toHaveBeenCalledWith('Warning message', 'additional context');
        });

        test('should log warning message with boolean data', () => {
            logger.warn('Warning message', true);

            expect(mockCdsLogger.warn).toHaveBeenCalledWith('Warning message', true);
        });
    });

    describe('error()', () => {
        test('should log error message without data', () => {
            logger.error('Error message');

            expect(mockCdsLogger.error).toHaveBeenCalledWith('Error message');
            expect(mockCdsLogger.error).toHaveBeenCalledTimes(1);
        });

        test('should log error message with Error object', () => {
            const error = new Error('Something went wrong');
            logger.error('Error occurred', error);

            expect(mockCdsLogger.error).toHaveBeenCalledWith('Error occurred', error);
            expect(mockCdsLogger.error).toHaveBeenCalledTimes(1);
        });

        test('should log error message with non-Error data', () => {
            const data = { code: 'ERR_001', details: 'Failed validation' };
            logger.error('Error with data', data);

            expect(mockCdsLogger.error).toHaveBeenCalledWith('Error with data', data);
            expect(mockCdsLogger.error).toHaveBeenCalledTimes(1);
        });

        test('should log error message with string data', () => {
            logger.error('Error message', 'error details');

            expect(mockCdsLogger.error).toHaveBeenCalledWith('Error message', 'error details');
        });

        test('should handle Error with custom properties', () => {
            const error = new Error('Custom error');
            error.code = 'CUSTOM_ERR';
            error.statusCode = 500;

            logger.error('Custom error occurred', error);

            expect(mockCdsLogger.error).toHaveBeenCalledWith('Custom error occurred', error);
        });
    });

    describe('withCorrelation()', () => {
        test('should log with correlation ID at debug level', () => {
            logger.withCorrelation('corr-123', 'debug', 'Debug message');

            expect(mockCdsLogger.debug).toHaveBeenCalledWith('Debug message', {
                correlationId: 'corr-123'
            });
        });

        test('should log with correlation ID at info level', () => {
            logger.withCorrelation('corr-456', 'info', 'Info message');

            expect(mockCdsLogger.info).toHaveBeenCalledWith('Info message', {
                correlationId: 'corr-456'
            });
        });

        test('should log with correlation ID at warn level', () => {
            logger.withCorrelation('corr-789', 'warn', 'Warning message');

            expect(mockCdsLogger.warn).toHaveBeenCalledWith('Warning message', {
                correlationId: 'corr-789'
            });
        });

        test('should log with correlation ID at error level', () => {
            logger.withCorrelation('corr-999', 'error', 'Error message');

            expect(mockCdsLogger.error).toHaveBeenCalledWith('Error message', {
                correlationId: 'corr-999'
            });
        });

        test('should merge correlation ID with additional object data', () => {
            const data = { userId: 123, action: 'submit' };
            logger.withCorrelation('corr-abc', 'info', 'Action logged', data);

            expect(mockCdsLogger.info).toHaveBeenCalledWith('Action logged', {
                correlationId: 'corr-abc',
                userId: 123,
                action: 'submit'
            });
        });

        test('should handle correlation ID with primitive data', () => {
            logger.withCorrelation('corr-def', 'warn', 'Warning with number', 42);

            expect(mockCdsLogger.warn).toHaveBeenCalledWith('Warning with number', {
                correlationId: 'corr-def',
                data: 42
            });
        });

        test('should handle correlation ID with string data', () => {
            logger.withCorrelation('corr-ghi', 'error', 'Error with string', 'error details');

            expect(mockCdsLogger.error).toHaveBeenCalledWith('Error with string', {
                correlationId: 'corr-ghi',
                data: 'error details'
            });
        });

        test('should handle correlation ID without additional data', () => {
            logger.withCorrelation('corr-jkl', 'debug', 'Debug only');

            expect(mockCdsLogger.debug).toHaveBeenCalledWith('Debug only', {
                correlationId: 'corr-jkl'
            });
        });

        test('should handle correlation ID with null data', () => {
            logger.withCorrelation('corr-mno', 'info', 'Info with null', null);

            expect(mockCdsLogger.info).toHaveBeenCalledWith('Info with null', {
                correlationId: 'corr-mno',
                data: null
            });
        });

        test('should handle correlation ID with undefined data', () => {
            logger.withCorrelation('corr-pqr', 'info', 'Info with undefined', undefined);

            expect(mockCdsLogger.info).toHaveBeenCalledWith('Info with undefined', {
                correlationId: 'corr-pqr'
            });
        });
    });

    describe('Integration scenarios', () => {
        test('should handle rapid consecutive calls', () => {
            logger.debug('Message 1');
            logger.info('Message 2');
            logger.warn('Message 3');
            logger.error('Message 4');

            expect(mockCdsLogger.debug).toHaveBeenCalledTimes(1);
            expect(mockCdsLogger.info).toHaveBeenCalledTimes(1);
            expect(mockCdsLogger.warn).toHaveBeenCalledTimes(1);
            expect(mockCdsLogger.error).toHaveBeenCalledTimes(1);
        });

        test('should handle mixed data types across calls', () => {
            logger.info('String data', 'text');
            logger.info('Number data', 123);
            logger.info('Object data', { key: 'value' });
            logger.info('Array data', [1, 2, 3]);
            logger.info('Boolean data', false);

            expect(mockCdsLogger.info).toHaveBeenCalledTimes(5);
        });

        test('should handle empty strings', () => {
            logger.warn('');
            logger.error('', new Error());

            expect(mockCdsLogger.warn).toHaveBeenCalledWith('');
            expect(mockCdsLogger.error).toHaveBeenCalled();
        });
    });
});
