import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it, vi } from "vitest";

import {
  assertReleaseCandidateIdentity,
  assertReleaseState,
  assertVersionAbsent,
  prepareReleaseCandidate,
} from "../../scripts/prepare-release.mjs";
import {
  assertRegistryMetadata,
  assertProvenanceAttestations,
  assertTarballIntegrity,
  retryRegistryLookup,
  verifyRegistryPackage,
} from "../../scripts/verify-registry-package.mjs";

const version = "0.1.0-alpha.0";
const packageJson = {
  name: "@calebhill/base",
  version,
  repository: {
    type: "git",
    url: "git+https://github.com/clbhll/base-design-system.git",
  },
  publishConfig: {
    access: "public",
    provenance: true,
    registry: "https://registry.npmjs.org",
    tag: "next",
  },
};
const preState = {
  mode: "pre",
  tag: "alpha",
};

function validReleaseState(overrides: Record<string, unknown> = {}) {
  return {
    tag: `v${version}`,
    packageJson,
    preState,
    pendingChangesets: [],
    ci: true,
    containedInMain: true,
    ...overrides,
  };
}

function registryMetadata(overrides: Record<string, unknown> = {}) {
  const bytes = Buffer.from("registry artifact");
  return {
    bytes,
    metadata: {
      name: "@calebhill/base",
      version,
      dist: {
        integrity: `sha512-${createHash("sha512").update(bytes).digest("base64")}`,
        tarball:
          "https://registry.npmjs.org/@calebhill/base/-/base-0.1.0-alpha.0.tgz",
        attestations: {
          url: "https://registry.npmjs.org/-/npm/v1/attestations/@calebhill%2fbase@0.1.0-alpha.0",
          provenance: {
            predicateType: "https://slsa.dev/provenance/v1",
          },
        },
        signatures: [{ keyid: "SHA256:registry", sig: "signed" }],
      },
      ...overrides,
    },
    packageDocument: {
      name: "@calebhill/base",
      "dist-tags": { next: version },
      versions: { [version]: {} },
    },
  };
}

function provenanceAttestations(overrides: Record<string, unknown> = {}) {
  const state = registryMetadata();
  const sha512 = Buffer.from(state.metadata.dist.integrity.slice("sha512-".length), "base64").toString("hex");
  const publish = {
    _type: "https://in-toto.io/Statement/v0.1",
    subject: [{ name: `pkg:npm/%40calebhill/base@${version}`, digest: { sha512 } }],
    predicateType: "https://github.com/npm/attestation/tree/main/specs/publish/v0.1",
    predicate: { name: "@calebhill/base", version, registry: "https://registry.npmjs.org" },
  };
  const provenance = {
    _type: "https://in-toto.io/Statement/v1",
    subject: [{ name: `pkg:npm/%40calebhill/base@${version}`, digest: { sha512 } }],
    predicateType: "https://slsa.dev/provenance/v1",
    predicate: {
      buildDefinition: {
        buildType: "https://slsa-framework.github.io/github-actions-buildtypes/workflow/v1",
        externalParameters: {
          workflow: {
            ref: `refs/tags/v${version}`,
            repository: "https://github.com/clbhll/base-design-system",
            path: "/.github/workflows/release.yml",
          },
        },
        resolvedDependencies: [
          {
            uri: `git+https://github.com/clbhll/base-design-system@refs/tags/v${version}`,
            digest: { gitCommit: "a".repeat(40) },
          },
        ],
      },
      runDetails: { builder: { id: "https://github.com/actions/runner/github-hosted" } },
    },
    ...overrides,
  };
  const wrap = (predicateType: string, statement: object) => ({
    predicateType,
    bundle: { dsseEnvelope: { payload: Buffer.from(JSON.stringify(statement)).toString("base64") } },
  });
  return {
    attestations: [
      wrap(publish.predicateType, publish),
      wrap(provenance.predicateType, provenance),
    ],
  };
}

