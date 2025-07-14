/**
 * ListCommand - List all running Console Log Pipe servers
 */

const chalk = require('chalk');
const ora = require('ora');
const ServerManager = require('../server/ServerManager');
const TableFormatter = require('../utils/TableFormatter');
const { formatDuration, formatTimestamp } = require('../utils/TimeUtils');

class ListCommand {
  static async execute(options, command) {
    const spinner = ora('Scanning for running servers...').start();

    try {
      // Get all server information
      const servers = await ServerManager.getAllServers(options.showInactive);

      if (servers.length === 0) {
        spinner.info('No Console Log Pipe servers found');
        console.log(chalk.yellow('Start a server with: clp start <app-name>'));
        return;
      }

      spinner.succeed(`Found ${servers.length} server(s)`);
      console.log();

      // Format output based on requested format
      switch (options.format) {
        case 'json':
          this.displayJson(servers);
          break;
        case 'text':
          this.displayText(servers);
          break;
        case 'table':
        default:
          this.displayTable(servers);
          break;
      }

      // Show summary
      const runningCount = servers.filter(s => s.status === 'running').length;
      const stoppedCount = servers.filter(s => s.status === 'stopped').length;

      console.log();
      console.log(
        chalk.gray(
          `Summary: ${chalk.green(runningCount)} running, ${chalk.red(
            stoppedCount
          )} stopped`
        )
      );

      if (runningCount > 0) {
        console.log();
        console.log(chalk.yellow.bold('Quick Commands:'));
        servers
          .filter(s => s.status === 'running')
          .forEach(server => {
            console.log(
              chalk.white(`  clp monitor ${server.appName}    # Monitor logs`)
            );
            console.log(
              chalk.white(`  clp stop ${server.appName}       # Stop server`)
            );
          });
      }
    } catch (error) {
      spinner.fail('Failed to list servers');
      console.error(chalk.red('Error:'), error.message);

      if (command.opts().verbose) {
        console.error(chalk.gray(error.stack));
      }

      process.exit(1);
    }
  }

  static displayTable(servers) {
    const headers = [
      'Application',
      'Status',
      'URL',
      'Session ID',
      'Environment',
      'Uptime',
      'Last Activity',
    ];

    const rows = servers.map(server => [
      server.appName,
      this.formatStatus(server.status),
      server.status === 'running' ? `${server.host}:${server.port}` : '-',
      server.sessionId ? `${server.sessionId.slice(0, 12)}...` : '-',
      server.environment || '-',
      server.status === 'running' && server.startTime
        ? formatDuration(Date.now() - new Date(server.startTime).getTime())
        : '-',
      server.lastActivity ? formatTimestamp(server.lastActivity) : '-',
    ]);

    TableFormatter.display(headers, rows, {
      title: 'Console Log Pipe Servers',
      color: true,
    });
  }

  static displayText(servers) {
    servers.forEach((server, index) => {
      if (index > 0) console.log();

      console.log(chalk.cyan.bold(`${server.appName}`));
      console.log(chalk.gray(`  Status: ${this.formatStatus(server.status)}`));

      if (server.status === 'running') {
        console.log(chalk.gray(`  URL: http://${server.host}:${server.port}`));
        console.log(chalk.gray(`  Session: ${server.sessionId}`));
        console.log(chalk.gray(`  Environment: ${server.environment}`));
        console.log(chalk.gray(`  Developer: ${server.developer}`));
        console.log(chalk.gray(`  Branch: ${server.branch}`));

        if (server.startTime) {
          const uptime = formatDuration(
            Date.now() - new Date(server.startTime).getTime()
          );
          console.log(chalk.gray(`  Uptime: ${uptime}`));
        }

        if (server.stats) {
          console.log(chalk.gray(`  Logs: ${server.stats.totalLogs || 0}`));
          console.log(chalk.gray(`  Errors: ${server.stats.totalErrors || 0}`));
          console.log(
            chalk.gray(`  Network: ${server.stats.totalNetworkRequests || 0}`)
          );
        }
      }

      if (server.lastActivity) {
        console.log(
          chalk.gray(`  Last Activity: ${formatTimestamp(server.lastActivity)}`)
        );
      }
    });
  }

  static displayJson(servers) {
    console.log(JSON.stringify(servers, null, 2));
  }

  static formatStatus(status) {
    switch (status) {
      case 'running':
        return `${chalk.green('●')} Running`;
      case 'stopped':
        return `${chalk.red('●')} Stopped`;
      case 'error':
        return `${chalk.red('●')} Error`;
      case 'starting':
        return `${chalk.yellow('●')} Starting`;
      case 'stopping':
        return `${chalk.yellow('●')} Stopping`;
      default:
        return `${chalk.gray('●')} Unknown`;
    }
  }
}

module.exports = ListCommand;
