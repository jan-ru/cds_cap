/**
 * Centralized error handling utility
 * Provides standardized error responses and logging
 *
 * @module srv/utils/error-handler
 */

const { createLogger } = require('./logger');
const logger = createLogger('error-handler');

/**
 * Standard error codes used across the application
 */
const ErrorCodes = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    FILE_ERROR: 'FILE_ERROR'
};

/**
 * HTTP status codes mapping
 */
const HttpStatus = {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
};

/**
 * Application error class with additional context
 */
class AppError extends Error {
    /**
     * @param {string} message - Error message
     * @param {string} code - Error code from ErrorCodes
     * @param {number} statusCode - HTTP status code
     * @param {Object} [details] - Additional error details
     */
    constructor(message, code, statusCode, details = {}) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.timestamp = new Date().toISOString();
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Creates a standardized error response object
 *
 * @param {Error|AppError} error - The error object
 * @param {Object} [context] - Additional context (user, request, etc.)
 * @returns {Object} Standardized error response
 */
function createErrorResponse(error, context = {}) {
    const isAppError = error instanceof AppError;

    const response = {
        error: {
            message: error.message || 'An unexpected error occurred',
            code: isAppError ? error.code : ErrorCodes.INTERNAL_ERROR,
            timestamp: isAppError ? error.timestamp : new Date().toISOString()
        }
    };

    // Add details for AppError
    if (isAppError && Object.keys(error.details).length > 0) {
        response.error.details = error.details;
    }

    // Log the error with context
    logger.error('Error occurred', {
        message: error.message,
        code: response.error.code,
        stack: error.stack,
        ...context
    });

    return response;
}

/**
 * Handles CAP request errors and rejects with proper format
 *
 * @param {Object} req - CAP request object
 * @param {Error|AppError} error - The error to handle
 * @param {Object} [context] - Additional context
 */
function handleRequestError(req, error, context = {}) {
    const isAppError = error instanceof AppError;
    const statusCode = isAppError ? error.statusCode : HttpStatus.INTERNAL_SERVER_ERROR;
    const errorResponse = createErrorResponse(error, context);

    req.reject(statusCode, errorResponse.error.message);
}

module.exports = {
    AppError,
    ErrorCodes,
    HttpStatus,
    createErrorResponse,
    handleRequestError
};
