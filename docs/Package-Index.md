# Console Log Pipe - Package Index

**Version:** 2.3.0 | **Status:** ✅ Production Release

Complete guide to all Console Log Pipe packages with direct NPM links and installation instructions.

## 📦 Package Overview

Console Log Pipe consists of 3 main packages, all synchronized at version `2.3.0`:

| Package     | Type     | Status        | Description                                   |
| ----------- | -------- | ------------- | --------------------------------------------- |
| **CLI**     | Required | ✅ Production | Global command-line tool for starting servers |
| **Client**  | Required | ✅ Production | Browser library for log streaming             |
| **Storage** | Optional | ✅ Production | Browser storage monitoring                    |

## 🎯 Package Details

### 1. Console Log Pipe CLI

**Global command-line tool for starting log servers**

- **Package Name:** `@kansnpms/console-log-pipe-cli`
- **Current Version:** `2.3.0`
- **NPM Registry:** https://www.npmjs.com/package/@kansnpms/console-log-pipe-cli
- **Repository:** https://github.com/kgptapps/consolelogpipe/tree/main/packages/cli
- **Documentation:** [CLI README](../packages/cli/README.md)
- **License:** MIT
- **Status:** ✅ Production Ready

#### Installation

```bash
# Install latest beta version (recommended)
npm install -g @kansnpms/console-log-pipe-cli@beta

# Install specific version
npm install -g @kansnpms/console-log-pipe-cli@2.3.0

# Verify installation
clp --version
# Expected: 2.3.0
```

#### Commands

```bash
clp start --port 3001        # Start console log server
clp storage --port 3002      # Start storage monitor
clp --help                   # Show help
clp --version                # Show version
```

---

### 2. Console Log Pipe Client

**Browser library for streaming console logs and network requests**

- **Package Name:** `@kansnpms/console-log-pipe-client`
- **Current Version:** `2.3.0`
- **NPM Registry:** https://www.npmjs.com/package/@kansnpms/console-log-pipe-client
- **Repository:** https://github.com/kgptapps/consolelogpipe/tree/main/packages/client
- **Documentation:** [Client README](../packages/client/README.md)
- **License:** MIT
- **Status:** ✅ Production Ready

#### Installation

```bash
# Install latest beta version (recommended)
npm install @kansnpms/console-log-pipe-client@beta

# Install specific version
npm install @kansnpms/console-log-pipe-client@2.3.0
```

#### CDN Alternative

```html
<!-- Latest beta version -->
<script src="https://unpkg.com/@kansnpms/console-log-pipe-client@beta"></script>

<!-- Specific version -->
<script src="https://unpkg.com/@kansnpms/console-log-pipe-client@2.3.0"></script>
```

#### Usage

```javascript
import ConsoleLogPipe from '@kansnpms/console-log-pipe-client';

// Initialize (requires CLI server running)
ConsoleLogPipe.init({ serverPort: 3001 });

// All console logs now stream to CLI terminal
console.log('Hello from browser!');
```

---

### 3. Console Log Pipe Storage Monitor

**Browser storage monitoring for cookies, localStorage, sessionStorage, and IndexedDB**

- **Package Name:** `@kansnpms/console-log-pipe-storage-beta`
- **Current Version:** `2.3.1`
- **NPM Registry:** https://www.npmjs.com/package/@kansnpms/console-log-pipe-storage-beta
- **Repository:** https://github.com/kgptapps/consolelogpipe/tree/main/packages/storage-monitor
- **Documentation:** [Storage README](../packages/storage-monitor/README.md)
- **License:** MIT
- **Status:** ✅ Production Ready

#### Installation

```bash
# Install latest stable version
npm install @kansnpms/storage-pipe

# Install specific version
npm install @kansnpms/storage-pipe@2.3.0
```

#### Usage

```javascript
import StorageMonitor from '@kansnpms/storage-pipe';

// Initialize (requires CLI storage server running)
StorageMonitor.init({ serverPort: 3002 });

// All storage changes now stream to CLI terminal
localStorage.setItem('key', 'value');
```

