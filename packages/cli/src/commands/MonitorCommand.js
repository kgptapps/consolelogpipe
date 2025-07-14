/**
 * MonitorCommand - Monitor logs from a running Console Log Pipe application
 */

const chalk = require('chalk');
const ora = require('ora');
const WebSocket = require('ws');
const ServerManager = require('../server/ServerManager');
const LogFormatter = require('../utils/LogFormatter');
const { parseTimeString } = require('../utils/TimeUtils');

class MonitorCommand {
  static async execute(appName, options, command) {
    const spinner = ora(`Connecting to ${appName}...`).start();

    try {
      // Check if server is running
      const serverInfo = await ServerManager.getServerInfo(appName);
      if (!serverInfo || serverInfo.status !== 'running') {
        spinner.fail(`No running server found for "${appName}"`);
        console.log(
          chalk.yellow(`Start the server first: clp start ${appName}`)
        );
        process.exit(1);
      }

      spinner.text = 'Establishing connection...';

      // Connect to WebSocket
      const wsUrl = `ws://${serverInfo.host}:${serverInfo.port}/ws`;
      const ws = new WebSocket(wsUrl);

      let isConnected = false;
      let logCount = 0;
      const maxTail = parseInt(options.tail, 10) || 50;

      // Connection handlers
      ws.on('open', () => {
        isConnected = true;
        spinner.succeed(
          `Connected to ${appName} (${serverInfo.host}:${serverInfo.port})`
        );

        console.log();
        console.log(chalk.green.bold(`📡 Monitoring logs for "${appName}"`));
        console.log(chalk.gray(`Session: ${serverInfo.sessionId}`));
        console.log(chalk.gray(`Environment: ${serverInfo.environment}`));
        console.log(chalk.gray('Press Ctrl+C to stop monitoring'));
        console.log(chalk.gray('─'.repeat(80)));

        // Request historical logs if needed
        if (options.since || options.tail) {
          const request = {
            type: 'request_logs',
            filter: {
              since: options.since ? parseTimeString(options.since) : null,
              tail: maxTail,
              level: options.level,
              pattern: options.filter,
            },
          };
          ws.send(JSON.stringify(request));
        }
      });

      ws.on('message', data => {
        try {
          const message = JSON.parse(data.toString());

          if (message.type === 'log') {
            this.displayLog(message.data, options);
            logCount++;
          } else if (message.type === 'error') {
            this.displayError(message.data, options);
            logCount++;
          } else if (message.type === 'network') {
            this.displayNetwork(message.data, options);
            logCount++;
          } else if (message.type === 'historical_logs') {
            // Display historical logs
            message.logs.forEach(log => {
              this.displayLog(log, options);
            });
          } else if (message.type === 'server_info') {
            // Server information update
            console.log(chalk.blue(`ℹ Server: ${message.data.message}`));
          }
        } catch (error) {
          console.error(chalk.red('Error parsing message:'), error.message);
        }
      });

      ws.on('error', error => {
        if (!isConnected) {
          spinner.fail('Failed to connect to server');
        }
        console.error(chalk.red('WebSocket error:'), error.message);
        process.exit(1);
      });

      ws.on('close', () => {
        if (isConnected) {
          console.log();
          console.log(chalk.yellow('Connection closed'));
          console.log(chalk.gray(`Total logs received: ${logCount}`));
        }
        process.exit(0);
      });

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log();
        console.log(chalk.yellow('Stopping monitor...'));
        ws.close();
      });

      process.on('SIGTERM', () => {
        ws.close();
      });
    } catch (error) {
      spinner.fail('Failed to monitor application');
      console.error(chalk.red('Error:'), error.message);

      if (command.opts().verbose) {
        console.error(chalk.gray(error.stack));
      }

      process.exit(1);
    }
  }

  static displayLog(logData, options) {
    if (options.level && !this.matchesLevel(logData.level, options.level)) {
      return;
    }

    if (options.filter && !this.matchesFilter(logData, options.filter)) {
      return;
    }

    const formatted = LogFormatter.formatLog(logData, {
      format: options.format || 'text',
      color: !options.noColor,
      timestamp: true,
    });

    console.log(formatted);
  }

  static displayError(errorData, options) {
    if (options.level && !this.matchesLevel('error', options.level)) {
      return;
    }

    if (options.filter && !this.matchesFilter(errorData, options.filter)) {
      return;
    }

    const formatted = LogFormatter.formatError(errorData, {
      format: options.format || 'text',
      color: !options.noColor,
      timestamp: true,
    });

    console.log(formatted);
  }

  static displayNetwork(networkData, options) {
    if (options.filter && !this.matchesFilter(networkData, options.filter)) {
      return;
    }

    const formatted = LogFormatter.formatNetwork(networkData, {
      format: options.format || 'text',
      color: !options.noColor,
      timestamp: true,
    });

    console.log(formatted);
  }

  static matchesLevel(logLevel, filterLevel) {
    const levels = ['debug', 'info', 'log', 'warn', 'error'];
    const logIndex = levels.indexOf(logLevel.toLowerCase());
    const filterIndex = levels.indexOf(filterLevel.toLowerCase());

    return logIndex >= filterIndex;
  }

  static matchesFilter(data, pattern) {
    const searchText = JSON.stringify(data).toLowerCase();
    return searchText.includes(pattern.toLowerCase());
  }
}

module.exports = MonitorCommand;
