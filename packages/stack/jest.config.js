module.exports = {
  displayName: '@mosaicstack/stack',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
  collectCoverageFrom: [
    'dist/**/*.js',
    '!dist/**/*.d.ts',
    '!dist/**/index.js',
    '!dist/test-runner.js',
    '!dist/testing/**/*.js',
    '!dist/examples/**/*.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 20000,
  verbose: true
};