module.exports = {
    // Test environment
    testEnvironment: 'node',

    // Test file patterns
    testMatch: [
        '**/test/**/*.test.js',
        '**/test/**/*.spec.js'
    ],

    // Coverage configuration
    collectCoverageFrom: [
        'srv/**/*.js',
        '!srv/**/*.cds',
        '!**/node_modules/**',
        '!**/test/**'
    ],

    // Coverage thresholds - updated to reflect current test coverage achievements
    // These thresholds prevent regression while allowing for further improvement
    // Note: monitoring.js has lower coverage (28%) due to complex event handling
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    },

    // Coverage directory
    coverageDirectory: 'coverage',

    // Ignore patterns
    testPathIgnorePatterns: [
        '/node_modules/',
        '/app/',
        '/db/'
    ],

    // Module paths (helps with imports)
    modulePaths: ['<rootDir>'],

    // Verbose output
    verbose: true,

    // Clear mocks between tests
    clearMocks: true,

    // Timeout for tests (milliseconds)
    testTimeout: 10000
};
