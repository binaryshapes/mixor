import type { UserConfig } from '@commitlint/types';

const Config: UserConfig = {
  parserPreset: {
    parserOpts: {
      headerPattern:
        /^(?<type>.*\s\w*)(?:\((?<scope>.*)\))?!?:\s(?<subject>(?:(?!#).)*(?:(?!\s).))$/,
      headerCorrespondence: ['type', 'scope', 'subject'],
    },
  },
  rules: {
    'body-leading-blank': [2, 'always'],
    'footer-leading-blank': [2, 'always'],
    'header-max-length': [2, 'always', 72],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-case': [
      2,
      'never',
      ['sentence-case', 'start-case', 'pascal-case', 'upper-case'],
    ],
    'subject-empty': [2, 'never'],
    'subject-exclamation-mark': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'type-enum': [
      2,
      'always',
      [
        '✨ feat', // Add new feature
        '🐛 fix', // Solve a bug
        '📚 docs', // Add or alter documentation
        '💄 style', // Improve formatting, white-space
        '🚀 perf', // Improve performance
        '🧪 test', // Add or modify tests
        '♻️ refact', // Rewrites code without feature, performance or bug changes
        '⏪ revert', // Changes that reverting other changes
        '🔀 merge', // Merge branches
        '🔧 chore', // Changes to the build process or auxiliary tools and libraries such as documentation generation
      ],
    ],
  },
};

export default Config;
