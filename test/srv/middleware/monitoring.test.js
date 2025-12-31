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

            const mockNext = jest.fn().mockResolvedValue({ data: 'test' });

            const result = await trackPerformance(mockReq, mockNext);

            expect(result).toEqual({ data: 'test' });
            expect(mockNext).toHaveBeenCalled();

            const metrics = getMetrics();
            expect(metrics.requests.total).toBe(1);
            expect(metrics.requests.success).toBe(1);
            expect(metrics.requests.errors).toBe(0);
        });

        test('should track failed request', async () => {
            const mockReq = createMockRequest({ event: 'CREATE' });

            const mockNext = jest.fn().mockRejectedValue(new Error('Test error'));

            await expect(trackPerformance(mockReq, mockNext)).rejects.toThrow('Test error');

            const metrics = getMetrics();
            expect(metrics.requests.total).toBe(1);
            expect(metrics.requests.success).toBe(0);
            expect(metrics.requests.errors).toBe(1);
        });

        test('should track response times', async () => {
            const mockReq = createMockRequest();

            const mockNext = jest.fn().mockImplementation(() => {
                return new Promise(resolve => setTimeout(() => resolve({}), 10));
            });

            await trackPerformance(mockReq, mockNext);

            const metrics = getMetrics();
            expect(metrics.responseTime.min).toBeGreaterThan(0);
            expect(metrics.responseTime.max).toBeGreaterThan(0);
            expect(metrics.responseTime.avg).toBeGreaterThan(0);
        });

        test('should use correlation ID from headers', async () => {
            const mockReq = createMockRequest({
                headers: { 'x-correlation-id': 'test-123' }
            });

            const mockNext = jest.fn().mockResolvedValue({});

            await trackPerformance(mockReq, mockNext);

            // Correlation ID is used internally but not returned
            expect(mockNext).toHaveBeenCalled();
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

            const mockNext = jest.fn().mockResolvedValue({});

            await trackPerformance(mockReq1, mockNext);
            await trackPerformance(mockReq2, mockNext);

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

            const mockNext = jest.fn().mockResolvedValue({});

            await trackPerformance(req1, mockNext);
            await trackPerformance(req2, mockNext);

            const metrics = getMetrics();
            expect(metrics.endpoints.length).toBe(2);
        });
    });

    describe('resetMetrics', () => {
        test('should reset all metrics to initial state', async () => {
            const mockReq = createMockRequest();

            const mockNext = jest.fn().mockResolvedValue({});

            await trackPerformance(mockReq, mockNext);

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

            const mockNext = jest.fn().mockImplementation(() => {
                return new Promise(resolve => setTimeout(() => resolve({}), 10));
            });

            await trackPerformance(mockReq, mockNext);

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
