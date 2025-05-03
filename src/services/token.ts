import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import axios from 'axios';
import { logger } from '../utils/logger';

interface TokenInfo {
  valid: boolean;
  username?: string;
  scopes?: string[];
}

interface TokenStatus {
  isConfigured: boolean;
  firstSixChars?: string;
  username?: string;
  scopes?: string[];
}

interface TokenService {
  getToken(): string | undefined;
  validateToken(token: string): Promise<boolean>;
  saveToken(token: string): Promise<boolean>;
  removeToken(): boolean;
  getTokenStatus(): Promise<TokenStatus>;
}

class FileTokenService implements TokenService {
  private readonly CONFIG_DIR: string;
  private readonly CONFIG_FILE: string;

  constructor() {
    this.CONFIG_DIR = path.join(os.homedir(), '.config', 'comistory');
    this.CONFIG_FILE = path.join(this.CONFIG_DIR, 'config.json');
  }

  getToken(): string | undefined {
    try {
      if (!fs.existsSync(this.CONFIG_FILE)) {
        return undefined;
      }

      const configData = fs.readFileSync(this.CONFIG_FILE, 'utf8');
      const config = JSON.parse(configData);

      return config.githubToken;
    } catch (error) {
      // If there's an error reading the config file, return undefined
      logger.error(`Error reading configuration: ${(error as Error).message}`);
      return undefined;
    }
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await axios.get('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // If we get here, the token is valid
      return response.status === 200;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;

        if (status === 401) {
          logger.error('Token validation failed: Invalid authentication');
        } else if (status === 403) {
          logger.error(
            'Token validation failed: Rate limit exceeded or insufficient permissions',
          );
        } else {
          logger.error(`Token validation failed: ${error.message}`);
        }
      } else {
        logger.error(`Token validation failed: ${(error as Error).message}`);
      }

      return false;
    }
  }

  async saveToken(token: string): Promise<boolean> {
    if (!token || token.trim() === '') {
      logger.error('Token is required');
      return false;
    }

    try {
      if (!fs.existsSync(this.CONFIG_DIR)) {
        fs.mkdirSync(this.CONFIG_DIR, { recursive: true });
        logger.debug(`Created configuration directory: ${this.CONFIG_DIR}`);
      }
    } catch (error) {
      logger.error(
        `Failed to create config directory: ${(error as Error).message}`,
      );
      return false;
    }

    logger.info('Validating GitHub token...');
    const isValid = await this.validateToken(token);

    if (!isValid) {
      logger.error('Token validation failed, token not saved');
      return false;
    }

    try {
      const config = fs.existsSync(this.CONFIG_FILE)
        ? JSON.parse(fs.readFileSync(this.CONFIG_FILE, 'utf8'))
        : {};

      config.githubToken = token;

      fs.writeFileSync(this.CONFIG_FILE, JSON.stringify(config, null, 2));
      logger.info('GitHub token saved successfully');

      const tokenInfo = await this.fetchTokenDetails(token);
      if (tokenInfo.username) {
        logger.info(`Token verified for user: ${tokenInfo.username}`);
      }

      return true;
    } catch (error) {
      logger.error(`Failed to save token: ${(error as Error).message}`);
      return false;
    }
  }

  removeToken(): boolean {
    try {
      if (!fs.existsSync(this.CONFIG_FILE)) {
        logger.info('No configuration file exists - nothing to remove');
        return true;
      }

      const config = JSON.parse(fs.readFileSync(this.CONFIG_FILE, 'utf8'));

      if (!config.githubToken) {
        logger.info('No GitHub token configured, nothing to remove');
        return true;
      }

      delete config.githubToken;
      fs.writeFileSync(this.CONFIG_FILE, JSON.stringify(config, null, 2));

      logger.info('GitHub token removed successfully');
      return true;
    } catch (error) {
      logger.error(`Failed to remove token: ${(error as Error).message}`);
      return false;
    }
  }

  async getTokenStatus(): Promise<TokenStatus> {
    const token = this.getToken();

    if (!token) {
      return { isConfigured: false };
    }

    // For security
    const firstSixChars = token.substring(0, 6) + '******';

    try {
      const tokenInfo = await this.fetchTokenDetails(token);

      return {
        isConfigured: true,
        firstSixChars,
        username: tokenInfo.username,
        scopes: tokenInfo.scopes,
      };
    } catch (error) {
      logger.error(`Failed to get token details: ${(error as Error).message}`);

      return {
        isConfigured: true,
        firstSixChars,
      };
    }
  }

  private async fetchTokenDetails(token: string): Promise<TokenInfo> {
    try {
      const response = await axios.get('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const scopes = ((response.headers['x-oauth-scopes'] as string) || '')
        .split(',')
        .map((scope) => scope.trim())
        .filter(Boolean);

      return {
        valid: true,
        username: response.data.login,
        scopes,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;

        if (status === 401) {
          return { valid: false };
        }
      }

      throw error;
    }
  }
}

export const tokenService = new FileTokenService();
