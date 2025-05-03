import { extractPullRequestNumber } from './helpers';

describe('extractPullRequestNumber', () => {
  test('extracts PR number from "Merge pull request #123" format', () => {
    expect(
      extractPullRequestNumber('Merge pull request #123 from user/branch'),
    ).toBe('123');
  });

  test('extracts PR number from "(#123)" format', () => {
    expect(extractPullRequestNumber('Fix bug (#123)')).toBe('123');
  });

  test('extracts PR number from "#123" format', () => {
    expect(extractPullRequestNumber('Fix #123 - Important bug')).toBe('123');
  });

  test('returns undefined for commit without PR number', () => {
    expect(extractPullRequestNumber('Regular commit message')).toBeUndefined();
  });

  test('handles multiple PR numbers by returning the first one', () => {
    expect(extractPullRequestNumber('Fix #123 and also fixes #456')).toBe(
      '123',
    );
  });
});
