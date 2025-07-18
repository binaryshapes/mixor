import { defineVitestConfig, project } from '@nuxo/vitest';

export default defineVitestConfig({
  projects: {
    mode: 'replace',
    config: [
      project('aggregate'),
      project('builder'),
      project('container'),
      project('doc'),
      project('env'),
      project('event'),
      project('flow'),
      project('hash'),
      project('metadata'),
      project('panic'),
      project('pipe'),
      project('result'),
      project('schema'),
      project('specification'),
      project('value'),
    ],
  },
});
