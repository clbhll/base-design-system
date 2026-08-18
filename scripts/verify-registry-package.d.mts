export interface RegistryDist {
  integrity: string;
  tarball: string;
  attestations: {
    url: string;
    provenance: { predicateType: string };
  };
  signatures: Array<{ keyid: string; sig: string }>;
}

export interface RegistryMetadata {
  name: string;
  version: string;
  dist: RegistryDist;
}

export interface RegistryPackageDocument {
  name?: string;
  "dist-tags": { next: string };
  versions: Record<string, unknown>;
}

export interface AttestationDocument {
  attestations: Array<{
    predicateType: string;
    bundle: { dsseEnvelope: { payload: string } };
  }>;
}

export function assertRegistryMetadata(options: {
  metadata: RegistryMetadata;
  packageDocument: RegistryPackageDocument;
  version: string;
}): void;
export function assertTarballIntegrity(bytes: Uint8Array, integrity: string): void;
export function assertProvenanceAttestations(options: {
  document: AttestationDocument;
  version: string;
  integrity: string;
  expectedCommit: string;
}): void;
export function retryRegistryLookup<T>(
  operation: () => Promise<T>,
  options?: {
    attempts?: number;
    delayMs?: number;
    delay?: (milliseconds: number) => Promise<void>;
  },
): Promise<T>;
export interface VerifyRegistryPackageOptions {
  version: string;
  packageRoot?: string;
  onTemporaryRootCreated?: (root: string) => void;
  lookup?: (version: string) => Promise<{
    metadata: RegistryMetadata;
    packageDocument: RegistryPackageDocument;
  }>;
  fetchAttestations?: (url: string) => Promise<AttestationDocument>;
  expectedCommit: string;
  download?: (url: string) => Promise<Uint8Array>;
  validateTarball?: (tarball: string) => Promise<void> | void;
  runFixture?: (
    fixtureTemplate: "vite-smoke" | "next-smoke",
    version: string,
    tarball: string,
    packageRoot: string,
    attemptRoot: string,
  ) => Promise<void> | void;
  auditSignatures?: (root: string, version: string) => Promise<void> | void;
  attempts?: number;
  delay?: (milliseconds: number) => Promise<void>;
}

export function verifyRegistryPackage(
  options: VerifyRegistryPackageOptions,
): Promise<{ version: string; integrity: string }>;
