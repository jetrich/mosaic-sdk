module.exports = {
  displayName: '@mosaicstack/config',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
  collectCoverageFrom: [
    'dist/**/*.js',
    '!dist/**/*.d.ts',
    '!dist/**/index.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 10000,
  verbose: true
};