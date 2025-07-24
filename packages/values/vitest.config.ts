import { defineVitestConfig, project } from '@nuxo/vitest';

export default defineVitestConfig({
  projects: [
    project('email'),
    project('enumerate'),
    project('id'),
    project('string'),
  ],
});
