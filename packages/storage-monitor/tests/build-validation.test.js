/**
 * Build Validation Tests
 *
 * These tests validate that the built packages match the documentation
 * and TypeScript definitions, preventing the issues identified in the QA report.
 */

const fs = require('fs');
const path = require('path');

describe('Build Validation', () => {
  const distPath = path.join(__dirname, '..', 'dist');

  beforeAll(() => {
    // Ensure dist directory exists
    expect(fs.existsSync(distPath)).toBe(true);
  });

  describe('UMD Build Validation', () => {
    let umdContent;

    beforeAll(() => {
      const umdPath = path.join(distPath, 'storage-monitor.umd.js');
      expect(fs.existsSync(umdPath)).toBe(true);
      umdContent = fs.readFileSync(umdPath, 'utf8');
    });

    test('should export UnifiedStorageMonitor as StorageMonitor', () => {
      // Should contain the UnifiedStorageMonitor definition
      expect(umdContent).toContain(
        'var UnifiedStorageMonitor = Object.create(null)'
      );

      // Should bind methods from BrowserStorageMonitor
      expect(umdContent).toContain(
        'UnifiedStorageMonitor.init = BrowserStorageMonitor.init.bind(BrowserStorageMonitor)'
      );

      // Should export as window.StorageMonitor
      expect(umdContent).toContain(
        'window.StorageMonitor = UnifiedStorageMonitor'
      );

      // Should return UnifiedStorageMonitor from UMD factory
      expect(umdContent).toContain('return UnifiedStorageMonitor');
    });

    test('should not contain async/await transpilation issues', () => {
      // Should not have the problematic _asyncToGenerator pattern for UnifiedStorageMonitor.init
      const asyncGeneratorMatches = umdContent.match(
        /_asyncToGenerator.*UnifiedStorageMonitor/g
      );
      expect(asyncGeneratorMatches).toBeNull();
    });

    test('should contain BrowserStorageMonitor definition', () => {
      expect(umdContent).toContain('BrowserStorageMonitor');
      expect(umdContent).toContain(
        'window.BrowserStorageMonitor = BrowserStorageMonitor'
      );
    });

    test('should have proper UMD wrapper', () => {
      expect(umdContent).toMatch(/\(function \(global, factory\)/);
      expect(umdContent).toContain('global.StorageMonitor = factory()');
    });
  });

  describe('ES6 Build Validation', () => {
    let esmContent;

    beforeAll(() => {
      const esmPath = path.join(distPath, 'index.esm.js');
      expect(fs.existsSync(esmPath)).toBe(true);
      esmContent = fs.readFileSync(esmPath, 'utf8');
    });

    test('should export ConsoleLogPipeStorage', () => {
      expect(esmContent).toContain('class ConsoleLogPipeStorage');
      expect(esmContent).toContain('export { ConsoleLogPipeStorage }');
    });

    test('should have default export', () => {
      expect(esmContent).toMatch(/export.*default.*ConsoleLogPipeStorage/);
    });
  });

  describe('CommonJS Build Validation', () => {
    let cjsContent;

    beforeAll(() => {
      const cjsPath = path.join(distPath, 'index.js');
      expect(fs.existsSync(cjsPath)).toBe(true);
      cjsContent = fs.readFileSync(cjsPath, 'utf8');
    });

    test('should export ConsoleLogPipeStorage', () => {
      expect(cjsContent).toContain('class ConsoleLogPipeStorage');
      expect(cjsContent).toContain(
        'exports.ConsoleLogPipeStorage = ConsoleLogPipeStorage'
      );
    });

    test('should have module.exports', () => {
      expect(cjsContent).toContain('module.exports = ConsoleLogPipeStorage');
    });
  });

  describe('TypeScript Definitions Validation', () => {
    let dtsContent;

    beforeAll(() => {
      const dtsPath = path.join(distPath, 'index.d.ts');
      expect(fs.existsSync(dtsPath)).toBe(true);
      dtsContent = fs.readFileSync(dtsPath, 'utf8');
    });

    test('should declare StorageMonitor class', () => {
      expect(dtsContent).toContain('export declare class StorageMonitor');
    });

    test('should declare ConsoleLogPipeStorage class', () => {
      expect(dtsContent).toContain(
        'export declare class ConsoleLogPipeStorage'
      );
    });

    test('should declare UnifiedStorageMonitor interface', () => {
      expect(dtsContent).toContain('interface UnifiedStorageMonitor');
    });

    test('should declare BrowserStorageMonitor interface', () => {
      expect(dtsContent).toContain('interface BrowserStorageMonitor');
    });

    test('should have correct global declarations', () => {
      expect(dtsContent).toContain('interface Window');
      expect(dtsContent).toContain('StorageMonitor?: UnifiedStorageMonitor');
    });

    test('should have UMD module declaration', () => {
      expect(dtsContent).toContain(
        "declare module '@kansnpms/storage-pipe/dist/storage-monitor.umd.js'"
      );
    });
  });

  describe('API Consistency Validation', () => {
    test('UMD and TypeScript definitions should match', () => {
      const umdPath = path.join(distPath, 'storage-monitor.umd.js');
      const dtsPath = path.join(distPath, 'index.d.ts');

      const umdContent = fs.readFileSync(umdPath, 'utf8');
      const dtsContent = fs.readFileSync(dtsPath, 'utf8');

      // UMD should export what TypeScript declares for browser
      expect(umdContent).toContain(
        'window.StorageMonitor = UnifiedStorageMonitor'
      );
      expect(dtsContent).toContain('StorageMonitor?: UnifiedStorageMonitor');
    });

    test('should not have conflicting API patterns', () => {
      const umdPath = path.join(distPath, 'storage-monitor.umd.js');
      const umdContent = fs.readFileSync(umdPath, 'utf8');

      // Should not export ConsoleLogPipeStorage in UMD (browser build)
      expect(umdContent).not.toContain('window.ConsoleLogPipeStorage =');

      // Should export the unified API
      expect(umdContent).toContain(
        'window.StorageMonitor = UnifiedStorageMonitor'
      );
    });
  });

  describe('Documentation Examples Validation', () => {
    let readmeContent;

    beforeAll(() => {
      const readmePath = path.join(__dirname, '..', 'README.md');
      expect(fs.existsSync(readmePath)).toBe(true);
      readmeContent = fs.readFileSync(readmePath, 'utf8');
    });

    test('should not contain conflicting API examples', () => {
      // Should not show StorageMonitor as default import for npm package
      expect(readmeContent).not.toMatch(
        /import StorageMonitor from '@kansnpms\/storage-pipe'/
      );

      // Should show correct browser script tag usage
      expect(readmeContent).toContain('StorageMonitor.init({');

      // Should show correct ES6 import pattern
      expect(readmeContent).toContain(
        "import { ConsoleLogPipeStorage } from '@kansnpms/storage-pipe'"
      );
    });

    test('should have environment-specific examples', () => {
      expect(readmeContent).toContain('Browser Script Tag');
      expect(readmeContent).toContain('ES6 Module Import');
      expect(readmeContent).toContain('Static Factory Methods');
    });
  });
});
