#!/usr/bin/env node

/**
 * Console Log Pipe CLI
 *
 * Global CLI tool for managing Console Log Pipe servers and monitoring applications
 */

const { Command } = require('commander');
const chalk = require('chalk');
const boxen = require('boxen');
const updateNotifier = require('update-notifier');
const pkg = require('../package.json');

// Import commands
const StartCommand = require('./commands/StartCommand');
const MonitorCommand = require('./commands/MonitorCommand');
const ListCommand = require('./commands/ListCommand');
const StopCommand = require('./commands/StopCommand');
const StatusCommand = require('./commands/StatusCommand');

// Check for updates
const notifier = updateNotifier({ pkg });
if (notifier.update) {
  console.log(
    boxen(
      `Update available ${chalk.dim(notifier.update.current)} → ${chalk.green(
        notifier.update.latest
      )}\nRun ${chalk.cyan('npm i -g console-log-pipe')} to update`,
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'yellow',
      }
    )
  );
}

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
  if (err.code === 'commander.help') {
    process.exit(0);
  }
  console.error(chalk.red('Error:'), err.message);
  process.exit(1);
});

// Add commands
program
  .command('start')
  .alias('s')
  .description('Start Console Log Pipe server for an application')
  .argument('[app-name]', 'Application name to monitor')
  .option('-p, --port <port>', 'Server port (auto-assigned if not specified)')
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

program
  .command('monitor')
  .alias('m')
  .description('Monitor logs from a running application')
  .argument('<app-name>', 'Application name to monitor')
  .option('-f, --follow', 'Follow log output in real-time', true)
  .option('--filter <pattern>', 'Filter logs by pattern')
  .option('--level <level>', 'Filter by log level')
  .option(
    '--since <time>',
    'Show logs since time (e.g., "1h", "30m", "2023-01-01")'
  )
  .option('--tail <number>', 'Number of recent logs to show', '50')
  .option('--format <format>', 'Output format (json, text, table)', 'text')
  .option('--no-color', 'Disable colored output')
  .action(MonitorCommand.execute);

program
  .command('list')
  .alias('ls')
  .description('List all running Console Log Pipe servers')
  .option('--format <format>', 'Output format (json, text, table)', 'table')
  .option('--show-inactive', 'Show inactive servers')
  .action(ListCommand.execute);

program
  .command('stop')
  .description('Stop Console Log Pipe server for an application')
  .argument(
    '[app-name]',
    'Application name to stop (stops all if not specified)'
  )
  .option('--force', 'Force stop without confirmation')
  .option('--all', 'Stop all running servers')
  .action(StopCommand.execute);

program
  .command('status')
  .description('Show status of Console Log Pipe servers')
  .argument('[app-name]', 'Application name to check status')
  .option('--detailed', 'Show detailed status information')
  .option('--format <format>', 'Output format (json, text, table)', 'text')
  .action(StatusCommand.execute);

program
  .command('logs')
  .description('View logs from Console Log Pipe servers')
  .argument('[app-name]', 'Application name to view logs')
  .option('--since <time>', 'Show logs since time')
  .option('--tail <number>', 'Number of recent logs to show', '100')
  .option('--follow', 'Follow log output')
  .option('--level <level>', 'Filter by log level')
  .action(MonitorCommand.execute);

// Add help examples
program.addHelpText(
  'after',
  `
Examples:
  ${chalk.cyan('clp start my-app')}                    Start server for "my-app"
  ${chalk.cyan(
    'clp start my-app --port 3001'
  )}        Start server on specific port
  ${chalk.cyan(
    'clp monitor my-app'
  )}                  Monitor logs from "my-app"
  ${chalk.cyan('clp monitor my-app --level error')}    Monitor only error logs
  ${chalk.cyan('clp list')}                           List all running servers
  ${chalk.cyan('clp stop my-app')}                    Stop server for "my-app"
  ${chalk.cyan('clp stop --all')}                     Stop all servers
  ${chalk.cyan('clp status')}                         Show status of all servers

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
        `  ${chalk.cyan('clp start my-app')}     Start monitoring your app\n` +
        `  ${chalk.cyan('clp monitor my-app')}   View real-time logs\n` +
        `  ${chalk.cyan('clp list')}            List running servers\n\n` +
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
