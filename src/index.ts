#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { setupConfigCommand } from './commands/config';
import { setupGenerateCommand } from './commands/generate';
import { logger } from './utils/logger';

function getPackageInfo() {
  const possiblePaths = [
    path.join(__dirname, '../../package.json'), // For published package
    path.join(__dirname, '../package.json'), // For local development
  ];

  for (const pkgPath of possiblePaths) {
    try {
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        return {
          name: pkg.name,
          version: pkg.version,
          description: pkg.description,
        };
      }
    } catch {
      // Go ahead
    }
  }

  return {
    name: 'comistory',
    version: 'latest',
    description: 'Every commit tells a story',
  };
}

const runCli = async (): Promise<void> => {
  const program = new Command();
  const { name, version, description } = getPackageInfo();

  program.name(name).description(description).version(version);

  setupGenerateCommand(program);
  setupConfigCommand(program);

  program.parse(process.argv);
};

runCli().catch((error) => {
  logger.error(`Unexpected error: ${error.message}`);
  process.exit(1);
});
