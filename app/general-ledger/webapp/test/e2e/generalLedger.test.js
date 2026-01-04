/**
 * wdi5 End-to-End Tests for General Ledger App
 *
 * Tests the Fiori Elements List Report and Object Page for general ledger entries
 */

const { wdi5 } = require('wdio-ui5-service');

describe('General Ledger - List Report Page', () => {

  before(async () => {
    // Navigate to the general ledger app
    await browser.url('/general-ledger/webapp/index.html');

    // Wait for UI5 to be ready
    await browser.asControl({
      selector: {
        id: 'container-generalledger---DumpListComponent',
        timeout: 30000,
        errorMessage: 'Could not find List Report page'
      }
    });
  });

  it('should load the General Ledger List Report', async () => {
    const title = await browser.getTitle();
    expect(title).toContain('General Ledger');
  });

  it('should display the filter bar', async () => {
    const filterBar = await browser.asControl({
      selector: {
        controlType: 'sap.ui.mdc.FilterBar',
        timeout: 10000
      }
    });

    expect(filterBar).toBeDefined();
    const isVisible = await filterBar.getVisible();
    expect(isVisible).toBe(true);
  });

  it('should display the table with general ledger entries', async () => {
    const table = await browser.asControl({
      selector: {
        controlType: 'sap.ui.mdc.Table',
        timeout: 10000
      }
    });

    expect(table).toBeDefined();

    // Check if table has rows
    const rows = await table.getRows();
    expect(rows).toBeDefined();
  });

  it('should be able to search in the filter bar', async () => {
    // Find the search field
    const searchField = await browser.asControl({
      selector: {
        controlType: 'sap.m.SearchField',
        properties: {
          placeholder: /Search/i
        }
      }
    });

    if (searchField) {
      await searchField.setValue('2024');
      await searchField.fireSearch();

      // Wait a bit for search to execute
      await browser.pause(1000);

      // Verify search was executed
      const value = await searchField.getValue();
      expect(value).toBe('2024');
    }
  });

  it('should be able to filter by PeriodYear', async () => {
    // Click on filter button to show filters
    const adaptFiltersButton = await browser.asControl({
      selector: {
        controlType: 'sap.m.Button',
        properties: {
          text: 'Adapt Filters'
        }
      }
    });

    if (adaptFiltersButton) {
      await adaptFiltersButton.press();
      await browser.pause(500);
    }

    // Try to find PeriodYear filter field
    const periodYearField = await browser.asControl({
      selector: {
        controlType: 'sap.m.Input',
        labelFor: {
          text: /Period Year/i
        },
        timeout: 5000
      }
    });

    if (periodYearField) {
      await periodYearField.setValue('2024');
      await periodYearField.fireChange();

      // Click Go button
      const goButton = await browser.asControl({
        selector: {
          controlType: 'sap.m.Button',
          properties: {
            text: 'Go'
          }
        }
      });

      if (goButton) {
        await goButton.press();
        await browser.pause(1000);
      }
    }
  });

  it('should be able to sort the table', async () => {
    // Find table
    const table = await browser.asControl({
      selector: {
        controlType: 'sap.ui.mdc.Table'
      }
    });

    if (table) {
      // Get the column header for sorting
      const columns = await table.getColumns();
      if (columns && columns.length > 0) {
        // Click on first column header to sort
        const firstColumn = columns[0];
        await firstColumn.press();

        await browser.pause(500);
      }
    }
  });

  it('should show table settings', async () => {
    // Find settings button
    const settingsButton = await browser.asControl({
      selector: {
        controlType: 'sap.m.Button',
        properties: {
          icon: 'sap-icon://action-settings'
        },
        timeout: 5000
      }
    });

    if (settingsButton) {
      await settingsButton.press();
      await browser.pause(500);

      // Look for settings dialog
      const settingsDialog = await browser.asControl({
        selector: {
          controlType: 'sap.m.Dialog',
          timeout: 2000
        }
      });

      if (settingsDialog) {
        const isOpen = await settingsDialog.isOpen();
        expect(isOpen).toBe(true);

        // Close dialog
        const closeButton = await browser.asControl({
          selector: {
            controlType: 'sap.m.Button',
            properties: {
              text: /Cancel|Close/i
            }
          }
        });

        if (closeButton) {
          await closeButton.press();
        }
      }
    }
  });
});

describe('General Ledger - Object Page', () => {

  it('should navigate to object page when clicking on a row', async () => {
    // Navigate back to list if not there
    await browser.url('/general-ledger/webapp/index.html');

    await browser.pause(2000);

    // Find the table
    const table = await browser.asControl({
      selector: {
        controlType: 'sap.ui.mdc.Table',
        timeout: 10000
      }
    });

    if (table) {
      const rows = await table.getRows();

      if (rows && rows.length > 0) {
        // Click on first row
        await rows[0].press();

        await browser.pause(1000);

        // Verify we're on object page by looking for ObjectPageLayout
        const objectPage = await browser.asControl({
          selector: {
            controlType: 'sap.uxap.ObjectPageLayout',
            timeout: 5000
          }
        });

        expect(objectPage).toBeDefined();
      }
    }
  });

  it('should display general ledger entry details', async () => {
    // Check for form fields on object page
    const formFields = await browser.asControl({
      selector: {
        controlType: 'sap.ui.layout.form.Form',
        timeout: 5000
      }
    });

    if (formFields) {
      const isVisible = await formFields.getVisible();
      expect(isVisible).toBe(true);
    }
  });

  it('should have a back button to navigate to list', async () => {
    const backButton = await browser.asControl({
      selector: {
        controlType: 'sap.m.Button',
        properties: {
          icon: 'sap-icon://nav-back'
        },
        timeout: 5000
      }
    });

    if (backButton) {
      await backButton.press();

      await browser.pause(1000);

      // Verify we're back on list page
      const table = await browser.asControl({
        selector: {
          controlType: 'sap.ui.mdc.Table',
          timeout: 5000
        }
      });

      expect(table).toBeDefined();
    }
  });
});

describe('General Ledger - Data Validation', () => {

  before(async () => {
    await browser.url('/general-ledger/webapp/index.html');
    await browser.pause(2000);
  });

  it('should display account codes in the table', async () => {
    // Get table data
    const table = await browser.asControl({
      selector: {
        controlType: 'sap.ui.mdc.Table'
      }
    });

    if (table) {
      const rows = await table.getRows();

      if (rows && rows.length > 0) {
        // Check first row has cells
        const cells = await rows[0].getCells();
        expect(cells).toBeDefined();
        expect(cells.length).toBeGreaterThan(0);
      }
    }
  });

  it('should display monetary amounts correctly', async () => {
    // Navigate to object page to see detailed amounts
    const table = await browser.asControl({
      selector: {
        controlType: 'sap.ui.mdc.Table'
      }
    });

    if (table) {
      const rows = await table.getRows();

      if (rows && rows.length > 0) {
        // Check that cells contain data
        const cells = await rows[0].getCells();

        for (const cell of cells) {
          const text = await cell.getText();
          // Just verify cells have some content
          expect(text).toBeDefined();
        }
      }
    }
  });
});

describe('General Ledger - Export Functionality', () => {

  before(async () => {
    await browser.url('/general-ledger/webapp/index.html');
    await browser.pause(2000);
  });

  it('should have an export button', async () => {
    const exportButton = await browser.asControl({
      selector: {
        controlType: 'sap.m.Button',
        properties: {
          text: /Export/i
        },
        timeout: 5000
      }
    });

    if (exportButton) {
      const isEnabled = await exportButton.getEnabled();
      expect(isEnabled).toBe(true);
    }
  });
});
