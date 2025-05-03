import { RemoteGitProvider } from './remote';

jest.mock('axios');
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('RemoteGitProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Repository URL parsing', () => {
    function parseRepoUrl(url: string): {
      owner: string;
      repo: string;
      apiUrl: string;
      htmlUrl: string;
    } {
      const provider = new RemoteGitProvider('dummy-token', url);
      // Need to access a private method for testing
      return (
        provider as unknown as {
          parseRepositoryUrl(): {
            owner: string;
            repo: string;
            apiUrl: string;
            htmlUrl: string;
          };
        }
      ).parseRepositoryUrl();
    }

    test('parses standard GitHub URL correctly', () => {
      const result = parseRepoUrl('https://github.com/user/repo');

      expect(result.owner).toBe('user');
      expect(result.repo).toBe('repo');
      expect(result.apiUrl).toBe(
        'https://api.github.com/repos/user/repo/commits',
      );
      expect(result.htmlUrl).toBe('https://github.com/user/repo');
    });

    test('parses GitHub URL with .git extension correctly', () => {
      const result = parseRepoUrl('https://github.com/user/repo.git');

      expect(result.owner).toBe('user');
      expect(result.repo).toBe('repo'); // .git should be removed
    });

    test('parses SSH format URL correctly', () => {
      const result = parseRepoUrl('github.com:user/repo.git');

      expect(result.owner).toBe('user');
      expect(result.repo).toBe('repo');
    });

    test('parses shorthand owner/repo format correctly', () => {
      const result = parseRepoUrl('user/repo');

      expect(result.owner).toBe('user');
      expect(result.repo).toBe('repo');
    });

    test('throws error for invalid repository URL', () => {
      expect(() => parseRepoUrl('invalid-url')).toThrow(
        'Invalid GitHub repository URL format',
      );
    });
  });
});
