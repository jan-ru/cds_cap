# wdi5 vs wdio: What's the Difference?

## Quick Answer

**wdi5** = **wdio** + **UI5 bridge**

- **wdio** = WebdriverIO (general browser automation)
- **wdi5** = wdio + special plugin for UI5 apps (much better for UI5!)

---

## Detailed Comparison

### WDIO (WebdriverIO)

**What it is:**
- General-purpose browser automation framework
- Like Selenium, but modern and better
- Works with ANY web application

**Pros:**
- ✅ Works with any website
- ✅ Large community
- ✅ Well documented

**Cons for UI5:**
- ❌ No native UI5 control access
- ❌ Must use `browser.execute()` to run UI5 code
- ❌ Complicated selectors
- ❌ No UI5 API helpers

### wdi5 (WebdriverIO bridge for UI5)

**What it is:**
- Built ON TOP of wdio
- Adds UI5-specific features
- Created specifically for SAP UI5 apps

**Pros:**
- ✅ Native UI5 control selectors
- ✅ Direct access to UI5 API
- ✅ Much simpler test code
- ✅ UI5-specific helpers
- ✅ Better error messages
- ✅ Automatic UI5 waiting

**Cons:**
- ⚠️ Only for UI5 apps (but that's what you have!)

---

## Code Comparison

### Example 1: Click a Button

**With plain wdio:**
```javascript
// Find button using DOM selector (fragile)
const button = await $('[id$="exportButton"]');
await button.click();

// OR execute UI5 code (complicated)
await browser.execute(() => {
  const btn = sap.ui.getCore().byId('exportButton');
  btn.firePress();
});
```

**With wdi5:**
```javascript
// Access UI5 control directly (clean!)
const button = await browser.asControl({
  selector: {
    id: 'exportButton',
    viewName: 'app.view.Main'
  }
});

await button.press(); // Uses UI5's native .press() method!
```

### Example 2: Get Table Data

**With plain wdio:**
```javascript
// Execute JavaScript to get data
const data = await browser.execute(() => {
  const table = sap.ui.getCore().byId('financialTable');
  if (!table) return null;
  
  const rows = table.getRows();
  return rows.map(row => {
    const cells = row.getCells();
    return cells.map(cell => cell.getText());
  });
});
```

**With wdi5:**
```javascript
// Direct UI5 control access
const table = await browser.asControl({
  selector: {
    id: 'financialTable',
    viewName: 'app.view.Main'
  }
});

const rowCount = await table.getRows().length;
const firstRow = await table.getRows()[0];
const cellData = await firstRow.getCells()[0].getText();
```

### Example 3: Select from Dropdown

**With plain wdio:**
```javascript
// Complex CSS selector
await $('[id$="periodSelect"]').click();
await browser.pause(500); // Hope dropdown opens
await $('li*=2024').click();
```

**With wdi5:**
```javascript
// Use UI5 API directly
const select = await browser.asControl({
  selector: {
    id: 'periodSelect',
    viewName: 'app.view.Main'
  }
});

await select.setSelectedKey('2024');
// OR
await select.setSelectedIndex(0);
```

### Example 4: Verify Model Data

**With plain wdio:**
```javascript
const modelData = await browser.execute(() => {
  const view = sap.ui.getCore().byId('mainView');
  const model = view.getModel('financial');
  return model ? model.getData() : null;
});

expect(modelData.root).toBeDefined();
```

**With wdi5:**
```javascript
const view = await browser.asControl({
  selector: {
    id: 'mainView',
    viewName: 'app.view.Main'
  }
});

const model = await view.getModel('financial');
const data = await model.getData();

expect(data.root).toBeDefined();
```

---

## Key wdi5 Features

### 1. **asControl() - Main Magic Method**

Access any UI5 control:

```javascript
const control = await browser.asControl({
  selector: {
    // By ID
    id: 'myButton',
    
    // In specific view
    viewName: 'app.view.Main',
    
    // By control type
    controlType: 'sap.m.Button',
    
    // By property
    properties: {
      text: 'Export'
    },
    
    // Combine multiple
    bindingPath: {
      path: '/items/0',
      modelName: 'financial'
    }
  }
});
```

### 2. **UI5 API Methods Work Directly**

Once you have a control, use ANY UI5 method:

```javascript
const button = await browser.asControl({ selector: { id: 'btn' } });

// All UI5 button methods work!
await button.press();
await button.getText();
await button.setEnabled(false);
await button.getVisible();
```

### 3. **Automatic UI5 Waiting**

wdi5 automatically waits for UI5 to be ready:

```javascript
// wdi5 waits for UI5 automatically
await browser.url('/');

// Immediately start testing - no manual waits needed!
const button = await browser.asControl({
  selector: { id: 'myButton' }
});
```

### 4. **Better Selectors**

Multiple ways to find controls:

```javascript
// By ID
{ id: 'exportButton' }

// By property
{ 
  controlType: 'sap.m.Button',
  properties: { text: 'Export' }
}

// By binding path
{
  bindingPath: {
    path: '/items/0/name',
    modelName: 'financial'
  }
}

// By ancestor (nested controls)
{
  id: 'innerControl',
  ancestor: {
    id: 'parentControl'
  }
}
```

---

## Real Test Example

### Testing Your Financial Apps with wdi5

```javascript
const { wdi5 } = require('wdio-ui5-service');

describe('Balance Sheet Report', () => {
  
  before(async () => {
    await browser.url('/balance-sheet-custom/');
  });

  it('should load balance sheet data', async () => {
    // Select period using UI5 control
    const periodSelect = await browser.asControl({
      selector: {
        id: 'periodSelect',
        viewName: 'app.balancesheet.view.Main'
      }
    });
    
    await periodSelect.setSelectedKey('2024');
    
    // Verify table loaded
    const table = await browser.asControl({
      selector: {
        id: 'balanceSheetTable',
        viewName: 'app.balancesheet.view.Main'
      }
    });
    
    const rows = await table.getRows();
    expect(rows.length).toBeGreaterThan(0);
  });

  it('should export to Excel', async () => {
    // Click export button
    const exportBtn = await browser.asControl({
      selector: {
        controlType: 'sap.m.Button',
        properties: {
          text: 'Export'
        }
      }
    });
    
    await exportBtn.press();
    
    // Verify export dialog (if exists)
    const dialog = await browser.asControl({
      selector: {
        controlType: 'sap.m.Dialog',
        properties: {
          title: 'Export Options'
        }
      }
    });
    
    const isOpen = await dialog.isOpen();
    expect(isOpen).toBe(true);
  });

  it('should verify model data', async () => {
    // Access view and model
    const view = await browser.asControl({
      selector: {
        id: 'mainView',
        viewName: 'app.balancesheet.view.Main'
      }
    });
    
    const financialModel = await view.getModel('financial');
    const data = await financialModel.getData();
    
    // Verify tree structure
    expect(data.root).toBeDefined();
    expect(data.root.nodes.length).toBeGreaterThan(0);
    
    // Check specific account
    const firstNode = data.root.nodes[0];
    expect(firstNode.name).toBeDefined();
    expect(firstNode.amountA).toBeDefined();
  });
});
```

---

## Installation & Setup

### Package.json (Already updated for you!)

```json
{
  "devDependencies": {
    "@wdio/cli": "^9.22.0",
    "@wdio/local-runner": "^9.22.0",
    "@wdio/mocha-framework": "^9.22.0",
    "@wdio/spec-reporter": "^9.22.0",
    "wdio-ui5-service": "^3.1.0",
    "chromedriver": "^131.0.3",
    "wdio-chromedriver-service": "^8.1.1"
  }
}
```

### wdio.conf.js

```javascript
exports.config = {
  services: [
    'chromedriver',
    [
      'ui5',  // This is the wdi5 service!
      {
        waitForUI5Timeout: 30000,
        screenshotPath: './screenshots'
      }
    ]
  ],
  
  // ... rest of config
};
```

---

## Why wdi5 is MUCH Better for Your Use Case

### Your App Structure

You have:
- 27+ UI5 apps
- Complex UI5 controls (TreeTable, period selectors)
- Shared UI5 library
- UI5-specific patterns (BaseReportController)

### With plain wdio:

```javascript
// Every test would look like this mess:
await browser.execute(() => {
  const ctrl = sap.ui.getCore().byId('...');
  ctrl.someMethod();
});
```

### With wdi5:

```javascript
// Clean, readable, maintainable:
const ctrl = await browser.asControl({ selector: { id: '...' } });
await ctrl.someMethod();
```

---

## Migration Impact

### What Changes

**Old (karma-ui5):**
```javascript
// QUnit + karma-ui5
QUnit.test("Should display table", function(assert) {
  var table = this.byId("financialTable");
  assert.ok(table, "Table exists");
});
```

**New (wdi5):**
```javascript
// Mocha + wdi5
it('should display table', async () => {
  const table = await browser.asControl({
    selector: { id: 'financialTable' }
  });
  expect(table).toBeDefined();
});
```

### What Stays the Same

- ✅ Testing the same functionality
- ✅ Same UI5 controls
- ✅ Same business logic
- ✅ Just better test code!

---

## Testing Pyramid Position

```
Manual Tests
    │
    ├── Exploratory testing
    │
System Tests (wdi5) ← YOU ARE HERE
    │
    ├── End-to-end user workflows
    ├── Full stack testing
    ├── Browser automation with UI5 controls
    │
Component Tests (OPA5 or wdi5)
    │
    ├── Individual UI5 controls
    ├── View/controller testing
    │
Unit Tests (Jest)
    │
    ├── Shared library functions
    ├── Formatters, utilities
    └── Business logic
```

**wdi5 is perfect for System Tests!**

---

## Common wdi5 Patterns

### Pattern 1: Navigation Test

```javascript
it('should navigate to different reports', async () => {
  // Click nav item
  const navItem = await browser.asControl({
    selector: {
      controlType: 'sap.m.StandardListItem',
      properties: { title: 'Balance Sheet' }
    }
  });
  
  await navItem.press();
  
  // Verify navigation
  const view = await browser.asControl({
    selector: {
      viewName: 'app.balancesheet.view.Main'
    }
  });
  
  expect(await view.getVisible()).toBe(true);
});
```

### Pattern 2: Form Input

```javascript
it('should fill form fields', async () => {
  const yearInput = await browser.asControl({
    selector: {
      id: 'yearInput',
      viewName: 'app.view.Main'
    }
  });
  
  await yearInput.setValue('2024');
  
  const value = await yearInput.getValue();
  expect(value).toBe('2024');
});
```

### Pattern 3: Table Interaction

```javascript
it('should expand tree table nodes', async () => {
  const tree = await browser.asControl({
    selector: {
      id: 'financialTree',
      viewName: 'app.view.Main'
    }
  });
  
  // Expand first row
  await tree.expand(0);
  
  // Verify expanded
  const isExpanded = await tree.isExpanded(0);
  expect(isExpanded).toBe(true);
});
```

---

## Summary

**Use wdi5, not plain wdio!**

| Feature | plain wdio | wdi5 |
|---------|-----------|------|
| **UI5 Controls** | ❌ Manual | ✅ Native |
| **Code Simplicity** | ❌ Complex | ✅ Clean |
| **UI5 API Access** | ❌ Via execute() | ✅ Direct |
| **Selectors** | ❌ CSS only | ✅ UI5 selectors |
| **For UI5 Apps** | ⚠️ Works | ✅ **Perfect** |

**Bottom line:** Since you have 27 UI5 apps, wdi5 is the obvious choice!

---

## Next Steps

1. ✅ Use updated package.json (has wdio-ui5-service)
2. ✅ Use updated wdio.conf.base.js (has ui5 service)
3. ✅ Write tests using browser.asControl()
4. ✅ Enjoy much cleaner test code!

**wdi5 = wdio for UI5 apps = Perfect for you! 🎉**
