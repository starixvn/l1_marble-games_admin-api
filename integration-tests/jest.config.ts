import type { Config } from 'jest';
import { resolve } from 'path';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.test.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testTimeout: 30000,
  detectOpenHandles: true,
  globalSetup: resolve(__dirname, './global-setup.ts'),
  globalTeardown: resolve(__dirname, './global-teardown.ts'),
  testResultsProcessor: "jest-sonar-reporter",
  reporters: ["default", ["jest-junit", { outputDirectory: "coverage", outputName: "integration-tests.xml" }]],
  coverageReporters: ["clover", "lcov", "text-summary", "cobertura"],
  coverageDirectory: "coverage",
};

export default config;
