import { mkdir, readFile, writeFile } from "node:fs/promises";

const tokensPath = new URL("../src/styles/tokens.css", import.meta.url);
const stylesPath = new URL("../src/styles/styles.css", import.meta.url);
const componentStylePaths = [
  new URL("../src/styles/components/button.css", import.meta.url),
  new URL("../src/styles/components/text-input.css", import.meta.url),
  new URL("../src/styles/components/progress-bar.css", import.meta.url),
];
const distDir = new URL("../dist/", import.meta.url);

const [tokens, styles, ...componentStyles] = await Promise.all([
  readFile(tokensPath, "utf8"),
  readFile(stylesPath, "utf8"),
  ...componentStylePaths.map((path) => readFile(path, "utf8")),
]);
const components = componentStyles.join("\n\n");

await mkdir(distDir, { recursive: true });
await writeFile(new URL("tokens.css", distDir), tokens);
await writeFile(new URL("styles.css", distDir), `${tokens}\n\n${styles}\n\n${components}`);
