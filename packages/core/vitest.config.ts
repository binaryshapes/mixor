import { defineVitestConfig } from '@unokit/vitest';

export default defineVitestConfig({
  projects: {
    mode: 'replace',
    config: [
      {
        test: {
          name: 'pipe',
          include: ['tests/pipe.spec.ts'],
          typecheck: {
            enabled: true,
            include: ['tests/pipe.spec.ts'],
            checker: 'tsc',
          },
        },
      },
      {
        test: {
          name: 'flow',
          include: ['tests/flow.spec.ts'],
          typecheck: {
            enabled: true,
            include: ['tests/flow.spec.ts'],
            checker: 'tsc',
          },
        },
      },
      {
        test: {
          name: 'result',
          include: ['tests/result.spec.ts'],
          typecheck: {
            enabled: true,
            include: ['tests/result.spec.ts'],
            checker: 'tsc',
          },
        },
      },
      {
        test: {
          name: 'metadata',
          include: ['tests/metadata.spec.ts'],
        },
      },
    ],
  },
});
