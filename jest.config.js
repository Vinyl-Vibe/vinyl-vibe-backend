module.exports = {
    // The test environment that will be used for testing
    testEnvironment: "node",

    // The glob patterns Jest uses to detect test files
    testMatch: ["**/src/**/__tests__/**/*.test.js"],

    // An array of regexp pattern strings that are matched against all test paths
    testPathIgnorePatterns: ["/node_modules/"],

    // Indicates whether each individual test should be reported during the run
    verbose: true,

    // Automatically clear mock calls and instances between every test
    clearMocks: true,

    // Indicates whether the coverage information should be collected while executing the test
    collectCoverage: true,

    // The directory where Jest should output its coverage files
    coverageDirectory: "coverage",

    // An array of glob patterns indicating a set of files for which coverage should be collected
    collectCoverageFrom: [
        "src/**/*.js",
        "!src/**/__tests__/**",
        "!src/index.js",
        "!src/server.js",
    ],

    // The test coverage threshold enforcement
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
        },
    },

    testTimeout: 10000, // Set default timeout to 10 seconds
};
