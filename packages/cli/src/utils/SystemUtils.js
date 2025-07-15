/**
 * SystemUtils - System utilities for Console Log Pipe CLI
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const os = require('os');

const execAsync = promisify(exec);

class SystemUtils {
  /**
   * Open URL in default browser
   */
  static async openBrowser(url) {
    try {
      const platform = os.platform();
      let command;

      switch (platform) {
        case 'darwin': // macOS
          command = `open "${url}"`;
          break;
        case 'win32': // Windows
          command = `start "" "${url}"`;
          break;
        default: // Linux and others
          command = `xdg-open "${url}"`;
          break;
      }

      await execAsync(command);
    } catch (error) {
      console.warn('Could not open browser:', error.message);
    }
  }

  /**
   * Detect git information from current directory
   */
  static async detectGitInfo() {
    const gitInfo = {
      developer: null,
      branch: null,
      repository: null,
      commit: null,
    };

    try {
      // Get git user name
      try {
        const { stdout: userName } = await execAsync('git config user.name');
        gitInfo.developer = userName.trim();
      } catch (error) {
        // Ignore error, use fallback
      }

      // Get current branch
      try {
        const { stdout: branch } = await execAsync(
          'git rev-parse --abbrev-ref HEAD'
        );
        gitInfo.branch = branch.trim();
      } catch (error) {
        // Ignore error, use fallback
      }

      // Get repository URL
      try {
        const { stdout: remoteUrl } = await execAsync(
          'git config --get remote.origin.url'
        );
        gitInfo.repository = remoteUrl.trim();
      } catch (error) {
        // Ignore error, use fallback
      }

      // Get current commit hash
      try {
        const { stdout: commit } = await execAsync(
          'git rev-parse --short HEAD'
        );
        gitInfo.commit = commit.trim();
      } catch (error) {
        // Ignore error, use fallback
      }
    } catch (error) {
      // Not a git repository or git not available
    }

    return gitInfo;
  }
}

module.exports = SystemUtils;
