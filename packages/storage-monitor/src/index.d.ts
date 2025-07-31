/**
 * TypeScript definitions for Console Log Pipe Storage Monitor
 */

export interface StorageItem {
  key: string;
  value: string;
  timestamp: string;
}

export interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  timestamp: string;
}

export interface StorageChanges {
  hasChanges: boolean;
  added: StorageItem[] | Cookie[];
  modified: (StorageItem | Cookie)[];
  deleted: (StorageItem | Cookie)[];
  current: (StorageItem | Cookie)[];
}

export interface IndexedDBInfo {
  available: boolean;
  databases: string[];
  timestamp: string;
}

export interface StorageState {
  cookies: Map<string, Cookie>;
  localStorage: Map<string, StorageItem>;
  sessionStorage: Map<string, StorageItem>;
  indexedDB: IndexedDBInfo;
}

export interface StorageMonitorConfig {
  serverHost?: string;
  serverPort?: number;
  sessionId?: string;
  enableCookies?: boolean;
  enableLocalStorage?: boolean;
  enableSessionStorage?: boolean;
  enableIndexedDB?: boolean;
  pollInterval?: number;
  autoConnect?: boolean;
}

export interface SessionInfo {
  sessionId: string;
  serverPort: number;
  isConnected: boolean;
  isMonitoring: boolean;
  enabledFeatures: {
    cookies: boolean;
    localStorage: boolean;
    sessionStorage: boolean;
    indexedDB: boolean;
  };
}

export interface StorageMessage {
  type: string;
  subType?: string;
  sessionId: string;
  timestamp: string;
  data: any;
}

export declare class StorageMonitor {
  config: StorageMonitorConfig;
  ws: WebSocket | null;
  isConnected: boolean;
  isMonitoring: boolean;
  previousState: StorageState;

  constructor(options?: StorageMonitorConfig);

  init(): Promise<StorageMonitor>;
  stop(): void;
  getCurrentState(): StorageState;

  private _connectWebSocket(): Promise<void>;
  private _startMonitoring(): void;
  private _sendMessage(message: StorageMessage): void;
  private _sendStorageUpdate(type: string, data: any): void;
  private _getCurrentCookies(): Map<string, Cookie>;
  private _getCurrentLocalStorage(): Map<string, StorageItem>;
  private _getCurrentSessionStorage(): Map<string, StorageItem>;
  private _getCurrentIndexedDBInfo(): IndexedDBInfo;
  private _detectCookieChanges(
    currentCookies: Map<string, Cookie>
  ): StorageChanges;
  private _detectStorageChanges(
    storageType: string,
    currentStorage: Map<string, StorageItem>
  ): StorageChanges;
}

export declare class ConsoleLogPipeStorage {
  version: string;
  monitor: StorageMonitor | null;
  config: StorageMonitorConfig;

  constructor(options?: StorageMonitorConfig);

  init(options?: StorageMonitorConfig): Promise<ConsoleLogPipeStorage>;
  start(): Promise<ConsoleLogPipeStorage>;
  stop(): ConsoleLogPipeStorage;
  getCurrentState(): StorageState | null;
  isMonitoring(): boolean;
  isConnected(): boolean;
  getConfig(): StorageMonitorConfig;
  updateConfig(newConfig: Partial<StorageMonitorConfig>): ConsoleLogPipeStorage;
  getSession(): SessionInfo;
  checkNow(): ConsoleLogPipeStorage;

  static create(options?: StorageMonitorConfig): ConsoleLogPipeStorage;
  static init(options?: StorageMonitorConfig): Promise<ConsoleLogPipeStorage>;
  static version: string;
}

export interface BrowserStorageMonitor {
  instance: StorageMonitor | null;

  init(options?: StorageMonitorConfig): Promise<StorageMonitor>;
  stop(): void;
  getCurrentState(): StorageState | null;
  isMonitoring(): boolean;
  isConnected(): boolean;
  checkStorageChanges(): void;
  onStorageChange(callback: (changes: StorageChanges) => void): void;
  offStorageChange(): void;
}

// Unified StorageMonitor API for browser environment (matches UMD export)
export interface UnifiedStorageMonitor {
  init(options?: StorageMonitorConfig): Promise<StorageMonitor>;
  stop(): void;
  getCurrentState(): StorageState | null;
  isMonitoring(): boolean;
  isConnected(): boolean;
  checkStorageChanges(): void;
  onStorageChange(callback: (changes: StorageChanges) => void): void;
  offStorageChange(): void;
  _internal: BrowserStorageMonitor;
}

declare const _default: ConsoleLogPipeStorage;
export default _default;

// Global declarations for browser environment
declare global {
  interface Window {
    StorageMonitor?: UnifiedStorageMonitor; // This is what UMD actually exports
    BrowserStorageMonitor?: BrowserStorageMonitor;
    ConsoleLogPipeStorage?: StorageMonitorConfig;
  }
}

// Module augmentation for different environments
declare module '@kansnpms/storage-pipe' {
  export = ConsoleLogPipeStorage;
}

// UMD module declaration for browser builds
declare module '@kansnpms/storage-pipe/dist/storage-monitor.umd.js' {
  const StorageMonitor: UnifiedStorageMonitor;
  export = StorageMonitor;
}
