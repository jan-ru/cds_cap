/**
 * Centralized logging utility using CAP's logging framework
 * Replaces console.log/console.error with structured, level-based logging
 *
 * @module srv/utils/logger
 */

const cds = require('@sap/cds');

/**
 * Creates a logger instance for a specific module/service
 *
 * @param {string} moduleName - Name of the module (e.g., 'analytics-service', 'tree-builder')
 * @returns {Object} Logger instance with log methods
 *
 * @example
 * const logger = createLogger('analytics-service');
 * logger.info('Processing request', { user: req.user.id });
 * logger.error('Failed to build tree', error);
 */
function createLogger(moduleName) {
    const logger = cds.log(moduleName);

    return {
        /**
         * Log debug information (verbose, development only)
         * @param {string} message - Log message
         * @param {*} [data] - Additional data to log
         */
        debug(message, data) {
            if (data !== undefined) {
                logger.debug(message, data);
            } else {
                logger.debug(message);
            }
        },

        /**
         * Log informational messages (normal operations)
         * @param {string} message - Log message
         * @param {*} [data] - Additional data to log
         */
        info(message, data) {
            if (data !== undefined) {
                logger.info(message, data);
            } else {
                logger.info(message);
            }
        },

        /**
         * Log warnings (potential issues, non-critical)
         * @param {string} message - Log message
         * @param {*} [data] - Additional data to log
         */
        warn(message, data) {
            if (data !== undefined) {
                logger.warn(message, data);
            } else {
                logger.warn(message);
            }
        },

        /**
         * Log errors (critical issues, failures)
         * @param {string} message - Log message
         * @param {Error|*} [error] - Error object or additional data
         */
        error(message, error) {
            if (error instanceof Error) {
                logger.error(message, error);
            } else if (error !== undefined) {
                logger.error(message, error);
            } else {
                logger.error(message);
            }
        },

        /**
         * Log with custom correlation ID for request tracing
         * @param {string} correlationId - Unique ID for request tracking
         * @param {string} level - Log level (debug, info, warn, error)
         * @param {string} message - Log message
         * @param {*} [data] - Additional data
         */
        withCorrelation(correlationId, level, message, data) {
            const logData = {
                correlationId,
                ...(data && typeof data === 'object' ? data : { data })
            };
            this[level](message, logData);
        }
    };
}

/**
 * Default logger instance for general use
 */
const defaultLogger = createLogger('app');

module.exports = {
    createLogger,
    logger: defaultLogger
};
