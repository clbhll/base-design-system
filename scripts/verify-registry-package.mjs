import { execFileSync } from "node:child_process";
import { createHash, timingSafeEqual } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";

import { assertPackageTarball } from "./assert-tarball-contents.mjs";
import { runInstalledFixture } from "./test-packed-fixture.mjs";

const packageName = "@calebhill/base";
const registryOrigin = "https://registry.npmjs.org";
const exactAlphaPattern = /^0\.1\.0-alpha\.\d+$/;

export function assertRegistryMetadata({ metadata, packageDocument, version }) {
  if (!exactAlphaPattern.test(version)) {
    throw new Error(`Registry verification requires an exact Base alpha version: ${version}`);
  }
  if (metadata?.name !== packageName || metadata?.version !== version) {
    throw new Error(
      `Registry package identity mismatch. Expected ${packageName}@${version}. Actual ${metadata?.name}@${metadata?.version}`,
    );
  }
  if (packageDocument?.["dist-tags"]?.next !== version) {
    throw new Error(
      `Registry next tag mismatch. Expected ${version}. Actual ${packageDocument?.["dist-tags"]?.next}`,
    );
  }
  if (!Object.hasOwn(packageDocument?.versions ?? {}, version)) {
    throw new Error(`Registry package document does not contain ${version}`);
  }

  let tarballUrl;
  try {
    tarballUrl = new URL(metadata.dist?.tarball);
  } catch {
    throw new Error("Registry tarball origin is missing or invalid");
  }
  const expectedPath = `/@calebhill/base/-/base-${version}.tgz`;
  if (
    tarballUrl.origin !== registryOrigin ||
    tarballUrl.pathname !== expectedPath ||
    tarballUrl.search !== "" ||
    tarballUrl.hash !== ""
  ) {
    throw new Error(`Registry tarball must use the exact official registry origin and path: ${tarballUrl}`);
  }
  if (typeof metadata.dist?.integrity !== "string" || !metadata.dist.integrity.startsWith("sha512-")) {
    throw new Error("Registry package must provide SHA-512 SRI integrity");
  }
  if (
    typeof metadata.dist?.attestations?.url !== "string" ||
    metadata.dist.attestations.provenance?.predicateType !== "https://slsa.dev/provenance/v1"
  ) {
    throw new Error("Registry package must provide npm provenance attestations");
  }
  const attestationUrl = new URL(metadata.dist.attestations.url);
  const expectedAttestationPath = `/-/npm/v1/attestations/@calebhill%2fbase@${version}`;
  if (
    attestationUrl.origin !== registryOrigin ||
    attestationUrl.pathname !== expectedAttestationPath ||
    attestationUrl.search !== "" ||
    attestationUrl.hash !== ""
  ) {
    throw new Error("Registry provenance attestation must use the exact official npm endpoint");
  }
  if (!Array.isArray(metadata.dist?.signatures) || metadata.dist.signatures.length === 0) {
    throw new Error("Registry package must provide registry signatures");
  }
  for (const signature of metadata.dist.signatures) {
    if (typeof signature?.keyid !== "string" || typeof signature?.sig !== "string") {
      throw new Error("Registry package signature metadata is malformed");
    }
  }
}

export function assertTarballIntegrity(bytes, integrity) {
  const match = /^sha512-([A-Za-z0-9+/]+={0,2})$/.exec(integrity ?? "");
  if (!match) throw new Error("Registry tarball integrity must be SHA-512 SRI");
  const expected = Buffer.from(match[1], "base64");
  const actual = createHash("sha512").update(bytes).digest();
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new Error("Registry tarball integrity mismatch");
  }
}

function decodeAttestationStatement(attestation) {
  const payload = attestation?.bundle?.dsseEnvelope?.payload;
  if (typeof payload !== "string") throw new Error("Provenance attestation payload is missing");
  try {
    return JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
  } catch {
    throw new Error("Provenance attestation payload is malformed");
  }
}

function assertAttestedSubject(statement, version, integrity) {
  const sri = /^sha512-([A-Za-z0-9+/]+={0,2})$/.exec(integrity);
  if (!sri) throw new Error("Provenance verification requires SHA-512 SRI");
  const expectedDigest = Buffer.from(sri[1], "base64").toString("hex");
  const expectedName = `pkg:npm/%40calebhill/base@${version}`;
  const subject = statement?.subject;
  if (
    !Array.isArray(subject) ||
    subject.length !== 1 ||
    subject[0]?.name !== expectedName ||
    subject[0]?.digest?.sha512 !== expectedDigest
  ) {
    throw new Error("Provenance subject does not match the exact registry artifact");
  }
}