function writeCandidateTarball(
  destination: string,
  candidateManifest: Record<string, unknown>,
) {
  const sourceRoot = mkdtempSync(join(tmpdir(), "base-release-candidate-source-"));
  const packageDirectory = join(sourceRoot, "package");
  const tarball = join(destination, "calebhill-base-candidate.tgz");
  mkdirSync(packageDirectory);
  writeFileSync(
    join(packageDirectory, "package.json"),
    `${JSON.stringify(candidateManifest, null, 2)}\n`,
  );

  try {
    execFileSync("tar", ["-czf", tarball, "package"], { cwd: sourceRoot });
    return tarball;
  } finally {
    rmSync(sourceRoot, { force: true, recursive: true });
  }
}

describe("release preparation state", () => {
  it("accepts only the exact alpha tag, prerelease state, public metadata, and main commit", () => {
    expect(() => assertReleaseState(validReleaseState())).not.toThrow();
  });

  it.each([
    ["a tag that differs from package.version", { tag: "v0.1.0-alpha.1" }, /tag.*version/i],
    ["a non-alpha prerelease", { tag: "v0.1.0-beta.0" }, /alpha/i],
    ["Changesets outside alpha mode", { preState: { ...preState, tag: "beta" } }, /alpha/i],
    ["a pending release changeset", { pendingChangesets: ["pending.md"] }, /pending.*changeset/i],
    ["a commit outside main", { containedInMain: false }, /main/i],
    [
      "a private registry",
      {
        packageJson: {
          ...packageJson,
          publishConfig: { ...packageJson.publishConfig, registry: "https://registry.example.test" },
        },
      },
      /registry/i,
    ],
    [
      "a non-public package",
      {
        packageJson: {
          ...packageJson,
          publishConfig: { ...packageJson.publishConfig, access: "restricted" },
        },
      },
      /public/i,
    ],
    [
      "a missing provenance setting",
      {
        packageJson: {
          ...packageJson,
          publishConfig: { ...packageJson.publishConfig, provenance: false },
        },
      },
      /provenance/i,
    ],
    [
      "a wrong repository",
      { packageJson: { ...packageJson, repository: "https://github.com/example/base.git" } },
      /repository/i,
    ],
  ])("rejects %s", (_name, mutation, message) => {
    expect(() => assertReleaseState(validReleaseState(mutation))).toThrow(message);
  });

  it("fails if the immutable version already exists", () => {
    expect(() => assertVersionAbsent({ versions: {} }, version)).not.toThrow();
    expect(() => assertVersionAbsent({ versions: { [version]: {} } }, version)).toThrow(
      /already exists/i,
    );
  });
});

