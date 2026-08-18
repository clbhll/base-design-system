export interface ReleasePackageManifest {
  name: string;
  version: string;
  repository: { type: string; url: string } | string;
  publishConfig: {
    access: string;
    provenance: boolean;
    registry: string;
    tag: string;
  };
}

export interface PrereleaseState {
  mode: string;
  tag: string;
}

export interface ReleaseStateOptions {
  tag: string;
  packageJson: ReleasePackageManifest;
  preState: PrereleaseState;
  pendingChangesets: string[];
  ci?: boolean;
  containedInMain?: boolean;
}

export function assertReleaseState(options: ReleaseStateOptions): void;
export function assertReleaseCandidateIdentity(
  candidateManifest: ReleasePackageManifest,
  releaseManifest: ReleasePackageManifest,
): void;
export function readReleaseCandidateManifest(
  tarballPath: string,
): ReleasePackageManifest;
export function assertVersionAbsent(
  packageDocument: { versions?: Record<string, unknown> },
  version: string,
): void;

export interface PrepareReleaseCandidateOptions {
  packageRoot?: string;
  tag: string;
  preState: PrereleaseState;
  pendingChangesets: string[];
  containedInMain: boolean;
  registryDocument: { versions?: Record<string, unknown> };
  outputDirectory?: string;
  onTemporaryRootCreated?: (root: string) => void;
  packCandidate?: (packageRoot: string, destination: string) => string;
  validateTarball?: (tarball: string) => Promise<void> | void;
  runFixture?: (
    fixtureTemplate: "vite-smoke" | "next-smoke",
    tarball: string,
    packageRoot: string,
  ) => Promise<void> | void;
}

export function prepareReleaseCandidate(
  options: PrepareReleaseCandidateOptions,
): Promise<{ digest: string; path: string; version: string }>;
