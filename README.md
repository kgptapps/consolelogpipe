# Console Log Pipe

Real-time log streaming from browsers to developers. Stream console logs, errors, and network requests from any browser application directly to your development environment.

## 🚀 Quick Start

### Install the CLI tool globally
```bash
npm install -g console-log-pipe
```

### Start the local server
```bash
clp start
```

### Add to your web application
```html
<script src="https://unpkg.com/@console-log-pipe/client"></script>
<script>
  ConsoleLogPipe.init({
    sessionId: 'your-session-id' // Get this from CLI output
  });
</script>
```

## 📦 Packages

This monorepo contains the following packages:

- **[@console-log-pipe/client](./packages/client)** - Browser client library
- **[console-log-pipe](./packages/cli)** - Global CLI tool and local server
- **[@console-log-pipe/server](./packages/server)** - Hosted server package
- **[@console-log-pipe/desktop](./packages/desktop)** - Electron desktop application
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

## 🤝 Contributing

Please read our [Contributing Guide](./docs/guides/contributing.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🔗 Links

- [GitHub Repository](https://github.com/kgptapps/consolelogpipe)
- [NPM Packages](https://www.npmjs.com/search?q=%40console-log-pipe)
- [Issues](https://github.com/kgptapps/consolelogpipe/issues)
- [Discussions](https://github.com/kgptapps/consolelogpipe/discussions)
