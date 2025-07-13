// Browser environment setup for client package tests

// Mock browser APIs
global.window = {
  location: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
  },
  navigator: {
    userAgent: 'Mozilla/5.0 (Test Browser) Jest/Test',
    language: 'en-US',
    languages: ['en-US', 'en'],
    onLine: true,
  },
  document: {
    title: 'Test Document',
    URL: 'http://localhost:3000',
    readyState: 'complete',
    createElement: jest.fn(),
    getElementById: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  console: {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
  setTimeout: jest.fn(fn => fn()),
  clearTimeout: jest.fn(),
  setInterval: jest.fn(),
  clearInterval: jest.fn(),
};

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Map(),
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  })
);

// Mock XMLHttpRequest
global.XMLHttpRequest = jest.fn(() => ({
  open: jest.fn(),
  send: jest.fn(),
  setRequestHeader: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  abort: jest.fn(),
  readyState: 4,
  status: 200,
  statusText: 'OK',
  responseText: '',
  response: '',
  responseXML: null,
  upload: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
}));

// Mock WebSocket
global.WebSocket = jest.fn(() => ({
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1, // OPEN
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
global.sessionStorage = { ...localStorageMock };

// Mock URL and URLSearchParams
global.URL = class URL {
  constructor(url) {
    this.href = url;
    this.origin = 'http://localhost:3000';
    this.pathname = '/';
    this.search = '';
    this.hash = '';
  }
};

global.URLSearchParams = class URLSearchParams {
  constructor() {
    this.params = new Map();
  }
  get(key) {
    return this.params.get(key);
  }
  set(key, value) {
    this.params.set(key, value);
  }
  has(key) {
    return this.params.has(key);
  }
  delete(key) {
    this.params.delete(key);
  }
};

// Browser-specific test utilities
global.browserTestUtils = {
  // Simulate console method calls
  simulateConsoleCall: (method, ...args) => {
    const event = new Event('console');
    event.method = method;
    event.args = args;
    return event;
  },

  // Simulate network request
  simulateNetworkRequest: (url, options = {}) => {
    return {
      url,
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body,
    };
  },

  // Simulate error
  simulateError: (message, filename, lineno, colno, error) => {
    const errorEvent = new Event('error');
    errorEvent.message = message;
    errorEvent.filename = filename;
    errorEvent.lineno = lineno;
    errorEvent.colno = colno;
    errorEvent.error = error;
    return errorEvent;
  },
};
