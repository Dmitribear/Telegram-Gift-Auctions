/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  moduleFileExtensions: ["ts", "js", "json"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  maxWorkers: 1,
  testTimeout: 30000,
};
