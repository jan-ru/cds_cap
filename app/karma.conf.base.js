/**
 * Base Karma Configuration
 * 
 * This is the shared base configuration for all UI5 apps.
 * Individual apps extend this with app-specific settings.
 * 
 * Usage in app karma.conf.js:
 * 
 * const baseConfig = require('../../karma.conf.base.js');
 * module.exports = function(config) {
 *   baseConfig(config);
 *   config.set({
 *     // App-specific overrides
 *   });
 * };
 */

module.exports = function(config) {
  config.set({
    frameworks: ["ui5"],
    
    ui5: {
      type: "application",
      configPath: "ui5.yaml",
      paths: {
        webapp: "webapp"
      }
    },

    browsers: ["ChromeHeadless"],
    
    browserConsoleLogOptions: {
      level: "error"
    },

    reporters: ["progress", "coverage"],
    
    coverageReporter: {
      includeAllSources: true,
      dir: "coverage",
      reporters: [
        { type: "html", subdir: "report-html" },
        { type: "cobertura", subdir: ".", file: "cobertura.txt" },
        { type: "lcovonly", subdir: ".", file: "report-lcovonly.txt" },
        { type: "text-summary" }
      ]
    },

    junitReporter: {
      outputDir: "target/junit",
      outputFile: "TESTS-results.xml",
      suite: "",
      useBrowserName: false,
      nameFormatter: undefined,
      classNameFormatter: undefined,
      properties: {},
      xmlVersion: null
    },

    preprocessors: {
      "webapp/**/*.js": ["coverage"]
    },

    singleRun: true,
    
    autoWatch: false,

    client: {
      qunit: {
        showUI: true
      }
    }
  });
};
