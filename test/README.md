# Test Suite

This directory contains **backend unit tests** for the CAP Analytics application using Jest.

For **frontend tests**, see individual app directories under `app/*/webapp/test/`.

## Running Tests

### Backend Tests (Jest)

```bash
# Run all backend tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with verbose output
npm run test:verbose
```

### Frontend Tests

Frontend testing uses two main approaches:

#### Integration Tests (OPA5)
OPA5 (One Page Acceptance) tests simulate user interactions in the browser.

```bash
# Run OPA5 integration tests (from app/your-app/)
cd app/revenue-analysis
npm run test:opa  # Opens test runner in browser
```

#### End-to-End Tests (wdi5 on top of WebdriverIO)

**wdi5** is the WebdriverIO service for UI5 applications. It provides native UI5 control selectors (`browser.asControl()`) and commands for testing Fiori Elements apps.

```bash
# Run E2E tests for a specific app (from app/your-app/)
cd app/revenue-analysis
npm run test:integration  # Uses wdi5

# Or use the shorthand
npm test
```

**wdi5 Configuration**:
- Base config: `app/wdio.conf.base.js` (shared across all apps)
- App-specific config: `app/your-app/wdio.conf.js`
- Test files: `app/your-app/webapp/test/e2e/**/*.test.js`

## Test Structure

```
test/
├── srv/
│   ├── utils/
│   │   └── financial-tree-builder.test.js  # Tree builder logic tests
│   └── analytics-service.test.js            # Service handler tests (TODO)
└── README.md

app/your-app/webapp/test/
├── unit/                    # QUnit unit tests (optional, mostly deprecated)
│   ├── controller/
│   └── unitTests.qunit.js
├── integration/             # OPA5 integration tests (user journeys)
│   ├── pages/
│   ├── AllJourneys.js
│   └── opaTests.qunit.html
└── e2e/                     # wdi5 E2E tests (recommended)
    └── *.test.js
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

### Backend (Jest)
Current thresholds (defined in jest.config.js):
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

### Frontend
- **OPA5 tests**: No coverage metrics (black-box testing)
- **wdi5 tests**: No coverage metrics (E2E testing)
- Focus is on user journey coverage rather than code coverage

## Test Files

### Backend Tests
- `financial-tree-builder.test.js` - Tests for revenue classification and tree building logic
- `revenue-tree-builder.test.js` - Tests for pivot table generation and period analysis
- `pivot-tree-builder.test.js` - Tests for pivot table hierarchies and aggregation
- `analytics-service.test.js` - Tests for all service handlers and business logic
- `odata-integration.test.js` - Integration tests for OData endpoints with real database
- `validation.test.js` - Tests for parameter validation, data validation, and input sanitization

### Frontend Tests (by app)
- **OPA5 Tests**: User navigation journeys and interaction flows
- **wdi5 Tests**: End-to-end testing with native UI5 control selectors (recommended)

## Writing wdi5 Tests

wdi5 extends WebdriverIO with UI5-specific capabilities. Use `browser.asControl()` to interact with UI5 controls:

```javascript
describe('My Fiori App', () => {
  before(async () => {
    await browser.url('/my-app/webapp/index.html');
    
    // Wait for UI5 to be ready
    await browser.asControl({
      selector: {
        id: 'container-myapp---ListComponent',
        timeout: 30000
      }
    });
  });

  it('should display the filter bar', async () => {
    const filterBar = await browser.asControl({
      selector: {
        controlType: 'sap.ui.mdc.FilterBar'
      }
    });
    
    expect(filterBar).toBeDefined();
    const isVisible = await filterBar.getVisible();
    expect(isVisible).toBe(true);
  });

  it('should filter data', async () => {
    const searchField = await browser.asControl({
      selector: {
        controlType: 'sap.m.SearchField',
        properties: {
          placeholder: /Search/i
        }
      }
    });
    
    await searchField.setValue('2024');
    await searchField.fireSearch();
  });
});
```

**Key wdi5 Features**:
- `browser.asControl()` - Find UI5 controls by ID, type, or properties
- Native UI5 methods - Call any UI5 control method (e.g., `.getVisible()`, `.press()`)
- Automatic waiting - wdi5 waits for UI5 to be ready before interacting
- Screenshots on failure - Configured in base config

## TODO

### Backend Tests
- [x] Add tests for analytics-service.js handlers
- [x] Add tests for revenue-tree-builder.js
- [x] Add tests for pivot-tree-builder.js
- [x] Add integration tests for OData endpoints
- [x] Add tests for validation logic

### Frontend Tests
- [x] Add wdi5 E2E tests for revenue-analysis app
- [x] Expand wdi5 test coverage for all Fiori Elements apps
- [ ] Add performance benchmarks for critical user journeys
- [ ] Add accessibility (WCAG) compliance tests using wdi5
