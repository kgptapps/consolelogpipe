#!/usr/bin/env node

/**
 * GitHub Actions Status Checker
 *
 * This script checks the status of GitHub Actions workflows and provides
 * detailed information about recent runs, failures, and overall health.
 */

/* eslint-disable no-console */

const { execSync } = require('child_process');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

class GitHubActionsChecker {
  constructor() {
    this.repoInfo = this.getRepoInfo();
    this.apiBase = 'https://api.github.com';
  }

  /**
   * Get repository information from git remote
   */
  getRepoInfo() {
    try {
      const remoteUrl = execSync('git remote get-url origin', {
        encoding: 'utf8',
      }).trim();
      const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);

      if (!match) {
        throw new Error('Could not parse GitHub repository from remote URL');
      }

      return {
        owner: match[1],
        repo: match[2],
        url: remoteUrl,
      };
    } catch (error) {
      console.error(
        `${colors.red}Error getting repository info: ${error.message}${colors.reset}`
      );
      process.exit(1);
    }
  }

  /**
   * Make GitHub API request
   */
  async makeApiRequest(endpoint) {
    try {
      const url = `${this.apiBase}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'GitHub-Actions-Checker/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(
          `GitHub API request failed: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(
        `${colors.red}API request failed: ${error.message}${colors.reset}`
      );
      throw error;
    }
  }

  /**
   * Get recent workflow runs
   */
  async getWorkflowRuns(limit = 10) {
    const endpoint = `/repos/${this.repoInfo.owner}/${this.repoInfo.repo}/actions/runs?per_page=${limit}`;
    return await this.makeApiRequest(endpoint);
  }

  /**
   * Get workflow details
   */
  async getWorkflows() {
    const endpoint = `/repos/${this.repoInfo.owner}/${this.repoInfo.repo}/actions/workflows`;
    return await this.makeApiRequest(endpoint);
  }

  /**
   * Get job details for a specific run
   */
  async getJobDetails(runId) {
    const endpoint = `/repos/${this.repoInfo.owner}/${this.repoInfo.repo}/actions/runs/${runId}/jobs`;
    return await this.makeApiRequest(endpoint);
  }

  /**
   * Format status with colors
   */
  formatStatus(status, conclusion) {
    if (status === 'completed') {
      switch (conclusion) {
        case 'success':
          return `${colors.green}✅ SUCCESS${colors.reset}`;
        case 'failure':
          return `${colors.red}❌ FAILURE${colors.reset}`;
        case 'cancelled':
          return `${colors.yellow}⏹️  CANCELLED${colors.reset}`;
        case 'skipped':
          return `${colors.blue}⏭️  SKIPPED${colors.reset}`;
        default:
          return `${colors.magenta}❓ ${
            conclusion?.toUpperCase() || 'UNKNOWN'
          }${colors.reset}`;
      }
    } else {
      return `${colors.cyan}🔄 ${status?.toUpperCase() || 'RUNNING'}${
        colors.reset
      }`;
    }
  }

  /**
   * Format duration
   */
  formatDuration(startTime, endTime) {
    if (!startTime || !endTime) return 'N/A';

    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = Math.round((end - start) / 1000);

    if (duration < 60) return `${duration}s`;
    if (duration < 3600)
      return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    return `${Math.floor(duration / 3600)}h ${Math.floor(
      (duration % 3600) / 60
    )}m`;
  }

  /**
   * Check overall workflow health
   */
  analyzeWorkflowHealth(runs) {
    const recentRuns = runs.slice(0, 10);
    const stats = {
      total: recentRuns.length,
      success: 0,
      failure: 0,
      cancelled: 0,
      running: 0,
    };

    recentRuns.forEach(run => {
      if (run.status === 'completed') {
        switch (run.conclusion) {
          case 'success':
            stats.success++;
            break;
          case 'failure':
            stats.failure++;
            break;
          case 'cancelled':
            stats.cancelled++;
            break;
        }
      } else {
        stats.running++;
      }
    });

    const successRate =
      stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0;

    return { ...stats, successRate };
  }

  /**
   * Main check function
   */
  async check() {
    console.log(
      `${colors.bright}${colors.cyan}🔍 GitHub Actions Status Check${colors.reset}`
    );
    console.log(
      `${colors.blue}Repository: ${this.repoInfo.owner}/${this.repoInfo.repo}${colors.reset}\n`
    );

    try {
      // Get workflows and recent runs
      const [workflowsData, runsData] = await Promise.all([
        this.getWorkflows(),
        this.getWorkflowRuns(20),
      ]);

      const workflows = workflowsData.workflows;
      const runs = runsData.workflow_runs;

      // Display workflow overview
      console.log(`${colors.bright}📋 Available Workflows:${colors.reset}`);
      workflows.forEach(workflow => {
        console.log(`  • ${workflow.name} (${workflow.path})`);
      });
      console.log();

      // Analyze health
      const health = this.analyzeWorkflowHealth(runs);
      console.log(
        `${colors.bright}📊 Workflow Health (Last ${health.total} runs):${colors.reset}`
      );
      console.log(
        `  Success Rate: ${
          health.successRate >= 80
            ? colors.green
            : health.successRate >= 60
            ? colors.yellow
            : colors.red
        }${health.successRate}%${colors.reset}`
      );
      console.log(
        `  ✅ Success: ${colors.green}${health.success}${colors.reset}`
      );
      console.log(
        `  ❌ Failure: ${colors.red}${health.failure}${colors.reset}`
      );
      console.log(
        `  ⏹️  Cancelled: ${colors.yellow}${health.cancelled}${colors.reset}`
      );
      console.log(
        `  🔄 Running: ${colors.cyan}${health.running}${colors.reset}\n`
      );

      // Display recent runs
      console.log(`${colors.bright}📝 Recent Workflow Runs:${colors.reset}`);

      const recentRuns = runs.slice(0, 10);
      for (const run of recentRuns) {
        const status = this.formatStatus(run.status, run.conclusion);
        const duration = this.formatDuration(
          run.run_started_at,
          run.updated_at
        );
        const date = new Date(run.created_at).toLocaleString();

        console.log(`  ${status} ${colors.bright}${run.name}${colors.reset}`);
        console.log(
          `    📅 ${date} | ⏱️  ${duration} | 🔗 Run #${run.run_number}`
        );
        console.log(`    💬 ${run.display_title}`);

        // Show failed job details
        if (run.conclusion === 'failure') {
          try {
            const jobsData = await this.getJobDetails(run.id);
            const failedJobs = jobsData.jobs.filter(
              job => job.conclusion === 'failure'
            );

            if (failedJobs.length > 0) {
              console.log(`    ${colors.red}❌ Failed Jobs:${colors.reset}`);
              failedJobs.forEach(job => {
                console.log(`      • ${job.name}`);
              });
            }
          } catch (error) {
            console.log(
              `    ${colors.yellow}⚠️  Could not fetch job details${colors.reset}`
            );
          }
        }
        console.log();
      }

      // Summary and recommendations
      console.log(`${colors.bright}💡 Recommendations:${colors.reset}`);

      if (health.failure > 0) {
        console.log(
          `  ${colors.red}• Fix failing workflows to improve reliability${colors.reset}`
        );
      }

      if (health.successRate < 80) {
        console.log(
          `  ${colors.yellow}• Success rate is below 80% - investigate recurring issues${colors.reset}`
        );
      }

      if (health.successRate >= 90) {
        console.log(
          `  ${colors.green}• Excellent workflow health! 🎉${colors.reset}`
        );
      }

      // Exit with appropriate code
      const hasFailures = runs
        .slice(0, 5)
        .some(run => run.conclusion === 'failure');
      process.exit(hasFailures ? 1 : 0);
    } catch (error) {
      console.error(
        `${colors.red}❌ Error checking GitHub Actions: ${error.message}${colors.reset}`
      );
      process.exit(1);
    }
  }
}

// Run the checker
if (require.main === module) {
  const checker = new GitHubActionsChecker();
  checker.check().catch(error => {
    console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = GitHubActionsChecker;
