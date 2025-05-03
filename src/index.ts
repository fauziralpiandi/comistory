#!/usr/bin/env node

import { Command } from 'commander';
import { setupConfigCommand } from './commands/config';
import { setupGenerateCommand } from './commands/generate';
import { name, version, description } from '../package.json';
import { logger } from './utils/logger';

const runCli = async (): Promise<void> => {
  const program = new Command();

  program.name(name).description(description).version(version);

  setupGenerateCommand(program);
  setupConfigCommand(program);

  program.parse(process.argv);
};

runCli().catch((error) => {
  logger.error(`Unexpected error: ${error.message}`);
  process.exit(1);
});
