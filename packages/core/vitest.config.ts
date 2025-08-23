import { defineVitestConfig, project } from '@nuxo/vitest';

export default defineVitestConfig({
  projects: [
    project('registry'),
    project('component'),
  ],
});
