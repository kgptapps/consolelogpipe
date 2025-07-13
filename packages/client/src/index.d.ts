/**
 * Console Log Pipe Client Library TypeScript Definitions
 */

export interface LogCaptureOptions {
  applicationName: string;
  sessionId?: string;
  serverUrl?: string;
  serverPort?: number;
  environment?: 'development' | 'staging' | 'production';
  developer?: string;
  branch?: string;
  preserveOriginal?: boolean;
  enableMetadata?: boolean;
  enableNetworkCapture?: boolean;
  logLevels?: string[];
  excludePatterns?: string[];
  includePatterns?: string[];
  maxLogSize?: number;
  maxQueueSize?: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: string;
  message: string;
  args: any[];
  metadata?: {
    url?: string;
    userAgent?: string;
    timestamp?: number;
    stackTrace?: string;
    sessionId?: string;
    applicationName?: string;
    environment?: string;
    developer?: string;
    branch?: string;
    errorCategory?: string;
    performance?: {
      memory?: any;
      timing?: any;
    };
  };
}

export declare class LogCapture {
  constructor(options: LogCaptureOptions);
  start(): void;
  stop(): void;
  isCapturing(): boolean;
  addListener(callback: (logEntry: LogEntry) => void): void;
  removeListener(callback: (logEntry: LogEntry) => void): void;
  getLogs(): LogEntry[];
  clearLogs(): void;
}

export interface ConsoleLogPipeStatic {
  init(options: LogCaptureOptions): LogCapture;
  LogCapture: typeof LogCapture;
}

declare const ConsoleLogPipe: ConsoleLogPipeStatic;

export default ConsoleLogPipe;
