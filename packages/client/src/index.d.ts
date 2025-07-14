/**
 * Console Log Pipe Client Library TypeScript Definitions
 */

export interface ConsoleLogPipeOptions {
  // Application context (required)
  applicationName: string;
  sessionId?: string;
  environment?: 'development' | 'staging' | 'production';
  developer?: string;
  branch?: string;

  // Server configuration
  serverHost?: string;
  serverPort?: number;
  serverPath?: string;
  enableRemoteLogging?: boolean;

  // Feature toggles
  enableLogCapture?: boolean;
  enableErrorCapture?: boolean;
  enableNetworkCapture?: boolean;
  preserveOriginal?: boolean;

  // AI-friendly features
  enableMetadata?: boolean;
  enableErrorCategorization?: boolean;
  enablePerformanceTracking?: boolean;
  enableNetworkAnalysis?: boolean;

  // Filtering options
  logLevels?: string[];
  excludePatterns?: string[];
  includePatterns?: string[];
  excludeUrls?: string[];
  includeUrls?: string[];

  // Performance options
  maxLogSize?: number;
  maxQueueSize?: number;
  batchSize?: number;
  batchTimeout?: number;

  // Transport options
  maxRetries?: number;
  retryDelay?: number;
  enableCompression?: boolean;
  enableAutoDiscovery?: boolean;
}

export interface CapturedData {
  type: 'log' | 'error' | 'network';
  data: any;
}

export interface SessionInfo {
  sessionId: string;
  applicationName: string;
  environment: string;
  developer: string;
  branch: string;
  startTime: number;
  isCapturing: boolean;
}

export interface Statistics {
  totalLogs: number;
  totalErrors: number;
  totalNetworkRequests: number;
  startTime: number;
  lastActivity: number;
  transport?: any;
}

export declare class ConsoleLogPipe {
  constructor(options: ConsoleLogPipeOptions);

  init(): Promise<ConsoleLogPipe>;
  start(): ConsoleLogPipe;
  stop(): ConsoleLogPipe;
  destroy(): Promise<ConsoleLogPipe>;

  addListener(callback: (data: CapturedData) => void): ConsoleLogPipe;
  removeListener(callback: (data: CapturedData) => void): ConsoleLogPipe;

  getConfig(): ConsoleLogPipeOptions;
  updateConfig(newConfig: Partial<ConsoleLogPipeOptions>): ConsoleLogPipe;
  getStats(): Statistics;
  getSession(): SessionInfo;
  flush(): Promise<ConsoleLogPipe>;
}

export interface ConsoleLogPipeAPI {
  init(options: ConsoleLogPipeOptions): Promise<ConsoleLogPipe>;
  create(options: ConsoleLogPipeOptions): ConsoleLogPipe;
  ConsoleLogPipe: typeof ConsoleLogPipe;
  version: string;
}

declare const ConsoleLogPipeAPI: ConsoleLogPipeAPI;

export default ConsoleLogPipeAPI;
