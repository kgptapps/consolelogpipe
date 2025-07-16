#!/usr/bin/env node

/**
 * Console Log Pipe CLI
 *
 * Global CLI tool for managing Console Log Pipe servers and monitoring applications
 */

const { Command } = require('commander');
const chalk = require('chalk');
const boxen = require('boxen');
const pkg = require('../package.json');

// Import commands
const StartCommand = require('./commands/StartCommand');

// Check for updates (temporarily disabled due to compatibility issues)
// try {
//   const updateNotifier = require('update-notifier');
//   const notifier = updateNotifier({ pkg });
//   if (notifier.update) {
//     console.log(
//       boxen(
//         `Update available ${chalk.dim(notifier.update.current)} → ${chalk.green(
//           notifier.update.latest
//         )}\nRun ${chalk.cyan('npm i -g @kansnpms/console-log-pipe-cli')} to update`,
//         {
//           padding: 1,
//           margin: 1,
//           borderStyle: 'round',
//           borderColor: 'yellow',
//         }
//       )
//     );
//   }
// } catch (error) {
//   // Silently ignore update notifier errors for compatibility
// }

// Create CLI program
const program = new Command();

program
  .name('clp')
  .description(
    'Console Log Pipe - AI-friendly web console integration for faster development'
  )
  .version(pkg.version)
  .option('-v, --verbose', 'Enable verbose logging')
  .option('--no-color', 'Disable colored output');

// Global error handler
program.exitOverride(err => {
  if (err.code === 'commander.version') {
    console.log(chalk.cyan(`Console Log Pipe v${pkg.version}`));
    process.exit(0);
  }
  if (err.code === 'commander.help' || err.code === 'commander.helpDisplayed') {
    // Help was displayed successfully, exit cleanly without error message
    process.exit(0);
  }
  console.error(chalk.red('Error:'), err.message);
  process.exit(1);
});

// Add commands
program
  .command('start')
  .alias('s')
  .description('Start Console Log Pipe server')
  .option('-p, --port <port>', 'Server port (required, 1024-65535)')
  .option('-h, --host <host>', 'Server host', 'localhost')
  .option('--no-browser', 'Do not open browser automatically')
  .option('--session-id <id>', 'Custom session ID')
  .option(
    '--env <environment>',
    'Environment (development, staging, production)',
    'development'
  )
  .option('--developer <name>', 'Developer name')
  .option('--branch <name>', 'Git branch name')
  .option('--log-level <level>', 'Minimum log level', 'debug')
  .option('--max-logs <number>', 'Maximum number of logs to store', '1000')
  .option('--enable-compression', 'Enable gzip compression', true)
  .option('--enable-cors', 'Enable CORS', true)
  .action(StartCommand.execute);

// Add help examples
program.addHelpText(
  'after',
  `
Examples:
  ${chalk.cyan('clp start --port 3001')}        Start server on port 3001
  ${chalk.cyan('clp start --port 3016')}        Start server on port 3016

For more information, visit: https://github.com/kgptapps/consolelogpipe
`
);

// Handle unknown commands
program.on('command:*', operands => {
  console.error(chalk.red(`Unknown command: ${operands[0]}`));
  console.log('See --help for a list of available commands.');
  process.exit(1);
});

// Show help if no command provided
if (!process.argv.slice(2).length) {
  console.log(
    boxen(
      `${chalk.cyan.bold('Console Log Pipe CLI')}\n\n` +
        `${chalk.gray(
          'AI-friendly web console integration for faster development'
        )}\n\n` +
        `${chalk.yellow('Quick Start:')}\n` +
        `  ${chalk.cyan('clp start --port 3001')}   Start monitoring\n\n` +
        `${chalk.gray('Run')} ${chalk.cyan('clp --help')} ${chalk.gray(
          'for more commands'
        )}`,
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
      }
    )
  );
  process.exit(0);
}

// Parse command line arguments
program.parse(process.argv);
