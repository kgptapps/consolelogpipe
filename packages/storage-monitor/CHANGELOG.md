# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.5.0] - 2025-01-31

### 🎉 Major API Consistency Fixes

This release resolves critical documentation vs implementation issues identified in QA testing.

### Fixed

- **UMD Build Export Consistency**: Fixed UMD build to properly export `UnifiedStorageMonitor` as
  `StorageMonitor` in browser environments
- **Promise Resolution Issues**: Fixed `StorageMonitor.init()` returning `undefined` instead of
  Promise
- **Missing ES6 Exports**: Added missing `export default StorageMonitor` to resolve rollup build
  issues
- **Async/Await Transpilation**: Resolved Babel transpilation issues causing Promise resolution
  failures
- **Connection Error Handling**: Added graceful error handling when WebSocket server is offline
- **TypeScript Definitions**: Updated type definitions to match actual UMD exports and browser API
- **API Method Inconsistencies**: Unified static methods for browser, instance methods for Node.js

### Added

- **UnifiedStorageMonitor Interface**: New TypeScript interface for browser UMD builds
- **Environment-Specific Documentation**: Clear separation of browser vs Node.js usage examples
- **Build Validation Tests**: Comprehensive testing framework to prevent future API mismatches
- **Error Handling**: Graceful degradation when storage monitor server is not running
- **UMD Module Declarations**: Proper TypeScript support for browser script tag usage

### Changed

- **Documentation Structure**: Reorganized README with environment-specific API examples
- **Browser API**: Browser now uses static methods (`StorageMonitor.init()`) as documented
- **Node.js API**: Node.js continues to use instance methods (`new ConsoleLogPipeStorage()`)
- **Error Messages**: Improved error messages and warnings for connection failures

### Removed

- **Conflicting API Examples**: Removed contradictory documentation patterns
- **Incorrect Browser References**: Removed references to `ConsoleLogPipeStorage` in browser
  examples

### Technical Details

#### Browser Environment (UMD Build)

```javascript
// ✅ Now works correctly
StorageMonitor.init({ serverPort: 3002 }).then(monitor => {
  console.log('Storage monitoring active');
});
```

#### Node.js Environment (ES6/CommonJS)

```javascript
// ✅ Continues to work as before
import { ConsoleLogPipeStorage } from '@kansnpms/storage-pipe';
const storage = await ConsoleLogPipeStorage.init({ serverPort: 3002 });
```

### Migration Guide

No breaking changes for existing users:

- **Browser users**: Continue using `StorageMonitor.init()` (now works correctly)
- **Node.js users**: Continue using `ConsoleLogPipeStorage` (no changes)
- **TypeScript users**: Updated definitions provide better type safety

### QA Issues Resolved

- ✅ Multiple conflicting API patterns
- ✅ UMD implementation mismatch
- ✅ TypeScript definitions mismatch
- ✅ API method inconsistencies
- ✅ Browser error: "Can't find variable: ConsoleLogPipeStorage"

## [2.4.9] - Previous Release

### Added

- Initial storage monitoring functionality
- WebSocket-based real-time updates
- Support for cookies, localStorage, sessionStorage, IndexedDB
- CLI integration with Console Log Pipe

---

For more details, see the
[GitHub repository](https://github.com/kgptapps/consolelogpipe/tree/main/packages/storage-monitor).
