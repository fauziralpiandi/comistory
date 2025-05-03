import { spawn } from 'child_process';
import { Commit } from '../../models/commit';
import { GitProvider } from './interface';
import { extractPullRequestNumber } from '../../utils/helpers';
import { logger } from '../../utils/logger';

export class LocalGitProvider implements GitProvider {
  async fetchCommits(): Promise<Commit[]> {
    try {
      const output = await this.executeGitLog();
      return this.parseGitLog(output);
    } catch (error) {
      const gitError = error as Error & { stderr?: string };
      if (gitError.stderr && gitError.stderr.includes('not a git repository')) {
        const errorMessage =
          'Current directory is not a git repository. Please run from a git repository root.';
        logger.error(errorMessage);
        throw new Error(errorMessage);
      }
      logger.error(`Git error: ${(error as Error).message}`);
      throw error;
    }
  }

  private executeGitLog(): Promise<string> {
    return new Promise((resolve, reject) => {
      // Format: hash, commit date, message
      // %H - full hash
      // %ad - author date (respects --date=format)
      // %s - subject (commit message first line)
      // %b - body (rest of commit message)
      const format = '%H%n%ad%n%s%n%b%n%n';

      // Use a more standardized ISO date format
      const gitArgs = [
        'log',
        `--pretty=format:${format}`,
        '--date=iso8601-strict',
      ];

      logger.debug(`Executing git command: git ${gitArgs.join(' ')}`);
      const git = spawn('git', gitArgs);

      let stdout = '';
      let stderr = '';

      git.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      git.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      git.on('close', (code) => {
        if (code !== 0) {
          const error = new Error(
            `git log exited with code ${code}: ${stderr}`,
          ) as Error & { stderr?: string };
          error.stderr = stderr;
          reject(error);
          return;
        }

        resolve(stdout);
      });
    });
  }

  private parseGitLog(output: string): Commit[] {
    const commits: Commit[] = [];
    const entries = output.split('\n\n').filter(Boolean);

    for (const entry of entries) {
      const lines = entry.split('\n');

      // Need at least hash, date, and message (subject)
      if (lines.length < 3) {
        logger.debug(`Skipping invalid commit entry: not enough lines`);
        continue;
      }

      const hash = lines[0].trim();
      const dateStr = lines[1].trim();
      const subject = lines[2].trim();

      let message = subject;
      if (lines.length > 3 && lines[3].trim()) {
        message += '\n\n' + lines[3].trim();
      }

      let commitDate;
      try {
        commitDate = new Date(dateStr);
        if (isNaN(commitDate.getTime())) {
          logger.debug(`Invalid date format for commit ${hash}: "${dateStr}"`);
          commitDate = new Date();
        }
      } catch (error) {
        logger.debug(`Error parsing date for commit ${hash}: ${error}`);
        commitDate = new Date(); // Fallback to current date if parsing fails
      }

      commits.push({
        hash,
        shortHash: hash.substring(0, 7),
        message,
        date: commitDate,
        prNumber: extractPullRequestNumber(message),
      });
    }

    logger.debug(`Parsed ${commits.length} commits from local git repository`);
    return commits;
  }
}

export const localGitProvider = new LocalGitProvider();
