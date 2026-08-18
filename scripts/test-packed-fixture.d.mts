export function assertExactPackageSpec(packageSpec: string): string;

export function assertFixtureTemplateContract(
  fixtureTemplateRoot: string,
  fixtureTemplate: "vite-smoke" | "next-smoke",
): void;

export function assertInstalledFileParity(
  tarballPath: string,
  installedPackageRoot: string,
): void;

export function assertPathContained(targetPath: string, taskRoot: string): void;

export function assertInstalledPackageIdentity(
  installedPackageRoot: string,
  expectedVersion: string,
): void;

export interface InstalledFixtureOptions {
  fixtureTemplate?: "vite-smoke" | "next-smoke";
  packageRoot?: string;
  packageSpec?: string;
  onInstalledPackage?: (installedPackageRoot: string) => void;
  onTemporaryRootCreated?: (temporaryRoot: string) => void;
}

export function runInstalledFixture(options?: InstalledFixtureOptions): Promise<void>;
export function runPackedFixture(options?: Omit<InstalledFixtureOptions, "fixtureTemplate">): Promise<void>;
export function runPackedFixtures(options?: { packageRoot?: string }): Promise<void>;
