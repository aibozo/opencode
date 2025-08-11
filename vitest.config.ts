import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    pool: "threads",
    singleThread: true,
    environment: "node",
    testTimeout: 120000,
    hookTimeout: 120000,
  },
})
