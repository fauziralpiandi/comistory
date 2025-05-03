import axios from 'axios';
import { Commit } from '../../models/commit';
import { FetchOptions, GitProvider } from './interface';
import { extractPullRequestNumber } from '../../utils/helpers';
import { logger } from '../../utils/logger';

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      date: string;
    };
  };
}

export class RemoteGitProvider implements GitProvider {
  constructor(
    private readonly token: string,
    private readonly repoUrl: string,
  ) {
    if (!token) {
      const errorMessage =
        'GitHub token is required for remote repository access';
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    if (!repoUrl) {
      const errorMessage = 'Repository URL is required';
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  async fetchCommits(options: FetchOptions): Promise<Commit[]> {
    const perPage = options.perPage || 100;
    const page = options.page || 1;

    if (perPage < 1 || perPage > 100) {
      const errorMessage = 'per_page must be between 1 and 100';
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    if (page < 1) {
      const errorMessage = 'page must be a positive number';
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    const { owner, repo, apiUrl, htmlUrl } = this.parseRepositoryUrl();

    logger.info(`Fetching commits from: ${apiUrl}`);
    logger.debug(`Repository owner: ${owner}, repo: ${repo}`);
    logger.debug(`Pagination: page: ${page}, per_page: ${perPage}`);

    try {
      const response = await axios.get<GitHubCommit[]>(apiUrl, {
        params: {
          per_page: perPage,
          page,
        },
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      this.logRateLimitInfo(response.headers);

      logger.debug(
        `Received ${response.data.length} commits from GitHub API (page: ${page})`,
      );

      return response.data.map((commit) => ({
        hash: commit.sha,
        shortHash: commit.sha.substring(0, 7),
        message: commit.commit.message,
        date: new Date(commit.commit.author.date),
        prNumber: extractPullRequestNumber(commit.commit.message),
        repoUrl: htmlUrl,
      }));
    } catch (error) {
      this.handleApiError(error, owner, repo);
      // This line will never be reached because handleApiError always throws
    }
  }

  private parseRepositoryUrl(): {
    owner: string;
    repo: string;
    apiUrl: string;
    htmlUrl: string;
  } {
    const patterns = [
      /github\.com\/([^/]+)\/([^/]+)(\.git)?$/i, // github.com/owner/repo.git or github.com/owner/repo
      /github\.com:([^/]+)\/([^/]+)(\.git)?$/i, // github.com:owner/repo.git or github.com:owner/repo
      /^([^/]+)\/([^/]+)$/i, // owner/repo
    ];

    let owner = '';
    let repo = '';

    for (const pattern of patterns) {
      const match = this.repoUrl.match(pattern);
      if (match && match[1] && match[2]) {
        owner = match[1];
        repo = match[2];
        break;
      }
    }

    if (!owner || !repo) {
      const errorMessage = `Invalid GitHub repository URL format: ${this.repoUrl}`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    // Remove .git extension if present
    if (repo.endsWith('.git')) {
      repo = repo.slice(0, -4);
    }

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/commits`;
    const htmlUrl = `https://github.com/${owner}/${repo}`;

    return { owner, repo, apiUrl, htmlUrl };
  }

  private logRateLimitInfo(headers: Record<string, unknown>): void {
    const rateLimitRemaining = headers['x-ratelimit-remaining'] as string;
    const rateLimitLimit = headers['x-ratelimit-limit'] as string;
    const rateLimitReset = headers['x-ratelimit-reset'] as string;

    if (rateLimitRemaining && rateLimitLimit) {
      const resetDate = rateLimitReset
        ? new Date(parseInt(rateLimitReset) * 1000).toLocaleTimeString()
        : 'unknown';

      logger.info(
        `GitHub API Rate Limit: ${rateLimitRemaining}/${rateLimitLimit} remaining (resets at: ${resetDate})`,
      );

      if (parseInt(rateLimitRemaining) < 10) {
        logger.warn(
          `GitHub API rate limit is running low. You may encounter errors soon.`,
        );
      }
    }
  }

  private handleApiError(error: unknown, owner: string, repo: string): never {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;

      if (status === 404) {
        const errorMessage = `Repository not found: ${owner}/${repo}. Check if the repository exists and is accessible with your token.`;
        logger.error(errorMessage);
        throw new Error(errorMessage);
      } else if (status === 403) {
        const rateLimitMessage = error.response?.data?.message || '';
        if (rateLimitMessage.toLowerCase().includes('rate limit')) {
          const errorMessage = `GitHub API rate limit exceeded. Your limit is 5,000 requests per hour.`;
          logger.error(errorMessage);
          throw new Error(errorMessage);
        } else {
          const errorMessage = `Access denied. Your GitHub token may have insufficient permissions or has expired.`;
          logger.error(errorMessage);
          throw new Error(errorMessage);
        }
      } else if (status === 401) {
        const errorMessage = `Authentication failed. The provided GitHub token is invalid.`;
        logger.error(errorMessage);
        throw new Error(errorMessage);
      } else if (status) {
        const errorMessage = `Failed to fetch commits from GitHub API: HTTP ${status}`;
        logger.error(errorMessage);
        throw new Error(errorMessage);
      } else {
        const errorMessage = `Failed to fetch commits from GitHub API: ${error.message}`;
        logger.error(errorMessage);
        throw new Error(errorMessage);
      }
    } else {
      const errorMessage = `Unexpected error: ${(error as Error).message}`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }
}

export function createRemoteGitProvider(
  token: string,
  repoUrl: string,
): GitProvider {
  return new RemoteGitProvider(token, repoUrl);
}
