/// <reference types="vitest" />

import { defineConfig } from "vite";

export default defineConfig({
  test: {
    coverage: {
      enabled: !!process.env.CI,
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
});
