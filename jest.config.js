/**
 * @fileoverview Jest Configuration for Unit Testing
 *
 * This configuration sets up Jest with:
 * - TypeScript support via ts-jest
 * - Path aliases matching tsconfig
 * - ESM module transformation for uuid and other ESM packages
 * - Coverage collection from source files
 */

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],

  // Path aliases - must match tsconfig.json paths
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // Transform ESM modules to CommonJS for Jest compatibility
  transform: {
    "^.+\\.ts$": ["ts-jest", { useESM: false }],
  },

  // Allow transformation of ESM-only node_modules packages
  transformIgnorePatterns: ["node_modules/(?!(uuid)/)"],

  // Setup files (none currently needed)
  setupFilesAfterEnv: [],

  // Coverage configuration
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],

  // Extend timeout for slower machines
  testTimeout: 10000,
};
