/**
 * StartCommand - Start Console Log Pipe server for an application
 */

const chalk = require('chalk');
const ora = require('ora');
const { v4: uuidv4 } = require('uuid');
const ServerManager = require('../server/ServerManager');
const ConfigManager = require('../utils/ConfigManager');
const PortManager = require('../utils/PortManager');
const { openBrowser, detectGitInfo } = require('../utils/SystemUtils');

class StartCommand {
  static async execute(appName, options, command) {
    const spinner = ora('Starting Console Log Pipe server...').start();

    try {
      // Validate application name
      if (!appName) {
        spinner.fail('Application name is required');
        console.log(chalk.yellow('Usage: clp start <app-name>'));
        console.log(chalk.gray('Example: clp start my-react-app'));
        process.exit(1);
        return;
      }

      // Validate application name format
      if (!/^[a-zA-Z0-9-_]+$/.test(appName)) {
        spinner.fail(
          'Invalid application name. Use only letters, numbers, hyphens, and underscores.'
        );
        process.exit(1);
        return;
      }

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

      // Get or assign port
      let port = options.port;
      if (!port) {
        port = await PortManager.getApplicationPort(appName);
      } else {
        port = parseInt(port, 10);
        if (isNaN(port) || port < 1024 || port > 65535) {
          spinner.fail('Invalid port number. Must be between 1024 and 65535.');
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

      // Display server information
      console.log();
      console.log(chalk.green.bold('🚀 Console Log Pipe Server Started'));
      console.log();
      console.log(chalk.cyan('Application:'), chalk.white(appName));
      console.log(
        chalk.cyan('Server URL:'),
        chalk.white(`http://${serverConfig.host}:${serverConfig.port}`)
      );
      console.log(chalk.cyan('Session ID:'), chalk.white(sessionId));
      console.log(
        chalk.cyan('Environment:'),
        chalk.white(serverConfig.environment)
      );
      console.log(chalk.cyan('Developer:'), chalk.white(developer));
      console.log(chalk.cyan('Branch:'), chalk.white(branch));
      console.log();

      // Display integration instructions
      console.log(chalk.yellow.bold('📋 Integration Instructions:'));
      console.log();
      console.log(chalk.gray('1. Install the client library:'));
      console.log(
        chalk.white('   npm install @kansnpms/console-log-pipe-client')
      );
      console.log();
      console.log(chalk.gray('2. Add to your application:'));
      console.log(
        chalk.white(
          '   import ConsoleLogPipe from "@kansnpms/console-log-pipe-client";'
        )
      );
      console.log(
        chalk.white(
          `   await ConsoleLogPipe.init({ applicationName: "${appName}" });`
        )
      );
      console.log();
      console.log(chalk.gray('3. Or use CDN:'));
      console.log(
        chalk.white(
          '   <script src="https://unpkg.com/@kansnpms/console-log-pipe-client"></script>'
        )
      );
      console.log(
        chalk.white(
          `   <script>ConsoleLogPipe.init({ applicationName: "${appName}" });</script>`
        )
      );
      console.log();

      // Display monitoring commands
      console.log(chalk.yellow.bold('🔍 Monitoring Commands:'));
      console.log(
        chalk.white(`   clp monitor ${appName}     # Monitor logs in real-time`)
      );
      console.log(
        chalk.white(`   clp status ${appName}      # Check server status`)
      );
      console.log(
        chalk.white(`   clp stop ${appName}        # Stop the server`)
      );
      console.log();

      // Open browser if requested
      if (!options.noBrowser) {
        console.log(chalk.gray('Opening browser...'));
        await openBrowser(`http://${serverConfig.host}:${serverConfig.port}`);
      }

      // Display session information for AI tools
      console.log(chalk.green.bold('🤖 AI-Friendly Session Info:'));
      console.log(
        JSON.stringify(
          {
            applicationName: appName,
            sessionId,
            serverUrl: `http://${serverConfig.host}:${serverConfig.port}`,
            environment: serverConfig.environment,
            developer,
            branch,
            startTime: serverConfig.startTime,
          },
          null,
          2
        )
      );
    } catch (error) {
      spinner.fail('Failed to start server');
      console.error(chalk.red('Error:'), error.message);

      if (command.opts().verbose) {
        console.error(chalk.gray(error.stack));
      }

      process.exit(1);
    }
  }
}

module.exports = StartCommand;
