import { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

// Import the client library but don't initialize it immediately
let ConsoleLogPipe;

function App() {
  const [count, setCount] = useState(0);
  const [logMessage, setLogMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load Console Log Pipe dynamically to avoid import-time issues
  useEffect(() => {
    const loadConsoleLogPipe = async () => {
      try {
        // Import dynamically to avoid immediate execution
        const module = await import('@kansnpms/console-log-pipe-client');
        ConsoleLogPipe = module.default;
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load Console Log Pipe:', error);
      }
    };

    loadConsoleLogPipe();
  }, []);

  // Initialize Console Log Pipe only after it's loaded and user clicks
  const initializeConsoleLogPipe = () => {
    if (!ConsoleLogPipe) {
      alert('Console Log Pipe not loaded yet');
      return;
    }

    try {
      ConsoleLogPipe.init({
        applicationName: 'react-test-app',
        port: 3008
      });
      setIsConnected(true);
      
      // Test a simple log after initialization
      setTimeout(() => {
        console.log('✅ Console Log Pipe initialized and working!');
      }, 100);
      
    } catch (error) {
      console.error('Failed to initialize Console Log Pipe:', error);
      setIsConnected(false);
    }
  };

  // Test different console log types
  const testConsoleLog = () => {
    console.log('📝 Regular log message from button click');
  };

  const testConsoleWarn = () => {
    console.warn('⚠️ Warning message - something might be wrong');
  };

  const testConsoleError = () => {
    console.error('🚨 Error message - something went wrong!');
  };

  const testConsoleInfo = () => {
    console.info('ℹ️ Info message with useful information');
  };

  const testCustomLog = () => {
    if (logMessage.trim()) {
      console.log(`💬 Custom message: ${logMessage}`);
      setLogMessage('');
    } else {
      console.warn('⚠️ Please enter a message to log');
    }
  };

  const testObjectLogging = () => {
    const testObject = {
      name: 'Test Object',
      timestamp: new Date().toISOString(),
      data: { nested: true, array: [1, 2, 3, 'test'] }
    };
    console.log('📦 Object logging test:', testObject);
  };

  const testNetworkRequest = async () => {
    console.log('🌐 Making network request...');
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
      const data = await response.json();
      console.log('✅ Network request successful:', data);
    } catch (error) {
      console.error('❌ Network request failed:', error);
    }
  };

  const testMultipleLogs = () => {
    console.log('1️⃣ First log message');
    setTimeout(() => console.warn('2️⃣ Second warning message'), 50);
    setTimeout(() => console.error('3️⃣ Third error message'), 100);
    setTimeout(() => console.info('4️⃣ Fourth info message'), 150);
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1>Console Log Pipe Test App (Safe Version)</h1>

        <div className="status-indicator" style={{
          padding: '10px',
          margin: '10px 0',
          borderRadius: '5px',
          backgroundColor: isConnected ? '#d4edda' : isLoaded ? '#fff3cd' : '#f8d7da',
          color: isConnected ? '#155724' : isLoaded ? '#856404' : '#721c24',
          border: `1px solid ${isConnected ? '#c3e6cb' : isLoaded ? '#ffeaa7' : '#f5c6cb'}`
        }}>
          {isConnected ? '✅ Console Log Pipe Connected' : 
           isLoaded ? '⚠️ Console Log Pipe Loaded (Click Initialize)' : 
           '❌ Console Log Pipe Loading...'}
        </div>

        {isLoaded && !isConnected && (
          <button 
            onClick={initializeConsoleLogPipe}
            style={{ 
              padding: '10px 20px', 
              fontSize: '16px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer',
              margin: '10px'
            }}
          >
            🚀 Initialize Console Log Pipe
          </button>
        )}

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

        {isConnected && (
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
        )}

        <div className="instructions" style={{
          backgroundColor: '#f8f9fa',
          padding: '15px',
          borderRadius: '5px',
          marginTop: '20px',
          textAlign: 'left'
        }}>
          <h3>Safe Testing Instructions:</h3>
          <ol>
            <li>Wait for "Console Log Pipe Loaded" status</li>
            <li>Click "Initialize Console Log Pipe" button</li>
            <li>Check CLI terminal for connection confirmation</li>
            <li>Use test buttons to send logs</li>
            <li>Verify logs appear in both browser DevTools and CLI terminal</li>
          </ol>
        </div>
      </header>
    </div>
  );
}

export default App;
