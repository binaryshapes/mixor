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
          name: 'builder',
          include: ['tests/builder.spec.ts'],
          typecheck: {
            enabled: true,
            include: ['tests/builder.spec.ts'],
            checker: 'tsc',
          },
        },
      },
      {
        test: {
          name: 'flow2',
          include: ['tests/flow2.spec.ts'],
          typecheck: {
            enabled: true,
            include: ['tests/flow2.spec.ts'],
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
          name: 'panic',
          include: ['tests/panic.spec.ts'],
          typecheck: {
            enabled: true,
            include: ['tests/panic.spec.ts'],
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
      {
        test: {
          name: 'container',
          include: ['tests/container.spec.ts'],
          typecheck: {
            enabled: true,
            include: ['tests/container.spec.ts'],
            checker: 'tsc',
          },
        },
      },
    ],
  },
});
