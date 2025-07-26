/**
 * Console Log Pipe Client Library TypeScript Definitions
 * Matches the actual published package API v2.4.7
 */

export interface ConsoleLogPipeInitOptions {
  /**
   * Server port number (required)
   * Must match the port used when starting the CLI server
   */
  serverPort: number;

  /**
   * Server host (optional)
   * Defaults to 'localhost'
   */
  serverHost?: string;
}

export interface ConsoleLogPipeInstance {
  /**
   * WebSocket connection to CLI server
   */
  ws: WebSocket | null;

  /**
   * Whether the client is connected to the CLI server
   */
  isConnected: boolean;

  /**
   * Original console methods (preserved)
   */
  originalConsole: {
    log: (...args: any[]) => void;
    error: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    info: (...args: any[]) => void;
    debug: (...args: any[]) => void;
  };
}

export interface ConsoleLogPipeAPI {
  /**
   * Initialize Console Log Pipe client
   * @param options Configuration options
   * @returns Promise that resolves to ConsoleLogPipe instance
   */
  init(options: ConsoleLogPipeInitOptions): Promise<ConsoleLogPipeInstance>;

  /**
   * Version of the Console Log Pipe client library
   */
  version: string;
}

declare const ConsoleLogPipe: ConsoleLogPipeAPI;

export default ConsoleLogPipe;
