/**
 * Script to automatically update release-please configuration
 * Detects all packages in packages/ and adds them to the configuration
 *
 * Usage:
 * node packages/tools/bin/sync-release-please.ts
 * node packages/tools/bin/sync-release-please.ts --dry-run
 * node packages/tools/bin/sync-release-please.ts -n
 *
 * Options:
 * --dry-run, -n    Show what changes would be made without modifying files
 */
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

interface PackageConfig {
  'component-no-space': boolean;
  component: string;
  'changelog-path': string;
  'extra-label': string;
  'extra-files': Array<{
    type: string;
    path: string;
    jsonpath: string;
  }>;
}

interface ReleasePleaseConfig {
  'release-type': string;
  'include-component-in-tag': boolean;
  'bootstrap-sha': string;
  'include-v-in-tag': boolean;
  'tag-separator': string;
  'separate-pull-requests': boolean;
  'pull-request-title-pattern': string;
  'pull-request-header': string;
  'pull-request-footer': string;
  'initial-version': string;
  packages: Record<string, PackageConfig>;
  'changelog-sections': Array<unknown>;
  $schema: string;
}

const PACKAGES_DIR = 'packages';
const CONFIG_FILE = 'release-please-config.json';
const MANIFEST_FILE = '.release-please-manifest.json';
const INITIAL_VERSION = '0.0.1';

/**
 * Parse the command line arguments.
 * @returns The command line arguments.
 *
 * @internal
 */
function parseArgs(): { dryRun: boolean } {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-n');
  return { dryRun };
}

/**
 * Find all packages in the packages directory.
 * @returns The list of packages.
 *
 * @internal
 */
async function findPackages(): Promise<string[]> {
  const packages: string[] = [];

  try {
    const entries = await readdir(PACKAGES_DIR, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const packageJsonPath = join(PACKAGES_DIR, entry.name, 'package.json');
        try {
          await stat(packageJsonPath);
          packages.push(entry.name);
        } catch {
          // No package.json found, skip this directory.
        }
      }
    }
  } catch (error) {
    console.error(`Error reading packages directory: ${error}`);
    process.exit(1);
  }

  return packages.sort();
}

/**
 * Create a package configuration.
 * @param packageName - The name of the package.
 * @returns The package configuration.
 *
 * @internal
 */
function createPackageConfig(packageName: string): PackageConfig {
  return {
    'component-no-space': true,
    component: packageName,
    'changelog-path': 'CHANGELOG.md',
    'extra-label': packageName,
    'extra-files': [
      {
        type: 'json',
        path: 'package.json',
        jsonpath: '$.version',
      },
    ],
  };
}

/**
 * Update the config file.
 * @param packages - The list of packages.
 * @param dryRun - Whether to run in dry run mode.
 *
 * @internal
 */
async function updateConfigFile(packages: string[], dryRun: boolean): Promise<void> {
  let config: ReleasePleaseConfig;

  try {
    const configContent = await readFile(CONFIG_FILE, 'utf-8');
    config = JSON.parse(configContent) as ReleasePleaseConfig;
  } catch (error) {
    console.error(`Error reading config file: ${error}`);
    process.exit(1);
  }

  const packagesToAdd: string[] = [];
  const packagesToRemove: string[] = [];

  // Update or add packages
  for (const pkg of packages) {
    const packagePath = `packages/${pkg}`;
    if (!config.packages[packagePath]) {
      packagesToAdd.push(pkg);
      config.packages[packagePath] = createPackageConfig(pkg);
    }
  }

  // Remove packages that no longer exist
  const existingPackages = new Set(packages.map((p) => `packages/${p}`));
  for (const packagePath of Object.keys(config.packages)) {
    if (!existingPackages.has(packagePath)) {
      packagesToRemove.push(packagePath);
      delete config.packages[packagePath];
    }
  }

  // Sort packages alphabetically
  const sortedPackages: Record<string, PackageConfig> = {};
  const sortedKeys = Object.keys(config.packages).sort();
  for (const key of sortedKeys) {
    sortedPackages[key] = config.packages[key];
  }
  config.packages = sortedPackages;

  // Show changes
  if (packagesToAdd.length > 0) {
    console.log(`📝 Would add ${packagesToAdd.length} package(s) to config:`);
    packagesToAdd.forEach((pkg) => console.log(`   ➕ ${pkg}`));
  }
  if (packagesToRemove.length > 0) {
    console.log(`📝 Would remove ${packagesToRemove.length} package(s) from config:`);
    packagesToRemove.forEach((pkg) => console.log(`   ➖ ${pkg}`));
  }
  if (packagesToAdd.length === 0 && packagesToRemove.length === 0) {
    console.log(`ℹ️  Configuration is already up to date`);
  }

  // Write updated file (only if not dry-run)
  if (!dryRun) {
    const updatedContent = JSON.stringify(config, null, 2) + '\n';
    await writeFile(CONFIG_FILE, updatedContent, 'utf-8');
    console.log();
    console.log(`✅ Configuration updated: ${CONFIG_FILE}`);
  } else if (packagesToAdd.length > 0 || packagesToRemove.length > 0) {
    console.log();
    console.log(`🔍 [DRY RUN] Would update: ${CONFIG_FILE}`);
  }
}

