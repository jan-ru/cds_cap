/**
 * wdi5 Configuration for Working Capital App
 * Extends base config with app-specific settings
 */

const baseConfig = require('../wdio.conf.base.js').config;

exports.config = {
    ...baseConfig,

    // App-specific test files
    specs: [
        './webapp/test/e2e/**/*.js'
    ],

    // App-specific base URL
    baseUrl: 'http://localhost:4004',

    // Override max instances if needed
    maxInstances: 10
};
