import dayjs from 'dayjs';
import dedent from 'dedent';

/**
 * @type {import('semantic-release').GlobalConfig}
 */
export default {
  branches: ['main', 'next', 'alpha', 'beta'],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        parserOpts: {
          headerPattern: /^([^\s]+)\s(\w+)(?:\(([^)]+)\))?:\s(.+)$/,
          headerCorrespondence: ['emoji', 'type', 'scope', 'subject'],
        },
        releaseRules: [
          { type: 'feat', release: 'minor' },
          { type: 'fix', release: 'patch' },
          { type: 'docs', release: false },
          { type: 'style', release: false },
          { type: 'perf', release: false },
          { type: 'test', release: false },
          { type: 'refact', release: false },
          { type: 'revert', release: false },
          { type: 'merge', release: false },
          { type: 'chore', release: false },
          { type: 'breaking', release: 'major' },
        ],
      },
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        parserOpts: {
          headerPattern: /^([^\s]+)\s(\w+)(?:\(([^)]+)\))?:\s(.+)$/,
          headerCorrespondence: ['emoji', 'type', 'scope', 'subject'],
        },
        writerOpts: {
          groupBy: 'type',
          commitGroupsSort: 'title',
          commitsSort: ['scope', 'subject'],
          noteGroupsSort: 'title',
          transform: (commit, context) => {
            const typeMap = {
              feat: '✨ Features',
              fix: '🐛 Fixes',
              chore: '🔧 Chores',
              docs: '📚 Documentation',
              refactor: '♻️ Refactoring',
              test: '🧪 Tests',
              breaking: '🔥 Breaking Changes',
            };

            if (!typeMap[commit.type]) return;

            const repo = `${context.host}/${context.owner}/${context.repository}`;

            return {
              ...commit,
              type: typeMap[commit.type],
              scope: commit.scope || '*',
              // Ensure the first letter is uppercase
              subject: commit.subject.charAt(0).toUpperCase() + commit.subject.slice(1) || '',
              author: commit.author?.name || '',
              userUrl: `${context.host}/${commit.author?.name}`,
              commitUrl: `${repo}/commit/${commit.hash}`,
            };
          },
          mainTemplate: dedent`
              ## 📦 Release {{version}} – {{date}}

              {{#if commitGroups.length}}
              {{#each commitGroups}}
              ### {{title}}

              {{#each commits}}
              - {{#if scope}}**{{scope}}:** {{/if}} {{subject}} • Thanks to **{{author}}**! ([{{commit.short}}]({{commitUrl}}))
              {{/each}}

              {{/each}}
              {{/if}}

              {{#if notes.length}}
              ### 🛑 Breaking Changes

              {{#each notes}}
              - {{text}}
              {{/each}}
              {{/if}}
          `,
          headerPartial: '',
          commitPartial: '',
          footerPartial: '',
          dateFormatter: () => dayjs().format('YYYY-MM-DD'),
        },
      },
    ],
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json', 'dist/**/*.js'],
        message: '📦 release: ${nextRelease.version} \n\n${nextRelease.notes}',
      },
    ],
    [
      '@semantic-release/github',
      {
        assets: [{ path: 'dist/index.cjs', label: 'CommonJS distribution' }],
        assets: [{ path: 'dist/index.mjs', label: 'ESM distribution' }],
      },
    ],
  ],
};
