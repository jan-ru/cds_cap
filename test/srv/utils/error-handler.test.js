/**
 * Unit tests for Error Handler utility
 */

const {
    AppError,
    ErrorCodes,
    HttpStatus,
    ErrorFactory,
    createErrorResponse,
    wrapHandler
} = require('../../../srv/utils/error-handler');

describe('Error Handler', () => {

    describe('AppError', () => {
        test('should create an AppError with all properties', () => {
            const error = new AppError(
                'Test error',
                ErrorCodes.VALIDATION_ERROR,
                HttpStatus.BAD_REQUEST,
                { field: 'email' }
            );

            expect(error.message).toBe('Test error');
            expect(error.code).toBe(ErrorCodes.VALIDATION_ERROR);
            expect(error.statusCode).toBe(HttpStatus.BAD_REQUEST);
            expect(error.details).toEqual({ field: 'email' });
            expect(error.timestamp).toBeDefined();
            expect(error.name).toBe('AppError');
        });

        test('should capture stack trace', () => {
            const error = new AppError('Test', ErrorCodes.INTERNAL_ERROR, 500);
            expect(error.stack).toBeDefined();
        });
    });

    describe('ErrorFactory', () => {
        test('validationError should create validation error', () => {
            const error = ErrorFactory.validationError('Invalid input', { field: 'age' });

            expect(error).toBeInstanceOf(AppError);
            expect(error.code).toBe(ErrorCodes.VALIDATION_ERROR);
            expect(error.statusCode).toBe(HttpStatus.BAD_REQUEST);
            expect(error.message).toBe('Invalid input');
            expect(error.details).toEqual({ field: 'age' });
        });

        test('notFoundError should create not found error', () => {
            const error = ErrorFactory.notFoundError('User');

            expect(error).toBeInstanceOf(AppError);
            expect(error.code).toBe(ErrorCodes.NOT_FOUND);
            expect(error.statusCode).toBe(HttpStatus.NOT_FOUND);
            expect(error.message).toBe('User not found');
        });

        test('unauthorizedError should create unauthorized error', () => {
            const error = ErrorFactory.unauthorizedError();

            expect(error).toBeInstanceOf(AppError);
            expect(error.code).toBe(ErrorCodes.UNAUTHORIZED);
            expect(error.statusCode).toBe(HttpStatus.UNAUTHORIZED);
            expect(error.message).toBe('Unauthorized access');
        });

        test('unauthorizedError should accept custom message', () => {
            const error = ErrorFactory.unauthorizedError('Invalid token');

            expect(error.message).toBe('Invalid token');
        });

        test('forbiddenError should create forbidden error', () => {
            const error = ErrorFactory.forbiddenError('Insufficient permissions');

            expect(error).toBeInstanceOf(AppError);
            expect(error.code).toBe(ErrorCodes.FORBIDDEN);
            expect(error.statusCode).toBe(HttpStatus.FORBIDDEN);
            expect(error.message).toBe('Insufficient permissions');
        });

        test('databaseError should create database error', () => {
            const dbError = new Error('Connection timeout');
            const error = ErrorFactory.databaseError('Database query failed', dbError);

            expect(error).toBeInstanceOf(AppError);
            expect(error.code).toBe(ErrorCodes.DATABASE_ERROR);
            expect(error.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
            expect(error.message).toBe('Database query failed');
            expect(error.details.originalError).toBe('Connection timeout');
        });

        test('fileError should create file error', () => {
            const error = ErrorFactory.fileError('File not readable', '/tmp/data.csv');

            expect(error).toBeInstanceOf(AppError);
            expect(error.code).toBe(ErrorCodes.FILE_ERROR);
            expect(error.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
            expect(error.message).toBe('File not readable');
            expect(error.details.filePath).toBe('/tmp/data.csv');
        });
    });

    describe('createErrorResponse', () => {
        test('should create response for AppError', () => {
            const error = new AppError(
                'Validation failed',
                ErrorCodes.VALIDATION_ERROR,
                400,
                { field: 'email' }
            );

            const response = createErrorResponse(error);

            expect(response.error.message).toBe('Validation failed');
            expect(response.error.code).toBe(ErrorCodes.VALIDATION_ERROR);
            expect(response.error.details).toEqual({ field: 'email' });
            expect(response.error.timestamp).toBeDefined();
        });

        test('should create response for standard Error', () => {
            const error = new Error('Unexpected error');

            const response = createErrorResponse(error);

            expect(response.error.message).toBe('Unexpected error');
            expect(response.error.code).toBe(ErrorCodes.INTERNAL_ERROR);
            expect(response.error.timestamp).toBeDefined();
            expect(response.error.details).toBeUndefined();
        });

        test('should handle error without message', () => {
            const error = new Error();

            const response = createErrorResponse(error);

            expect(response.error.message).toBe('An unexpected error occurred');
        });
    });

    describe('wrapHandler', () => {
        test('should execute handler successfully', async () => {
            const handler = async (req) => {
                return { success: true, data: req.data };
            };

            const wrappedHandler = wrapHandler(handler);
            const mockReq = { data: { test: 'value' } };

            const result = await wrappedHandler(mockReq);

            expect(result).toEqual({ success: true, data: { test: 'value' } });
        });

        test('should catch and handle errors', async () => {
            const handler = async () => {
                throw ErrorFactory.validationError('Invalid input');
            };

            const wrappedHandler = wrapHandler(handler);
            const mockReq = {
                reject: jest.fn()
            };

            await wrappedHandler(mockReq);

            expect(mockReq.reject).toHaveBeenCalledWith(400, 'Invalid input');
        });

        test('should handle standard errors', async () => {
            const handler = async () => {
                throw new Error('Unexpected error');
            };

            const wrappedHandler = wrapHandler(handler);
            const mockReq = {
                reject: jest.fn()
            };

            await wrappedHandler(mockReq);

            expect(mockReq.reject).toHaveBeenCalledWith(500, 'Unexpected error');
        });
    });
});
