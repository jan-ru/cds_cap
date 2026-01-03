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
        singleRun: true,
        autoWatch: false,
        client: {
            qunit: {
                showUI: true
            }
        },
        preprocessors: {
            "webapp/**/*.js": ["coverage"]
        },
        coverageReporter: {
            type: "html",
            dir: "coverage",
            check: {
                global: {
                    statements: 50,
                    branches: 50,
                    functions: 50,
                    lines: 50
                }
            }
        },
        reporters: ["progress", "coverage"]
    });
};
