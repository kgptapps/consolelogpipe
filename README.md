# Console Log Pipe

[![CI](https://github.com/kgptapps/consolelogpipe/actions/workflows/ci.yml/badge.svg)](https://github.com/kgptapps/consolelogpipe/actions/workflows/ci.yml)
[![Code Quality](https://github.com/kgptapps/consolelogpipe/actions/workflows/code-quality.yml/badge.svg)](https://github.com/kgptapps/consolelogpipe/actions/workflows/code-quality.yml)
[![CodeQL](https://github.com/kgptapps/consolelogpipe/actions/workflows/codeql.yml/badge.svg)](https://github.com/kgptapps/consolelogpipe/actions/workflows/codeql.yml)
[![npm version](https://img.shields.io/npm/v/@kansnpms/console-log-pipe-client.svg)](https://www.npmjs.com/package/@kansnpms/console-log-pipe-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@kansnpms/console-log-pipe-client.svg)](https://nodejs.org/)
[![Coverage Status](https://img.shields.io/badge/coverage-96.77%25-brightgreen.svg)](https://github.com/kgptapps/consolelogpipe/actions/workflows/ci.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/kgptapps/consolelogpipe/blob/main/CONTRIBUTING.md)
[![GitHub issues](https://img.shields.io/github/issues/kgptapps/consolelogpipe.svg)](https://github.com/kgptapps/consolelogpipe/issues)
[![GitHub stars](https://img.shields.io/github/stars/kgptapps/consolelogpipe.svg)](https://github.com/kgptapps/consolelogpipe/stargazers)

Real-time log streaming from browsers to developers. Stream console logs, errors, and network
requests from any browser application directly to your development environment.

## ✨ Key Features

- **🔄 Multi-Application Support** - Monitor multiple applications simultaneously with isolated
  sessions
- **🎯 AI-Friendly Development** - Structured error categorization and metadata for AI tools
- **🌍 Environment Detection** - Automatic detection of development, staging, and production
  environments
- **📊 Session Management** - Unique session IDs with beautiful console logging
- **🔍 Smart Filtering** - Filter logs by level, patterns, and application-specific criteria
- **⚡ Real-time Streaming** - Instant log delivery with WebSocket connections

## 📊 Project Status

| Component                 | Status         | Coverage | Description                        |
| ------------------------- | -------------- | -------- | ---------------------------------- |
| 🏗️ **Project Setup**      | ✅ Complete    | 100%     | Monorepo structure, CI/CD, tooling |
| 📋 **Documentation**      | ✅ Complete    | 100%     | Technical PRDs, architecture docs  |
| 🔧 **GitHub Actions**     | ✅ Complete    | 100%     | CI/CD validation and automation    |
| 📦 **Client Library**     | ✅ Complete    | 96.77%   | Multi-app console log capture      |
| 🖥️ **CLI Tool**           | 🔄 In Progress | -        | Command-line interface             |
| 🌐 **Server**             | 🔄 In Progress | -        | WebSocket server implementation    |
| 🖱️ **Browser Extensions** | ⏳ Planned     | -        | Chrome, Firefox, Safari, Edge      |
| 🖥️ **Desktop App**        | ⏳ Planned     | -        | Electron-based application         |

## 🚀 Quick Start

### Install the CLI tool globally

```bash
npm install -g console-log-pipe
```

### Start the local server

```bash
# Start server for a specific application
clp start --app my-web-app

# Or start server for multiple applications
clp start --app my-web-app --app admin-panel

# Start with custom port (optional)
clp start --app my-web-app --port 3001
```

### Add to your web application

#### Option 1: NPM Package (Recommended)

```bash
npm install @kansnpms/console-log-pipe-client
```

```javascript
import ConsoleLogPipe from '@kansnpms/console-log-pipe-client';

ConsoleLogPipe.init({
  applicationName: 'my-web-app', // Required: Must match CLI --app parameter
  // sessionId is auto-generated, or use custom one from CLI output
});
```

**Framework Examples:**

```javascript
// React
import { useEffect } from 'react';
import ConsoleLogPipe from '@kansnpms/console-log-pipe-client';

function App() {
  useEffect(() => {
    ConsoleLogPipe.init({ applicationName: 'my-react-app' });
  }, []);

  return <div>My App</div>;
}

// Vue.js
import { createApp } from 'vue';
import ConsoleLogPipe from '@kansnpms/console-log-pipe-client';

const app = createApp({});
ConsoleLogPipe.init({ applicationName: 'my-vue-app' });

// Node.js/Express (for server-side logging)
const ConsoleLogPipe = require('@kansnpms/console-log-pipe-client');
ConsoleLogPipe.init({ applicationName: 'my-api-server' });
```

#### Option 2: CDN

```html
<script src="https://unpkg.com/@kansnpms/console-log-pipe-client"></script>
<script>
  ConsoleLogPipe.init({
    applicationName: 'my-web-app', // Required: Must match CLI --app parameter
    // sessionId is auto-generated, or use custom one from CLI output
  });
</script>
```

The CLI will display session information like:

```
🔍 Console Log Pipe Server Started
📱 Application: my-web-app
🆔 Session ID: clp_abc123_xyz789
🌐 Server Port: 3001
🔗 Ready to receive logs...
```

## 📦 Packages

This monorepo contains the following packages:

- **[@kansnpms/console-log-pipe-client](./packages/client)** - Browser client library
- **[console-log-pipe](./packages/cli)** - Global CLI tool and local server
- **[@kansnpms/console-log-pipe-server](./packages/server)** - Hosted server package
- **[@kansnpms/console-log-pipe-desktop](./packages/desktop)** - Electron desktop application
- **Browser Extensions** - Chrome, Firefox, Safari, and Edge extensions

## 🏗️ Development

### Prerequisites

- Node.js 16+
- npm 8+

### Setup

```bash
# Clone the repository
git clone https://github.com/kgptapps/consolelogpipe.git
cd consolelogpipe

# Install dependencies
npm install
npm run bootstrap

# Build all packages
npm run build

# Run tests
npm test
```

## 📖 Documentation

- [Getting Started Guide](./docs/guides/getting-started.md)
- [API Documentation](./docs/api/)
- [Configuration Guide](./docs/guides/configuration.md)
- [Examples](./examples/)

## 🔄 CI/CD & Quality Assurance

This project maintains high quality standards through comprehensive automation:

### 🛡️ GitHub Actions Workflows

- **CI Pipeline**: Automated testing, linting, type checking, and building
- **Code Quality**: ESLint analysis, Prettier formatting, and security scanning
- **CodeQL Security**: Advanced security vulnerability detection
- **Dependency Updates**: Automated dependency management with Dependabot

### 📊 Quality Metrics

- **Test Coverage**: >95% statement coverage across all packages
- **Code Quality**: ESLint + Prettier with strict rules
- **Type Safety**: TypeScript with strict mode enabled
- **Security**: Snyk vulnerability scanning and CodeQL analysis

### 🔧 Development Workflow

All changes follow a mandatory 6-step workflow:

1. **🧠 UNDERSTAND** - Analyze requirements and dependencies
2. **⚙️ DEVELOP** - Implement functionality with comprehensive tests
3. **🧪 TEST** - Run full test suite with coverage validation
4. **📝 GIT COMMIT** - Commit with conventional format and hooks
5. **🚀 GIT PUSH** - Push changes to repository
6. **✅ GITHUB ACTIONS VALIDATION** - Validate all CI/CD workflows pass

## 🤝 Contributing

Please read our [Contributing Guide](./docs/guides/contributing.md) for details on our code of
conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🔗 Links

- [GitHub Repository](https://github.com/kgptapps/consolelogpipe)
- [NPM Packages](https://www.npmjs.com/search?q=%40kansnpms%2Fconsole-log-pipe)
- [Issues](https://github.com/kgptapps/consolelogpipe/issues)
- [Discussions](https://github.com/kgptapps/consolelogpipe/discussions)