export function assertProvenanceAttestations({
  document,
  version,
  integrity,
  expectedCommit,
}) {
  if (!/^[0-9a-f]{40}$/.test(expectedCommit ?? "")) {
    throw new Error(`Expected release commit must be a full Git SHA: ${expectedCommit}`);
  }
  const attestations = document?.attestations;
  if (!Array.isArray(attestations)) throw new Error("Registry provenance attestations are missing");
  const publishAttestation = attestations.find(
    (entry) => entry.predicateType === "https://github.com/npm/attestation/tree/main/specs/publish/v0.1",
  );
  const provenanceAttestation = attestations.find(
    (entry) => entry.predicateType === "https://slsa.dev/provenance/v1",
  );
  if (!publishAttestation || !provenanceAttestation) {
    throw new Error("Registry publish and provenance attestations are both required");
  }

  const publish = decodeAttestationStatement(publishAttestation);
  const provenance = decodeAttestationStatement(provenanceAttestation);
  assertAttestedSubject(publish, version, integrity);
  assertAttestedSubject(provenance, version, integrity);
  if (
    publish.predicate?.name !== packageName ||
    publish.predicate?.version !== version ||
    publish.predicate?.registry !== registryOrigin
  ) {
    throw new Error("npm publish attestation identity mismatch");
  }

  const definition = provenance.predicate?.buildDefinition;
  const workflow = definition?.externalParameters?.workflow;
  const expectedRef = `refs/tags/v${version}`;
  if (
    definition?.buildType !== "https://slsa-framework.github.io/github-actions-buildtypes/workflow/v1" ||
    workflow?.repository !== "https://github.com/clbhll/base-design-system" ||
    workflow?.path !== ".github/workflows/release.yml" ||
    workflow?.ref !== expectedRef
  ) {
    throw new Error("Provenance workflow identity mismatch");
  }
  const source = definition.resolvedDependencies;
  if (
    !Array.isArray(source) ||
    !source.some(
      (dependency) =>
        dependency?.uri ===
          `git+https://github.com/clbhll/base-design-system@${expectedRef}` &&
        dependency?.digest?.gitCommit === expectedCommit,
    )
  ) {
    throw new Error("Provenance source commit mismatch");
  }
  if (provenance.predicate?.runDetails?.builder?.id !== "https://github.com/actions/runner/github-hosted") {
    throw new Error("Provenance builder must be the GitHub-hosted Actions runner");
  }
}

export async function retryRegistryLookup(
  operation,
  options = {},
) {
  return retryRegistryOperation("Registry lookup", operation, options);
}

async function retryRegistryOperation(
  label,
  operation,
  {
    attempts = 6,
    delayMs = 10_000,
    delay = (milliseconds) => new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds)),
    shouldRetry = () => true,
  } = {},
) {
  if (!Number.isInteger(attempts) || attempts < 1) {
    throw new Error("Registry retry attempts must be a positive integer");
  }
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!shouldRetry(error)) throw error;
      if (attempt < attempts) await delay(delayMs);
    }
  }
  const detail = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`${label} failed after ${attempts} attempts: ${detail}`, { cause: lastError });
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { accept: "application/json" },
    redirect: "error",
  });
  if (!response.ok) throw new Error(`Registry metadata request failed with HTTP ${response.status}`);
  return response.json();
}

async function lookupRegistryState(version) {
  const encodedPackage = "@calebhill%2fbase";
  const [metadata, packageDocument] = await Promise.all([
    fetchJson(`${registryOrigin}/${encodedPackage}/${version}`),
    fetchJson(`${registryOrigin}/${encodedPackage}`),
  ]);
  return { metadata, packageDocument };
}

