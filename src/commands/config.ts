import { Command } from 'commander';
import { tokenService } from '../services/token';
import { logger } from '../utils/logger';

export function setupConfigCommand(program: Command): void {
  program
    .command('config')
    .description('Configure your GitHub token')
    .option('--set <token>', 'Set GitHub API token in global config')
    .option('--remove', 'Remove GitHub API token from global config')
    .option('--status', 'Display information about the configured GitHub token')
    .action(async (options) => {
      if (options.set) {
        try {
          const success = await tokenService.saveToken(options.set);
          if (!success) {
            process.exit(1);
          }
        } catch (error) {
          logger.error(
            `Token configuration failed: ${(error as Error).message}`,
          );
          process.exit(1);
        }
      } else if (options.remove) {
        try {
          const success = tokenService.removeToken();
          if (!success) {
            process.exit(1);
          }
        } catch (error) {
          logger.error(`Token removal failed: ${(error as Error).message}`);
          process.exit(1);
        }
      } else if (options.status) {
        const tokenInfo = await tokenService.getTokenStatus();

        if (tokenInfo.isConfigured) {
          logger.info(`GitHub token is configured: ${tokenInfo.firstSixChars}`);

          if (tokenInfo.username) {
            logger.info(
              `Token associated with GitHub user: ${tokenInfo.username}`,
            );
          }

          if (tokenInfo.scopes && tokenInfo.scopes.length > 0) {
            logger.info(`Token scopes: ${tokenInfo.scopes.join(', ')}`);
          } else if (tokenInfo.scopes && tokenInfo.scopes.length === 0) {
            logger.warn(
              `Token has no scopes configured, which may limit functionality`,
            );
          }
        } else {
          logger.info('No GitHub token is currently configured');
          logger.info('To set a token: comistory config --set <token>');
        }
      } else {
        logger.error('No configuration option specified');
      }
    });
}
