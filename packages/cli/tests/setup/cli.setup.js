// CLI environment setup for CLI package tests

const fs = require('fs');
const path = require('path');
const os = require('os');

// Mock file system operations
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  rmSync: jest.fn(),
  unlinkSync: jest.fn(),
  statSync: jest.fn(),
  readdirSync: jest.fn(),
}));

// Mock path operations
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: jest.fn((...args) => args.join('/')),
  resolve: jest.fn((...args) => `/${args.join('/')}`),
  dirname: jest.fn(p => p.split('/').slice(0, -1).join('/')),
  basename: jest.fn(p => p.split('/').pop()),
}));

// Mock os operations
jest.mock('os', () => ({
  ...jest.requireActual('os'),
  homedir: jest.fn(() => '/home/test'),
  tmpdir: jest.fn(() => '/tmp'),
  platform: jest.fn(() => 'linux'),
  arch: jest.fn(() => 'x64'),
}));

// Mock process
const originalProcess = process;
global.process = {
  ...originalProcess,
  argv: ['node', 'clp'],
  cwd: jest.fn(() => '/test/cwd'),
  exit: jest.fn(),
  stdout: {
    write: jest.fn(),
    isTTY: true,
  },
  stderr: {
    write: jest.fn(),
    isTTY: true,
  },
  stdin: {
    read: jest.fn(),
    on: jest.fn(),
    setRawMode: jest.fn(),
  },
  env: {
    NODE_ENV: 'test',
    HOME: '/home/test',
    PATH: '/usr/bin:/bin',
  },
};

// Mock child_process
jest.mock('child_process', () => ({
  spawn: jest.fn(),
  exec: jest.fn(),
  execSync: jest.fn(),
  fork: jest.fn(),
}));

// Mock HTTP server
const mockServer = {
  listen: jest.fn((port, callback) => {
    if (callback) callback();
    return mockServer;
  }),
  close: jest.fn(callback => {
    if (callback) callback();
    return mockServer;
  }),
  on: jest.fn(),
  address: jest.fn(() => ({ port: 3000 })),
};

// Mock Express
jest.mock('express', () => {
  const express = jest.fn(() => ({
    use: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    listen: jest.fn((port, callback) => {
      if (callback) callback();
      return mockServer;
    }),
    set: jest.fn(),
  }));
  express.static = jest.fn();
  express.json = jest.fn();
  express.urlencoded = jest.fn();
  return express;
});

// Mock WebSocket server
jest.mock('ws', () => ({
  WebSocketServer: jest.fn(() => ({
    on: jest.fn(),
    close: jest.fn(),
    clients: new Set(),
  })),
}));

// CLI-specific test utilities
global.cliTestUtils = {
  // Mock command line arguments
  mockArgv: args => {
    process.argv = ['node', 'clp', ...args];
  },

  // Mock file system
  mockFileSystem: (files = {}) => {
    fs.existsSync.mockImplementation(filePath => {
      return Object.keys(files).includes(filePath);
    });

    fs.readFileSync.mockImplementation(filePath => {
      if (files[filePath]) {
        return files[filePath];
      }
      throw new Error(`File not found: ${filePath}`);
    });

    fs.writeFileSync.mockImplementation((filePath, content) => {
      files[filePath] = content;
    });
  },

  // Mock server
  createMockServer: () => mockServer,

  // Capture console output
  captureOutput: () => {
    const output = [];
    const originalWrite = process.stdout.write;
    process.stdout.write = jest.fn(chunk => {
      output.push(chunk.toString());
      return true;
    });

    return {
      getOutput: () => output.join(''),
      restore: () => {
        process.stdout.write = originalWrite;
      },
    };
  },
};
