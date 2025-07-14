/**
 * StopCommand - Stop Console Log Pipe server for an application
 */

const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const ServerManager = require('../server/ServerManager');
const { formatDuration } = require('../utils/TimeUtils');

class StopCommand {
  static async execute(appName, options, command) {
    try {
      if (options.all) {
        await this.stopAllServers(options, command);
      } else if (appName) {
        await this.stopSingleServer(appName, options, command);
      } else {
        await this.interactiveStop(options, command);
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);

      if (command.opts().verbose) {
        console.error(chalk.gray(error.stack));
      }

      process.exit(1);
    }
  }

  static async stopSingleServer(appName, options, _command) {
    const spinner = ora(`Stopping server for "${appName}"...`).start();

    try {
      // Check if server exists and is running
      const serverInfo = await ServerManager.getServerInfo(appName);
      if (!serverInfo) {
        spinner.fail(`No server configuration found for "${appName}"`);
        return;
      }

      if (serverInfo.status !== 'running') {
        spinner.info(`Server for "${appName}" is not running`);
        return;
      }

      // Confirm if not forced
      if (!options.force) {
        spinner.stop();
        const uptime = serverInfo.startTime
          ? formatDuration(
              Date.now() - new Date(serverInfo.startTime).getTime()
            )
          : 'unknown';

        console.log();
        console.log(chalk.yellow(`About to stop server for "${appName}"`));
        console.log(
          chalk.gray(`  URL: http://${serverInfo.host}:${serverInfo.port}`)
        );
        console.log(chalk.gray(`  Session: ${serverInfo.sessionId}`));
        console.log(chalk.gray(`  Uptime: ${uptime}`));

        if (serverInfo.stats) {
          console.log(
            chalk.gray(`  Total logs: ${serverInfo.stats.totalLogs || 0}`)
          );
        }

        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Are you sure you want to stop this server?',
            default: false,
          },
        ]);

        if (!confirm) {
          console.log(chalk.yellow('Operation cancelled'));
          return;
        }

        spinner.start(`Stopping server for "${appName}"...`);
      }

      // Stop the server
      await ServerManager.stopServer(appName);

      spinner.succeed(`Server stopped for "${appName}"`);

      console.log();
      console.log(chalk.green('✓ Server stopped successfully'));
      console.log(chalk.gray(`  Application: ${appName}`));
      console.log(chalk.gray(`  Port ${serverInfo.port} is now available`));
    } catch (error) {
      spinner.fail(`Failed to stop server for "${appName}"`);
      throw error;
    }
  }

  static async stopAllServers(options, _command) {
    const spinner = ora('Finding running servers...').start();

    try {
      const servers = await ServerManager.getAllServers();
      const runningServers = servers.filter(s => s.status === 'running');

      if (runningServers.length === 0) {
        spinner.info('No running servers found');
        return;
      }

      spinner.stop();

      // Confirm if not forced
      if (!options.force) {
        console.log();
        console.log(
          chalk.yellow(
            `About to stop ${runningServers.length} running server(s):`
          )
        );
        runningServers.forEach(server => {
          console.log(
            chalk.gray(`  • ${server.appName} (${server.host}:${server.port})`)
          );
        });

        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Are you sure you want to stop all servers?',
            default: false,
          },
        ]);

        if (!confirm) {
          console.log(chalk.yellow('Operation cancelled'));
          return;
        }
      }

      // Stop all servers
      const stopSpinner = ora('Stopping all servers...').start();

      let successCount = 0;
      let failureCount = 0;

      for (const server of runningServers) {
        try {
          await ServerManager.stopServer(server.appName);
          successCount++;
        } catch (error) {
          failureCount++;
          console.error(
            chalk.red(`Failed to stop ${server.appName}:`),
            error.message
          );
        }
      }

      if (failureCount === 0) {
        stopSpinner.succeed(`All ${successCount} servers stopped successfully`);
      } else {
        stopSpinner.warn(
          `${successCount} servers stopped, ${failureCount} failed`
        );
      }

      console.log();
      console.log(chalk.green(`✓ ${successCount} server(s) stopped`));
      if (failureCount > 0) {
        console.log(chalk.red(`✗ ${failureCount} server(s) failed to stop`));
      }
    } catch (error) {
      spinner.fail('Failed to stop servers');
      throw error;
    }
  }

  static async interactiveStop(options, command) {
    const spinner = ora('Finding running servers...').start();

    try {
      const servers = await ServerManager.getAllServers();
      const runningServers = servers.filter(s => s.status === 'running');

      if (runningServers.length === 0) {
        spinner.info('No running servers found');
        console.log(chalk.yellow('Start a server with: clp start <app-name>'));
        return;
      }

      spinner.stop();

      // Interactive selection
      const choices = runningServers.map(server => ({
        name: `${server.appName} (${server.host}:${server.port})`,
        value: server.appName,
      }));

      choices.push(
        { name: chalk.red('Stop all servers'), value: '__all__' },
        { name: chalk.gray('Cancel'), value: '__cancel__' }
      );

      const { selectedApp } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedApp',
          message: 'Which server would you like to stop?',
          choices,
        },
      ]);

      if (selectedApp === '__cancel__') {
        console.log(chalk.yellow('Operation cancelled'));
        return;
      }

      if (selectedApp === '__all__') {
        await this.stopAllServers({ force: false }, command);
      } else {
        await this.stopSingleServer(selectedApp, { force: false }, command);
      }
    } catch (error) {
      spinner.fail('Failed to list servers');
      throw error;
    }
  }
}

module.exports = StopCommand;
