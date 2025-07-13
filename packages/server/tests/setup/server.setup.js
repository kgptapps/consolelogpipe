// Server environment setup for server package tests

const http = require('http');
const express = require('express');

// Mock Express application
const mockApp = {
  use: jest.fn(),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
  listen: jest.fn(),
  set: jest.fn(),
  locals: {},
};

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
  setTimeout: jest.fn(),
  keepAliveTimeout: 5000,
};

// Mock Express
jest.mock('express', () => {
  const express = jest.fn(() => mockApp);
  express.static = jest.fn();
  express.json = jest.fn(() => (req, res, next) => next());
  express.urlencoded = jest.fn(() => (req, res, next) => next());
  express.Router = jest.fn(() => ({
    use: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  }));
  return express;
});

// Mock HTTP
jest.mock('http', () => ({
  ...jest.requireActual('http'),
  createServer: jest.fn(() => mockServer),
}));

// Mock WebSocket Server
const mockWSServer = {
  on: jest.fn(),
  close: jest.fn(),
  clients: new Set(),
  handleUpgrade: jest.fn(),
};

jest.mock('ws', () => ({
  WebSocketServer: jest.fn(() => mockWSServer),
  WebSocket: jest.fn(() => ({
    send: jest.fn(),
    close: jest.fn(),
    on: jest.fn(),
    readyState: 1,
    OPEN: 1,
    CLOSED: 3,
  })),
}));

// Mock database connections
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    connect: jest.fn(() =>
      Promise.resolve({
        query: jest.fn(() => Promise.resolve({ rows: [] })),
        release: jest.fn(),
      })
    ),
    query: jest.fn(() => Promise.resolve({ rows: [] })),
    end: jest.fn(() => Promise.resolve()),
  })),
}));

jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(() => Promise.resolve()),
    disconnect: jest.fn(() => Promise.resolve()),
    get: jest.fn(() => Promise.resolve(null)),
    set: jest.fn(() => Promise.resolve('OK')),
    del: jest.fn(() => Promise.resolve(1)),
    exists: jest.fn(() => Promise.resolve(0)),
    expire: jest.fn(() => Promise.resolve(1)),
    on: jest.fn(),
  })),
}));

// Mock middleware
jest.mock('cors', () => jest.fn(() => (req, res, next) => next()));
jest.mock('helmet', () => jest.fn(() => (req, res, next) => next()));
jest.mock('compression', () => jest.fn(() => (req, res, next) => next()));

// Server-specific test utilities
global.serverTestUtils = {
  // Create mock request
  createMockRequest: (options = {}) => ({
    method: options.method || 'GET',
    url: options.url || '/',
    headers: options.headers || {},
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    ip: options.ip || '127.0.0.1',
    get: jest.fn(header => options.headers[header.toLowerCase()]),
    ...options,
  }),

  // Create mock response
  createMockResponse: () => {
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(() => res),
      send: jest.fn(() => res),
      end: jest.fn(() => res),
      set: jest.fn(() => res),
      cookie: jest.fn(() => res),
      clearCookie: jest.fn(() => res),
      redirect: jest.fn(() => res),
      locals: {},
      headersSent: false,
    };
    return res;
  },

  // Create mock next function
  createMockNext: () => jest.fn(),

  // Mock WebSocket connection
  createMockWebSocket: () => ({
    send: jest.fn(),
    close: jest.fn(),
    on: jest.fn(),
    readyState: 1,
    OPEN: 1,
    CLOSED: 3,
  }),

  // Mock database client
  createMockDbClient: () => ({
    query: jest.fn(() => Promise.resolve({ rows: [] })),
    release: jest.fn(),
  }),

  // Mock Redis client
  createMockRedisClient: () => ({
    get: jest.fn(() => Promise.resolve(null)),
    set: jest.fn(() => Promise.resolve('OK')),
    del: jest.fn(() => Promise.resolve(1)),
    exists: jest.fn(() => Promise.resolve(0)),
    expire: jest.fn(() => Promise.resolve(1)),
  }),
};
