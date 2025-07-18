import { defineVitestConfig, project } from '@nuxo/vitest';

export default defineVitestConfig({
  projects: {
    mode: 'replace',
    config: [
      project('email'),
      project('id'),
      project('string'),
    ],
  },
});
