/**
 * Unit tests for Performance Monitoring middleware
 */

const EventEmitter = require('events');
const {
    trackPerformance,
    getMetrics,
    resetMetrics,
    configure,
    config
} = require('../../../srv/middleware/monitoring');

// Helper function to create mock request with EventEmitter
function createMockRequest(overrides = {}) {
    const req = new EventEmitter();
    Object.assign(req, {
        event: 'READ',
        target: { name: 'TestEntity' },
        headers: {},
        ...overrides
    });
    return req;
}

describe('Performance Monitoring', () => {

    beforeEach(() => {
        // Reset metrics before each test
        resetMetrics();
    });

    describe('trackPerformance', () => {
        test('should track successful request', async () => {
            const mockReq = createMockRequest();

            // Call trackPerformance (sets up event listeners)
            await trackPerformance(mockReq);

            // Simulate CAP completing the request
            mockReq.emit('done');

            // Wait for event handlers to execute
            await new Promise(resolve => setImmediate(resolve));

            const metrics = getMetrics();
            expect(metrics.requests.total).toBe(1);
            expect(metrics.requests.success).toBe(1);
            expect(metrics.requests.errors).toBe(0);
        });

        test('should track failed request', async () => {
            const mockReq = createMockRequest({ event: 'CREATE' });

            // Call trackPerformance (sets up event listeners)
            await trackPerformance(mockReq);

            // Simulate CAP error
            mockReq.emit('error', new Error('Test error'));

            // Wait for event handlers to execute
            await new Promise(resolve => setImmediate(resolve));

            const metrics = getMetrics();
            expect(metrics.requests.total).toBe(1);
            expect(metrics.requests.success).toBe(0);
            expect(metrics.requests.errors).toBe(1);
        });

        test('should track response times', async () => {
            const mockReq = createMockRequest();

            // Call trackPerformance
            await trackPerformance(mockReq);

            // Simulate delay then completion
            await new Promise(resolve => setTimeout(resolve, 10));
            mockReq.emit('done');

            // Wait for event handlers
            await new Promise(resolve => setImmediate(resolve));

            const metrics = getMetrics();
            expect(metrics.responseTime.min).toBeGreaterThan(0);
            expect(metrics.responseTime.max).toBeGreaterThan(0);
            expect(metrics.responseTime.avg).toBeGreaterThan(0);
        });

        test('should use correlation ID from headers', async () => {
            const mockReq = createMockRequest({
                headers: { 'x-correlation-id': 'test-123' }
            });

            // Call trackPerformance
            await trackPerformance(mockReq);

            // Verify correlation ID is stored in request context
            expect(mockReq._monitoringContext.correlationId).toBe('test-123');

            // Simulate completion
            mockReq.emit('done');

            // Wait for event handlers
            await new Promise(resolve => setImmediate(resolve));
        });
    });

    describe('getMetrics', () => {
        test('should return initial metrics', () => {
            const metrics = getMetrics();

            expect(metrics.requests.total).toBe(0);
            expect(metrics.requests.success).toBe(0);
            expect(metrics.requests.errors).toBe(0);
            expect(metrics.responseTime.min).toBe(0);
            expect(metrics.responseTime.max).toBe(0);
            expect(metrics.responseTime.avg).toBe(0);
            expect(metrics.endpoints).toEqual([]);
            expect(metrics.slowRequests).toEqual([]);
            expect(metrics.memory).toBeDefined();
            expect(metrics.uptime).toBeDefined();
        });

        test('should return updated metrics after requests', async () => {
            const mockReq1 = createMockRequest();
            const mockReq2 = createMockRequest();

            // Call trackPerformance for both requests
            await trackPerformance(mockReq1);
            await trackPerformance(mockReq2);

            // Simulate both completing
            mockReq1.emit('done');
            mockReq2.emit('done');

            // Wait for event handlers
            await new Promise(resolve => setImmediate(resolve));

            const metrics = getMetrics();
            expect(metrics.requests.total).toBe(2);
            expect(metrics.endpoints.length).toBe(1);
            expect(metrics.endpoints[0].name).toBe('READ:TestEntity');
            expect(metrics.endpoints[0].count).toBe(2);
        });

        test('should track different endpoints separately', async () => {
            const req1 = createMockRequest({ target: { name: 'Entity1' } });
            const req2 = createMockRequest({
                event: 'CREATE',
                target: { name: 'Entity2' }
            });

            // Call trackPerformance for both requests
            await trackPerformance(req1);
            await trackPerformance(req2);

            // Simulate both completing
            req1.emit('done');
            req2.emit('done');

            // Wait for event handlers
            await new Promise(resolve => setImmediate(resolve));

            const metrics = getMetrics();
            expect(metrics.endpoints.length).toBe(2);
        });
    });

    describe('resetMetrics', () => {
        test('should reset all metrics to initial state', async () => {
            const mockReq = createMockRequest();

            // Call trackPerformance
            await trackPerformance(mockReq);

            // Simulate completion
            mockReq.emit('done');

            // Wait for event handlers
            await new Promise(resolve => setImmediate(resolve));

            let metrics = getMetrics();
            expect(metrics.requests.total).toBe(1);

            resetMetrics();

            metrics = getMetrics();
            expect(metrics.requests.total).toBe(0);
            expect(metrics.endpoints).toEqual([]);
        });
    });

    describe('configure', () => {
        test('should update configuration', () => {
            const originalThreshold = config.slowRequestThreshold;

            configure({ slowRequestThreshold: 2000 });

            expect(config.slowRequestThreshold).toBe(2000);

            // Reset to original
            configure({ slowRequestThreshold: originalThreshold });
        });

        test('should enable detailed logging', () => {
            configure({ enableDetailedLogging: true });

            expect(config.enableDetailedLogging).toBe(true);

            // Reset
            configure({ enableDetailedLogging: false });
        });
    });

    describe('slow request tracking', () => {
        test('should track slow requests', async () => {
            // Configure lower threshold for testing
            configure({ slowRequestThreshold: 5 });

            const mockReq = createMockRequest({
                target: { name: 'SlowEntity' }
            });

            // Call trackPerformance
            await trackPerformance(mockReq);

            // Simulate delay then completion
            await new Promise(resolve => setTimeout(resolve, 10));
            mockReq.emit('done');

            // Wait for event handlers
            await new Promise(resolve => setImmediate(resolve));

            const metrics = getMetrics();
            expect(metrics.slowRequests.length).toBeGreaterThan(0);

            // Reset threshold
            configure({ slowRequestThreshold: 1000 });
        });
    });

    describe('memory metrics', () => {
        test('should include memory information', () => {
            const metrics = getMetrics();

            expect(metrics.memory).toBeDefined();
            expect(metrics.memory.heapUsed).toMatch(/MB$/);
            expect(metrics.memory.heapTotal).toMatch(/MB$/);
            expect(metrics.memory.external).toMatch(/MB$/);
        });
    });

    describe('uptime tracking', () => {
        test('should include uptime information', () => {
            const metrics = getMetrics();

            expect(metrics.uptime).toBeDefined();
            expect(metrics.uptime).toMatch(/seconds$/);
        });
    });
});
