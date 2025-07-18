import { defineVitestConfig, project } from '@nuxo/vitest';

export default defineVitestConfig({
  projects: {
    mode: 'replace',
    config: [
      project('email'),
      project('enumerate'),
      project('id'),
      project('string'),
    ],
  },
});
