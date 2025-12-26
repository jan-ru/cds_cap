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

    // Coverage thresholds (optional - can be adjusted)
    coverageThreshold: {
        global: {
            branches: 50,
            functions: 50,
            lines: 50,
            statements: 50
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