async function downloadTarball(url) {
  const response = await fetch(url, { redirect: "error" });
  if (!response.ok) throw new Error(`Registry tarball request failed with HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

function verifyAuditSignatures(root, version) {
  writeFileSync(
    join(root, "package.json"),
    `${JSON.stringify(
      {
        name: "base-registry-signature-audit",
        private: true,
        version: "0.0.0",
        dependencies: { [packageName]: version },
      },
      null,
      2,
    )}\n`,
  );
  execFileSync(
    "npm",
    ["install", "--ignore-scripts", "--no-audit", "--no-fund", `--registry=${registryOrigin}/`],
    { cwd: root, stdio: "inherit" },
  );
  execFileSync("npm", ["audit", "signatures", `--registry=${registryOrigin}/`], {
    cwd: root,
    stdio: "inherit",
  });
}

const deterministicFixtureError = /^(?:Base fixture package spec|Candidate package identity|Expected fixture|Forbidden packed content|Installed package (?:file parity|identity|path)|Packed |styles\.css |tokens\.css |Unknown installed fixture|(?:next|vite)-smoke fixture )/i;

function shouldRetryFixture(error) {
  return !(error instanceof Error && deterministicFixtureError.test(error.message));
}

async function inAttemptRoot(root, prefix, operation) {
  const attemptRoot = mkdtempSync(join(root, `${prefix}-attempt-`));
  try {
    return await operation(attemptRoot);
  } finally {
    rmSync(attemptRoot, { force: true, recursive: true });
  }
}

export async function verifyRegistryPackage({
  version,
  packageRoot = process.cwd(),
  onTemporaryRootCreated,
  lookup = lookupRegistryState,
  fetchAttestations = fetchJson,
  expectedCommit,
  download = downloadTarball,
  validateTarball = assertPackageTarball,
  runFixture = async (fixtureTemplate, exactVersion, tarball, root, attemptRoot) =>
    runInstalledFixture({
      fixtureTemplate,
      packageRoot: root,
      packageSpec: exactVersion,
      expectedTarball: tarball,
      temporaryParent: attemptRoot,
    }),
  auditSignatures = verifyAuditSignatures,
  attempts,
  delay,
} = {}) {
  if (!exactAlphaPattern.test(version ?? "")) {
    throw new Error(`Registry verification requires an exact Base alpha version: ${version}`);
  }
  const root = resolve(packageRoot);
  const tempParent = join(root, ".tmp");
  mkdirSync(tempParent, { recursive: true });
  const tempRoot = mkdtempSync(join(tempParent, "registry-verify-"));

  try {
    onTemporaryRootCreated?.(tempRoot);
    const state = await retryRegistryLookup(async () => {
      const current = await lookup(version);
      assertRegistryMetadata({ ...current, version });
      const attestationDocument = await fetchAttestations(current.metadata.dist.attestations.url);
      assertProvenanceAttestations({
        document: attestationDocument,
        version,
        integrity: current.metadata.dist.integrity,
        expectedCommit,
      });
      const bytes = await download(current.metadata.dist.tarball);
      assertTarballIntegrity(bytes, current.metadata.dist.integrity);
      return { ...current, attestationDocument, bytes };
    }, { attempts, delay });
    const tarball = join(tempRoot, `calebhill-base-${version}.tgz`);
    writeFileSync(tarball, state.bytes);
    await validateTarball(tarball);
    for (const fixtureTemplate of ["vite-smoke", "next-smoke"]) {
      await retryRegistryOperation(
        `${fixtureTemplate} registry fixture`,
        () => inAttemptRoot(
          tempRoot,
          fixtureTemplate,
          (attemptRoot) => runFixture(fixtureTemplate, version, tarball, root, attemptRoot),
        ),
        { attempts, delay, shouldRetry: shouldRetryFixture },
      );
    }
    await retryRegistryOperation(
      "npm signature audit",
      () => inAttemptRoot(
        tempRoot,
        "signature-audit",
        (attemptRoot) => auditSignatures(attemptRoot, version),
      ),
      { attempts, delay },
    );
    return { version, integrity: state.metadata.dist.integrity };
  } finally {
    rmSync(tempRoot, { force: true, recursive: true });
  }
}

export function parseRegistryVersionArguments(arguments_) {
  const values = arguments_.filter((argument) => argument !== "--");
  if (values.length === 0) throw new Error("Provide the exact registry version to verify");
  if (values.length !== 1) throw new Error("Provide exactly one registry version to verify");
  return values[0];
}

export function resolveExpectedReleaseCommit({
  version,
  githubSha = process.env.GITHUB_SHA,
  revParse = (revision) => execFileSync("git", ["rev-parse", revision], { encoding: "utf8" }).trim(),
}) {
  return githubSha || revParse(`v${version}^{commit}`);
}

async function main() {
  const version = parseRegistryVersionArguments(process.argv.slice(2));
  const expectedCommit = resolveExpectedReleaseCommit({ version });
  const result = await verifyRegistryPackage({ version, expectedCommit });
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  await main();
}
