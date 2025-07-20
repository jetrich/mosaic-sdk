module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: [
    '**/integration/**/*.test.ts',
    '**/unit/**/*.test.ts'
  ],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  collectCoverage: true,
  coverageDirectory: '<rootDir>/reports/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/utilities/',
    '/tests/mocks/'
  ],
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],
  testTimeout: 30000,
  verbose: true,
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'MosAIc Stack Integration Test Report',
      outputPath: '<rootDir>/reports/test-report.html',
      includeFailureMsg: true,
      includeConsoleLog: true
    }]
  ]
};