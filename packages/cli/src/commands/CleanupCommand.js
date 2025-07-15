/**
 * CleanupCommand - Clean up corrupted configuration files
 */

const chalk = require('chalk');
const ora = require('ora');
const ConfigManager = require('../utils/ConfigManager');

class CleanupCommand {
  static async execute(options, command) {
    const spinner = ora(
      'Checking for corrupted configuration files...'
    ).start();

    try {
      const cleanedCount = await ConfigManager.cleanupCorruptedConfigs();

      if (cleanedCount === 0) {
        spinner.succeed('No corrupted configuration files found');
        console.log(chalk.green('✅ All configuration files are valid'));
      } else {
        spinner.succeed(
          `Cleaned up ${cleanedCount} corrupted configuration file(s)`
        );
        console.log();
        console.log(chalk.green('✅ Configuration cleanup completed'));
        console.log(
          chalk.yellow(
            'ℹ  Fresh configuration files will be created when you start servers'
          )
        );
      }

      if (command.opts().verbose) {
        console.log();
        console.log(chalk.gray('Configuration directories:'));
        console.log(chalk.gray(`  Global: ${ConfigManager.globalConfigFile}`));
        console.log(chalk.gray(`  Servers: ${ConfigManager.serversDir}`));
      }
    } catch (error) {
      spinner.fail('Failed to clean up configuration files');
      console.error(chalk.red('✖ Error:'), error.message);

      if (command.opts().verbose) {
        console.error(chalk.gray(error.stack));
      }

      process.exit(1);
    }
  }

  static getDescription() {
    return 'Clean up corrupted configuration files';
  }

  static getOptions() {
    return [
      {
        flags: '--verbose',
        description: 'Show detailed output',
      },
    ];
  }
}

module.exports = CleanupCommand;
