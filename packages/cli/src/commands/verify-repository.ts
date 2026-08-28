import { execFileSync, spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import {
  REFERENCE_IGNORE_TARGETS,
  findRepositoryPolicyViolations,
  type RepositoryManifest,
  type RepositoryPolicyInput,
  type RepositoryPolicyViolation,
  type RepositorySourceFile,
  type RepositorySourceSymlink,
} from './repository-policy.js';

export { findRepositoryPolicyViolations } from './repository-policy.js';
export type {
  RepositoryManifest,
  RepositoryPolicyInput,
  RepositoryPolicyViolation,
  RepositorySourceFile,
  RepositorySourceSymlink,
  WorkspacePackageId,
} from './repository-policy.js';

const PACKAGE_IDS = ['cli', 'catalog', 'core', 'schema'] as const;
const DEPENDENCY_SECTIONS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
] as const;

interface RawPackageManifest {
  name?: unknown;
  dependencies?: unknown;
  devDependencies?: unknown;
  peerDependencies?: unknown;
  optionalDependencies?: unknown;
}

export interface ReadRepositoryPolicyOptions {
  root: string;
  trackedFiles?: readonly string[];
  effectivelyIgnoredReferenceTargets?: readonly string[];
}

export class RepositoryPolicyError extends Error {
  readonly violations: readonly RepositoryPolicyViolation[];

  constructor(violations: readonly RepositoryPolicyViolation[]) {
    const sorted = [...violations].sort((left, right) =>
      compareText(
        `${left.path}\0${left.code}\0${left.specifier ?? ''}`,
        `${right.path}\0${right.code}\0${right.specifier ?? ''}`,
      ),
    );
    super(
      `Repository-Policy verletzt (${sorted.length} Befunde):\n${sorted
        .map((violation) => `[${violation.code}] ${violation.path}: ${violation.detail}`)
        .join('\n')}`,
    );
    this.name = 'RepositoryPolicyError';
    this.violations = sorted;
  }
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function readGitTrackedFiles(root: string): string[] {
  const output = execFileSync(
    'git',
    ['-c', 'core.fsmonitor=false', 'ls-files', '--cached', '-z'],
    {
      cwd: root,
      maxBuffer: 16 * 1024 * 1024,
    },
  );
  return output
    .toString('utf8')
    .split('\0')
    .filter((path) => path.length > 0)
    .sort();
}

export function readGitIgnoredReferenceTargets(root: string): string[] {
  return REFERENCE_IGNORE_TARGETS.filter((target) => {
    const result = spawnSync(
      'git',
      [
        '-c',
        'core.fsmonitor=false',
        'check-ignore',
        '--no-index',
        '--quiet',
        '--',
        target,
      ],
      { cwd: root, encoding: 'utf8' },
    );
    if (result.status === 0) return true;
    if (result.status === 1) return false;
    if (result.error !== undefined) throw result.error;
    throw new Error(
      `git check-ignore für ${target} fehlgeschlagen: ${result.stderr.trim() || `Status ${String(result.status)}`}`,
    );
  });
}

function repositoryPath(root: string, absolutePath: string): string {
  return relative(root, absolutePath).split(sep).join('/');
}

interface SourceTreePaths {
  files: string[];
  symlinks: string[];
}

function sourcePaths(directory: string): SourceTreePaths {
  const paths: SourceTreePaths = { files: [], symlinks: [] };
  for (const entry of readdirSync(directory, { withFileTypes: true }).sort((left, right) =>
    compareText(left.name, right.name),
  )) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      const nested = sourcePaths(path);
      paths.files.push(...nested.files);
      paths.symlinks.push(...nested.symlinks);
    } else if (entry.isSymbolicLink()) {
      paths.symlinks.push(path);
    } else if (entry.isFile() && /\.[cm]?tsx?$/u.test(entry.name)) {
      paths.files.push(path);
    }
  }
  return paths;
}

interface DependencyModel {
  dependencies: Record<string, unknown>;
  malformedSections: string[];
}

function dependencyEntries(raw: RawPackageManifest): DependencyModel {
  const dependencies: Record<string, unknown> = {};
  const malformedSections: string[] = [];
  for (const section of DEPENDENCY_SECTIONS) {
    const values = raw[section];
    if (values === undefined) continue;
    if (values === null || typeof values !== 'object' || Array.isArray(values)) {
      malformedSections.push(section);
      continue;
    }
    for (const [name, version] of Object.entries(values)) {
      dependencies[name] = version;
    }
  }
  return { dependencies, malformedSections };
}

export function readRepositoryPolicyInput(
  options: ReadRepositoryPolicyOptions,
): RepositoryPolicyInput {
  const manifests: RepositoryManifest[] = [];
  const sourceFiles: RepositorySourceFile[] = [];
  const sourceSymlinks: RepositorySourceSymlink[] = [];

  for (const id of PACKAGE_IDS) {
    const manifestPath = join(options.root, 'packages', id, 'package.json');
    const raw = JSON.parse(readFileSync(manifestPath, 'utf8')) as RawPackageManifest;
    if (typeof raw.name !== 'string') {
      throw new Error(`${repositoryPath(options.root, manifestPath)} enthält keinen Paketnamen.`);
    }
    const dependencyModel = dependencyEntries(raw);
    manifests.push({
      id,
      name: raw.name,
      path: repositoryPath(options.root, manifestPath),
      dependencies: dependencyModel.dependencies,
      malformedDependencySections: dependencyModel.malformedSections,
    });

    const packageSources = sourcePaths(join(options.root, 'packages', id, 'src'));
    for (const sourcePath of packageSources.files) {
      sourceFiles.push({
        packageId: id,
        path: repositoryPath(options.root, sourcePath),
        source: readFileSync(sourcePath, 'utf8'),
      });
    }
    for (const symlinkPath of packageSources.symlinks) {
      sourceSymlinks.push({
        packageId: id,
        path: repositoryPath(options.root, symlinkPath),
      });
    }
  }

  return {
    manifests,
    sourceFiles,
    sourceSymlinks,
    trackedFiles: [...(options.trackedFiles ?? readGitTrackedFiles(options.root))],
    gitignore: readFileSync(join(options.root, '.gitignore'), 'utf8'),
    effectivelyIgnoredReferenceTargets: [
      ...(options.effectivelyIgnoredReferenceTargets ??
        readGitIgnoredReferenceTargets(options.root)),
    ],
  };
}

export function verifyRepository(options: Partial<ReadRepositoryPolicyOptions> = {}): void {
  const input = readRepositoryPolicyInput({
    root: options.root ?? process.cwd(),
    ...(options.trackedFiles !== undefined ? { trackedFiles: options.trackedFiles } : {}),
    ...(options.effectivelyIgnoredReferenceTargets !== undefined
      ? { effectivelyIgnoredReferenceTargets: options.effectivelyIgnoredReferenceTargets }
      : {}),
  });
  const violations = findRepositoryPolicyViolations(input);
  if (violations.length > 0) throw new RepositoryPolicyError(violations);
  console.log('Repository-Gate bestanden.');
}
