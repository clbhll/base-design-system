import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { baseLabAliases } from "./vite.aliases";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: baseLabAliases,
  },
  root: fileURLToPath(new URL("./", import.meta.url)),
});
