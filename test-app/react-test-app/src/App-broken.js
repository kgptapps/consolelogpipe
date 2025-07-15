import { useState, useEffect } from 'react';
import ConsoleLogPipe from '@kansnpms/console-log-pipe-client';
import logo from './logo.svg';
import './App.css';

function App() {
  const [count, setCount] = useState(0);
  const [logMessage, setLogMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // Initialize Console Log Pipe with correct parameters
  useEffect(() => {
    try {
      // Use the correct parameters as per documentation
      ConsoleLogPipe.init({
        applicationName: 'react-test-app', // Must match CLI app name
        port: 3008 // Must match CLI server port
      });
      setIsConnected(true);

      // Don't log immediately to avoid recursion - just set state
    } catch (error) {
      setIsConnected(false);
      // Use native console.error to avoid recursion
      window.console.error('❌ Failed to initialize Console Log Pipe:', error);
    }
  }, []);

  // Test different console log types with delays to avoid recursion
  const testConsoleLog = () => {
    setTimeout(() => console.log('📝 Regular log message from button click'), 10);
  };

  const testConsoleWarn = () => {
    setTimeout(() => console.warn('⚠️ Warning message - something might be wrong'), 10);
  };

  const testConsoleError = () => {
    setTimeout(() => console.error('🚨 Error message - something went wrong!'), 10);
  };

  const testConsoleInfo = () => {
    setTimeout(() => console.info('ℹ️ Info message with useful information'), 10);
  };

  const testCustomLog = () => {
    if (logMessage.trim()) {
      setTimeout(() => {
        console.log(`💬 Custom message: ${logMessage}`);
      }, 10);
      setLogMessage('');
    } else {
      setTimeout(() => console.warn('⚠️ Please enter a message to log'), 10);
    }
  };

  const testObjectLogging = () => {
    const testObject = {
      name: 'Test Object',
      timestamp: new Date().toISOString(),
      data: { nested: true, array: [1, 2, 3, 'test'] }
    };
    setTimeout(() => console.log('📦 Object logging test:', testObject), 10);
  };

  const testNetworkRequest = async () => {
    setTimeout(() => console.log('🌐 Making network request...'), 10);
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
      const data = await response.json();
      setTimeout(() => console.log('✅ Network request successful:', data), 10);
    } catch (error) {
      setTimeout(() => console.error('❌ Network request failed:', error), 10);
    }
  };

  const testMultipleLogs = () => {
    setTimeout(() => console.log('1️⃣ First log message'), 10);
    setTimeout(() => console.warn('2️⃣ Second warning message'), 50);
    setTimeout(() => console.error('3️⃣ Third error message'), 100);
    setTimeout(() => console.info('4️⃣ Fourth info message'), 150);
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1>Console Log Pipe Test App</h1>

        <div className="status-indicator" style={{
          padding: '10px',
          margin: '10px 0',
          borderRadius: '5px',
          backgroundColor: isConnected ? '#d4edda' : '#f8d7da',
          color: isConnected ? '#155724' : '#721c24',
          border: `1px solid ${isConnected ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {isConnected ? '✅ Console Log Pipe Connected' : '❌ Console Log Pipe Disconnected'}
        </div>

        <div className="card">
          <button onClick={() => {
            setCount((count) => count + 1);
            console.log(`Counter clicked: ${count + 1}`);
          }}>
            count is {count}
          </button>
          <p>
            Counter clicks will generate console logs automatically
          </p>
        </div>

        <div className="test-section" style={{ margin: '20px 0' }}>
          <h2>Console Log Tests</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
            <button onClick={testConsoleLog}>Test Log</button>
            <button onClick={testConsoleWarn}>Test Warn</button>
            <button onClick={testConsoleError}>Test Error</button>
            <button onClick={testConsoleInfo}>Test Info</button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              value={logMessage}
              onChange={(e) => setLogMessage(e.target.value)}
              placeholder="Enter custom log message"
              style={{ marginRight: '10px', padding: '5px' }}
            />
            <button onClick={testCustomLog}>Log Custom Message</button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button onClick={testObjectLogging}>Test Object Logging</button>
            <button onClick={testNetworkRequest}>Test Network Request</button>
            <button onClick={testMultipleLogs}>Test Multiple Logs</button>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
