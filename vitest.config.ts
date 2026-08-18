import { defineConfig } from "vitest/config";

import { baseLabAliases } from "./lab/vite.aliases";

export default defineConfig({
  resolve: {
    alias: baseLabAliases,
  },
  test: {
    environment: "jsdom",
    fileParallelism: false,
    setupFiles: ["./test/setup.ts"],
    testTimeout: 15_000,
    include: ["test/**/*.test.ts", "test/**/*.test.tsx"],
  },
});
