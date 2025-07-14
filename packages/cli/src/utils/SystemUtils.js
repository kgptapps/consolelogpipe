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

  /**
   * Get system information
   */
  static getSystemInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      hostname: os.hostname(),
      username: os.userInfo().username,
      homeDir: os.homedir(),
      tmpDir: os.tmpdir(),
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      uptime: os.uptime(),
    };
  }

  /**
   * Check if a command exists in PATH
   */
  static async commandExists(command) {
    try {
      const platform = os.platform();
      const checkCommand = platform === 'win32' ? 'where' : 'which';
      await execAsync(`${checkCommand} ${command}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get environment variables related to development
   */
  static getDevEnvironment() {
    return {
      nodeEnv: process.env.NODE_ENV,
      editor: process.env.EDITOR || process.env.VISUAL,
      shell: process.env.SHELL,
      term: process.env.TERM,
      colorTerm: process.env.COLORTERM,
      ci: process.env.CI,
      github: process.env.GITHUB_ACTIONS,
      gitlab: process.env.GITLAB_CI,
      jenkins: process.env.JENKINS_URL,
    };
  }

  /**
   * Detect if running in a CI environment
   */
  static isCI() {
    return !!(
      process.env.CI ||
      process.env.GITHUB_ACTIONS ||
      process.env.GITLAB_CI ||
      process.env.JENKINS_URL ||
      process.env.TRAVIS ||
      process.env.CIRCLECI ||
      process.env.APPVEYOR ||
      process.env.BUILDKITE
    );
  }

  /**
   * Get network interfaces
   */
  static getNetworkInterfaces() {
    const interfaces = os.networkInterfaces();
    const result = {};

    for (const [name, addresses] of Object.entries(interfaces)) {
      result[name] = addresses
        .filter(addr => !addr.internal)
        .map(addr => ({
          address: addr.address,
          family: addr.family,
          mac: addr.mac,
        }));
    }

    return result;
  }

  /**
   * Get local IP addresses
   */
  static getLocalIPs() {
    const interfaces = os.networkInterfaces();
    const ips = [];

    for (const addresses of Object.values(interfaces)) {
      for (const addr of addresses) {
        if (!addr.internal && addr.family === 'IPv4') {
          ips.push(addr.address);
        }
      }
    }

    return ips;
  }

  /**
   * Kill process by PID
   */
  static async killProcess(pid, signal = 'SIGTERM') {
    try {
      process.kill(pid, signal);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Find processes by name
   */
  static async findProcessesByName(name) {
    try {
      const platform = os.platform();
      let command;

      if (platform === 'win32') {
        command = `tasklist /FI "IMAGENAME eq ${name}" /FO CSV`;
      } else {
        command = `pgrep -f "${name}"`;
      }

      const { stdout } = await execAsync(command);

      if (platform === 'win32') {
        // Parse Windows tasklist output
        const lines = stdout.split('\n').slice(1); // Skip header
        return lines
          .filter(line => line.trim())
          .map(line => {
            const parts = line.split(',');
            return {
              pid: parseInt(parts[1].replace(/"/g, ''), 10),
              name: parts[0].replace(/"/g, ''),
            };
          });
      } else {
        // Parse Unix pgrep output
        return stdout
          .split('\n')
          .filter(line => line.trim())
          .map(pid => ({ pid: parseInt(pid, 10) }));
      }
    } catch (error) {
      return [];
    }
  }

  /**
   * Get disk usage for a path
   */
  static async getDiskUsage(path = '.') {
    try {
      const platform = os.platform();
      let command;

      if (platform === 'win32') {
        command = `dir "${path}" /-c`;
      } else {
        command = `du -sh "${path}"`;
      }

      const { stdout } = await execAsync(command);
      return stdout.trim();
    } catch (error) {
      return 'Unknown';
    }
  }

  /**
   * Check if port is in use
   */
  static async isPortInUse(port) {
    try {
      const platform = os.platform();
      let command;

      if (platform === 'win32') {
        command = `netstat -an | findstr :${port}`;
      } else {
        command = `lsof -i :${port}`;
      }

      await execAsync(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get process using a specific port
   */
  static async getProcessOnPort(port) {
    try {
      const platform = os.platform();
      let command;

      if (platform === 'win32') {
        command = `netstat -ano | findstr :${port}`;
      } else {
        command = `lsof -i :${port} -t`;
      }

      const { stdout } = await execAsync(command);

      if (platform === 'win32') {
        const lines = stdout.split('\n').filter(line => line.trim());
        if (lines.length > 0) {
          const parts = lines[0].trim().split(/\s+/);
          return { pid: parseInt(parts[parts.length - 1], 10) };
        }
      } else {
        const pid = parseInt(stdout.trim(), 10);
        if (!isNaN(pid)) {
          return { pid };
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }
}

module.exports = SystemUtils;
