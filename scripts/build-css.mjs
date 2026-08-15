import { mkdir, readFile, writeFile } from "node:fs/promises";

const tokensPath = new URL("../src/styles/tokens.css", import.meta.url);
const stylesPath = new URL("../src/styles/styles.css", import.meta.url);
const distDir = new URL("../dist/", import.meta.url);

const tokens = await readFile(tokensPath, "utf8");
const styles = await readFile(stylesPath, "utf8");

await mkdir(distDir, { recursive: true });
await writeFile(new URL("tokens.css", distDir), tokens);
await writeFile(new URL("styles.css", distDir), `${tokens}\n\n${styles}\n`);
