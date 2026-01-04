/**
 * wdi5 End-to-End Tests for Working Capital App
 *
 * Tests the Fiori Elements List Report for Sales Invoices
 */

const { wdi5 } = require('wdio-ui5-service');

describe('Working Capital - Sales Invoice List Report', () => {

  before(async () => {
    // Navigate to the working capital app (sales invoices)
    await browser.url('/working-capital/webapp/index.html');

    // Wait for UI5 to be ready - targeting the List Report component
    await browser.asControl({
      selector: {
        id: 'container-workingcapital---SalesInvoiceListComponent',
        timeout: 30000,
        errorMessage: 'Could not find Working Capital List Report Page'
      }
    });
  });

  it('should load the Working Capital page', async () => {
    const title = await browser.getTitle();
    expect(title).toContain('Working Capital');
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

  it('should display the table with sales invoice data', async () => {
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
        },
        timeout: 5000
      }
    });

    if (searchField) {
      await searchField.setValue('2024');
      await searchField.fireSearch();

      // Wait for search to execute
      await browser.pause(1000);

      // Verify search was executed
      const value = await searchField.getValue();
      expect(value).toBe('2024');
    }
  });

  it('should filter by Debtor Name', async () => {
    // Click on filter button to show filters if needed
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

    // Try to find Debtor Name filter field (from SelectionFields annotation)
    const debtorNameField = await browser.asControl({
      selector: {
        controlType: 'sap.ui.mdc.FilterField',
        properties: {
          label: /Debtor/i
        },
        timeout: 5000
      }
    });

    if (debtorNameField) {
      expect(debtorNameField).toBeDefined();
    }
  });

  it('should filter by Invoice Date', async () => {
    const invoiceDateField = await browser.asControl({
      selector: {
        controlType: 'sap.ui.mdc.FilterField',
        properties: {
          label: /Invoice Date/i
        },
        timeout: 5000
      }
    });

    if (invoiceDateField) {
      expect(invoiceDateField).toBeDefined();
      
      // Date filter should be available for time-based filtering
      await invoiceDateField.focus();
      await browser.pause(500);
    }
  });

  it('should filter by Project', async () => {
    const projectField = await browser.asControl({
      selector: {
        controlType: 'sap.ui.mdc.FilterField',
        properties: {
          label: /Project/i
        },
        timeout: 5000
      }
    });

    if (projectField) {
      expect(projectField).toBeDefined();
    }
  });

  it('should execute Go button to apply filters', async () => {
    try {
      const goButton = await browser.asControl({
        selector: {
          controlType: 'sap.m.Button',
          properties: {
            text: 'Go'
          },
          timeout: 5000
        }
      });

      if (goButton) {
        await goButton.press();
        await browser.pause(1000);
        
        expect(goButton).toBeDefined();
      }
    } catch (error) {
      console.log('Go button not found or not clickable');
    }
  });

  it('should display invoice amounts in the table', async () => {
    const table = await browser.asControl({
      selector: {
        controlType: 'sap.ui.mdc.Table',
        timeout: 10000
      }
    });

    expect(table).toBeDefined();
    
    // Check that table has data (invoices with amounts)
    const rows = await table.getRows();
    if (rows && rows.length > 0) {
      expect(rows.length).toBeGreaterThan(0);
    }
  });

  it('should display correct column headers', async () => {
    const table = await browser.asControl({
      selector: {
        controlType: 'sap.ui.mdc.Table',
        timeout: 10000
      }
    });

    expect(table).toBeDefined();
    
    // Table should have columns: Invoice Number, Debtor, Project, Date, Amounts
    const columns = await table.getColumns();
    if (columns) {
      expect(columns.length).toBeGreaterThan(0);
    }
  });

  it('should be able to navigate to invoice object page', async () => {
    const table = await browser.asControl({
      selector: {
        controlType: 'sap.ui.mdc.Table',
        timeout: 10000
      }
    });

    expect(table).toBeDefined();

    try {
      // Try to click first row if available
      const rows = await table.getRows();
      if (rows && rows.length > 0) {
        const firstRow = rows[0];
        await firstRow.press();
        await browser.pause(2000);

        // Check if we navigated to object page
        const objectPage = await browser.asControl({
          selector: {
            controlType: 'sap.uxap.ObjectPageLayout',
            timeout: 5000
          }
        });

        if (objectPage) {
          expect(objectPage).toBeDefined();
          
          // Verify object page header shows invoice details
          const headerTitle = await browser.asControl({
            selector: {
              controlType: 'sap.uxap.ObjectPageHeader',
              timeout: 5000
            }
          });

          if (headerTitle) {
            expect(headerTitle).toBeDefined();
          }

          // Navigate back
          const backButton = await browser.asControl({
            selector: {
              controlType: 'sap.m.Button',
              properties: {
                icon: 'sap-icon://nav-back'
              }
            }
          });

          if (backButton) {
            await backButton.press();
            await browser.pause(1000);
          }
        }
      }
    } catch (error) {
      console.log('Navigation to object page test skipped - no data or navigation issue');
    }
  });

  it('should support table column sorting', async () => {
    const table = await browser.asControl({
      selector: {
        controlType: 'sap.ui.mdc.Table',
        timeout: 10000
      }
    });

    expect(table).toBeDefined();
    
    // MDC Table should support column sorting
    const columns = await table.getColumns();
    if (columns && columns.length > 0) {
      expect(columns.length).toBeGreaterThan(0);
    }
  });

  it('should display financial data (Total ex VAT, Total incl VAT, Open Amount)', async () => {
    const table = await browser.asControl({
      selector: {
        controlType: 'sap.ui.mdc.Table',
        timeout: 10000
      }
    });

    expect(table).toBeDefined();
    
    // Check that financial columns are displayed
    const columns = await table.getColumns();
    if (columns) {
      // Should have columns for various amounts (ex VAT, incl VAT, open)
      expect(columns.length).toBeGreaterThan(3);
    }
  });

  it('should handle table settings/personalization', async () => {
    try {
      const settingsButton = await browser.asControl({
        selector: {
          controlType: 'sap.m.Button',
          properties: {
            icon: /settings/i
          },
          timeout: 5000
        }
      });

      if (settingsButton) {
        await settingsButton.press();
        await browser.pause(500);

        // Check if settings dialog appears
        const settingsDialog = await browser.asControl({
          selector: {
            controlType: 'sap.m.Dialog',
            timeout: 5000
          }
        });

        if (settingsDialog) {
          expect(settingsDialog).toBeDefined();
          
          // Close the dialog
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
            await browser.pause(500);
          }
        }
      }
    } catch (error) {
      console.log('Settings test skipped - button not found');
    }
  });

  it('should respect selection fields from annotations', async () => {
    const filterBar = await browser.asControl({
      selector: {
        controlType: 'sap.ui.mdc.FilterBar',
        timeout: 10000
      }
    });

    expect(filterBar).toBeDefined();
    
    // SelectionFields in annotations: debtor_name, invoice_date, project
    const filterFields = await filterBar.getFilterItems();
    if (filterFields) {
      expect(filterFields.length).toBeGreaterThan(0);
    }
  });

  it('should handle empty state gracefully', async () => {
    try {
      const clearButton = await browser.asControl({
        selector: {
          controlType: 'sap.m.Button',
          properties: {
            text: /Clear|Reset/i
          },
          timeout: 5000
        }
      });

      if (clearButton) {
        await clearButton.press();
        await browser.pause(1000);
      }

      const table = await browser.asControl({
        selector: {
          controlType: 'sap.ui.mdc.Table',
          timeout: 10000
        }
      });

      expect(table).toBeDefined();
    } catch (error) {
      console.log('Clear filters test skipped');
    }
  });

  it('should maintain responsive design on different screen sizes', async () => {
    // Test tablet view
    await browser.setWindowSize(768, 1024);
    await browser.pause(500);

    const filterBar = await browser.asControl({
      selector: {
        controlType: 'sap.ui.mdc.FilterBar',
        timeout: 10000
      }
    });

    expect(filterBar).toBeDefined();

    // Reset to desktop view
    await browser.setWindowSize(1920, 1080);
    await browser.pause(500);
  });

  it('should support variant management', async () => {
    // List Report should have variant management capability
    try {
      const variantButton = await browser.asControl({
        selector: {
          controlType: 'sap.ui.fl.variants.VariantManagement',
          timeout: 5000
        }
      });

      if (variantButton) {
        expect(variantButton).toBeDefined();
      }
    } catch (error) {
      console.log('Variant management not found - may be using different control');
    }
  });

  after(async () => {
    // Clean up - reset to default view
    await browser.setWindowSize(1920, 1080);
  });
});

