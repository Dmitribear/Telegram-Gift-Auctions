import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["tests/**/*.test.ts", "tests/**/*.spec.ts"],
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 30000,
  },
});