/**
 * Update the manifest file.
 * @param packages - The list of packages.
 * @param dryRun - Whether to run in dry run mode.
 *
 * @internal
 */
async function updateManifestFile(packages: string[], dryRun: boolean): Promise<void> {
  let manifest: Record<string, string>;

  try {
    const manifestContent = await readFile(MANIFEST_FILE, 'utf-8');
    manifest = JSON.parse(manifestContent) as Record<string, string>;
  } catch {
    // If file doesn't exist, create a new one
    manifest = {};
  }

  const packagesToAdd: Array<{ path: string; version: string }> = [];
  const packagesToRemove: string[] = [];

  // Add new packages to manifest
  for (const pkg of packages) {
    const packagePath = `packages/${pkg}`;
    if (!manifest[packagePath]) {
      packagesToAdd.push({ path: packagePath, version: INITIAL_VERSION });
      manifest[packagePath] = INITIAL_VERSION;
    }
  }

  // Remove packages that no longer exist
  const existingPackages = new Set(packages.map((p) => `packages/${p}`));
  for (const packagePath of Object.keys(manifest)) {
    if (!existingPackages.has(packagePath)) {
      packagesToRemove.push(packagePath);
      delete manifest[packagePath];
    }
  }

  const updated = packagesToAdd.length > 0 || packagesToRemove.length > 0;

  // Show changes
  if (packagesToAdd.length > 0) {
    console.log(`📝 Would add ${packagesToAdd.length} package(s) to manifest:`);
    packagesToAdd.forEach(({ path, version }) =>
      console.log(`   ➕ ${path} (initial version: ${version})`),
    );
  }
  if (packagesToRemove.length > 0) {
    console.log(`📝 Would remove ${packagesToRemove.length} package(s) from manifest:`);
    packagesToRemove.forEach((pkg) => console.log(`   ➖ ${pkg}`));
  }
  if (!updated) {
    console.log(`ℹ️  Manifest is already up to date`);
  }

  // Write updated file (only if not dry-run).
  if (updated && !dryRun) {
    // Sort manifest alphabetically.
    const sortedManifest: Record<string, string> = {};
    const sortedKeys = Object.keys(manifest).sort();
    for (const key of sortedKeys) {
      sortedManifest[key] = manifest[key];
    }

    const updatedContent = JSON.stringify(sortedManifest, null, 2) + '\n';
    await writeFile(MANIFEST_FILE, updatedContent, 'utf-8');
    console.log(`✅ Manifest updated: ${MANIFEST_FILE}`);
  } else if (updated && dryRun) {
    console.log();
    console.log(`🔍 [DRY RUN] Would update: ${MANIFEST_FILE}`);
  }
}

/**
 * Main function.
 *
 * @internal
 */
async function main() {
  const { dryRun } = parseArgs();

  if (dryRun) {
    console.log('🔍 [DRY RUN MODE] - No files will be modified\n');
  }

  console.log('🔍 Searching for packages in packages/...\n');

  const packages = await findPackages();
  console.log(`📦 Packages detected (${packages.length}):`);
  packages.forEach((pkg) => console.log(`   - ${pkg}`));
  console.log();

  await updateConfigFile(packages, dryRun);
  console.log();
  await updateManifestFile(packages, dryRun);

  if (dryRun) {
    console.log('\n✨ Dry run completed! Use without --dry-run to apply changes.');
  } else {
    console.log('\n✨ Update completed!');
  }
}

// Execute main function
// This file is designed to be executed as a binary, so we always run main()
await main();
