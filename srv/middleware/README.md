# Performance Monitoring

Middleware for tracking API performance, response times, and system health.

## Features

- ✅ **Request Tracking** - Counts total, successful, and failed requests
- ✅ **Response Time Metrics** - Min, max, and average response times
- ✅ **Per-Endpoint Metrics** - Detailed stats for each API endpoint
- ✅ **Slow Request Detection** - Automatically logs requests exceeding threshold
- ✅ **Memory Monitoring** - Tracks heap and memory usage
- ✅ **Correlation IDs** - Request tracing support
- ✅ **Periodic Logging** - Automatic metrics summaries every 60 seconds

## Quick Start

Monitoring is automatically enabled in `analytics-service.js`:

```javascript
const { trackPerformance, startPeriodicLogging } = require('./middleware/monitoring');

// Start periodic logging
startPeriodicLogging(60000); // Log every 60 seconds

// Add to all requests
this.before('*', trackPerformance);
```

## API Endpoints

### Get Current Metrics

```http
GET /odata/v4/analytics/getMetrics()
```

Returns JSON with current performance metrics:

```json
{
  "requests": {
    "total": 150,
    "success": 145,
    "errors": 5
  },
  "responseTime": {
    "min": 5,
    "max": 1250,
    "avg": 125
  },
  "endpoints": [
    {
      "name": "READ:FinancialStatements",
      "count": 45,
      "totalDuration": 5625,
      "avgDuration": 125,
      "errors": 0
    }
  ],
  "slowRequests": [
    {
      "correlationId": "1703123456789-a1b2c3",
      "endpoint": "getFinancialStatementsTree",
      "duration": 1250,
      "timestamp": "2025-12-26T12:34:56.789Z"
    }
  ],
  "memory": {
    "heapUsed": "45.23 MB",
    "heapTotal": "67.50 MB",
    "external": "1.23 MB"
  },
  "uptime": "3600 seconds"
}
```

### Reset Metrics

```http
GET /odata/v4/analytics/resetMetrics()
```

Clears all metrics and starts tracking fresh.

## Configuration

Configure monitoring thresholds:

```javascript
const { configure } = require('./middleware/monitoring');

configure({
    slowRequestThreshold: 2000,      // Log requests slower than 2 seconds
    enableDetailedLogging: true,     // Enable per-request logging
    logInterval: 120000               // Log summary every 2 minutes
});
```

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `slowRequestThreshold` | 1000 | Threshold in ms for slow request logging |
| `maxSlowRequestsTracked` | 50 | Number of slow requests to keep |
| `logInterval` | 60000 | Interval for periodic summary logs (ms) |
| `enableDetailedLogging` | false | Enable detailed per-request logging |

## Metrics Explained

### Request Counts
- **total** - All requests processed
- **success** - Requests that completed successfully
- **errors** - Requests that threw errors

### Response Times
- **min** - Fastest request (ms)
- **max** - Slowest request (ms)
- **avg** - Average response time (ms)

### Endpoint Metrics
- **name** - Endpoint identifier (e.g., "READ:Entity")
- **count** - Number of calls to this endpoint
- **avgDuration** - Average response time for this endpoint
- **errors** - Number of failed requests

### Slow Requests
Automatically tracked when requests exceed `slowRequestThreshold`:
- **correlationId** - Unique request identifier
- **endpoint** - Which endpoint was slow
- **duration** - How long it took (ms)
- **timestamp** - When it occurred

## Correlation IDs

Correlation IDs help track requests across logs:

```javascript
// Client sends correlation ID in header
fetch('/odata/v4/analytics/getMetrics()', {
    headers: {
        'x-correlation-id': 'my-unique-id-123'
    }
});
```

If no correlation ID is provided, one is automatically generated.

## Log Output Examples

### Periodic Summary (Every 60 seconds)

```
[monitoring] - Performance metrics summary {
  requests: { total: 150, success: 145, errors: 5 },
  responseTime: { min: 5, max: 1250, avg: 125 },
  topEndpoints: [
    'READ:FinancialStatements (45 calls, 125ms avg)',
    'getFinancialStatementsTree (12 calls, 850ms avg)',
    'READ:Pivot (30 calls, 45ms avg)'
  ],
  slowRequestCount: 3,
  memory: { heapUsed: '45.23 MB', heapTotal: '67.50 MB' }
}
```

### Slow Request Warning

```
[monitoring] - Slow request detected {
  correlationId: '1703123456789-a1b2c3',
  endpoint: 'getFinancialStatementsTree',
  duration: 1250,
  timestamp: '2025-12-26T12:34:56.789Z',
  event: 'getFinancialStatementsTree',
  entity: 'AnalyticsService'
}
```

### Detailed Request Logging

When `enableDetailedLogging: true`:

```
[monitoring] - Request completed {
  correlationId: '1703123456789-a1b2c3',
  event: 'READ',
  entity: 'FinancialStatements',
  duration: '125ms',
  memoryDelta: { heapUsed: '0.05 MB', external: '0.00 MB' }
}
```

## Performance Optimization Tips

Based on metrics, you can identify:

1. **Slow Endpoints** - Focus optimization efforts on endpoints with high avg duration
2. **Memory Leaks** - Watch for steadily increasing heap usage
3. **Error Patterns** - High error rates on specific endpoints indicate issues
4. **Usage Patterns** - High call counts show which endpoints are most used

## Testing

Run monitoring tests:

```bash
npm test -- monitoring.test.js
```

Current test coverage: **13 tests** covering:
- Request tracking (success/failure)
- Response time calculation
- Endpoint metrics aggregation
- Slow request detection
- Configuration management
- Metrics reset

## Integration Example

```javascript
// In your service implementation
const { trackPerformance, getMetrics, startPeriodicLogging } = require('./middleware/monitoring');

module.exports = cds.service.impl(async function() {
    // Start monitoring
    startPeriodicLogging();

    // Track all requests
    this.before('*', trackPerformance);

    // Expose metrics endpoint
    this.on('getMetrics', async () => {
        return JSON.stringify(getMetrics(), null, 2);
    });
});
```

## Troubleshooting

### High Memory Usage
- Check `memory.heapUsed` in metrics
- Look for endpoints with large data transfers
- Consider pagination for large result sets

### Slow Requests
- Review `slowRequests` array
- Check database query performance
- Consider caching frequently accessed data

### High Error Rates
- Check endpoint-specific error counts
- Review error logs for patterns
- Verify input validation

## Future Enhancements

Potential additions:
- [ ] Histogram of response time distribution
- [ ] Database query tracking
- [ ] Cache hit/miss rates
- [ ] Export metrics to external monitoring tools
- [ ] Real-time metrics dashboard
- [ ] Alerting via webhooks

---

For more information, see the test file: `test/srv/middleware/monitoring.test.js`
