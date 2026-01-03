/**
 * Base wdi5 Configuration for UI5 Apps
 * 
 * wdi5 = WebdriverIO bridge for UI5 applications
 * Provides native UI5 control selectors and commands
 * 
 * Usage in app/your-app/wdio.conf.js:
 * 
 * const merge = require('deepmerge');
 * const baseConfig = require('../wdio.conf.base.js').config;
 * 
 * exports.config = merge(baseConfig, {
 *   specs: ['./test/e2e/**/*.test.js'],
 *   baseUrl: 'http://localhost:8080/your-app/'
 * });
 */

exports.config = {
  //
  // ====================
  // Runner Configuration
  // ====================
  runner: 'local',
  
  //
  // ==================
  // Specify Test Files
  // ==================
  specs: [
    './test/e2e/**/*.test.js'
  ],
  
  exclude: [],
  
  //
  // ============
  // Capabilities
  // ============
  maxInstances: 5,
  
  capabilities: [{
    maxInstances: 5,
    browserName: 'chrome',
    acceptInsecureCerts: true,
    'goog:chromeOptions': {
      args: [
        '--headless',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--no-sandbox',
        '--disable-dev-shm-usage'
      ]
    }
  }],
  
  //
  // ===================
  // Test Configurations
  // ===================
  logLevel: 'error',
  bail: 0,
  baseUrl: 'http://localhost:8080',
  waitforTimeout: 30000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  
  //
  // ========
  // Services
  // ========
  services: [
    [
      'ui5',  // wdi5 service
      {
        // wdi5 configuration
        screenshotPath: './screenshots',
        screenshotsDisabled: false,
        
        // UI5 specific settings
        waitForUI5Timeout: 30000,
        
        // Optional: Skip UI5 injection for non-UI5 pages
        skipInjectUI5OnStart: false,
        
        // Optional: Log level for wdi5
        logLevel: 'verbose'
      }
    ]
  ],
  
  //
  // Framework
  // =========
  framework: 'mocha',
  
  //
  // Test reporter for stdout
  // ========================
  reporters: ['spec'],
  
  //
  // Options to be passed to Mocha
  // ==============================
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000
  },

  //
  // =====
  // Hooks
  // =====
  
  /**
   * Gets executed once before all workers get launched.
   */
  onPrepare: function (config, capabilities) {
    console.log('Starting wdi5 UI5 tests...');
  },

  /**
   * Gets executed before test execution begins.
   */
  before: async function (capabilities, specs) {
    // wdi5 automatically provides browser.asControl() and other UI5 commands
    // No manual setup needed - it's handled by wdio-ui5-service
  },

  /**
   * Gets executed after all tests are done.
   */
  after: function (result, capabilities, specs) {
  },

  /**
   * Function to be executed after a test (in Mocha/Jasmine only)
   * Takes screenshots on test failure
   */
  afterTest: async function(test, context, { error, result, duration, passed, retries }) {
    if (error) {
      await browser.takeScreenshot();
    }
  },

  /**
   * Gets executed after all workers got shut down and the process is about to exit.
   */
  onComplete: function(exitCode, config, capabilities, results) {
    console.log('All wdi5 tests completed!');
  }
};
