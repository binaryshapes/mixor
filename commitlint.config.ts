import type { UserConfig } from '@commitlint/types';

const Config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'body-max-line-length': [0], // Disable body max line length check.
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'perf',
        'test',
        'refact',
        'revert',
        'merge',
        'chore',
      ],
    ],
  },
};

export default Config;