describe("deterministic candidate preparation", () => {
  it("returns one exact candidate digest and cleans its task root", async () => {
    const packageRoot = mkdtempSync(join(tmpdir(), "base-release-package-"));
    writeFileSync(join(packageRoot, "package.json"), `${JSON.stringify(packageJson)}\n`);
    const observedFixtures: string[] = [];
    let temporaryRoot = "";

    try {
      const result = await prepareReleaseCandidate({
        packageRoot,
        tag: `v${version}`,
        preState,
        pendingChangesets: [],
        containedInMain: true,
        registryDocument: { versions: {} },
        onTemporaryRootCreated: (root: string) => {
          temporaryRoot = root;
        },
        packCandidate: (_root: string, destination: string) => {
          return writeCandidateTarball(destination, packageJson);
        },
        validateTarball: () => undefined,
        runFixture: (fixtureTemplate: string) => {
          observedFixtures.push(fixtureTemplate);
        },
      });

      expect(result.version).toBe(version);
      expect(result.digest).toBe(
        createHash("sha256").update(readFileSync(result.path)).digest("hex"),
      );
      expect(result.path).toMatch(/\.tgz$/);
      expect(observedFixtures).toEqual(["vite-smoke", "next-smoke"]);
      expect(temporaryRoot).not.toBe("");
      expect(existsSync(temporaryRoot)).toBe(false);
    } finally {
      rmSync(packageRoot, { force: true, recursive: true });
    }
  });

  it("cleans the task root when fixture verification fails", async () => {
    const packageRoot = mkdtempSync(join(tmpdir(), "base-release-package-"));
    writeFileSync(join(packageRoot, "package.json"), `${JSON.stringify(packageJson)}\n`);
    let temporaryRoot = "";

    try {
      await expect(
        prepareReleaseCandidate({
          packageRoot,
          tag: `v${version}`,
          preState,
          pendingChangesets: [],
          containedInMain: true,
          registryDocument: { versions: {} },
          onTemporaryRootCreated: (root: string) => {
            temporaryRoot = root;
          },
          packCandidate: (_root: string, destination: string) => {
            return writeCandidateTarball(destination, packageJson);
          },
          validateTarball: () => undefined,
          runFixture: () => Promise.reject(new Error("fixture failure")),
        }),
      ).rejects.toThrow(/fixture failure/i);
      expect(temporaryRoot).not.toBe("");
      expect(existsSync(temporaryRoot)).toBe(false);
    } finally {
      rmSync(packageRoot, { force: true, recursive: true });
    }
  });

  it.each([
    ["name", { name: "@calebhill/other" }, /candidate.*name/i],
    ["version", { version: "0.1.0-alpha.1" }, /candidate.*version/i],
    [
      "repository",
      { repository: { type: "git", url: "git+https://github.com/example/base.git" } },
      /candidate.*repository/i,
    ],
    [
      "registry",
      { publishConfig: { ...packageJson.publishConfig, registry: "https://registry.example.test" } },
      /candidate.*publishConfig/i,
    ],
    [
      "access",
      { publishConfig: { ...packageJson.publishConfig, access: "restricted" } },
      /candidate.*publishConfig/i,
    ],
    [
      "tag",
      { publishConfig: { ...packageJson.publishConfig, tag: "latest" } },
      /candidate.*publishConfig/i,
    ],
    [
      "provenance",
      { publishConfig: { ...packageJson.publishConfig, provenance: false } },
      /candidate.*publishConfig/i,
    ],
  ])("rejects a valid candidate whose %s was swapped after release-state validation", async (_field, mutation, message) => {
    const packageRoot = mkdtempSync(join(tmpdir(), "base-release-package-"));
    writeFileSync(join(packageRoot, "package.json"), `${JSON.stringify(packageJson)}\n`);

    try {
      const candidateManifest = { ...packageJson, ...mutation };
      await expect(
        prepareReleaseCandidate({
          packageRoot,
          tag: `v${version}`,
          preState,
          pendingChangesets: [],
          containedInMain: true,
          registryDocument: { versions: {} },
          packCandidate: (_root: string, destination: string) =>
            writeCandidateTarball(destination, candidateManifest),
          validateTarball: () => undefined,
          runFixture: () => undefined,
        }),
      ).rejects.toThrow(message);
    } finally {
      rmSync(packageRoot, { force: true, recursive: true });
    }
  });

  it("requires exact candidate release fields even when called without packing", () => {
    expect(() => assertReleaseCandidateIdentity(packageJson, packageJson)).not.toThrow();
    expect(() =>
      assertReleaseCandidateIdentity(
        { ...packageJson, version: "0.1.0-alpha.1" },
        packageJson,
      ),
    ).toThrow(/candidate.*version/i);
  });

  it("rejects a swapped version in a candidate that passes the complete package gate", async () => {
    const packageRoot = mkdtempSync(join(tmpdir(), "base-release-package-"));
    const packedRoot = mkdtempSync(join(tmpdir(), "base-release-packed-"));
    const extractedRoot = mkdtempSync(join(tmpdir(), "base-release-extracted-"));
    writeFileSync(join(packageRoot, "package.json"), `${JSON.stringify(packageJson)}\n`);

    try {
      execFileSync("pnpm", ["pack", "--pack-destination", packedRoot], {
        cwd: resolve("."),
        stdio: "ignore",
      });
      const original = readdirSync(packedRoot).find((entry) => entry.endsWith(".tgz"));
      if (!original) throw new Error("Expected a locally packed Base candidate");
      execFileSync("tar", ["-xf", join(packedRoot, original), "-C", extractedRoot]);
      const manifestPath = join(extractedRoot, "package/package.json");
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
      writeFileSync(
        manifestPath,
        `${JSON.stringify({ ...manifest, version: "0.1.0-alpha.1" }, null, 2)}\n`,
      );
      const swapped = join(packedRoot, "swapped-valid-base.tgz");
      execFileSync(
        "tar",
        [
          "-czf",
          swapped,
          "package/LICENSE",
          "package/README.md",
          "package/dist/index.d.ts",
          "package/dist/index.js",
          "package/dist/styles.css",
          "package/dist/tokens.css",
          "package/package.json",
        ],
        { cwd: extractedRoot },
      );

      await expect(
        prepareReleaseCandidate({
          packageRoot,
          tag: `v${version}`,
          preState,
          pendingChangesets: [],
          containedInMain: true,
          registryDocument: { versions: {} },
          packCandidate: (_root: string, destination: string) => {
            const candidate = join(destination, "swapped-valid-base.tgz");
            copyFileSync(swapped, candidate);
            return candidate;
          },
          runFixture: () => undefined,
        }),
      ).rejects.toThrow(/candidate.*version/i);
    } finally {
      rmSync(packageRoot, { force: true, recursive: true });
      rmSync(packedRoot, { force: true, recursive: true });
      rmSync(extractedRoot, { force: true, recursive: true });
    }
  });
});

