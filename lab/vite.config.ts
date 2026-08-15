import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "@calebhill/base/styles.css",
        replacement: fileURLToPath(new URL("./src/styles.css", import.meta.url)),
      },
      {
        find: "@calebhill/base/tokens.css",
        replacement: fileURLToPath(new URL("../src/styles/tokens.css", import.meta.url)),
      },
      {
        find: /^@calebhill\/base$/,
        replacement: fileURLToPath(new URL("../src/index.ts", import.meta.url)),
      },
    ],
  },
  root: fileURLToPath(new URL("./", import.meta.url)),
});
