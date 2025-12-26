# Test Suite

This directory contains unit tests for the CAP Analytics application using Jest.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with verbose output
npm run test:verbose
```

## Test Structure

```
test/
├── srv/
│   ├── utils/
│   │   └── financial-tree-builder.test.js  # Tree builder logic tests
│   └── analytics-service.test.js            # Service handler tests (TODO)
└── README.md
```

## Writing Tests

### Basic Test Example

```javascript
describe('Feature Name', () => {
    test('should do something specific', () => {
        const result = myFunction(input);
        expect(result).toBe(expected);
    });
});
```

### Common Assertions

```javascript
expect(value).toBe(expected);           // Strict equality
expect(value).toEqual(expected);        // Deep equality (objects/arrays)
expect(value).toBeDefined();            // Not undefined
expect(value).toBeNull();               // Is null
expect(array).toContain(item);          // Array contains item
expect(string).toMatch(/pattern/);      // Regex match
expect(fn).toThrow();                   // Function throws error
```

## Coverage Thresholds

Current thresholds (defined in jest.config.js):
- Branches: 50%
- Functions: 50%
- Lines: 50%
- Statements: 50%

## Test Files

- `financial-tree-builder.test.js` - Tests for revenue classification and tree building logic

## TODO

- [ ] Add tests for analytics-service.js handlers
- [ ] Add tests for revenue-tree-builder.js
- [ ] Add tests for pivot-tree-builder.js
- [ ] Add integration tests for OData endpoints
- [ ] Add tests for validation logic
- [ ] Increase coverage to 70%+
