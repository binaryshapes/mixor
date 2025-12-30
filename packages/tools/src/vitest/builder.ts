import { type TestProjectConfiguration, defineConfig } from 'vitest/config';

/**
 * Options for Vitest configuration.
 */
type VitestOptions = {
  /**
   * Whether to use globals.
   * This need to set "types": ["vitest/globals"] in tsconfig.json.
   *
   * @defaultValue true
   */
  globals?: boolean;
  /**
   * Whether to watch for changes.
   *
   * @defaultValue false
   */
  watch?: boolean;
  /**
   * Whether to use UI.
   *
   * @defaultValue false
   */
  ui?: boolean;
  /**
   * The directory to run the tests.
   *
   * @defaultValue './tests'
   */
  dir?: string;
  /**
   * Whether to disable console intercept.
   *
   * @defaultValue true
   */
  disableConsoleIntercept?: boolean;
  /**
   * The thresholds for the tests.
   *
   * @defaultValue 90
   */
  thresholds?: number;

  /**
   * The tsconfig file to use for typechecking.
   *
   * @defaultValue './tsconfig.json'
   */
  typecheckTsConfig?: string;

  /**
   * The projects to run the tests.
   *
   * @defaultValue `{ mode: 'add', config: [] }`
   */
  projects?: ((tsconfig: string) => TestProjectConfiguration)[];
};

/**
 * The default configuration for Vitest.
 * Nuxo team prefer to use this configuration.
 */
const defaultConfig = {
  globals: true,
  watch: false,
  ui: false,
  dir: './tests',
  thresholds: 90,
  disableConsoleIntercept: true,
  typecheckTsConfig: './tsconfig.spec.json',
} satisfies VitestOptions;

/**
 * Base configuration for Vitest.
 *
 * @param config - The configuration for Vitest.
 * @returns The configuration for Vitest.
 */
const defineVitestConfig = (config: VitestOptions = defaultConfig) => {
  // Checking given options and merge with default options.
  config = { ...defaultConfig, ...config };

  return defineConfig({
    test: {
      globals: config.globals,
      watch: config.watch,
      ui: config.ui,
      dir: config.dir,
      environment: 'node',
      reporters: [
        [
          'verbose',
          {
            isTTY: true,
            summary: false,
          },
        ],
      ],
      disableConsoleIntercept: config.disableConsoleIntercept,
      outputFile: {
        ifNoTests: 'warn',
        ifFailed: 'error',
      },
      coverage: {
        reportsDirectory: './coverage',
        enabled: false,
        provider: 'v8',
        include: [
          'src/**/*.ts',
        ],
        exclude: [
          '**/index.ts',
        ],
        reporter: [
          ['text', { skipEmpty: true }],
          ['html', { skipEmpty: true }],
        ],
        cleanOnRerun: true,
        thresholds: {
          statements: config.thresholds,
          branches: config.thresholds,
          functions: config.thresholds,
          lines: config.thresholds,
        },
      },
      projects: config.projects?.map((p) =>
        p(config.typecheckTsConfig ?? defaultConfig.typecheckTsConfig),
      ) ?? [
        {
          test: {
            include: ['tests/**/*.spec.ts'],
            typecheck: {
              enabled: true,
              include: ['tests/**/*.spec.ts'],
              checker: 'tsc',
              tsconfig: './tsconfig.spec.json',
            },
          },
        },
      ],
    },
  });
};
export default defineVitestConfig;
