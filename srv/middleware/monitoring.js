/**
 * Performance monitoring middleware for CAP services
 * Tracks API response times, memory usage, and provides metrics
 *
 * @module srv/middleware/monitoring
 */

const { createLogger } = require('../utils/logger');
const logger = createLogger('monitoring');

/**
 * Performance metrics storage
 * @private
 */
const metrics = {
    requests: {
        total: 0,
        success: 0,
        errors: 0
    },
    responseTime: {
        min: Infinity,
        max: 0,
        avg: 0,
        total: 0
    },
    endpoints: new Map(),
    slowRequests: []
};

/**
 * Configuration for monitoring thresholds
 */
const config = {
    slowRequestThreshold: 1000,      // Log requests slower than 1 second
    maxSlowRequestsTracked: 50,      // Keep last 50 slow requests
    logInterval: 60000,               // Log summary every 60 seconds
    enableDetailedLogging: false      // Enable detailed per-request logging
};

/**
 * Tracks performance metrics for a single request
 * Registered as a CAP before() handler - receives only req parameter
 *
 * @param {Object} req - CAP request object
 * @returns {Promise<void>}
 */
async function trackPerformance(req) {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    // Generate correlation ID if not present
    const correlationId = req.headers?.['x-correlation-id'] || generateCorrelationId();

    // Store metrics in request context for later retrieval
    req._monitoringContext = {
        startTime,
        startMemory,
        correlationId
    };

    // Register after handler to capture completion metrics
    req.on('done', () => {
        try {
            const duration = Date.now() - startTime;
            const endMemory = process.memoryUsage();

            // Update metrics
            updateMetrics(req, duration, true);

            // Log if slow request
            if (duration > config.slowRequestThreshold) {
                logSlowRequest(req, duration, correlationId);
            }

            // Detailed logging if enabled
            if (config.enableDetailedLogging) {
                logger.debug('Request completed', {
                    correlationId,
                    event: req.event,
                    entity: req.target?.name,
                    duration: `${duration}ms`,
                    memoryDelta: calculateMemoryDelta(startMemory, endMemory)
                });
            }
        } catch (error) {
            logger.error('Error in monitoring done handler', { error: error.message });
        }
    });

    // Register error handler to capture failures
    req.on('error', (error) => {
        try {
            const duration = Date.now() - startTime;
            updateMetrics(req, duration, false);

            logger.error('Request failed', {
                correlationId,
                event: req.event,
                entity: req.target?.name,
                duration: `${duration}ms`,
                error: error.message
            });
        } catch (err) {
            logger.error('Error in monitoring error handler', { error: err.message });
        }
    });

    // Event listeners registered - CAP will automatically emit 'done' or 'error' events
    // No need to call next() or manually emit events
}

/**
 * Updates aggregated metrics
 *
 * @private
 * @param {Object} req - Request object
 * @param {number} duration - Request duration in ms
 * @param {boolean} success - Whether request succeeded
 */
function updateMetrics(req, duration, success) {
    // Update request counts
    metrics.requests.total++;
    if (success) {
        metrics.requests.success++;
    } else {
        metrics.requests.errors++;
    }

    // Update response times
    metrics.responseTime.min = Math.min(metrics.responseTime.min, duration);
    metrics.responseTime.max = Math.max(metrics.responseTime.max, duration);
    metrics.responseTime.total += duration;
    metrics.responseTime.avg = metrics.responseTime.total / metrics.requests.total;

    // Update per-endpoint metrics
    const endpoint = getEndpointKey(req);
    if (!metrics.endpoints.has(endpoint)) {
        metrics.endpoints.set(endpoint, {
            count: 0,
            totalDuration: 0,
            avgDuration: 0,
            errors: 0
        });
    }

    const endpointMetrics = metrics.endpoints.get(endpoint);
    endpointMetrics.count++;
    endpointMetrics.totalDuration += duration;
    endpointMetrics.avgDuration = endpointMetrics.totalDuration / endpointMetrics.count;
    if (!success) {
        endpointMetrics.errors++;
    }
}

/**
 * Logs slow requests for analysis
 *
 * @private
 * @param {Object} req - Request object
 * @param {number} duration - Request duration in ms
 * @param {string} correlationId - Correlation ID
 */
