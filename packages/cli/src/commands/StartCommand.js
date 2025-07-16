/**
 * StartCommand - Start Console Log Pipe server for an application
 */

const chalk = require('chalk');
const ora = require('ora');
const { v4: uuidv4 } = require('uuid');
const WebSocket = require('ws');
const ServerManager = require('../server/ServerManager');
const ConfigManager = require('../utils/ConfigManager');
const PortManager = require('../utils/PortManager');
const { openBrowser, detectGitInfo } = require('../utils/SystemUtils');

// Ensure UTF-8 encoding for proper emoji display
if (!process.env.LANG || !process.env.LANG.includes('UTF-8')) {
  process.env.LANG = 'en_US.UTF-8';
}

class StartCommand {
  static async execute(options, command) {
    const spinner = ora('Starting Console Log Pipe server...').start();

    try {
      // Clean up any corrupted configuration files first
      try {
        const cleanedCount = await ConfigManager.cleanupCorruptedConfigs();
        if (cleanedCount > 0) {
          spinner.text = 'Cleaned up corrupted config files, continuing...';
        }
      } catch (cleanupError) {
        // Don't fail the command if cleanup fails, just warn
        console.warn(
          'Warning: Could not clean up config files:',
          cleanupError.message
        );
      }

      // Use a fixed app name since we removed the parameter
      const appName = 'console-log-pipe';

      // Check if server is already running for this app
      const existingServer = await ServerManager.getServerInfo(appName);
      if (existingServer && existingServer.status === 'running') {
        spinner.info(`Server already running for "${appName}"`);
        console.log(
          chalk.cyan(
            `Server URL: http://${existingServer.host}:${existingServer.port}`
          )
        );
        console.log(chalk.cyan(`Session ID: ${existingServer.sessionId}`));

        if (!options.noBrowser) {
          await openBrowser(
            `http://${existingServer.host}:${existingServer.port}`
          );
        }
        return;
      }

      // Require port number - no auto-assignment
      if (!options.port) {
        spinner.fail('Port number is required');
        console.log(chalk.yellow('Usage: clp start --port <port>'));
        console.log(chalk.gray('Example: clp start --port 3016'));
        console.log(chalk.gray('Port must be between 1024 and 65535'));
        process.exit(1);
        return;
      }

      const port = parseInt(options.port, 10);
      if (isNaN(port) || port < 1024 || port > 65535) {
        spinner.fail('Invalid port number. Must be between 1024 and 65535.');
        console.log(chalk.yellow('Example: clp start --port 3016'));
        process.exit(1);
        return;
      }

      // Check if port is available
      const isAvailable = await PortManager.isPortAvailable(port);
      if (!isAvailable) {
        spinner.fail(`Port ${port} is already in use`);
        process.exit(1);
        return;
      }

      // Generate session ID
      const sessionId =
        options.sessionId || `clp_${Date.now()}_${uuidv4().slice(0, 8)}`;

      // Detect git information if not provided
      const gitInfo = await detectGitInfo();
      const developer =
        options.developer || gitInfo.developer || 'unknown-developer';
      const branch = options.branch || gitInfo.branch || 'unknown-branch';

      // Create server configuration
      const serverConfig = {
        appName,
        host: options.host || 'localhost',
        port,
        sessionId,
        environment: options.env || 'development',
        developer,
        branch,
        logLevel: options.logLevel || 'debug',
        maxLogs: parseInt(options.maxLogs, 10) || 1000,
        enableCompression: options.enableCompression !== false,
        enableCors: options.enableCors !== false,
        startTime: new Date().toISOString(),
      };

      spinner.text = `Starting server on port ${port}...`;

      // Start the server
      await ServerManager.startServer(serverConfig);

      // Save configuration
      await ConfigManager.saveServerConfig(appName, serverConfig);

      spinner.succeed(`Server started successfully for "${appName}"`);

      // Display essential server information only
      console.log();
      console.log(chalk.green.bold('🚀 Console Log Pipe Server Started'));
      console.log();
      console.log(chalk.cyan('Application:'), chalk.white(appName));
      console.log(
        chalk.cyan('Server URL:'),
        chalk.white(`http://${serverConfig.host}:${serverConfig.port}`)
      );
      console.log(chalk.cyan('Session ID:'), chalk.white(sessionId));
      console.log();
      console.log(
        chalk.gray('Monitoring logs in real-time... Press Ctrl+C to stop')
      );
      console.log(chalk.gray('─'.repeat(60)));
      console.log();

      // Start monitoring logs via WebSocket
      StartCommand._startLogMonitoring(appName, serverConfig);
    } catch (error) {
      spinner.fail('Failed to start server');
      console.error(chalk.red('Error:'), error.message);

      if (command.opts().verbose) {
        console.error(chalk.gray(error.stack));
      }

      process.exit(1);
    }
  }

  /**
   * Start monitoring logs via WebSocket
   */
  static _startLogMonitoring(appName, serverConfig) {
    // Connect to WebSocket for real-time logs
    const wsUrl = `ws://${serverConfig.host}:${serverConfig.port}`;
    const ws = new WebSocket(wsUrl);

    let logCount = 0;

    ws.on('open', () => {
      // Connection established, ready to receive logs
    });

    ws.on('message', data => {
      try {
        const message = JSON.parse(data.toString('utf8'));

        if (
          message.type === 'log' ||
          message.type === 'error' ||
          message.type === 'network'
        ) {
          StartCommand._displayLog(message.data, message.type);
          logCount++;
        } else if (message.type === 'server_info') {
          // Ignore server info messages in start command
        }
      } catch (error) {
        console.error(chalk.red('Error parsing log message:'), error.message);
      }
    });

    ws.on('error', error => {
      console.error(chalk.red('WebSocket error:'), error.message);
    });

    ws.on('close', () => {
      console.log();
      console.log(chalk.yellow('Log monitoring stopped'));
      if (logCount > 0) {
        console.log(chalk.gray(`Total logs received: ${logCount}`));
      }
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log();
      console.log(chalk.yellow('Stopping server...'));
      ws.close();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      ws.close();
      process.exit(0);
    });
  }

  /**
   * Display a log entry
   */
  static _displayLog(logData, type) {
    const timestamp = new Date().toLocaleTimeString();
    const level = logData.level || type || 'log';

    let color = chalk.white;
    let icon = '📝';

    switch (level.toLowerCase()) {
      case 'error':
        color = chalk.red;
        icon = '❌';
        break;
      case 'warn':
      case 'warning':
        color = chalk.yellow;
        icon = '⚠️';
        break;
      case 'info':
        color = chalk.blue;
        icon = 'ℹ️';
        break;
      case 'debug':
        color = chalk.gray;
        icon = '🔍';
        break;
      case 'network':
        color = chalk.cyan;
        icon = '🌐';
        break;
    }

    const message = logData.message || logData.url || JSON.stringify(logData);
    console.log(`${chalk.gray(timestamp)} ${icon} ${color(message)}`);
  }
}

module.exports = StartCommand;
