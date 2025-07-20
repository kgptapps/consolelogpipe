# @kansnpms/console-log-pipe-client

[![npm version](https://img.shields.io/npm/v/@kansnpms/console-log-pipe-client.svg)](https://www.npmjs.com/package/@kansnpms/console-log-pipe-client)
[![npm downloads](https://img.shields.io/npm/dt/@kansnpms/console-log-pipe-client.svg)](https://www.npmjs.com/package/@kansnpms/console-log-pipe-client)
[![Coverage Status](https://img.shields.io/badge/coverage-96.77%25-brightgreen.svg)](https://github.com/kgptapps/consolelogpipe)
[![CI](https://github.com/kgptapps/consolelogpipe/actions/workflows/ci.yml/badge.svg)](https://github.com/kgptapps/consolelogpipe/actions/workflows/ci.yml)
[![Code Quality](https://github.com/kgptapps/consolelogpipe/actions/workflows/code-quality.yml/badge.svg)](https://github.com/kgptapps/consolelogpipe/actions/workflows/code-quality.yml)
[![license: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

![Console Log Pipe Client](https://raw.githubusercontent.com/kgptapps/consolelogpipe/main/images/KansBrowserMirrorAgents.png)

> **AI‑Friendly browser logging client** – stream console output, errors, network traffic,
> `localStorage` / `sessionStorage` changes and cookies to your local **Console Log Pipe CLI** so an
> **AI coding assistant** (or a human!) can debug your application without ever opening DevTools.

---

## ✨ Highlights

| Feature                           | Description                                                                                            |
| --------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Zero runtime deps**             | Written in vanilla TS → no bundled dependencies, minimal attack‑surface.                               |
| **Real‑time WebSocket streaming** | <10 ms latency from browser to terminal on typical localhost.                                          |
| **AI‑optimised JSON schema**      | Logs are enriched with metadata (env, TS type hints, stack‑traces) designed for effortless AI parsing. |
| **Network + Storage capture**     | Intercepts `fetch`, XHR, cookies, `localStorage`, `sessionStorage`, and **optionally** IndexedDB.      |
| **Session isolation**             | Work on multiple tabs/apps simultaneously – each gets a unique sessionId.                              |
| **Smart filtering**               | Whitelist/blacklist log levels, URL patterns, payload sizes.                                           |

## 📦 Installation

```bash
# your web project – choose one:
npm  i  @kansnpms/console-log-pipe-client    # npm
yarn add @kansnpms/console-log-pipe-client   # yarn
pnpm add @kansnpms/console-log-pipe-client   # pnpm
```

> **Prerequisite** – the companion CLI **must** be running:
>
> ```bash
> npm  i -g @kansnpms/console-log-pipe-cli
> clp start --port 3001  # pick any free port
> ```

A CDN build is also available for quick experiments:

```html
<script src="https://unpkg.com/@kansnpms/console-log-pipe-client"></script>
```

---

## 🚀 Quick Start

```ts
import ConsoleLogPipe from '@kansnpms/console-log-pipe-client';

// Basic usage (returns a Promise)
const client = await ConsoleLogPipe.init({
  port: 3001, // (required) – same port you gave the CLI
  developer: 'nandana', // appears in the CLI header & AI metadata
  environment: 'dev', // dev | staging | prod (auto‑detected if omitted)
  enableNetworkCapture: true,
  includePatterns: ['/api'], // only stream matching network req/res
});

console.log('✅ Console Log Pipe is ready!');
```

```ts
// With completion callbacks (no need to await)
ConsoleLogPipe.init({
  port: 3001,
  onReady: client => {
    console.log('✅ Console Log Pipe is ready!');
    // Your app initialization code here
  },
  onError: error => {
    console.error('❌ Console Log Pipe failed to initialize:', error);
    // Handle initialization failure
  },
});
```

```ts
// Error handling with try/catch
try {
  const client = await ConsoleLogPipe.init({ port: 3001 });
  console.log('✅ Ready to capture logs!');
} catch (error) {
  console.error('❌ Failed to initialize:', error);
}
```

Open your browser console and watch the magic appear in your terminal 📡.

---

## ⚙️ API Reference

### `ConsoleLogPipe.init(options: InitOptions)`

Initialises interception and returns a **Promise** that resolves when ready. Call it once as early
as possible (before most imports if you want **first‑paint** logs).

**⚠️ Port is mandatory** - throws error if not provided or invalid.

| Option                 | Type                                                     | Default      | Notes                                                      |
| ---------------------- | -------------------------------------------------------- | ------------ | ---------------------------------------------------------- |
| `port`                 | `number`                                                 | **required** | Port where CLI WebSocket server is listening (1024-65535). |
| `onReady`              | `function`                                               | –            | Callback when initialization completes successfully.       |
| `onError`              | `function`                                               | –            | Callback when initialization fails.                        |
| `sessionId`            | `string`                                                 | auto         | Custom ID useful when you manually spawn CLI sessions.     |
| `environment`          | `"development" \| "staging" \| "production"`             | auto         | Included in every payload.                                 |
| `developer`            | `string`                                                 | –            | Helpful when multiple devs share the same pipe.            |
| `enableNetworkCapture` | `boolean`                                                | `true`       | Wraps `fetch` & XHR.                                       |
| `enableMetadata`       | `boolean`                                                | `true`       | Adds file, line, column, user‑agent, etc.                  |
| `logLevels`            | `Array<"log" \| "warn" \| "error" \| "info" \| "debug">` | all          | Reduce noise.                                              |
| `includePatterns`      | `string[]`                                               | –            | Regex/glob patterns to **allow**.                          |
| `excludePatterns`      | `string[]`                                               | –            | Regex/glob patterns to **skip**.                           |
| `maxLogSize`           | `number`                                                 | `10000`      | in bytes – large objects are truncated (with notice).      |

**Returns:** `Promise<ConsoleLogPipe>` - Resolves when client is ready to capture logs.

**Throws:** Error if port is missing, invalid, or initialization fails.

### `ConsoleLogPipe.destroy()`

Restores native browser APIs and closes the socket.

---

## 🏗️ Architecture

```mermaid
graph LR
  subgraph Browser
    A[Console / Errors / Fetch] -->|intercept| B(Console Log Pipe Client)
  end
  B -- WebSocket JSON --> C(CLI Server)
  C -- STDOUT →|structured text| D(IDE / AI Assistant)
  D -- hot‑reload → A
```

> **CLI ↔ Client = yin & yang** – each is pointless without the other.

---

## 🔒 Security Notes

- No external requests except the WebSocket you configure.
- Sanitises circular references and strips functions before serialising.
- Tested with CSP `script-src 'self'` and strictest Chrome extension policies.

---

## 🤝 Contributing

PRs & issues welcome! Please run `pnpm test` and `pnpm lint` before opening a pull‑request.

1. Fork ➡️ branch ➡️ commit + signoff.
2. `pnpm dev` to start the test harness (CLI is auto‑spawned).
3. Add **unit & e2e** tests beside new logic.

---

## 📝 License

MIT © 2025 Kansnpms & contributors
