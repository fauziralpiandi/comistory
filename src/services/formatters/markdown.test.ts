import { Commit } from '../../models/commit';
import { markdownFormatter } from './markdown';

describe('MarkdownFormatter', () => {
  test('formats single commit correctly', () => {
    const commits: Commit[] = [
      {
        hash: '1234567890abcdef',
        shortHash: '1234567',
        message: 'feat: add new feature',
        date: new Date('2023-01-15T10:00:00Z'),
      },
    ];

    const result = markdownFormatter.format(commits);

    expect(result).toContain('# Comistory');
    expect(result).toContain('## 2023/01/15');
    expect(result).toContain('### ✨ Feature');
    expect(result).toContain('- feat: add new feature');
  });

  test('categorizes commits correctly', () => {
    const commits: Commit[] = [
      {
        hash: '1234567890abcdef',
        shortHash: '1234567',
        message: 'feat: add new feature',
        date: new Date('2023-01-15'),
      },
      {
        hash: '0987654321fedcba',
        shortHash: '0987654',
        message: 'fix: resolve bug',
        date: new Date('2023-01-15'),
      },
      {
        hash: 'aabbccddeeff1122',
        shortHash: 'aabbccd',
        message: 'docs: update README',
        date: new Date('2023-01-15'),
      },
    ];

    const result = markdownFormatter.format(commits);

    expect(result).toContain('### ✨ Feature');
    expect(result).toContain('### 🐛 Bug Fix');
    expect(result).toContain('### 📚 Documentation');
  });

  test('groups commits by day correctly', () => {
    const commits: Commit[] = [
      {
        hash: '1111111111111111',
        shortHash: '1111111',
        message: 'feat: day 1 feature',
        date: new Date('2023-01-01'),
      },
      {
        hash: '2222222222222222',
        shortHash: '2222222',
        message: 'feat: day 2 feature',
        date: new Date('2023-01-02'),
      },
    ];

    const result = markdownFormatter.format(commits);

    expect(result).toContain('## 2023/01/02');
    expect(result).toContain('## 2023/01/01');
    expect(result).toContain('- feat: day 2 feature');
    expect(result).toContain('- feat: day 1 feature');
  });

  test('sorts days in descending order (newest first)', () => {
    const commits: Commit[] = [
      {
        hash: '1111111111111111',
        shortHash: '1111111',
        message: 'feat: older feature',
        date: new Date('2023-01-01'),
      },
      {
        hash: '2222222222222222',
        shortHash: '2222222',
        message: 'feat: newer feature',
        date: new Date('2023-01-02'),
      },
    ];

    const result = markdownFormatter.format(commits);
    const dayHeadingPositions = [
      result.indexOf('## 2023/01/02'),
      result.indexOf('## 2023/01/01'),
    ];

    // Verify the newer date appears before the older date
    expect(dayHeadingPositions[0]).toBeLessThan(dayHeadingPositions[1]);
  });

  test('adds PR and commit links for commits with repo URL', () => {
    const commits: Commit[] = [
      {
        hash: '1234567890abcdef',
        shortHash: '1234567',
        message: 'feat: add new feature (#123)',
        date: new Date('2023-01-15'),
        prNumber: '123',
        repoUrl: 'https://github.com/user/repo',
      },
    ];

    const result = markdownFormatter.format(commits);

    expect(result).toContain(
      '[1234567](https://github.com/user/repo/commit/1234567890abcdef)',
    );
    expect(result).toContain('[#123](https://github.com/user/repo/pull/123)');
  });

  test('handles empty commits array', () => {
    expect(markdownFormatter.format([])).toBe('# No commits found');
  });

  test('categorizes conventional commit types correctly', () => {
    const commits: Commit[] = [
      {
        hash: '1111111111111111',
        shortHash: '1111111',
        message: 'feat: add new feature',
        date: new Date('2023-01-15'),
      },
      {
        hash: '2222222222222222',
        shortHash: '2222222',
        message: 'fix: resolve bug',
        date: new Date('2023-01-15'),
      },
      {
        hash: '3333333333333333',
        shortHash: '3333333',
        message: 'docs: update documentation',
        date: new Date('2023-01-15'),
      },
      {
        hash: '4444444444444444',
        shortHash: '4444444',
        message: 'style: format code',
        date: new Date('2023-01-15'),
      },
      {
        hash: '5555555555555555',
        shortHash: '5555555',
        message: 'refactor: improve code structure',
        date: new Date('2023-01-15'),
      },
      {
        hash: '6666666666666666',
        shortHash: '6666666',
        message: 'test: add more tests',
        date: new Date('2023-01-15'),
      },
      {
        hash: '7777777777777777',
        shortHash: '7777777',
        message: 'build: update dependencies',
        date: new Date('2023-01-15'),
      },
      {
        hash: '8888888888888888',
        shortHash: '8888888',
        message: 'chore: miscellaneous tasks',
        date: new Date('2023-01-15'),
      },
      {
        hash: '9999999999999999',
        shortHash: '9999999',
        message: 'perf: improve performance',
        date: new Date('2023-01-15'),
      },
    ];

    const result = markdownFormatter.format(commits);

    expect(result).toContain('### ✨ Feature');
    expect(result).toContain('### 🐛 Bug Fix');
    expect(result).toContain('### 📚 Documentation');
    expect(result).toContain('### 🎨 Style');
    expect(result).toContain('### ♻️ Refactor');
    expect(result).toContain('### 🧪 Test');
    expect(result).toContain('### 🏗️ Build');
    expect(result).toContain('### 🔧 Chore');
    expect(result).toContain('### ⚡ Performance');

    expect(result).toContain('- feat: add new feature');
    expect(result).toContain('- fix: resolve bug');
    expect(result).toContain('- docs: update documentation');
  });

  test('categorizes feat! syntax as breaking change', () => {
    const commits: Commit[] = [
      {
        hash: 'abcdef1234567890',
        shortHash: 'abcdef1',
        message: 'feat!: breaking change feature',
        date: new Date('2023-01-15'),
      },
    ];

    const result = markdownFormatter.format(commits);

    expect(result).toContain('### 🔥 Breaking Change');
    expect(result).toContain('- feat!: breaking change feature');
  });

  test('correctly detects BREAKING CHANGE: format in commit message', () => {
    const commits: Commit[] = [
      {
        hash: 'abcdef1234567890',
        shortHash: 'abcdef1',
        message: 'feat: BREAKING CHANGE: this changes the API',
        date: new Date('2023-01-15'),
      },
    ];

    const result = markdownFormatter.format(commits);

    expect(result).toContain('### 🔥 Breaking Change');
    expect(result).toContain('- feat: BREAKING CHANGE: this changes the API');
  });
});
