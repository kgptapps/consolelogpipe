/**
 * StatusCommand - Show status of Console Log Pipe servers
 */

const chalk = require('chalk');
const ora = require('ora');
const ServerManager = require('../server/ServerManager');
const { formatDuration, formatTimestamp } = require('../utils/TimeUtils');

class StatusCommand {
  static async execute(appName, options, command) {
    const spinner = ora('Checking server status...').start();

    try {
      if (appName) {
        await this.showSingleStatus(appName, options, spinner);
      } else {
        await this.showAllStatus(options, spinner);
      }
    } catch (error) {
      spinner.fail('Failed to get server status');
      console.error(chalk.red('Error:'), error.message);

      if (command.opts().verbose) {
        console.error(chalk.gray(error.stack));
      }

      process.exit(1);
    }
  }

  static async showSingleStatus(appName, options, spinner) {
    try {
      const serverInfo = await ServerManager.getServerInfo(appName);

      if (!serverInfo) {
        spinner.fail(`No server configuration found for "${appName}"`);
        console.log(chalk.yellow(`Start a server with: clp start ${appName}`));
        return;
      }

      spinner.succeed(`Status for "${appName}"`);
      console.log();

      if (options.format === 'json') {
        console.log(JSON.stringify(serverInfo, null, 2));
        return;
      }

      // Display detailed status
      this.displayDetailedStatus(serverInfo, options.detailed);
    } catch (error) {
      spinner.fail(`Failed to get status for "${appName}"`);
      throw error;
    }
  }

  static async showAllStatus(options, spinner) {
    try {
      const servers = await ServerManager.getAllServers();

      if (servers.length === 0) {
        spinner.info('No Console Log Pipe servers found');
        console.log(chalk.yellow('Start a server with: clp start <app-name>'));
        return;
      }

      spinner.succeed(`Found ${servers.length} server(s)`);
      console.log();

      if (options.format === 'json') {
        console.log(JSON.stringify(servers, null, 2));
        return;
      }

      // Display overview
      this.displayOverview(servers);

      if (options.detailed) {
        console.log();
        console.log(chalk.cyan.bold('Detailed Status:'));
        console.log();

        servers.forEach((server, index) => {
          if (index > 0) console.log();
          this.displayDetailedStatus(server, true);
        });
      }
    } catch (error) {
      spinner.fail('Failed to get server status');
      throw error;
    }
  }

  static displayOverview(servers) {
    const runningServers = servers.filter(s => s.status === 'running');
    const stoppedServers = servers.filter(s => s.status === 'stopped');
    const errorServers = servers.filter(s => s.status === 'error');

    console.log(chalk.cyan.bold('Console Log Pipe Status Overview'));
    console.log();

    // Summary stats
    console.log(chalk.green(`✓ Running: ${runningServers.length}`));
    console.log(chalk.red(`✗ Stopped: ${stoppedServers.length}`));
    if (errorServers.length > 0) {
      console.log(chalk.yellow(`⚠ Error: ${errorServers.length}`));
    }
    console.log();

    // Running servers
    if (runningServers.length > 0) {
      console.log(chalk.green.bold('Running Servers:'));
      runningServers.forEach(server => {
        const uptime = server.startTime
          ? formatDuration(Date.now() - new Date(server.startTime).getTime())
          : 'unknown';

        console.log(chalk.white(`  ${server.appName}`));
        console.log(
          chalk.gray(`    URL: http://${server.host}:${server.port}`)
        );
        console.log(chalk.gray(`    Uptime: ${uptime}`));
        console.log(chalk.gray(`    Environment: ${server.environment}`));

        if (server.stats) {
          const stats = server.stats;
          console.log(
            chalk.gray(
              `    Activity: ${stats.totalLogs || 0} logs, ${
                stats.totalErrors || 0
              } errors, ${stats.totalNetworkRequests || 0} network`
            )
          );
        }
      });
      console.log();
    }

    // Stopped servers
    if (stoppedServers.length > 0) {
      console.log(chalk.red.bold('Stopped Servers:'));
      stoppedServers.forEach(server => {
        console.log(chalk.white(`  ${server.appName}`));
        if (server.lastActivity) {
          console.log(
            chalk.gray(`    Last seen: ${formatTimestamp(server.lastActivity)}`)
          );
        }
      });
      console.log();
    }

    // Error servers
    if (errorServers.length > 0) {
      console.log(chalk.yellow.bold('Servers with Errors:'));
      errorServers.forEach(server => {
        console.log(chalk.white(`  ${server.appName}`));
        if (server.error) {
          console.log(chalk.red(`    Error: ${server.error}`));
        }
      });
      console.log();
    }
  }

  static displayDetailedStatus(server, detailed = false) {
    console.log(chalk.cyan.bold(`${server.appName}`));
    console.log(chalk.gray(`  Status: ${this.formatStatus(server.status)}`));

    if (server.status === 'running') {
      console.log(
        chalk.gray(`  Server URL: http://${server.host}:${server.port}`)
      );
      console.log(chalk.gray(`  Session ID: ${server.sessionId}`));
      console.log(chalk.gray(`  Environment: ${server.environment}`));
      console.log(chalk.gray(`  Developer: ${server.developer}`));
      console.log(chalk.gray(`  Branch: ${server.branch}`));

      if (server.startTime) {
        const uptime = formatDuration(
          Date.now() - new Date(server.startTime).getTime()
        );
        console.log(chalk.gray(`  Uptime: ${uptime}`));
        console.log(
          chalk.gray(`  Started: ${formatTimestamp(server.startTime)}`)
        );
      }

      if (server.stats) {
        const stats = server.stats;
        console.log(chalk.gray(`  Total Logs: ${stats.totalLogs || 0}`));
        console.log(chalk.gray(`  Total Errors: ${stats.totalErrors || 0}`));
        console.log(
          chalk.gray(`  Network Requests: ${stats.totalNetworkRequests || 0}`)
        );

        if (stats.lastActivity) {
          console.log(
            chalk.gray(
              `  Last Activity: ${formatTimestamp(stats.lastActivity)}`
            )
          );
        }
      }

      if (detailed && server.config) {
        console.log(chalk.gray(`  Log Level: ${server.config.logLevel}`));
        console.log(chalk.gray(`  Max Logs: ${server.config.maxLogs}`));
        console.log(
          chalk.gray(
            `  Compression: ${
              server.config.enableCompression ? 'enabled' : 'disabled'
            }`
          )
        );
        console.log(
          chalk.gray(
            `  CORS: ${server.config.enableCors ? 'enabled' : 'disabled'}`
          )
        );
      }
    } else if (server.status === 'stopped') {
      if (server.lastActivity) {
        console.log(
          chalk.gray(`  Last Activity: ${formatTimestamp(server.lastActivity)}`)
        );
      }
      if (server.stopTime) {
        console.log(
          chalk.gray(`  Stopped: ${formatTimestamp(server.stopTime)}`)
        );
      }
    } else if (server.status === 'error') {
      if (server.error) {
        console.log(chalk.red(`  Error: ${server.error}`));
      }
      if (server.lastActivity) {
        console.log(
          chalk.gray(`  Last Activity: ${formatTimestamp(server.lastActivity)}`)
        );
      }
    }

    // Health check information
    if (detailed && server.health) {
      console.log(chalk.gray(`  Health: ${server.health.status}`));
      if (server.health.lastCheck) {
        console.log(
          chalk.gray(
            `  Last Health Check: ${formatTimestamp(server.health.lastCheck)}`
          )
        );
      }
    }
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

module.exports = StatusCommand;
