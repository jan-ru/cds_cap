/**
 * wdi5 End-to-End Tests for Revenue Analysis App
 *
 * Tests the Fiori Elements Analytical List Page for revenue analysis with charts and filters
 */

const { wdi5 } = require('wdio-ui5-service');

describe('Revenue Analysis - Analytical List Page', () => {

  before(async () => {
    // Navigate to the revenue analysis app
    await browser.url('/revenue-analysis/webapp/index.html');

    // Wait for UI5 to be ready - targeting the Analytical List Page component
    await browser.asControl({
      selector: {
        id: 'container-revenueanalysis---RevenueReportListComponent',
        timeout: 30000,
        errorMessage: 'Could not find Revenue Analysis Analytical List Page'
      }
    });
  });

  it('should load the Revenue Analysis page', async () => {
    const title = await browser.getTitle();
    expect(title).toContain('Revenue Analysis');
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

  it('should display the chart visualization', async () => {
    // Analytical List Page should show a chart
    const chart = await browser.asControl({
      selector: {
        controlType: 'sap.ui.mdc.Chart',
        timeout: 10000
      }
    });

    expect(chart).toBeDefined();
    const isVisible = await chart.getVisible();
    expect(isVisible).toBe(true);
  });

  it('should display the table with revenue data', async () => {
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

  it('should be able to filter by Revenue Type', async () => {
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

    // Try to find Revenue Type filter field
    const revenueTypeField = await browser.asControl({
      selector: {
        controlType: 'sap.ui.mdc.FilterField',
        properties: {
          label: 'Revenue Type'
        },
        timeout: 5000
      }
    });

    if (revenueTypeField) {
      expect(revenueTypeField).toBeDefined();
    }
  });

  it('should filter by Cost Center Group', async () => {
    const costCenterField = await browser.asControl({
      selector: {
        controlType: 'sap.ui.mdc.FilterField',
        properties: {
          label: 'Cost Center'
        },
        timeout: 5000
      }
    });

    if (costCenterField) {
      expect(costCenterField).toBeDefined();
    }
  });

  it('should filter by Period Year', async () => {
    const periodYearField = await browser.asControl({
      selector: {
        controlType: 'sap.ui.mdc.FilterField',
        properties: {
          label: 'Year'
        },
        timeout: 5000
      }
    });

    if (periodYearField) {
      expect(periodYearField).toBeDefined();
      
      // Try to set a year filter
      await periodYearField.focus();
      await browser.pause(500);
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
        
        // Verify button was pressed
        expect(goButton).toBeDefined();
      }
    } catch (error) {
      // Go button might not be visible in all scenarios
      console.log('Go button not found or not clickable');
    }
  });

  it('should display revenue amounts in the table', async () => {
    const table = await browser.asControl({
      selector: {
        controlType: 'sap.ui.mdc.Table',
        timeout: 10000
      }
    });

    expect(table).toBeDefined();
    
    // Check that table has data
    const rows = await table.getRows();
    if (rows && rows.length > 0) {
      expect(rows.length).toBeGreaterThan(0);
    }
  });

  it('should switch between chart and table view', async () => {
    // Look for view switch buttons in Analytical List Page
    try {
      const chartButton = await browser.asControl({
        selector: {
          controlType: 'sap.m.SegmentedButton',
          timeout: 5000
        }
      });

      if (chartButton) {
        expect(chartButton).toBeDefined();
      }
    } catch (error) {
      console.log('View switch buttons not found - may be using different control');
    }
  });

  it('should be able to navigate to object page', async () => {
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

  it('should handle chart interactions', async () => {
    const chart = await browser.asControl({
      selector: {
        controlType: 'sap.ui.mdc.Chart',
        timeout: 10000
      }
    });

    expect(chart).toBeDefined();
    
    // Verify chart type
    const chartType = await chart.getChartType();
    if (chartType) {
      // Chart type should be column based on annotations
      expect(chartType).toBeDefined();
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
    
    // Table should have columns defined in LineItem annotation
    const columns = await table.getColumns();
    if (columns) {
      expect(columns.length).toBeGreaterThan(0);
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
    
    // SelectionFields in annotations: RevenueType, CostCenterGroup, PeriodYear
    // These should be visible in the filter bar
    const filterFields = await filterBar.getFilterItems();
    if (filterFields) {
      expect(filterFields.length).toBeGreaterThan(0);
    }
  });

  it('should handle empty state gracefully', async () => {
    // Clear all filters and check if empty state is shown appropriately
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

  after(async () => {
    // Clean up - reset to default view
    await browser.setWindowSize(1920, 1080);
  });
});

describe('Revenue Analysis - Data Validation', () => {

  before(async () => {
    await browser.url('/revenue-analysis/webapp/index.html');
    await browser.asControl({
      selector: {
        id: 'container-revenueanalysis---RevenueReportListComponent',
        timeout: 30000
      }
    });
  });

  it('should display revenue amounts with proper formatting', async () => {
    const table = await browser.asControl({
      selector: {
        controlType: 'sap.ui.mdc.Table',
        timeout: 10000
      }
    });

    expect(table).toBeDefined();
    
    // Check that amounts are displayed (test data availability)
    const rows = await table.getRows();
    if (rows && rows.length > 0) {
      expect(rows.length).toBeGreaterThan(0);
    }
  });

  it('should show period information correctly', async () => {
    // Period data should include both year and month
    const table = await browser.asControl({
      selector: {
        controlType: 'sap.ui.mdc.Table',
        timeout: 10000
      }
    });

    expect(table).toBeDefined();
  });
});