describe("exact registry artifact verification", () => {
  it("accepts exact official metadata with next, SRI, provenance, and signatures", () => {
    const state = registryMetadata();
    expect(() => assertRegistryMetadata({ ...state, version })).not.toThrow();
    expect(() => assertTarballIntegrity(state.bytes, state.metadata.dist.integrity)).not.toThrow();
  });

  it.each([
    ["the wrong next tag", { packageDocument: { "dist-tags": { next: "0.1.0-alpha.1" } } }, /next/i],
    [
      "a non-official tarball origin",
      { dist: { tarball: "https://registry.example.test/base.tgz" } },
      /official.*registry|tarball.*origin/i,
    ],
    ["missing integrity", { dist: { integrity: undefined } }, /integrity/i],
    ["missing attestations", { dist: { attestations: undefined } }, /provenance|attestation/i],
    [
      "an unrelated official-registry attestation endpoint",
      {
        dist: {
          attestations: {
            url: "https://registry.npmjs.org/-/npm/v1/attestations/other@1.0.0",
            provenance: { predicateType: "https://slsa.dev/provenance/v1" },
          },
        },
      },
      /attestation/i,
    ],
    ["missing registry signatures", { dist: { signatures: [] } }, /signature/i],
  ])("rejects %s", (_name, mutation, message) => {
    const state = registryMetadata();
    const packageDocument = "packageDocument" in mutation
      ? { ...state.packageDocument, ...(mutation.packageDocument as object) }
      : state.packageDocument;
    const metadata = "dist" in mutation
      ? { ...state.metadata, dist: { ...state.metadata.dist, ...(mutation.dist as object) } }
      : state.metadata;
    expect(() => assertRegistryMetadata({ metadata, packageDocument, version })).toThrow(
      message,
    );
  });

  it("rejects a one-byte artifact mutation against the registry SRI", () => {
    const state = registryMetadata();
    expect(() => assertTarballIntegrity(Buffer.from("registry artifacu"), state.metadata.dist.integrity)).toThrow(
      /integrity/i,
    );
  });

  it("ties canonical npm provenance to the exact repository, workflow, tag, commit, and artifact", () => {
    const state = registryMetadata();
    expect(() =>
      assertProvenanceAttestations({
        document: provenanceAttestations(),
        version,
        integrity: state.metadata.dist.integrity,
        expectedCommit: "a".repeat(40),
      }),
    ).not.toThrow();

    const document = provenanceAttestations();
    const provenance = JSON.parse(
      Buffer.from(document.attestations[1].bundle.dsseEnvelope.payload, "base64").toString("utf8"),
    ) as {
      predicate: {
        buildDefinition: { externalParameters: { workflow: { path: string } } };
      };
    };
    for (const wrongPath of [
      ".github/workflows/release.yml",
      "/.github/workflows/other.yml",
    ]) {
      provenance.predicate.buildDefinition.externalParameters.workflow.path = wrongPath;
      document.attestations[1].bundle.dsseEnvelope.payload = Buffer.from(JSON.stringify(provenance)).toString("base64");
      expect(() =>
        assertProvenanceAttestations({
          document,
          version,
          integrity: state.metadata.dist.integrity,
          expectedCommit: "a".repeat(40),
        }),
      ).toThrow(/workflow/i);
    }
  });

  it("retries propagation only to the configured bound", async () => {
    const eventuallyAvailable = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("not propagated"))
      .mockRejectedValueOnce(new Error("not propagated"))
      .mockResolvedValue("available");
    const noDelay = vi.fn(() => Promise.resolve());

    await expect(
      retryRegistryLookup(eventuallyAvailable, { attempts: 3, delay: noDelay }),
    ).resolves.toBe("available");
    expect(eventuallyAvailable).toHaveBeenCalledTimes(3);
    expect(noDelay).toHaveBeenCalledTimes(2);

    const alwaysMissing = vi.fn<() => Promise<string>>().mockRejectedValue(new Error("missing"));
    await expect(
      retryRegistryLookup(alwaysMissing, { attempts: 3, delay: noDelay }),
    ).rejects.toThrow(/missing/i);
    expect(alwaysMissing).toHaveBeenCalledTimes(3);
  });

  it("validates one downloaded artifact through both registry fixtures and cleans up", async () => {
    const packageRoot = mkdtempSync(join(tmpdir(), "base-registry-package-"));
    const state = registryMetadata();
    const fixtures: string[] = [];
    let temporaryRoot = "";
    let downloadAttempts = 0;

    try {
      const result = await verifyRegistryPackage({
        version,
        packageRoot,
        onTemporaryRootCreated: (root: string) => {
          temporaryRoot = root;
        },
        lookup: () => Promise.resolve({
          metadata: state.metadata,
          packageDocument: state.packageDocument,
        }),
        fetchAttestations: () => Promise.resolve(provenanceAttestations()),
        expectedCommit: "a".repeat(40),
        download: () => {
          downloadAttempts += 1;
          return downloadAttempts === 1
            ? Promise.reject(new Error("tarball not propagated"))
            : Promise.resolve(state.bytes);
        },
        validateTarball: (tarball: string) => {
          expect(readFileSync(tarball)).toEqual(state.bytes);
        },
        runFixture: (fixture: string, requestedVersion: string, tarball: string) => {
          expect(requestedVersion).toBe(version);
          expect(readFileSync(tarball)).toEqual(state.bytes);
          fixtures.push(fixture);
        },
        auditSignatures: () => undefined,
        attempts: 2,
        delay: () => Promise.resolve(),
      });

      expect(result).toEqual({ version, integrity: state.metadata.dist.integrity });
      expect(fixtures).toEqual(["vite-smoke", "next-smoke"]);
      expect(downloadAttempts).toBe(2);
      expect(temporaryRoot).not.toBe("");
      expect(existsSync(temporaryRoot)).toBe(false);
    } finally {
      rmSync(packageRoot, { force: true, recursive: true });
    }
  });

  it("retries each exact-version fixture in a fresh cleaned attempt root", async () => {
    const packageRoot = mkdtempSync(join(tmpdir(), "base-registry-package-"));
    const state = registryMetadata();
    const calls = new Map<string, number>();
    const attemptRoots: string[] = [];

    try {
      await verifyRegistryPackage({
        version,
        packageRoot,
        lookup: () => Promise.resolve({
          metadata: state.metadata,
          packageDocument: state.packageDocument,
        }),
        fetchAttestations: () => Promise.resolve(provenanceAttestations()),
        expectedCommit: "a".repeat(40),
        download: () => Promise.resolve(state.bytes),
        validateTarball: () => undefined,
        runFixture: (fixture, requestedVersion, _tarball, _root, attemptRoot) => {
          expect(requestedVersion).toBe(version);
          expect(existsSync(attemptRoot)).toBe(true);
          writeFileSync(join(attemptRoot, "attempt-marker"), fixture);
          attemptRoots.push(attemptRoot);
          const call = (calls.get(fixture) ?? 0) + 1;
          calls.set(fixture, call);
          if (call === 1) throw new Error(`${fixture} registry install not propagated`);
        },
        auditSignatures: () => undefined,
        attempts: 2,
        delay: () => Promise.resolve(),
      });

      expect(Object.fromEntries(calls)).toEqual({ "vite-smoke": 2, "next-smoke": 2 });
      expect(new Set(attemptRoots).size).toBe(4);
      expect(attemptRoots.every((root) => !existsSync(root))).toBe(true);
    } finally {
      rmSync(packageRoot, { force: true, recursive: true });
    }
  });

  it("retries the signature audit in a fresh cleaned attempt root", async () => {
    const packageRoot = mkdtempSync(join(tmpdir(), "base-registry-package-"));
    const state = registryMetadata();
    const attemptRoots: string[] = [];

    try {
      await verifyRegistryPackage({
        version,
        packageRoot,
        lookup: () => Promise.resolve({
          metadata: state.metadata,
          packageDocument: state.packageDocument,
        }),
        fetchAttestations: () => Promise.resolve(provenanceAttestations()),
        expectedCommit: "a".repeat(40),
        download: () => Promise.resolve(state.bytes),
        validateTarball: () => undefined,
        runFixture: () => undefined,
        auditSignatures: (attemptRoot, requestedVersion) => {
          expect(requestedVersion).toBe(version);
          expect(existsSync(attemptRoot)).toBe(true);
          writeFileSync(join(attemptRoot, "attempt-marker"), "audit");
          attemptRoots.push(attemptRoot);
          if (attemptRoots.length === 1) throw new Error("signature records not propagated");
        },
        attempts: 2,
        delay: () => Promise.resolve(),
      });

      expect(attemptRoots).toHaveLength(2);
      expect(new Set(attemptRoots).size).toBe(2);
      expect(attemptRoots.every((root) => !existsSync(root))).toBe(true);
    } finally {
      rmSync(packageRoot, { force: true, recursive: true });
    }
  });

  it("reports fixture retry exhaustion and cleans every attempt root", async () => {
    const packageRoot = mkdtempSync(join(tmpdir(), "base-registry-package-"));
    const state = registryMetadata();
    const attemptRoots: string[] = [];

    try {
      await expect(
        verifyRegistryPackage({
          version,
          packageRoot,
          lookup: () => Promise.resolve({
            metadata: state.metadata,
            packageDocument: state.packageDocument,
          }),
          fetchAttestations: () => Promise.resolve(provenanceAttestations()),
          expectedCommit: "a".repeat(40),
          download: () => Promise.resolve(state.bytes),
          validateTarball: () => undefined,
          runFixture: (fixture, _requestedVersion, _tarball, _root, attemptRoot) => {
            writeFileSync(join(attemptRoot, "attempt-marker"), fixture);
            attemptRoots.push(attemptRoot);
            throw new Error("registry package still unavailable");
          },
          auditSignatures: () => undefined,
          attempts: 3,
          delay: () => Promise.resolve(),
        }),
      ).rejects.toThrow(/vite-smoke.*failed after 3 attempts.*still unavailable/i);
      expect(attemptRoots).toHaveLength(3);
      expect(new Set(attemptRoots).size).toBe(3);
      expect(attemptRoots.every((root) => !existsSync(root))).toBe(true);
    } finally {
      rmSync(packageRoot, { force: true, recursive: true });
    }
  });

  it("reports signature retry exhaustion and cleans every attempt root", async () => {
    const packageRoot = mkdtempSync(join(tmpdir(), "base-registry-package-"));
    const state = registryMetadata();
    const attemptRoots: string[] = [];

    try {
      await expect(
        verifyRegistryPackage({
          version,
          packageRoot,
          lookup: () => Promise.resolve({
            metadata: state.metadata,
            packageDocument: state.packageDocument,
          }),
          fetchAttestations: () => Promise.resolve(provenanceAttestations()),
          expectedCommit: "a".repeat(40),
          download: () => Promise.resolve(state.bytes),
          validateTarball: () => undefined,
          runFixture: () => undefined,
          auditSignatures: (attemptRoot) => {
            writeFileSync(join(attemptRoot, "attempt-marker"), "audit");
            attemptRoots.push(attemptRoot);
            throw new Error("signature record still unavailable");
          },
          attempts: 3,
          delay: () => Promise.resolve(),
        }),
      ).rejects.toThrow(/npm signature audit.*failed after 3 attempts.*still unavailable/i);
      expect(attemptRoots).toHaveLength(3);
      expect(new Set(attemptRoots).size).toBe(3);
      expect(attemptRoots.every((root) => !existsSync(root))).toBe(true);
    } finally {
      rmSync(packageRoot, { force: true, recursive: true });
    }
  });

  it("does not retry a distinguishable installed-artifact mismatch", async () => {
    const packageRoot = mkdtempSync(join(tmpdir(), "base-registry-package-"));
    const state = registryMetadata();
    const attemptRoots: string[] = [];

    try {
      await expect(
        verifyRegistryPackage({
          version,
          packageRoot,
          lookup: () => Promise.resolve({
            metadata: state.metadata,
            packageDocument: state.packageDocument,
          }),
          fetchAttestations: () => Promise.resolve(provenanceAttestations()),
          expectedCommit: "a".repeat(40),
          download: () => Promise.resolve(state.bytes),
          validateTarball: () => undefined,
          runFixture: (_fixture, _requestedVersion, _tarball, _root, attemptRoot) => {
            attemptRoots.push(attemptRoot);
            throw new Error("Installed package file parity mismatch");
          },
          auditSignatures: () => undefined,
          attempts: 3,
          delay: () => Promise.resolve(),
        }),
      ).rejects.toThrow(/installed package file parity mismatch/i);
      expect(attemptRoots).toHaveLength(1);
      expect(existsSync(attemptRoots[0])).toBe(false);
    } finally {
      rmSync(packageRoot, { force: true, recursive: true });
    }
  });

  it("cleans the registry task root when post-download verification fails", async () => {
    const packageRoot = mkdtempSync(join(tmpdir(), "base-registry-package-"));
    const state = registryMetadata();
    let temporaryRoot = "";

    try {
      await expect(
        verifyRegistryPackage({
          version,
          packageRoot,
          onTemporaryRootCreated: (root: string) => {
            temporaryRoot = root;
          },
          lookup: () => Promise.resolve({
            metadata: state.metadata,
            packageDocument: state.packageDocument,
          }),
          fetchAttestations: () => Promise.resolve(provenanceAttestations()),
          expectedCommit: "a".repeat(40),
          download: () => Promise.resolve(state.bytes),
          validateTarball: () => undefined,
          runFixture: () => Promise.reject(new Error("registry fixture failure")),
          auditSignatures: () => undefined,
          attempts: 1,
        }),
      ).rejects.toThrow(/registry fixture failure/i);
      expect(temporaryRoot).not.toBe("");
      expect(existsSync(temporaryRoot)).toBe(false);
    } finally {
      rmSync(packageRoot, { force: true, recursive: true });
    }
  });
});

