/**
 * Base WebdriverIO Configuration
 *
 * This is the shared base configuration for all UI5 apps.
 * Individual apps extend this with app-specific settings.
 *
 * @example
 * // Usage in app wdio.conf.js:
 * const merge = require('deepmerge');
 * const baseConfig = require('../../wdio.conf.base.js').config;
 *
 * exports.config = merge(baseConfig, {
 *   // App-specific overrides
 *   specs: ['./webapp/test/e2e/' + '**' + '/*.js']
 * });
 */

exports.config = {
  runner: 'local',
  
  specs: [
    './webapp/test/e2e/**/*.test.js'
  ],
  
  exclude: [],
  
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
  
  logLevel: 'info',
  
  bail: 0,
  
  baseUrl: 'http://localhost:8080',
  
  waitforTimeout: 10000,
  
  connectionRetryTimeout: 120000,
  
  connectionRetryCount: 3,
  
  framework: 'mocha',
  
  reporters: ['spec'],
  
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000
  },

  /**
   * Gets executed once before all workers get launched.
   */
  onPrepare: function (config, capabilities) {
    console.log('Starting WDIO tests...');
  },

  /**
   * Gets executed before a worker process is spawned.
   */
  onWorkerStart: function (cid, caps, specs, args, execArgv) {
  },

  /**
   * Gets executed after all workers got shut down and the process is about to exit.
   */
  onComplete: function(exitCode, config, capabilities, results) {
    console.log('All tests completed!');
  }
};
