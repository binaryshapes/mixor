import { defineVitestConfig } from '@unokit/vitest';

/**
 * Defines a project for the test runner.
 *
 * @param name - The name of the project.
 * @param typecheck - Whether to enable type checking.
 * @returns A project configuration object.
 */
function project(name: string, typecheck = true) {
  return {
    test: {
      name,
      include: [`tests/${name}.spec.ts`],
      typecheck: typecheck
        ? {
            enabled: true,
            include: [`tests/${name}.spec.ts`],
            checker: 'tsc',
          }
        : undefined,
    },
  };
}

export default defineVitestConfig({
  projects: {
    mode: 'replace',
    config: [
      project('string'),
      project('id'),
      project('internet'),
      project('financial'),
      project('email'),
    ],
  },
});
