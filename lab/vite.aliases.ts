import { fileURLToPath, URL } from "node:url";

export const baseLabAliases = [
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
];
