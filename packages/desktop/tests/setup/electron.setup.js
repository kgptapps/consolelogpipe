// Electron environment setup for desktop package tests

// Mock Electron main process APIs
global.electron = {
  app: {
    getPath: jest.fn(name => {
      const paths = {
        home: '/home/test',
        userData: '/home/test/.config/console-log-pipe',
        temp: '/tmp',
        desktop: '/home/test/Desktop',
        documents: '/home/test/Documents',
      };
      return paths[name] || '/home/test';
    }),
    getName: jest.fn(() => 'Console Log Pipe'),
    getVersion: jest.fn(() => '1.0.0'),
    isReady: jest.fn(() => true),
    whenReady: jest.fn(() => Promise.resolve()),
    quit: jest.fn(),
    exit: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    removeListener: jest.fn(),
    setPath: jest.fn(),
    getAppPath: jest.fn(() => '/app'),
    focus: jest.fn(),
  },

  BrowserWindow: jest.fn(() => ({
    loadURL: jest.fn(() => Promise.resolve()),
    loadFile: jest.fn(() => Promise.resolve()),
    show: jest.fn(),
    hide: jest.fn(),
    close: jest.fn(),
    destroy: jest.fn(),
    focus: jest.fn(),
    blur: jest.fn(),
    minimize: jest.fn(),
    maximize: jest.fn(),
    restore: jest.fn(),
    setTitle: jest.fn(),
    getTitle: jest.fn(() => 'Console Log Pipe'),
    setSize: jest.fn(),
    getSize: jest.fn(() => [800, 600]),
    setPosition: jest.fn(),
    getPosition: jest.fn(() => [100, 100]),
    center: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    removeListener: jest.fn(),
    webContents: {
      send: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
      removeListener: jest.fn(),
      openDevTools: jest.fn(),
      closeDevTools: jest.fn(),
      isDevToolsOpened: jest.fn(() => false),
      executeJavaScript: jest.fn(() => Promise.resolve()),
      insertCSS: jest.fn(() => Promise.resolve()),
      setUserAgent: jest.fn(),
      getUserAgent: jest.fn(() => 'Electron'),
      session: {
        clearCache: jest.fn(() => Promise.resolve()),
        clearStorageData: jest.fn(() => Promise.resolve()),
      },
    },
    isDestroyed: jest.fn(() => false),
    isVisible: jest.fn(() => true),
    isMinimized: jest.fn(() => false),
    isMaximized: jest.fn(() => false),
    isFullScreen: jest.fn(() => false),
  })),

  Menu: {
    setApplicationMenu: jest.fn(),
    buildFromTemplate: jest.fn(() => ({})),
    getApplicationMenu: jest.fn(() => null),
  },

  Tray: jest.fn(() => ({
    setToolTip: jest.fn(),
    setContextMenu: jest.fn(),
    destroy: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    removeListener: jest.fn(),
  })),

  dialog: {
    showOpenDialog: jest.fn(() =>
      Promise.resolve({ canceled: false, filePaths: [] })
    ),
    showSaveDialog: jest.fn(() =>
      Promise.resolve({ canceled: false, filePath: '' })
    ),
    showMessageBox: jest.fn(() => Promise.resolve({ response: 0 })),
    showErrorBox: jest.fn(),
  },

  shell: {
    openExternal: jest.fn(() => Promise.resolve()),
    openPath: jest.fn(() => Promise.resolve('')),
    showItemInFolder: jest.fn(),
    moveItemToTrash: jest.fn(() => true),
  },

  ipcMain: {
    on: jest.fn(),
    once: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
    handle: jest.fn(),
    handleOnce: jest.fn(),
  },

  ipcRenderer: {
    send: jest.fn(),
    sendSync: jest.fn(() => ({})),
    on: jest.fn(),
    once: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
    invoke: jest.fn(() => Promise.resolve()),
  },

  autoUpdater: {
    checkForUpdatesAndNotify: jest.fn(() => Promise.resolve()),
    checkForUpdates: jest.fn(() => Promise.resolve()),
    downloadUpdate: jest.fn(() => Promise.resolve()),
    quitAndInstall: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    removeListener: jest.fn(),
  },
};

// Mock electron-store
jest.mock('electron-store', () => {
  return jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    has: jest.fn(() => false),
    delete: jest.fn(),
    clear: jest.fn(),
    size: 0,
    store: {},
  }));
});

// Mock electron-log
jest.mock('electron-log', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  silly: jest.fn(),
  transports: {
    file: {
      level: 'info',
      format: '{h}:{i}:{s} {text}',
    },
    console: {
      level: 'info',
    },
  },
}));

// Electron-specific test utilities
global.electronTestUtils = {
  // Create mock BrowserWindow
  createMockWindow: (options = {}) => {
    return new electron.BrowserWindow(options);
  },

  // Create mock menu
  createMockMenu: (template = []) => {
    return electron.Menu.buildFromTemplate(template);
  },

  // Create mock tray
  createMockTray: iconPath => {
    return new electron.Tray(iconPath);
  },

  // Simulate IPC communication
  simulateIPC: (channel, ...args) => {
    const listeners = electron.ipcMain.on.mock.calls
      .filter(call => call[0] === channel)
      .map(call => call[1]);

    listeners.forEach(listener => {
      const mockEvent = {
        reply: jest.fn(),
        sender: {
          send: jest.fn(),
        },
      };
      listener(mockEvent, ...args);
    });
  },

  // Mock app events
  simulateAppEvent: (event, ...args) => {
    const listeners = electron.app.on.mock.calls
      .filter(call => call[0] === event)
      .map(call => call[1]);

    listeners.forEach(listener => listener(...args));
  },
};