function logSlowRequest(req, duration, correlationId) {
    const slowRequest = {
        correlationId,
        endpoint: getEndpointKey(req),
        duration,
        timestamp: new Date().toISOString(),
        event: req.event,
        entity: req.target?.name
    };

    // Add to slow requests tracking
    metrics.slowRequests.unshift(slowRequest);
    if (metrics.slowRequests.length > config.maxSlowRequestsTracked) {
        metrics.slowRequests.pop();
    }

    logger.warn('Slow request detected', slowRequest);
}

/**
 * Gets a unique key for the endpoint
 *
 * @private
 * @param {Object} req - Request object
 * @returns {string} Endpoint key
 */
function getEndpointKey(req) {
    if (req.event) {
        return `${req.event}:${req.target?.name || 'unknown'}`;
    }
    return req.target?.name || 'unknown';
}

/**
 * Calculates memory usage delta
 *
 * @private
 * @param {Object} startMemory - Memory usage at start
 * @param {Object} endMemory - Memory usage at end
 * @returns {Object} Memory delta
 */
function calculateMemoryDelta(startMemory, endMemory) {
    return {
        heapUsed: `${((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024).toFixed(2)} MB`,
        external: `${((endMemory.external - startMemory.external) / 1024 / 1024).toFixed(2)} MB`
    };
}

/**
 * Generates a unique correlation ID
 *
 * @private
 * @returns {string} Correlation ID
 */
function generateCorrelationId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Gets current metrics snapshot
 *
 * @returns {Object} Current metrics
 */
function getMetrics() {
    return {
        requests: { ...metrics.requests },
        responseTime: {
            min: metrics.responseTime.min === Infinity ? 0 : metrics.responseTime.min,
            max: metrics.responseTime.max,
            avg: Math.round(metrics.responseTime.avg)
        },
        endpoints: Array.from(metrics.endpoints.entries()).map(([name, data]) => ({
            name,
            ...data,
            avgDuration: Math.round(data.avgDuration)
        })),
        slowRequests: metrics.slowRequests.slice(0, 10), // Last 10 slow requests
        memory: {
            heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
            heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
            external: `${(process.memoryUsage().external / 1024 / 1024).toFixed(2)} MB`
        },
        uptime: `${Math.floor(process.uptime())} seconds`
    };
}

/**
 * Resets all metrics
 */
function resetMetrics() {
    metrics.requests = { total: 0, success: 0, errors: 0 };
    metrics.responseTime = { min: Infinity, max: 0, avg: 0, total: 0 };
    metrics.endpoints.clear();
    metrics.slowRequests = [];

    logger.info('Metrics reset');
}

/**
 * Logs periodic metrics summary
 *
 * @private
 */
function logMetricsSummary() {
    const summary = getMetrics();

    logger.info('Performance metrics summary', {
        requests: summary.requests,
        responseTime: summary.responseTime,
        topEndpoints: summary.endpoints
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
            .map(e => `${e.name} (${e.count} calls, ${e.avgDuration}ms avg)`),
        slowRequestCount: summary.slowRequests.length,
        memory: summary.memory
    });
}

/**
 * Starts periodic metrics logging
 *
 * @param {number} [interval] - Logging interval in ms (default: 60000)
 * @returns {NodeJS.Timeout} Interval timer
 */
function startPeriodicLogging(interval = config.logInterval) {
    logger.info('Starting periodic metrics logging', { interval: `${interval}ms` });
    return setInterval(logMetricsSummary, interval);
}

/**
 * Configures monitoring settings
 *
 * @param {Object} options - Configuration options
 * @param {number} [options.slowRequestThreshold] - Threshold for slow requests (ms)
 * @param {boolean} [options.enableDetailedLogging] - Enable per-request logging
 * @param {number} [options.logInterval] - Summary log interval (ms)
 */
function configure(options) {
    Object.assign(config, options);
    logger.info('Monitoring configured', config);
}

module.exports = {
    trackPerformance,
    getMetrics,
    resetMetrics,
    startPeriodicLogging,
    configure,
    config
};