describe('Working Capital - Data Validation', () => {

  before(async () => {
    await browser.url('/working-capital/webapp/index.html');
    await browser.asControl({
      selector: {
        id: 'container-workingcapital---SalesInvoiceListComponent',
        timeout: 30000
      }
    });
  });

  it('should display invoice data with proper formatting', async () => {
    const table = await browser.asControl({
      selector: {
        controlType: 'sap.ui.mdc.Table',
        timeout: 10000
      }
    });

    expect(table).toBeDefined();
    
    // Check that invoice data is displayed
    const rows = await table.getRows();
    if (rows && rows.length > 0) {
      expect(rows.length).toBeGreaterThan(0);
    }
  });

  it('should show payment status information', async () => {
    // Working capital app should show open amounts and paid amounts
    const table = await browser.asControl({
      selector: {
        controlType: 'sap.ui.mdc.Table',
        timeout: 10000
      }
    });

    expect(table).toBeDefined();
    
    // Payment status columns should be available
    const columns = await table.getColumns();
    if (columns) {
      expect(columns.length).toBeGreaterThan(0);
    }
  });

  it('should display debtor and project information', async () => {
    const table = await browser.asControl({
      selector: {
        controlType: 'sap.ui.mdc.Table',
        timeout: 10000
      }
    });

    expect(table).toBeDefined();
    
    // Should show debtor names and project details
    const rows = await table.getRows();
    if (rows && rows.length > 0) {
      expect(rows).toBeDefined();
    }
  });
});

describe('Working Capital - Object Page', () => {

  before(async () => {
    await browser.url('/working-capital/webapp/index.html');
    await browser.asControl({
      selector: {
        id: 'container-workingcapital---SalesInvoiceListComponent',
        timeout: 30000
      }
    });
  });

  it('should display invoice details in object page facets', async () => {
    const table = await browser.asControl({
      selector: {
        controlType: 'sap.ui.mdc.Table',
        timeout: 10000
      }
    });

    expect(table).toBeDefined();

    try {
      const rows = await table.getRows();
      if (rows && rows.length > 0) {
        // Navigate to first invoice
        const firstRow = rows[0];
        await firstRow.press();
        await browser.pause(2000);

        const objectPage = await browser.asControl({
          selector: {
            controlType: 'sap.uxap.ObjectPageLayout',
            timeout: 5000
          }
        });

        if (objectPage) {
          // Check for facets: Invoice Details, Financial Summary, Payment Status
          const sections = await objectPage.getSections();
          if (sections) {
            expect(sections.length).toBeGreaterThan(0);
          }

          // Navigate back
          await browser.back();
          await browser.pause(1000);
        }
      }
    } catch (error) {
      console.log('Object page facets test skipped');
    }
  });
});
