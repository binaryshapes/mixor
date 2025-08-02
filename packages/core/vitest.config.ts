import { defineVitestConfig, project } from '@nuxo/vitest';

export default defineVitestConfig({
  projects: [
    project('aggregate'),
    project('builder'),
    project('container'),
    project('criteria'),
    project('doc'),
    project('element'),
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
    project('trace'),
    project('value'),
  ],
});
