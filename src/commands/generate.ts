import * as fs from 'fs';
import { Command } from 'commander';
import { Commit } from '../models/commit';
import { localGitProvider } from '../services/git/local';
import { createRemoteGitProvider } from '../services/git/remote';
import { markdownFormatter } from '../services/formatters/markdown';
import { tokenService } from '../services/token';
import { GitProvider } from '../services/git/interface';
import { logger } from '../utils/logger';
import { name } from '../../package.json';

interface GenerateOptions {
  local?: boolean;
  remote?: string;
  output?: string;
  perPage?: string;
  page?: string;
}

export function setupGenerateCommand(program: Command): void {
  program
    .command('generate')
    .description('Generate commit history in markdown format')
    .option('--local', 'Generate from local git repository')
    .option('--remote <url>', 'Generate from remote git repository URL')
    .option('--output <file>', 'Output file path')
    .option('--per-page <number>', 'Number of commits per page (1-100)', '100')
    .option('--page <number>', 'Page number to fetch', '1')
    .option('--verbose', 'Enable verbose output', false)
    .action((options) => {
      if (options.verbose) {
        process.env['COMISTORY_VERBOSE'] = 'true';
        logger.debug('Verbose mode enabled');
      }

      generateCommits(options);
    });
}

async function generateCommits(options: GenerateOptions): Promise<void> {
  validateOptions(options);

  // If using remote, ensure token is available
  if (options.remote) {
    validateTokenForRemote();
  }

  const gitProvider = createGitProvider(options);

  try {
    const commits = await fetchCommits(gitProvider, options);

    if (!commits || commits.length === 0) {
      logger.info('No commits found.');
      return;
    }

    const markdown = markdownFormatter.format(commits);
    const outputFile = options.output || `${name}.md`;

    writeOutput(outputFile, markdown);

    if (process.env['COMISTORY_VERBOSE'] === 'true') {
      logger.debug(markdown);
    }
  } catch (error) {
    logger.error(`${(error as Error).message}`);
    process.exit(1);
  }
}

function validateOptions(options: GenerateOptions): void {
  if (!options) {
    logger.error('Options object is required');
    process.exit(1);
  }

  if (
    (!options.local && !options.remote) ||
    (options.local && options.remote)
  ) {
    logger.error(
      'You must provide exactly one option: --local or --remote <url>',
    );
    process.exit(1);
  }

  if (options.remote && typeof options.remote !== 'string') {
    logger.error('Remote URL must be a valid string');
    process.exit(1);
  }

  if (options.output && typeof options.output !== 'string') {
    logger.error('Output path must be a valid string');
    process.exit(1);
  }

  if (options.remote) {
    const perPage = parseInt(options.perPage || '100', 10);
    const page = parseInt(options.page || '1', 10);

    if (isNaN(perPage) || perPage < 1 || perPage > 100) {
      logger.error('--per-page must be a number between 1 and 100');
      process.exit(1);
    }

    if (isNaN(page) || page < 1) {
      logger.error('--page must be a positive number');
      process.exit(1);
    }
  }
}

function validateTokenForRemote(): void {
  const token = tokenService.getToken();

  if (!token) {
    logger.error('GitHub token is required for remote repository access');
    logger.info('Please configure your GitHub token with:');
    logger.info('comistory config --set <token>');
    process.exit(1);
  }
}

function createGitProvider(options: GenerateOptions): GitProvider {
  if (options.local) {
    return localGitProvider;
  } else if (options.remote) {
    const token = tokenService.getToken();
    if (!token) {
      // This should never happen as we validate token earlier
      const errorMessage =
        'GitHub token is required for remote repository access';
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }
    return createRemoteGitProvider(token, options.remote);
  }

  const errorMessage = 'Invalid options';
  logger.error(errorMessage);
  throw new Error(errorMessage);
}

async function fetchCommits(
  provider: GitProvider,
  options: GenerateOptions,
): Promise<Commit[]> {
  if (options.remote) {
    const perPage = parseInt(options.perPage || '100', 10);
    const page = parseInt(options.page || '1', 10);
    return provider.fetchCommits({ perPage, page });
  }

  return provider.fetchCommits({});
}

function writeOutput(outputFile: string, markdown: string): void {
  try {
    fs.writeFileSync(outputFile, markdown);
    logger.info(`Commit history has been saved to: ${outputFile}`);
  } catch (writeError) {
    logger.error(
      `Failed to write output file: ${(writeError as Error).message}`,
    );
    process.exit(1);
  }
}