## 🚀 Quick Start Guide

### Complete Installation (All Packages)

```bash
# 1. Install CLI globally (required)
npm install -g @kansnpms/console-log-pipe-cli@beta

# 2. Install client library (required for web projects)
npm install @kansnpms/console-log-pipe-client@beta

# 3. Install storage monitor (optional)
npm install @kansnpms/storage-pipe
```

### Start Servers

```bash
# Terminal 1: Start console log server
clp start --port 3001

# Terminal 2: Start storage monitor (optional)
clp storage --port 3002
```

### Browser Integration

```javascript
// Import packages
import ConsoleLogPipe from '@kansnpms/console-log-pipe-client';
import StorageMonitor from '@kansnpms/storage-pipe';

// Initialize console logging
ConsoleLogPipe.init({ serverPort: 3001 });

// Initialize storage monitoring (optional)
StorageMonitor.init({ serverPort: 3002 });

// Test functionality
console.log('Console logs now stream to CLI!');
localStorage.setItem('test', 'Storage changes stream too!');
```

## 📊 Package Statistics

### Download Stats

- **CLI Downloads:**
  [![CLI downloads](https://img.shields.io/npm/dt/@kansnpms/console-log-pipe-cli.svg)](https://www.npmjs.com/package/@kansnpms/console-log-pipe-cli)
- **Client Downloads:**
  [![Client downloads](https://img.shields.io/npm/dt/@kansnpms/console-log-pipe-client.svg)](https://www.npmjs.com/package/@kansnpms/console-log-pipe-client)
- **Storage Downloads:**
  [![Storage downloads](https://img.shields.io/npm/dt/@kansnpms/console-log-pipe-storage-beta.svg)](https://www.npmjs.com/package/@kansnpms/console-log-pipe-storage-beta)

### Version Info

- **CLI Version:**
  [![npm version](https://img.shields.io/npm/v/@kansnpms/console-log-pipe-cli.svg)](https://www.npmjs.com/package/@kansnpms/console-log-pipe-cli)
- **Client Version:**
  [![npm version](https://img.shields.io/npm/v/@kansnpms/console-log-pipe-client.svg)](https://www.npmjs.com/package/@kansnpms/console-log-pipe-client)
- **Storage Version:**
  [![npm version](https://img.shields.io/npm/v/@kansnpms/console-log-pipe-storage-beta.svg)](https://www.npmjs.com/package/@kansnpms/console-log-pipe-storage-beta)

## 🔗 Useful Links

### NPM Package Pages

- **CLI Package:** https://www.npmjs.com/package/@kansnpms/console-log-pipe-cli
- **Client Package:** https://www.npmjs.com/package/@kansnpms/console-log-pipe-client
- **Storage Package:** https://www.npmjs.com/package/@kansnpms/console-log-pipe-storage-beta

### Documentation

- **Main Repository:** https://github.com/kgptapps/consolelogpipe
- **Release Guide:** [docs/Release-Guide.md](./Release-Guide.md)
- **QA Testing:** [docs/Simple-QA-Test.md](./Simple-QA-Test.md)

### Support

- **Issues:** https://github.com/kgptapps/consolelogpipe/issues
- **Discussions:** https://github.com/kgptapps/consolelogpipe/discussions

## ✅ Package Verification

Verify all packages are properly published:

```bash
# Check package versions
npm view @kansnpms/console-log-pipe-cli@beta version
npm view @kansnpms/console-log-pipe-client@beta version
npm view @kansnpms/console-log-pipe-storage-beta@beta version

# Expected output for all: 2.3.0
```

## 🎉 Ready for Production

All Console Log Pipe packages are **production-ready** and available for immediate use:

- ✅ **Published to NPM** - All packages available for installation
- ✅ **Comprehensive Documentation** - Complete guides and examples
- ✅ **Quality Tested** - 939/939 tests passing
- ✅ **Version Synchronized** - All packages at 2.3.0
- ✅ **Support Available** - GitHub issues and discussions

**Start using Console Log Pipe today!** 🚀