describe("release workflow contract", () => {
  const workflowPath = resolve(".github/workflows/release.yml");

  it("uses three ordered jobs with a digest-bound OIDC publish handoff", () => {
    const workflow = readFileSync(workflowPath, "utf8");

    expect(workflow).toMatch(/push:\s*\n\s*tags:\s*\n\s*- ["']v\*-alpha\.\*["']/);
    expect(workflow).toMatch(/cancel-in-progress:\s*false/);
    expect(workflow).toMatch(/\n {2}verify:\n/);
    expect(workflow).toMatch(/\n {2}publish:\n[\s\S]*?needs:\s*verify/);
    expect(workflow).toMatch(/\n {2}verify-registry:\n[\s\S]*?needs:\s*publish/);
    expect(workflow.match(/id-token:\s*write/g)).toHaveLength(1);
    expect(workflow).not.toMatch(/NODE_AUTH_TOKEN|NPM_TOKEN|npm[_-]?token|secrets\./i);
    expect(workflow).toMatch(/npm publish [^\n]+ --access public --tag next --provenance/);
    expect(workflow).toContain('candidate_path="$(realpath "${candidates[0]}")"');
    expect(workflow).toMatch(/sha256sum[\s\S]*needs\.verify\.outputs\.digest/);
    expect(workflow).toMatch(/tar -xOf [^\n]+ package\/package\.json/);
    expect(workflow).toMatch(/candidate_manifest\.version[\s\S]*RELEASE_VERSION/);
    expect(workflow).toMatch(/candidate_manifest\.repository/);
    expect(workflow).toMatch(/clbhll\/base-design-system/);
    expect(workflow).toMatch(/candidate_manifest\.publishConfig/);
    expect(workflow).toMatch(/registry\.npmjs\.org/);
  });

  it("pins every action and exact toolchain version", () => {
    const workflow = readFileSync(workflowPath, "utf8");
    const actions = [...workflow.matchAll(/uses:\s*([^\s#]+)/g)].map((match) => match[1]);
    expect(actions.length).toBeGreaterThan(0);
    expect(actions.every((action) => /@[0-9a-f]{40}$/.test(action))).toBe(true);
    expect(workflow).toContain("node-version: 24");
    expect(workflow).toContain("npm@11.19.0");
    expect(workflow).toContain("version: 10.30.3");
    expect(workflow).toContain("pnpm install --frozen-lockfile");

    const resolvedActions = [
      ["actions/checkout", "v4.4.0", "11d5960a326750d5838078e36cf38b85af677262"],
      ["actions/setup-node", "v4.4.0", "49933ea5288caeca8642d1e84afbd3f7d6820020"],
      ["pnpm/action-setup", "v4.3.0", "b906affcce14559ad1aafd4ab0e942779e9f58b1"],
      ["actions/upload-artifact", "v4.6.2", "ea165f8d65b6e75b540449e92b4886f43607fa02"],
      ["actions/download-artifact", "v4.3.0", "d3f86a106a0bac45b974a628896c90dbdf5c8093"],
    ];
    const annotatedActions = [...workflow.matchAll(
      /# ([^\s]+) (v\d+\.\d+\.\d+)\n\s+- uses: ([^@\s]+)@([0-9a-f]{40})/g,
    )].map((match) => match.slice(1));
    expect(annotatedActions).toHaveLength(actions.length);
    for (const [commentedAction, tag, usedAction, sha] of annotatedActions) {
      expect(commentedAction).toBe(usedAction);
      expect(resolvedActions).toContainEqual([usedAction, tag, sha]);
    }
  });

  it("versions the first alpha while keeping the ordinary verify gate offline", () => {
    const manifest = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
      version: string;
    };
    expect(manifest.version).toBe(version);
    expect(manifest.scripts["release:prepare"]).toBe("node scripts/prepare-release.mjs");
    expect(manifest.scripts["fixture:registry"]).toBe("node scripts/verify-registry-package.mjs");
    expect(manifest.scripts.verify).not.toMatch(/fixture:registry|verify-registry-package/);
  });

  it("keeps alpha pre-mode and consumes exactly the intended release changesets", () => {
    const state = JSON.parse(readFileSync(".changeset/pre.json", "utf8")) as {
      mode: string;
      tag: string;
    };
    const releaseChangesets = [
      "brave-actions-arrive.md",
      "bright-bases-bloom.md",
      "calm-primitives-grow.md",
    ];
    const pendingChangesets = readdirSync(".changeset")
      .filter((file) => file.endsWith(".md") && file !== "README.md")
      .sort();
    const archivedChangesets = readdirSync(".changeset/pre")
      .filter((file) => file.endsWith(".md"))
      .sort();
    const changelog = readFileSync("CHANGELOG.md", "utf8");

    expect(state.mode).toBe("pre");
    expect(state.tag).toBe("alpha");
    expect(pendingChangesets).toEqual([]);
    expect(archivedChangesets).toEqual(releaseChangesets);
    expect(changelog).toBe(`# @calebhill/base

## 0.1.0-alpha.0

### Minor Changes

- 5b36749: Add Button, ButtonLink, MoreIcon, and TrashIcon as the first accessible Base action primitives.
- 91e70b9: Add the semantic light and dark token contract plus opt-in typography, link, focus, press, and reduced-motion foundation styles.
- 9e48fd5: Add TextInput and ProgressBar as accessible Base input and feedback primitives.
`);
  });

  it("documents npm's required bootstrap latest tag without assigning latest to an alpha", () => {
    const runbook = readFileSync("docs/releasing.md", "utf8");

    expect(runbook).toContain("npm's required `latest` tag");
    expect(runbook).toContain("no pending top-level `.changeset/*.md` files");
    expect(runbook).toContain("the three consumed changesets retained under `.changeset/pre`");
    expect(runbook).toContain("`latest` still points to the deprecated `0.0.0` bootstrap");
    expect(runbook).toContain("An alpha must never receive `latest`");
  });
});
